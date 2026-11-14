import type { SupabaseClient } from "@supabase/supabase-js";
import type { Link } from "./types";

export const VIEWS = ["week", "older", "done"] as const;
export type View = (typeof VIEWS)[number];

export function parseView(value: string | string[] | undefined): View {
  return VIEWS.find((v) => v === value) ?? "week";
}

/**
 * week: unread, saved since `windowStart`, newest first.
 * older: unread, saved before `windowStart`.
 * done: marked done, most recently finished first.
 */
export async function listLinks(
  db: SupabaseClient,
  userId: string,
  view: View,
  windowStart: Date,
): Promise<Link[]> {
  let query = db.from("links").select().eq("user_id", userId);
  const since = windowStart.toISOString();

  if (view === "week") {
    query = query.eq("status", "unread").gte("saved_at", since).order("saved_at", { ascending: false });
  } else if (view === "older") {
    query = query.eq("status", "unread").lt("saved_at", since).order("saved_at", { ascending: false });
  } else {
    query = query.eq("status", "done").order("done_at", { ascending: false });
  }

  const { data, error } = await query.limit(200).returns<Link[]>();
  if (error) throw error;
  return data;
}
