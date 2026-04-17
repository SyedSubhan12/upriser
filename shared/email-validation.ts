export const AUTH_EMAIL_HELP_TEXT =
  "Use a real email address like Gmail, Yahoo, Outlook, or your school/work domain. Temporary email services are not allowed.";

export const AUTH_EMAIL_INVALID_MESSAGE =
  "Use a real email address like Gmail, Yahoo, Outlook, or your school/work domain.";

export const AUTH_EMAIL_DISPOSABLE_MESSAGE =
  "Temporary or disposable email addresses are not allowed. Use Gmail, Yahoo, Outlook, or your school/work email.";

const blockedEmailDomains = new Set([
  "teacher.com",
  "student.com",
  "school.com",
  "test.com",
  "10minutemail.com",
  "10minutemail.net",
  "discard.email",
  "fakeinbox.com",
  "getnada.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "maildrop.cc",
  "mailinator.com",
  "sharklasers.com",
  "temp-mail.org",
  "tempmail.com",
  "trashmail.com",
  "yopmail.com",
]);

const blockedDomainFragments = [
  "10minutemail",
  "discard",
  "fakeinbox",
  "getnada",
  "guerrillamail",
  "mailinator",
  "sharklasers",
  "spamgourmet",
  "temp-mail",
  "tempmail",
  "throwaway",
  "trashmail",
  "yopmail",
];

const reservedDomains = new Set([
  "example.com",
  "example.org",
  "example.net",
  "invalid",
  "localhost",
]);

const basicEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmailAddress(email: string) {
  return email.trim().toLowerCase();
}

export function validateAuthEmailAddress(email: string) {
  const normalizedEmail = normalizeEmailAddress(email);

  if (!basicEmailPattern.test(normalizedEmail)) {
    return {
      isValid: false,
      normalizedEmail,
      error: "Please enter a valid email address",
    };
  }

  const [, domain = ""] = normalizedEmail.split("@");

  if (
    reservedDomains.has(domain) ||
    domain.endsWith(".local") ||
    domain.includes("..")
  ) {
    return {
      isValid: false,
      normalizedEmail,
      error: AUTH_EMAIL_INVALID_MESSAGE,
    };
  }

  const isDisposableDomain =
    blockedEmailDomains.has(domain) ||
    blockedDomainFragments.some((fragment) => domain.includes(fragment));

  if (isDisposableDomain) {
    return {
      isValid: false,
      normalizedEmail,
      error: "Enter a correct mail (e.g. Gmail, Yahoo, Outlook)",
    };
  }

  return {
    isValid: true,
    normalizedEmail,
  };
}
