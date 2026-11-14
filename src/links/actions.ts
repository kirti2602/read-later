"use server";

import { refresh } from "next/cache";
import { createServerSupabase } from "@/auth/supabase-server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// RLS limits every update to the signed-in user's own links. The status filters
// stop a stale tab from reviving a link that was deleted elsewhere.

export async function markDone(linkId: string): Promise<void> {
  if (!UUID.test(linkId)) return;
  const db = await createServerSupabase();
  const { error } = await db
    .from("links")
    .update({ status: "done", done_at: new Date().toISOString() })
    .eq("id", linkId)
    .eq("status", "unread");
  if (error) throw error;
  refresh();
}

/** Undo for Done and Delete: puts the link back in the state it was in before. */
export async function restoreLink(linkId: string, to: "unread" | "done"): Promise<void> {
  if (!UUID.test(linkId) || (to !== "unread" && to !== "done")) return;
  const db = await createServerSupabase();
  const { error } = await db
    .from("links")
    .update({ status: to, ...(to === "unread" ? { done_at: null } : {}) })
    .eq("id", linkId)
    .neq("status", to);
  if (error) throw error;
  refresh();
}

export async function deleteLink(linkId: string): Promise<void> {
  if (!UUID.test(linkId)) return;
  const db = await createServerSupabase();
  const { error } = await db
    .from("links")
    .update({ status: "deleted" })
    .eq("id", linkId)
    .neq("status", "deleted");
  if (error) throw error;
  refresh();
}
