export type LinkType = "article" | "video" | "thread" | "other";
export type LinkSource = "whatsapp" | "extension" | "share" | "web";
export type LinkStatus = "unread" | "done" | "deleted";

/** Row of `public.links`. */
export type Link = {
  id: string;
  user_id: string;
  url: string;
  canonical_url: string;
  title: string | null;
  site: string | null;
  thumbnail_url: string | null;
  type: LinkType;
  est_minutes: number | null;
  note: string | null;
  source: LinkSource;
  status: LinkStatus;
  saved_at: string;
  done_at: string | null;
  digest_count: number;
  window_start: string;
};
