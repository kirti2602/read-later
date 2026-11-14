"use server";

import { getCurrentUser } from "@/auth/current-user";
import { createServerSupabase } from "@/auth/supabase-server";
import { searchPattern } from "./display";
import type { View } from "./queries";
import type { Link } from "./types";
import { windowStart } from "./week-window";

export type SearchResult = { link: Link; view: View };

const LIMIT = 8;

/** Searches every saved link (any week, done or not; never deleted) by title, site and URL. */
export async function searchLinks(query: string): Promise<SearchResult[]> {
  const pattern = searchPattern(query);
  if (!pattern) return [];

  const db = await createServerSupabase();
  const user = await getCurrentUser(db);
  if (!user) return [];

  const { data, error } = await db
    .from("links")
    .select()
    .eq("user_id", user.id)
    .neq("status", "deleted")
    .or(`title.ilike.${pattern},site.ilike.${pattern},url.ilike.${pattern}`)
    .order("saved_at", { ascending: false })
    .limit(LIMIT)
    .returns<Link[]>();
  if (error) throw error;

  const start = windowStart(new Date(), { timeZone: user.timezone, digestDay: user.digestDay, digestTime: user.digestTime });
  return data.map((link) => ({
    link,
    view: link.status === "done" ? "done" : Date.parse(link.saved_at) >= start.getTime() ? "week" : "older",
  }));
}
