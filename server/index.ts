import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { createServer } from "http";
import session from "express-session";
import createMemoryStore from "memorystore";
import cors from "cors";
import pgSession from "connect-pg-simple";
import pg from "pg";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db, pool } from "./db.js";
import { users } from "@shared/schema";
import { passport } from "./auth.js";
import bcrypt from "bcryptjs";
import { registerAdminRoutes } from "./admin-routes.js";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export const app = express();
if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
export const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Allow CORS from the frontend (supports comma-separated origins)
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173").split(',').map(o => o.trim());
const isDevMode = process.env.NODE_ENV !== "production";
app.use(cors({
  origin: (origin, callback) => {
    // In development, allow all origins
    if (isDevMode) {
      callback(null, true);
      return;
    }
    // Allow requests with no origin (e.g., mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(
  express.json({
    limit: '1mb', // Prevent oversized JSON payloads
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

const MemoryStore = createMemoryStore(session);
const PgSessionStore = pgSession(session);
const sessionStore = process.env.DATABASE_URL
  ? new PgSessionStore({
    pool: pool,
    createTableIfMissing: true,
  })
  : new MemoryStore({
    checkPeriod: 86400000,
  });

const isProduction = process.env.NODE_ENV === "production";

if (!process.env.SESSION_SECRET && isProduction) {
  // Don't process.exit(1) as it crashes Vercel silently. Throw instead.
  throw new Error("FATAL: SESSION_SECRET must be set in production!");
} else if (!process.env.SESSION_SECRET) {
  console.warn("⚠️  WARNING: SESSION_SECRET not set. Using insecure default. Set SESSION_SECRET in production!");
}


app.use(
  session({
    secret: process.env.SESSION_SECRET || "serprep-dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: isProduction || process.env.VERCEL === "1",
      httpOnly: true,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  }),
);

// Initialize Passport for Google OAuth
import { setupGoogleAuth } from "./auth.js";
setupGoogleAuth();
app.use(passport.initialize());
app.use(passport.session());

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@serprep.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_NAME = process.env.ADMIN_NAME || "System Administrator";

// Warn about default admin/teacher credentials
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.warn("⚠️  WARNING: ADMIN_EMAIL/ADMIN_PASSWORD not set. Using defaults. Set these in production!");
}

const TEACHER_EMAIL = process.env.TEACHER_EMAIL || "teacher@serprep.com";
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || "teacher123";
const TEACHER_NAME = process.env.TEACHER_NAME || "Demo Teacher";

if (!process.env.TEACHER_EMAIL || !process.env.TEACHER_PASSWORD) {
  console.warn("⚠️  WARNING: TEACHER_EMAIL/TEACHER_PASSWORD not set. Using defaults. Set these in production!");
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        // Only log a truncated preview to avoid memory bloat
        const preview = JSON.stringify(capturedJsonResponse).substring(0, 200);
        logLine += ` :: ${preview}${preview.length >= 200 ? '...' : ''}`;
      }
      log(logLine);
    }
    // Release reference to allow GC
    capturedJsonResponse = undefined;
  });

  next();
});

let isInitialized = false;
export async function initializeServer() {
  if (isInitialized) return;
  log("Initializing server...");

  try {
    // Only seed users in local dev or if explicitly requested. 
    // Skipping in Vercel production to keep cold starts under the 10s limit.
    if (process.env.VERCEL !== "1") {
      log("Ensuring system users...");
      const existingAdmin = await db
        .select()
        .from(users)
        .where(eq(users.email, ADMIN_EMAIL))
        .limit(1);

      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

      if (existingAdmin.length > 0) {
        await db
          .update(users)
          .set({
            role: "admin",
            isActive: true,
            password: hashedPassword,
            name: ADMIN_NAME,
          })
          .where(eq(users.id, existingAdmin[0].id));
      } else {
        await db.insert(users).values({
          id: randomUUID(),
          email: ADMIN_EMAIL,
          password: hashedPassword,
          name: ADMIN_NAME,
          role: "admin",
          authProvider: "local",
          isActive: true,
          createdAt: new Date(),
        });
      }

      const existingTeacher = await db
        .select()
        .from(users)
        .where(eq(users.email, TEACHER_EMAIL))
        .limit(1);

      const hashedTeacherPassword = await bcrypt.hash(TEACHER_PASSWORD, 10);

      if (existingTeacher.length > 0) {
        await db
          .update(users)
          .set({
            role: "teacher",
            isActive: true,
            password: hashedTeacherPassword,
            name: TEACHER_NAME,
          })
          .where(eq(users.id, existingTeacher[0].id));
      } else {
        await db.insert(users).values({
          id: randomUUID(),
          email: TEACHER_EMAIL,
          password: hashedTeacherPassword,
          name: TEACHER_NAME,
          role: "teacher",
          authProvider: "local",
          isActive: true,
          createdAt: new Date(),
        });
      }
    }
  } catch (error) {
    console.error("Failed to ensure system users:", error);
  }

  log("Registering routes...");
  await registerRoutes(httpServer, app);
  await registerAdminRoutes(app);
  log("Routes registered.");

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`[ERROR] ${status} - ${message}`, err.stack || err);
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  if (app.get("env") === "development") {
    const { setupVite } = await import("./vite.js");
    await setupVite(httpServer, app);
  } else if (process.env.VERCEL !== "1") {
    // In production (non-Vercel), serve static files from the dist folder
    const { serveStatic } = await import("./static.js");
    serveStatic(app);
  }

  isInitialized = true;
}

// Initial call for non-serverless environments
if (process.env.VERCEL !== "1") {
  (async () => {
    await initializeServer();
    if (process.env.NODE_ENV !== "production") {
      const port = parseInt(process.env.PORT || "5000", 10);
      httpServer.listen(
        {
          port,
          host: "0.0.0.0",
          reusePort: true,
        },
        () => {
          log(`serving on port ${port}`);
        },
      );
    }
  })();
}
