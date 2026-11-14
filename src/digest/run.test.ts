import { describe, expect, it } from "vitest";
import type { DigestLink } from "./select";
import { runDigests, type DigestRow, type DigestStore, type DigestUser } from "./run";

const USER: DigestUser = { id: "11111111-1111-4111-8111-111111111111", email: "me@example.com", timezone: "Asia/Kolkata", digestDay: 6, digestTime: "09:00" };
// Sat 2026-11-21 09:00 IST: the digest covers 14 Nov 09:00 to 21 Nov 09:00 IST.
const NOW = new Date("2026-11-21T03:30:00Z");

const link = (id: string, savedAt: string, digestCount = 0, status: DigestLink["status"] = "unread"): DigestLink => ({
  id: `${id}0000000-0000-4000-8000-000000000000`.slice(0, 36),
  title: `Link ${id}`,
  url: `https://example.com/${id}`,
  site: "example.com",
  type: "article",
  est_minutes: 5,
  status,
  saved_at: savedAt,
  digest_count: digestCount,
});

function memoryStore(links: DigestLink[], digests: DigestRow[] = []) {
  const state = { links: [...links], digests: [...digests], sent: [] as string[] };
  const store: DigestStore = {
    listUsers: async () => [USER],
    findDigest: async (userId, start) => state.digests.find((d) => d.userId === userId && d.windowStart.getTime() === start.getTime()) ?? null,
    candidateLinks: async (_userId, from, to) =>
      state.links.filter((l) => l.status === "unread" && Date.parse(l.saved_at) >= from.getTime() && Date.parse(l.saved_at) < to.getTime()),
    linksByIds: async (_userId, ids) => state.links.filter((l) => ids.includes(l.id)),
    createPendingDigest: async (row) => {
      const existing = state.digests.find((d) => d.userId === row.userId && d.windowStart.getTime() === row.windowStart.getTime());
      if (existing) return existing;
      const created: DigestRow = { ...row, id: `digest-${state.digests.length + 1}`, status: "pending" };
      state.digests.push(created);
      return created;
    },
    markSent: async (id, freshIds, carriedIds) => {
      state.digests = state.digests.map((d) => (d.id === id ? { ...d, status: "sent" } : d));
      state.links = state.links.map((l) =>
        freshIds.includes(l.id) && l.digest_count === 0
          ? { ...l, digest_count: 1 }
          : carriedIds.includes(l.id) && l.digest_count === 1
            ? { ...l, digest_count: 2 }
            : l,
      );
    },
    markFailed: async (id) => {
      state.digests = state.digests.map((d) => (d.id === id ? { ...d, status: "failed" } : d));
    },
  };
  return { store, state };
}

const deps = (overrides: Partial<Parameters<typeof runDigests>[1]> = {}) => {
  const sent: { to: string; subject: string; idempotencyKey: string; text: string }[] = [];
  return {
    sent,
    deps: {
      now: NOW,
      appUrl: "https://app.example",
      doneSecret: "test-secret",
      sendEmail: async (message: { to: string; subject: string; html: string; text: string; idempotencyKey: string }) => {
        sent.push(message);
        return { id: "email_1" };
      },
      ...overrides,
    },
  };
};

describe("runDigests", () => {
  it("sends this week's links plus once-shown leftovers, then records it", async () => {
    const fresh = link("a", "2026-11-18T10:00:00Z");
    const carried = link("b", "2026-11-10T10:00:00Z", 1);
    const shownTwice = link("c", "2026-11-10T11:00:00Z", 2);
    const { store, state } = memoryStore([fresh, carried, shownTwice]);
    const { deps: d, sent } = deps();

    const results = await runDigests(store, d);

    expect(results).toEqual([{ userId: USER.id, outcome: "sent", digestId: "digest-1" }]);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("me@example.com");
    expect(sent[0].idempotencyKey).toBe("digest-digest-1");
    expect(sent[0].text).toContain("Link a");
    expect(sent[0].text).toContain("From last week");
    expect(sent[0].text).not.toContain("Link c");
    expect(state.digests[0].linkIds.sort()).toEqual([fresh.id, carried.id].sort());
    expect(state.links.find((l) => l.id === fresh.id)?.digest_count).toBe(1);
    expect(state.links.find((l) => l.id === carried.id)?.digest_count).toBe(2);
  });

  it("does nothing when there is nothing to send", async () => {
    const { store, state } = memoryStore([link("a", "2026-11-18T10:00:00Z", 0, "done")]);
    const { deps: d, sent } = deps();
    expect(await runDigests(store, d)).toEqual([{ userId: USER.id, outcome: "nothing_to_send" }]);
    expect(sent).toHaveLength(0);
    expect(state.digests).toHaveLength(0);
  });

  it("sends once: a retry after a successful send stops", async () => {
    const { store } = memoryStore([link("a", "2026-11-18T10:00:00Z")]);
    const first = deps();
    await runDigests(store, first.deps);
    const retry = deps({ now: new Date("2026-11-21T03:45:00Z") });
    expect(await runDigests(store, retry.deps)).toEqual([{ userId: USER.id, outcome: "already_sent", digestId: "digest-1" }]);
    expect(retry.sent).toHaveLength(0);
  });

  it("resends a pending digest with the same links and key, so the provider drops a duplicate", async () => {
    const a = link("a", "2026-11-18T10:00:00Z");
    const pending: DigestRow = {
      id: "digest-9",
      userId: USER.id,
      windowStart: new Date("2026-11-14T03:30:00Z"),
      windowEnd: new Date("2026-11-21T03:30:00Z"),
      linkIds: [a.id],
      status: "pending",
    };
    // A link saved after the crash must not join the retried email.
    const late = link("b", "2026-11-19T10:00:00Z");
    const { store } = memoryStore([a, late], [pending]);
    const { deps: d, sent } = deps();

    expect(await runDigests(store, d)).toEqual([{ userId: USER.id, outcome: "sent", digestId: "digest-9" }]);
    expect(sent[0].idempotencyKey).toBe("digest-digest-9");
    expect(sent[0].text).toContain("Link a");
    expect(sent[0].text).not.toContain("Link b");
  });

  it("records a failed send and reports it without throwing", async () => {
    const { store, state } = memoryStore([link("a", "2026-11-18T10:00:00Z")]);
    const { deps: d } = deps({
      sendEmail: async () => {
        throw new Error("Resend refused the email (403): domain not verified");
      },
    });
    expect(await runDigests(store, d)).toEqual([
      { userId: USER.id, outcome: "failed", digestId: "digest-1", error: "Resend refused the email (403): domain not verified" },
    ]);
    expect(state.digests[0].status).toBe("failed");
    expect(state.links[0].digest_count).toBe(0);
  });

  it("builds Done links that verify for the right link and user", async () => {
    const { store } = memoryStore([link("a", "2026-11-18T10:00:00Z")]);
    const { deps: d, sent } = deps();
    await runDigests(store, d);
    const token = sent[0].text.match(/https:\/\/app\.example\/done\/(\S+)/)?.[1];
    const { verifyDoneToken } = await import("./token");
    expect(verifyDoneToken(token ?? "", "test-secret", NOW)).toEqual({ linkId: link("a", "").id, userId: USER.id });
  });
});
