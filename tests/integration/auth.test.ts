import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { createServer } from "http";
import { registerRoutes } from "../../server/routes.js";
import { storage } from "../../server/storage.js";
import * as emailService from "../../server/services/email.js";
import { hashTeacherVerificationOtp } from "../../server/services/teacher-email-verification.js";

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

// Mock the storage
vi.mock("../../server/storage.js", () => ({
  storage: {
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    getAllUsers: vi.fn(),
    getTutorRegistrationByUserId: vi.fn(),
    getMaterialsByFilters: vi.fn(),
    getAllSubjects: vi.fn(),
    getUserProfileByDeviceId: vi.fn(),
    createUserProfile: vi.fn(),
    updateUserProfile: vi.fn(),
    getUserPreferences: vi.fn(),
    upsertUserPreferences: vi.fn(),
    getUserSubjects: vi.fn(),
    setUserSubjects: vi.fn(),
    getAllBoards: vi.fn(),
    getBoard: vi.fn(),
    getSubjectsByQualification: vi.fn(),
    getSubjectsByBoard: vi.fn(),
    getSubject: vi.fn(),
  }
}));

// Mock email service
vi.mock("../../server/services/email.js", () => ({
  sendEmail: vi.fn().mockResolvedValue({ delivered: true, provider: "resend" })
}));

describe("Auth Verification API", () => {
  let app: express.Express;
  let server: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    server = createServer(app);
    await registerRoutes(server, app);
  });

  describe("POST /api/auth/verify-email-otp", () => {
    it("should return 400 if email or otp is missing", async () => {
      const res = await request(app)
        .post("/api/auth/verify-email-otp")
        .send({ email: "test@example.com" });
      expect(res.status).toBe(400);
    });

    it("should verify correct OTP and reset resend count", async () => {
      const email = "teacher@upriser.com";
      const otp = "123456";
      const hashed = hashTeacherVerificationOtp(email, otp);
      const user = { 
        id: "123", 
        email, 
        role: "teacher", 
        isEmailVerified: false, 
        emailVerificationToken: hashed,
        emailVerificationExpires: new Date(Date.now() + 10000),
        emailVerificationResendCount: 2
      };

      vi.mocked(storage.getUserByEmail).mockResolvedValue(user as any);
      vi.mocked(storage.updateUser).mockResolvedValue({ ...user, isEmailVerified: true } as any);

      const res = await request(app)
        .post("/api/auth/verify-email-otp")
        .send({ email, otp });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(storage.updateUser).toHaveBeenCalledWith("123", expect.objectContaining({
        isEmailVerified: true,
        emailVerificationResendCount: 0
      }));
    });

    it("should return 400 for expired OTP", async () => {
      const email = "teacher@upriser.com";
      const otp = "123456";
      const user = { 
        id: "123", 
        email, 
        role: "teacher", 
        emailVerificationExpires: new Date(Date.now() - 10000) 
      };

      vi.mocked(storage.getUserByEmail).mockResolvedValue(user as any);

      const res = await request(app)
        .post("/api/auth/verify-email-otp")
        .send({ email, otp });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Verification code has expired");
    });
  });

  describe("POST /api/auth/resend-verification", () => {
    it("should resend OTP and increment count", async () => {
      const email = "teacher@upriser.com";
      const user = { 
        id: "123", 
        email, 
        name: "Teacher",
        role: "teacher", 
        isEmailVerified: false,
        emailVerificationResendCount: 1
      };

      vi.mocked(storage.getUserByEmail).mockResolvedValue(user as any);
      vi.mocked(storage.updateUser).mockResolvedValue(user as any);

      const res = await request(app)
        .post("/api/auth/resend-verification")
        .send({ email });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(storage.updateUser).toHaveBeenCalledWith("123", expect.objectContaining({
        emailVerificationResendCount: 2
      }));
    });

    it("should block resending after 5 attempts", async () => {
      const email = "teacher@upriser.com";
      const user = { 
        id: "123", 
        email, 
        role: "teacher", 
        emailVerificationResendCount: 5 
      };

      vi.mocked(storage.getUserByEmail).mockResolvedValue(user as any);

      const res = await request(app)
        .post("/api/auth/resend-verification")
        .send({ email });

      expect(res.status).toBe(429);
      expect(res.body.error).toContain("Maximum resend attempts reached");
    });
  });
});
