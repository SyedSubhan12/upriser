import crypto from "crypto";
import type { User } from "../../shared/schema.js";
import { sendEmail, type EmailDeliveryResult } from "./email.js";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

function getVerificationSecret() {
  return (
    process.env.EMAIL_VERIFICATION_SECRET ||
    process.env.SESSION_SECRET ||
    "ExamsValley-teacher-email-verification"
  );
}

export function getTeacherVerificationExpiryDate() {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

export function generateTeacherVerificationOtp() {
  return crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");
}

export function hashTeacherVerificationOtp(email: string, otp: string) {
  return crypto
    .createHash("sha256")
    .update(`${email.toLowerCase()}:${otp}:${getVerificationSecret()}`)
    .digest("hex");
}

export function verifyTeacherVerificationOtp(email: string, otp: string, hashedOtp: string | null | undefined) {
  if (!hashedOtp) return false;

  const expectedBuffer = Buffer.from(hashTeacherVerificationOtp(email, otp), "hex");
  const actualBuffer = Buffer.from(hashedOtp, "hex");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export function getTeacherVerificationExpiryMinutes() {
  return OTP_EXPIRY_MINUTES;
}

export function maskEmailAddress(email: string) {
  const [localPart, domain = ""] = email.split("@");
  if (!localPart) return email;

  const visible = localPart.length <= 2
    ? localPart[0] ?? "*"
    : `${localPart[0]}${"*".repeat(Math.max(localPart.length - 2, 1))}${localPart[localPart.length - 1]}`;

  return `${visible}@${domain}`;
}

export async function sendTeacherVerificationOtpEmail(
  user: Pick<User, "email" | "name">,
  otp: string,
): Promise<EmailDeliveryResult> {
  const subject = `[ExamsValley] ${otp} is your verification code`;
  const text = [
    `Verify your ExamsValley account`,
    "",
    `Hi ${user.name},`,
    "",
    `Your verification code is: ${otp}`,
    `This code will expire in ${OTP_EXPIRY_MINUTES} minutes.`,
    "",
    "If you didn't request this code, you can safely ignore this email.",
    "",
    "Best regards,",
    "The ExamsValley Team",
  ].join("\n");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
          color: #1a1a1a;
        }
        .logo {
          font-size: 24px;
          font-weight: 800;
          color: #7c3aed;
          margin-bottom: 30px;
          text-align: center;
          letter-spacing: -0.025em;
        }
        .card {
          background: #ffffff;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #f3f4f6;
        }
        h1 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 24px;
          color: #111827;
          text-align: center;
        }
        .otp {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 0.25em;
          color: #7c3aed;
          background: #f5f3ff;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          margin: 30px 0;
          border: 1px dashed #c084fc;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 14px;
          color: #6b7280;
        }
        .divider {
          height: 1px;
          background: #f3f4f6;
          margin: 30px 0;
        }
      </style>
    </head>
    <body style="background-color: #f9fafb; margin: 0; padding: 0;">
      <div class="container">
        <div class="logo">ExamsValley</div>
        <div class="card">
          <h1>Verify your identity</h1>
          <p>Hi ${escapeHtml(user.name)},</p>
          <p>Please use the following verification code to complete your registration. This code is valid for <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
          
          <div class="otp">${otp}</div>
          
          <p style="font-size: 14px; color: #6b7280;">If you didn't request this code, you can safely ignore this email.</p>
          
          <div class="divider"></div>
          
          <p style="font-size: 14px; margin: 0;">Best regards,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 5px 0 0 0;">The ExamsValley Team</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ExamsValley. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
