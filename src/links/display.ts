import type { Link } from "./types";

/** Longest a preview can take: two 5s fetch attempts plus the database write, with slack. */
const PREVIEW_PENDING_MS = 30_000;

/** A link's details are still being fetched: enrichLink always writes a title, so none yet means in flight. */
export function isPreviewPending(link: Pick<Link, "title" | "saved_at">, now: number): boolean {
  return link.title === null && now - Date.parse(link.saved_at) < PREVIEW_PENDING_MS;
}

export function displayTitle(link: Pick<Link, "title" | "url">): string {
  return link.title ?? new URL(link.url).hostname.replace(/^www\./, "");
}
