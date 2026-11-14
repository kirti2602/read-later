import type { SupabaseClient } from "@supabase/supabase-js";
import type { TypeFilter } from "./display";
import type { Link } from "./types";

export const VIEWS = ["week", "older", "done"] as const;
export type View = (typeof VIEWS)[number];
export type ViewCounts = Record<View, number>;

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
  type: TypeFilter = "all",
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
  if (type !== "all") query = query.eq("type", type);

  const { data, error } = await query.limit(200).returns<Link[]>();
  if (error) throw error;
  return data;
}

/** How many links each view holds, for the sidebar and tab bar badges. */
export async function countLinks(db: SupabaseClient, userId: string, windowStart: Date): Promise<ViewCounts> {
  const since = windowStart.toISOString();
  const base = () => db.from("links").select("id", { count: "exact", head: true }).eq("user_id", userId);
  const [week, older, done] = await Promise.all([
    base().eq("status", "unread").gte("saved_at", since),
    base().eq("status", "unread").lt("saved_at", since),
    base().eq("status", "done"),
  ]);
  for (const result of [week, older, done]) if (result.error) throw result.error;
  return { week: week.count ?? 0, older: older.count ?? 0, done: done.count ?? 0 };
}
