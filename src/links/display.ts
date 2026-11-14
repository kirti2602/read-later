import type { Link } from "./types";

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

export function listSummary(links: Pick<Link, "est_minutes">[]): { count: number; minutes: number } {
  return {
    count: links.length,
    minutes: links.reduce((sum, link) => sum + (link.est_minutes ?? 0), 0),
  };
}

export function formatDay(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone }).format(date);
}
