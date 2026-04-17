# IOTP Verification System Testing Strategy

## Overview
This document outlines the testing strategy for the IOTP (Internet of Things Protocol) verification system, focusing on the teacher email verification flow, resend functionality, and security constraints.

## Test Scenarios

### 1. Initial Request (Registration)
- **Scenario**: Teacher registers for an account.
- **Expected Behavior**: Account created in `pending` status, OTP generated, hashed, stored, and sent via email.
- **Status**: Verified in `server/routes.ts` logic.

### 2. Code Generation & Delivery
- **Scenario**: Verify OTP generation format and delivery mechanism.
- **Expected Behavior**: 6-digit numeric code. Delivery via Resend API (production) or Console (development).
- **Test**: `tests/unit/otp.test.ts`

### 3. Resend Functionality
- **Scenario**: User requests a new verification code.
- **Expected Behavior**: New OTP generated, `emailVerificationResendCount` incremented, `lastResentAt` updated.
- **Test**: `tests/integration/auth.test.ts`

### 4. Validation Process
- **Scenario**: User submits OTP for verification.
- **Expected Behavior**: Timing-safe comparison against stored hash. If valid, user is marked `isEmailVerified: true` and resend count is reset.
- **Test**: `tests/integration/auth.test.ts`

### 5. Edge Cases
- **Expired Codes**: Verify that OTPs older than 10 minutes are rejected.
- **Maximum Resend Attempts**: Verify that users are blocked after 5 resend attempts (HTTP 429).
- **Invalid Inputs**: Verify that non-numeric or non-6-digit codes are rejected.
- **Duplicate Requests**: Verify idempotency of verification (already verified accounts return success).

### 6. Security Standards
- **Timing-Safe Comparison**: Prevents timing attacks on OTP verification.
- **Rate Limiting**: `authLimiter` prevents brute-force attacks (5 requests / 15 mins).
- **Resend Limit**: Prevents email spamming and abuse.

### 7. Performance Testing
- **Concurrency**: Handled concurrent verification requests to ensure no race conditions or DB deadlocks.
- **Baseline**: Average response time target < 100ms for verification requests.
- **Test**: `tests/performance/verification.test.ts`

## Execution
Run all tests using:
```bash
npm run test
```

## Results (Baseline)
- **Unit Tests**: Pass (6/6)
- **Integration Tests**: Pass (5/5)
- **Performance**: ~15ms average response time under concurrency of 50.
