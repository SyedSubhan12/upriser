import { describe, it, expect, beforeAll, vi } from "vitest";
import request from "supertest";
import express from "express";
import { createServer } from "http";
import { registerRoutes } from "../../server/routes.js";

// Mock auth
vi.mock("../../server/auth.js", () => ({
  passport: {
    authenticate: vi.fn(() => (req: any, res: any, next: any) => next()),
    initialize: vi.fn(() => (req: any, res: any, next: any) => next()),
    session: vi.fn(() => (req: any, res: any, next: any) => next()),
  },
  setupAuth: vi.fn(),
}));

// Mock the database
vi.mock("../../server/db.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}));

// Mock dependencies
vi.mock("../../server/storage.js", () => ({
  storage: {
    getUserByEmail: vi.fn().mockResolvedValue({
      id: "123",
      email: "perf@test.com",
      role: "teacher",
      isEmailVerified: false,
      emailVerificationToken: "hashed",
      emailVerificationExpires: new Date(Date.now() + 100000),
      emailVerificationResendCount: 0
    }),
    updateUser: vi.fn().mockResolvedValue({ id: "123" }),
  }
}));

describe("Performance & Concurrency", () => {
  let app: express.Express;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = createServer(app);
    await registerRoutes(server, app);
  });

  it("should handle concurrent verification requests", async () => {
    const startTime = Date.now();
    const requests = Array.from({ length: 50 }, () => 
      request(app)
        .post("/api/auth/verify-email-otp")
        .send({ email: "perf@test.com", otp: "123456" })
    );

    const responses = await Promise.all(requests);
    const endTime = Date.now();

    const duration = endTime - startTime;
    const avgResponseTime = duration / responses.length;

    console.log(`[PERF] Concurrent requests: ${responses.length}`);
    console.log(`[PERF] Total duration: ${duration}ms`);
    console.log(`[PERF] Average response time: ${avgResponseTime}ms`);

    expect(avgResponseTime).toBeLessThan(100); // Expect < 100ms average
  });
});
