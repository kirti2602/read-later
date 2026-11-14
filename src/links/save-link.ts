import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppUser } from "@/auth/current-user";
import { canonicalizeUrl } from "./canonicalize";
import { fetchMetadata } from "./metadata";
import type { Link, LinkSource } from "./types";
import { windowStart } from "./week-window";

export type SaveResult = "saved" | "already_saved" | "restored";

const UNIQUE_VIOLATION = "23505";

/**
 * Inserts the link, or returns this week's existing copy of it. A copy the user
 * deleted earlier this week is brought back as unread. Throws InvalidUrlError.
 */
export async function saveLink(
  db: SupabaseClient,
  user: AppUser,
  rawUrl: string,
  source: LinkSource,
  now: Date = new Date(),
): Promise<{ link: Link; result: SaveResult }> {
  const { url, canonicalUrl } = canonicalizeUrl(rawUrl);
  const start = windowStart(now, {
    timeZone: user.timezone,
    digestDay: user.digestDay,
    digestTime: user.digestTime,
  });

  const { data: inserted, error: insertError } = await db
    .from("links")
    .insert({
      user_id: user.id,
      url,
      canonical_url: canonicalUrl,
      source,
      saved_at: now.toISOString(),
      window_start: start.toISOString(),
    })
    .select()
    .single<Link>();
  if (!insertError) return { link: inserted, result: "saved" };
  if (insertError.code !== UNIQUE_VIOLATION) throw insertError;

  const { data: existing, error: selectError } = await db
    .from("links")
    .select()
    .eq("user_id", user.id)
    .eq("canonical_url", canonicalUrl)
    .eq("window_start", start.toISOString())
    .single<Link>();
  if (selectError) throw selectError;
  if (existing.status !== "deleted") return { link: existing, result: "already_saved" };

  const { data: restored, error: restoreError } = await db
    .from("links")
    .update({ status: "unread", saved_at: now.toISOString(), done_at: null })
    .eq("id", existing.id)
    .select()
    .single<Link>();
  if (restoreError) throw restoreError;
  return { link: restored, result: "restored" };
}

/** Fills in title, site, thumbnail, type and minutes. Title falls back to the hostname. */
export async function enrichLink(db: SupabaseClient, link: Link): Promise<void> {
  const meta = await fetchMetadata({ url: link.url, canonicalUrl: link.canonical_url });
  const { error } = await db
    .from("links")
    .update({
      title: meta.title ?? new URL(link.url).hostname.replace(/^www\./, ""),
      site: meta.site,
      thumbnail_url: meta.thumbnailUrl,
      type: meta.type,
      est_minutes: meta.estMinutes,
    })
    .eq("id", link.id);
  if (error) console.error("Could not save link preview", link.id, error);
}
