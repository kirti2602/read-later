/**
 * The one place that knows which email provider the app uses (Resend). Switching to
 * Postmark or SES later means rewriting this file only.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Same key, same email: a retried send within 24h is dropped by the provider. */
  idempotencyKey: string;
};

type SendOptions = { apiKey: string; from: string; fetchImpl?: typeof fetch };

export class EmailSendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailSendError";
  }
}

// Without a verified domain, Resend only sends from its shared address, and only to the account owner.
const DEFAULT_FROM = "Read Later <onboarding@resend.dev>";
const SEND_TIMEOUT_MS = 10_000;

function optionsFromEnv(): SendOptions {
  return { apiKey: process.env.RESEND_API_KEY ?? "", from: process.env.EMAIL_FROM || DEFAULT_FROM };
}

export async function sendEmail(message: EmailMessage, options: SendOptions = optionsFromEnv()): Promise<{ id: string }> {
  const { apiKey, from, fetchImpl = fetch } = options;
  if (!apiKey) throw new EmailSendError("RESEND_API_KEY is not set");

  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "idempotency-key": message.idempotencyKey,
    },
    body: JSON.stringify({ from, to: [message.to], subject: message.subject, html: message.html, text: message.text }),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });

  const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!response.ok || !body.id) {
    throw new EmailSendError(`Resend refused the email (${response.status}): ${body.message ?? "no details"}`);
  }
  return { id: body.id };
}
