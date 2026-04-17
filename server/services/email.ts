type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailDeliveryResult = {
  delivered: boolean;
  provider: "resend" | "console";
};

export async function sendEmail(payload: EmailPayload): Promise<EmailDeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const verifiedDomain = "examsvalley.com";
  
  // Get from address from env, but default to verified domain
  let from = process.env.EMAIL_FROM || `ExamsValley <no-reply@${verifiedDomain}>`;

  // Force verified domain if using Resend's default onboarding address or if domain mismatch in production
  const isDefaultResendAddress = from.includes("onboarding@resend.dev");
  const isWrongDomain = !from.includes(`@${verifiedDomain}`);
  
  if (isDefaultResendAddress || (process.env.NODE_ENV === "production" && isWrongDomain)) {
    const reason = isDefaultResendAddress ? "using Resend default address" : "domain mismatch in production";
    console.warn(`[EMAIL_WARNING] Overriding from address "${from}" because: ${reason}. Using no-reply@${verifiedDomain} instead.`);
    from = `ExamsValley <no-reply@${verifiedDomain}>`;
  }

  if (!apiKey) {
    console.log(`[EMAIL_FALLBACK] To: ${payload.to}`);
    console.log(`[EMAIL_FALLBACK] Subject: ${payload.subject}`);
    console.log(payload.text);
    return {
      delivered: process.env.NODE_ENV !== "production",
      provider: "console",
    };
  }

  try {
    console.log(`[EMAIL_ATTEMPT] Sending email to ${payload.to} via Resend (from: ${from})`);
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = result.message || JSON.stringify(result);
      console.error(`[EMAIL_ERROR] Resend API failed: ${response.status} ${errorMsg}`);
      
      // Handle specific Resend validation errors
      if (response.status === 403 && errorMsg.includes("testing mode")) {
        throw new Error(
          `Resend API is in testing mode. Emails can only be sent to the verified domain owner. ` +
          `Ensure the domain "${verifiedDomain}" is fully verified and your API key has production access.`
        );
      }
      
      if (response.status === 422) {
        throw new Error(`Invalid email parameters: ${errorMsg}`);
      }

      throw new Error(`Failed to send email: ${response.status} ${errorMsg}`);
    }

    console.log(`[EMAIL_SUCCESS] Email sent to ${payload.to} (id: ${result.id})`);
    return {
      delivered: true,
      provider: "resend",
    };
  } catch (error: any) {
    console.error(`[EMAIL_CRITICAL_FAILURE] ${error.message}`);
    throw error;
  }
}
