import { describe, it, expect } from "vitest";
import { 
  generateTeacherVerificationOtp, 
  hashTeacherVerificationOtp, 
  verifyTeacherVerificationOtp,
  getTeacherVerificationExpiryDate 
} from "../../server/services/teacher-email-verification.js";

describe("OTP Verification Service", () => {
  const email = "test@example.com";
  
  it("should generate a 6-digit OTP", () => {
    const otp = generateTeacherVerificationOtp();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it("should generate different OTPs each time", () => {
    const otp1 = generateTeacherVerificationOtp();
    const otp2 = generateTeacherVerificationOtp();
    expect(otp1).not.toBe(otp2);
  });

  it("should correctly hash and verify an OTP", () => {
    const otp = "123456";
    const hashed = hashTeacherVerificationOtp(email, otp);
    const result = verifyTeacherVerificationOtp(email, otp, hashed);
    expect(result).toBe(true);
  });

  it("should fail verification with wrong OTP", () => {
    const otp = "123456";
    const wrongOtp = "654321";
    const hashed = hashTeacherVerificationOtp(email, otp);
    const result = verifyTeacherVerificationOtp(email, wrongOtp, hashed);
    expect(result).toBe(false);
  });

  it("should fail verification with wrong email", () => {
    const otp = "123456";
    const hashed = hashTeacherVerificationOtp(email, otp);
    const result = verifyTeacherVerificationOtp("wrong@example.com", otp, hashed);
    expect(result).toBe(false);
  });

  it("should handle null or undefined hashed OTP", () => {
    const otp = "123456";
    expect(verifyTeacherVerificationOtp(email, otp, null)).toBe(false);
    expect(verifyTeacherVerificationOtp(email, otp, undefined)).toBe(false);
  });

  it("should provide an expiry date in the future", () => {
    const expiry = getTeacherVerificationExpiryDate();
    expect(expiry.getTime()).toBeGreaterThan(Date.now());
  });
});
