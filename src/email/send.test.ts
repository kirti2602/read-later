import { describe, expect, it } from "vitest";
import { EmailSendError, sendEmail } from "./send";

const message = { to: "me@example.com", subject: "Hi", html: "<p>Hi</p>", text: "Hi", idempotencyKey: "digest-123" };

describe("sendEmail", () => {
  it("posts to Resend with the key, sender and idempotency key", async () => {
    let request: { url: string; init?: RequestInit } | null = null;
    const fetchImpl: typeof fetch = async (url, init) => {
      request = { url: String(url), init };
      return Response.json({ id: "email_1" });
    };

    const result = await sendEmail(message, { apiKey: "re_test", from: "Read Later <onboarding@resend.dev>", fetchImpl });

    expect(result).toEqual({ id: "email_1" });
    expect(request!.url).toBe("https://api.resend.com/emails");
    const headers = new Headers(request!.init?.headers);
    expect(headers.get("authorization")).toBe("Bearer re_test");
    expect(headers.get("idempotency-key")).toBe("digest-123");
    expect(JSON.parse(String(request!.init?.body))).toEqual({
      from: "Read Later <onboarding@resend.dev>",
      to: ["me@example.com"],
      subject: "Hi",
      html: "<p>Hi</p>",
      text: "Hi",
    });
  });

  it("throws a readable error with Resend's message when the send is refused", async () => {
    const fetchImpl: typeof fetch = async () =>
      Response.json({ name: "validation_error", message: "You can only send testing emails to your own email address" }, { status: 403 });

    await expect(sendEmail(message, { apiKey: "re_test", from: "x <a@b.c>", fetchImpl })).rejects.toThrow(
      new EmailSendError("Resend refused the email (403): You can only send testing emails to your own email address"),
    );
  });

  it("refuses to send without an API key", async () => {
    await expect(sendEmail(message, { apiKey: "", from: "x <a@b.c>" })).rejects.toThrow(EmailSendError);
  });
});
