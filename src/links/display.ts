import type { Link, LinkType } from "./types";

/** Longest a preview can take: two 5s fetch attempts plus the database write, with slack. */
const PREVIEW_PENDING_MS = 30_000;

/** A link's details are still being fetched: enrichLink always writes a title, so none yet means in flight. */
export function isPreviewPending(link: Pick<Link, "title" | "saved_at">, now: number): boolean {
  return link.title === null && now - Date.parse(link.saved_at) < PREVIEW_PENDING_MS;
}

const hostnameOf = (url: string) => new URL(url).hostname.replace(/^www\./, "");

export function displayTitle(link: Pick<Link, "title" | "url">): string {
  return link.title ?? hostnameOf(link.url);
}

/** "Article from udayan.co", "Video on YouTube": the type in words, never an icon. */
export function sourceLine(link: Pick<Link, "type" | "site" | "url">): string {
  const site = link.site ?? hostnameOf(link.url);
  switch (link.type) {
    case "article":
      return `Article from ${site}`;
    case "video":
      return `Video on ${site}`;
    case "thread":
      return `Post on ${site}`;
    default:
      return site;
  }
}

/** `timed` is how many links the minute total covers, so the total never passes for the whole list. */
export function listSummary(links: Pick<Link, "est_minutes">[]): { count: number; minutes: number; timed: number } {
  return {
    count: links.length,
    minutes: links.reduce((sum, link) => sum + (link.est_minutes ?? 0), 0),
    timed: links.filter((link) => link.est_minutes).length,
  };
}

export function formatDay(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone }).format(date);
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** The video id when the link is one YouTube video, else null (channels, playlists, other sites). */
export function youTubeId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^(www|m)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = parsed.pathname.slice(1);
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (parsed.pathname === "/watch") id = parsed.searchParams.get("v");
    else id = parsed.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1] ?? null;
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

export type TypeFilter = "all" | Exclude<LinkType, "other">;
const TYPE_FILTERS: TypeFilter[] = ["article", "video", "thread"];

export function parseType(value: string | string[] | undefined): TypeFilter {
  return TYPE_FILTERS.find((t) => t === value) ?? "all";
}

const dayKey = (instant: number, timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(instant);

/** "Today", "Yesterday" or "10 Nov", judged in the user's timezone. */
export function savedDay(savedAt: string, now: number, timeZone: string): string {
  const saved = Date.parse(savedAt);
  if (dayKey(saved, timeZone) === dayKey(now, timeZone)) return "Today";
  if (dayKey(saved, timeZone) === dayKey(now - 86_400_000, timeZone)) return "Yesterday";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone }).format(saved);
}

/** The site's own icon; never a third-party favicon service, which would see every saved domain. */
export function faviconUrl(url: string): string {
  return `${new URL(url).origin}/favicon.ico`;
}
