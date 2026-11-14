import type { EmailMessage } from "@/email/send";
import { renderDigestEmail } from "./email";
import { digestWindow, selectDigestLinks, type DigestLink, type DigestWindow } from "./select";
import { signDoneToken } from "./token";

export type DigestUser = { id: string; email: string; timezone: string; digestDay: number; digestTime: string };

export type DigestRow = {
  id: string;
  userId: string;
  windowStart: Date;
  windowEnd: Date;
  linkIds: string[];
  status: "pending" | "sent" | "failed";
};

/** What the digest job needs from storage; the Supabase version lives in store.ts. */
export interface DigestStore {
  listUsers(): Promise<DigestUser[]>;
  findDigest(userId: string, windowStart: Date): Promise<DigestRow | null>;
  /** Unread links saved in [from, to). */
  candidateLinks(userId: string, from: Date, to: Date): Promise<DigestLink[]>;
  linksByIds(userId: string, ids: string[]): Promise<DigestLink[]>;
  /** Inserts a pending row, or returns the existing one for the same user and window. */
  createPendingDigest(row: Omit<DigestRow, "id" | "status">): Promise<DigestRow>;
  /** Marks the digest sent and bumps digest_count (fresh 0→1, carried 1→2). */
  markSent(id: string, freshIds: string[], carriedIds: string[]): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
}

export type RunDeps = {
  now?: Date;
  appUrl: string;
  doneSecret: string;
  sendEmail: (message: EmailMessage) => Promise<{ id: string }>;
};

export type RunResult = {
  userId: string;
  outcome: "sent" | "already_sent" | "nothing_to_send" | "failed";
  digestId?: string;
  error?: string;
};

const newestFirst = (a: DigestLink, b: DigestLink) => Date.parse(b.saved_at) - Date.parse(a.saved_at);

/**
 * Sends each user the digest for the week that just ended, at most once. Safe to run
 * again and again (the 09:00, 09:15 and 09:30 IST triggers): a sent week is skipped,
 * and an unfinished one is resent with the same links and idempotency key.
 */
export async function runDigests(store: DigestStore, deps: RunDeps): Promise<RunResult[]> {
  const results: RunResult[] = [];
  // yagni: one user at a time in one request; batch and resume across the retry runs when users grow.
  for (const user of await store.listUsers()) results.push(await runForUser(store, user, deps));
  return results;
}

async function runForUser(store: DigestStore, user: DigestUser, deps: RunDeps): Promise<RunResult> {
  const now = deps.now ?? new Date();
  const window = digestWindow(now, { timeZone: user.timezone, digestDay: user.digestDay, digestTime: user.digestTime });

  const existing = await store.findDigest(user.id, window.start);
  if (existing?.status === "sent") return { userId: user.id, outcome: "already_sent", digestId: existing.id };

  const { fresh, carried } = existing ? await reloadDigest(store, user.id, existing, window) : await pickLinks(store, user.id, window);
  if (fresh.length === 0 && carried.length === 0) return { userId: user.id, outcome: "nothing_to_send" };

  const row =
    existing ??
    (await store.createPendingDigest({
      userId: user.id,
      windowStart: window.start,
      windowEnd: window.end,
      linkIds: [...fresh, ...carried].map((l) => l.id),
    }));

  try {
    const email = renderDigestEmail({
      appUrl: deps.appUrl,
      fresh,
      carried,
      // Expiry is pinned to the window, not the clock, so a resend renders the identical email.
      doneUrl: (link) => `${deps.appUrl}/done/${signDoneToken({ linkId: link.id, userId: user.id }, deps.doneSecret, window.end)}`,
    });
    await deps.sendEmail({ to: user.email, ...email, idempotencyKey: `digest-${row.id}` });
    await store.markSent(row.id, fresh.map((l) => l.id), carried.map((l) => l.id));
    return { userId: user.id, outcome: "sent", digestId: row.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await store.markFailed(row.id, message).catch(() => {});
    return { userId: user.id, outcome: "failed", digestId: row.id, error: message };
  }
}

async function pickLinks(store: DigestStore, userId: string, window: DigestWindow) {
  return selectDigestLinks(await store.candidateLinks(userId, window.previousStart, window.end), window);
}

/** A retry resends exactly what the first attempt chose, even if links changed since. */
async function reloadDigest(store: DigestStore, userId: string, row: DigestRow, window: DigestWindow) {
  const links = (await store.linksByIds(userId, row.linkIds)).sort(newestFirst);
  return {
    fresh: links.filter((l) => Date.parse(l.saved_at) >= window.start.getTime()),
    carried: links.filter((l) => Date.parse(l.saved_at) < window.start.getTime()),
  };
}
