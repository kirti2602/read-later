"use server";

import { getCurrentUser } from "@/auth/current-user";
import { createServerSupabase } from "@/auth/supabase-server";
import { sendEmail } from "@/email/send";
import { windowStart } from "@/links/week-window";
import { appUrl, doneSecret } from "./config";
import { renderDigestEmail } from "./email";
import { selectDigestLinks, type DigestLink } from "./select";
import { signDoneToken } from "./token";

export type TestDigestState = { message: string | null; isError: boolean };

/**
 * Emails what Saturday's digest would hold right now, marked as a test. It writes no
 * digest row and leaves digest_count alone, so the real Saturday send is unaffected.
 */
export async function sendTestDigest(): Promise<TestDigestState> {
  const db = await createServerSupabase();
  const user = await getCurrentUser(db);
  if (!user) return { message: "You're signed out. Sign in and try again.", isError: true };

  const now = new Date();
  const schedule = { timeZone: user.timezone, digestDay: user.digestDay, digestTime: user.digestTime };
  const start = windowStart(now, schedule);
  const window = { start, end: new Date(now.getTime() + 1), previousStart: windowStart(new Date(start.getTime() - 1), schedule) };

  const { data, error } = await db
    .from("links")
    .select("id, title, url, site, type, est_minutes, status, saved_at, digest_count")
    .eq("user_id", user.id)
    .eq("status", "unread")
    .gte("saved_at", window.previousStart.toISOString())
    .returns<DigestLink[]>();
  if (error) return { message: "Couldn't read your links. Try again.", isError: true };

  const { fresh, carried } = selectDigestLinks(data, window);
  if (fresh.length === 0 && carried.length === 0) {
    return { message: "Nothing to send yet: save a link this week, then try again.", isError: true };
  }

  try {
    const base = appUrl();
    const secret = doneSecret();
    const email = renderDigestEmail({
      appUrl: base,
      fresh,
      carried,
      isTest: true,
      doneUrl: (link) => `${base}/done/${signDoneToken({ linkId: link.id, userId: user.id }, secret)}`,
    });
    await sendEmail({ to: user.email, ...email, idempotencyKey: `test-${user.id}-${now.getTime()}` });
    return { message: `Sent to ${user.email}. It can take a minute; check spam if it doesn't show.`, isError: false };
  } catch (sendError) {
    console.error("Test digest failed", sendError);
    const detail = sendError instanceof Error ? sendError.message : "unknown error";
    return { message: `Couldn't send the test: ${detail}`, isError: true };
  }
}
