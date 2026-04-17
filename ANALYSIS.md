# IOTP OTP Verification System: Comprehensive Analysis

## 1. Current Architecture & Setup

### **API Configuration**
The system uses the **Resend API** for email delivery.
- **Service Layer**: [email.ts](file:///home/syeds/upriser/server/services/email.ts) abstracts the delivery logic.
- **Authentication**: Uses `RESEND_API_KEY` and `EMAIL_FROM` environment variables.
- **Domain Enforcement**: The system strictly enforces the verified domain `examsvalley.com`. It automatically overrides any default Resend addresses (like `onboarding@resend.dev`) or mismatched domains in production to ensure high deliverability and bypass Resend's sandbox restrictions.
- **Fallback Mechanism**: In development (`NODE_ENV !== "production"`), if API keys are missing, the system logs the email content to the console instead of sending it.

### **Verification Workflow**
1. **Trigger**: Teacher registration or manual resend request.
2. **Generation**: A 6-digit numeric OTP is generated via `crypto.randomInt`.
3. **Storage**: The OTP is hashed using `SHA-256` with a salt (`SESSION_SECRET`) and stored in the database with an expiry timestamp (10 minutes).
4. **Delivery**: The plain-text OTP is sent to the user's email via Resend.
5. **Validation**: User submits OTP; system performs a timing-safe comparison (`crypto.timingSafeEqual`) against the stored hash.

## 2. Security & Anti-Abuse Mechanisms

### **Logging & Error Handling**
- **Detailed Audit**: Every email attempt, success, and failure is logged with recipient, sender, and Resend IDs.
- **Resend-Specific Errors**: 403 (testing mode) and 422 (validation) errors are caught and re-thrown with clear, actionable messages.
- **Rate Limiting**: 
    - **IP-Based**: `authLimiter` in [rate-limit.ts](file:///home/syeds/upriser/server/middleware/rate-limit.ts) restricts authentication attempts (including OTP resends) to **5 requests per 15 minutes** per IP.
- **User-Based (Count)**: A hard limit of **5 resend attempts** per account, tracked via `emailVerificationResendCount` in the database.
- **Cooling-off Period**: A mandatory **60-second wait** between resend requests to prevent rapid-fire abuse.

### **Data Protection**
- **Hashing**: OTPs are never stored in plain text.
- **PII Masking**: Emails are masked (e.g., `t***r@upriser.com`) in API responses to protect user privacy.
- **Timing Attacks**: Verification uses constant-time comparison to prevent side-channel attacks.

## 3. Email Templates & Compliance

### **Template Design**
- **HTML**: Modern, responsive design with inline CSS, branding, and clear calls to action.
- **Plain Text**: Included for compatibility with older email clients.
- **Localization**: Currently English-only.

### **Regulatory Compliance**
- **Transactional Nature**: As these are functional/security emails, they do not require an "Unsubscribe" link under CAN-SPAM/GDPR.
- **Missing Elements**: Standard best practice suggests including a physical mailing address and a "Help/Support" link in the footer, which are currently missing.

## 4. Error Handling & Edge Cases

| Scenario | Response Code | Logic |
| :--- | :--- | :--- |
| **Expired Token** | `400 Bad Request` | Checks `emailVerificationExpires` against current time. |
| **Invalid Code** | `400 Bad Request` | Returns generic "Invalid verification code" after timing-safe check. |
| **Max Resends** | `429 Too Many Requests` | Blocks request if count >= 5. |
| **Cooling-off** | `429 Too Many Requests` | Blocks request if `lastResentAt` < 60s ago. |
| **Invalid Email** | `400 Bad Request` | Zod schema validation for email format. |
| **Already Verified** | `400 Bad Request` | Prevents resending to already active accounts. |

## 5. Identified Limitations & Recommendations

### **Limitations**
1. **No Retry Logic**: The `sendEmail` function fails immediately on network errors.
2. **Limited Monitoring**: Email delivery success/failure is only logged to the console; no persistent audit trail or dashboard.
3. **No Domain Verification Check**: The system assumes the `EMAIL_FROM` domain is correctly configured in Resend.

### **Recommendations (Migration Plan)**
1. **Reliability**: Implement exponential backoff for the Resend API call to handle transient failures.
2. **Monitoring**: Integrate a logging service (e.g., Sentry, Winston) to track `EmailDeliveryResult` in production.
3. **Security**: Consider implementing "Verified IP" tracking to allow more lenient rate limits for known users.
4. **Compliance**: Update the footer in [teacher-email-verification.ts](file:///home/syeds/upriser/server/services/teacher-email-verification.ts) to include the company's physical address.

## 6. Testing & Operations

### **Testing Procedures**
- **Automated**: Run `npm run test` to execute unit, integration, and performance tests.
- **Manual**: Use the `/api/auth/resend-verification` endpoint in development mode to verify console logs.
- **Delivery**: Use a service like **Mailtrap** or **Resend Test Mode** to verify actual delivery without burning production quotas.

### **Monitoring Requirements**
- Track **OTP Success Rate** (Verified / Sent).
- Monitor **Bounce Rates** and **Spam Complaints** via the Resend Dashboard.
- Alerting on **High Failure Rates** in the `sendEmail` service.
