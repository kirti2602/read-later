import { timingSafeEqual } from "node:crypto";
import { createAdminSupabase } from "@/auth/supabase-admin";
import { appUrl, cronSecret, doneSecret } from "@/digest/config";
import { runDigests } from "@/digest/run";
import { supabaseDigestStore } from "@/digest/store";
import { sendEmail } from "@/email/send";

function authorized(request: Request): boolean {
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${cronSecret()}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Called by Supabase pg_cron on Saturday at 09:00, 09:15 and 09:30 IST. Each call sends
 * whatever digests are due and not yet sent, so the later calls are retries.
 */
export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const results = await runDigests(supabaseDigestStore(createAdminSupabase()), {
    appUrl: appUrl(),
    doneSecret: doneSecret(),
    sendEmail,
  });
  // Counts and ids only; no email addresses or titles in responses or logs.
  const summary = results.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.outcome]: (acc[r.outcome] ?? 0) + 1 }), {});
  for (const r of results) if (r.outcome === "failed") console.error("Digest failed", r.digestId, r.error);
  return Response.json({ summary, digests: results.map(({ outcome, digestId }) => ({ outcome, digestId })) });
}
