import type { Link } from "@/links/types";
import { windowStart, type WindowSchedule } from "@/links/week-window";

export type DigestWindow = {
  /** Start of the week the digest covers (inclusive). */
  start: Date;
  /** End of that week (exclusive): the digest boundary at or before `now`. */
  end: Date;
  /** Start of the week before, for "From last week" leftovers. */
  previousStart: Date;
};

/**
 * The week that just ended, as of `now`. Each boundary comes from `windowStart`
 * rather than a fixed 7-day step so weeks stay correct across DST changes.
 * Any time after the digest boundary yields the same window, so retries agree.
 */
export function digestWindow(now: Date, schedule: WindowSchedule): DigestWindow {
  const end = windowStart(now, schedule);
  const start = windowStart(new Date(end.getTime() - 1), schedule);
  const previousStart = windowStart(new Date(start.getTime() - 1), schedule);
  return { start, end, previousStart };
}

export type DigestLink = Pick<
  Link,
  "id" | "title" | "url" | "site" | "type" | "est_minutes" | "status" | "saved_at" | "digest_count"
>;

/** Unread links saved in the window, plus last week's leftovers that were shown exactly once. */
export function selectDigestLinks<T extends DigestLink>(
  links: T[],
  window: DigestWindow,
): { fresh: T[]; carried: T[] } {
  const start = window.start.getTime();
  const end = window.end.getTime();
  const previousStart = window.previousStart.getTime();
  const savedAt = (link: T) => new Date(link.saved_at).getTime();

  const unread = links.filter((link) => link.status === "unread");
  const newestFirst = (a: T, b: T) => savedAt(b) - savedAt(a);

  return {
    fresh: unread
      .filter((link) => savedAt(link) >= start && savedAt(link) < end)
      .sort(newestFirst),
    carried: unread
      .filter(
        (link) =>
          savedAt(link) >= previousStart && savedAt(link) < start && link.digest_count === 1,
      )
      .sort(newestFirst),
  };
}
