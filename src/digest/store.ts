import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DigestRow, DigestStore, DigestUser } from "./run";
import type { DigestLink } from "./select";

const LINK_FIELDS = "id, title, url, site, type, est_minutes, status, saved_at, digest_count";
const UNIQUE_VIOLATION = "23505";

type DigestRecord = {
  id: string;
  user_id: string;
  window_start: string;
  window_end: string;
  link_ids: string[];
  status: DigestRow["status"];
};

const toRow = (r: DigestRecord): DigestRow => ({
  id: r.id,
  userId: r.user_id,
  windowStart: new Date(r.window_start),
  windowEnd: new Date(r.window_end),
  linkIds: r.link_ids,
  status: r.status,
});

/** DigestStore on Supabase. Uses the secret-key client, so every query filters by user id itself. */
export function supabaseDigestStore(db: SupabaseClient): DigestStore {
  async function findDigest(userId: string, windowStart: Date): Promise<DigestRow | null> {
    const { data, error } = await db
      .from("digests")
      .select("id, user_id, window_start, window_end, link_ids, status")
      .eq("user_id", userId)
      .eq("window_start", windowStart.toISOString())
      .maybeSingle<DigestRecord>();
    if (error) throw error;
    return data ? toRow(data) : null;
  }

  return {
    async listUsers(): Promise<DigestUser[]> {
      const { data, error } = await db.from("users").select("id, email, timezone, digest_day, digest_time");
      if (error) throw error;
      return data.map((u) => ({ id: u.id, email: u.email, timezone: u.timezone, digestDay: u.digest_day, digestTime: u.digest_time }));
    },

    findDigest,

    async candidateLinks(userId, from, to) {
      const { data, error } = await db
        .from("links")
        .select(LINK_FIELDS)
        .eq("user_id", userId)
        .eq("status", "unread")
        .gte("saved_at", from.toISOString())
        .lt("saved_at", to.toISOString())
        .returns<DigestLink[]>();
      if (error) throw error;
      return data;
    },

    async linksByIds(userId, ids) {
      if (ids.length === 0) return [];
      const { data, error } = await db.from("links").select(LINK_FIELDS).eq("user_id", userId).in("id", ids).returns<DigestLink[]>();
      if (error) throw error;
      return data;
    },

    async createPendingDigest(row) {
      const { data, error } = await db
        .from("digests")
        .insert({
          user_id: row.userId,
          window_start: row.windowStart.toISOString(),
          window_end: row.windowEnd.toISOString(),
          link_ids: row.linkIds,
        })
        .select("id, user_id, window_start, window_end, link_ids, status")
        .single<DigestRecord>();
      if (!error) return toRow(data);
      // Two overlapping runs: the other one created it first, so use theirs.
      if (error.code === UNIQUE_VIOLATION) {
        const existing = await findDigest(row.userId, row.windowStart);
        if (existing) return existing;
      }
      throw error;
    },

    async markSent(id, freshIds, carriedIds) {
      const { error } = await db.from("digests").update({ status: "sent", sent_at: new Date().toISOString(), error: null }).eq("id", id);
      if (error) throw error;
      // Guarded on the current count, so a repeat of this step can't bump a link twice.
      if (freshIds.length) {
        const { error: freshError } = await db.from("links").update({ digest_count: 1 }).in("id", freshIds).eq("digest_count", 0);
        if (freshError) throw freshError;
      }
      if (carriedIds.length) {
        const { error: carriedError } = await db.from("links").update({ digest_count: 2 }).in("id", carriedIds).eq("digest_count", 1);
        if (carriedError) throw carriedError;
      }
    },

    async markFailed(id, message) {
      const { error } = await db.from("digests").update({ status: "failed", error: message.slice(0, 500) }).eq("id", id);
      if (error) throw error;
    },
  };
}
