"use server";

import { refresh } from "next/cache";
import { createServerSupabase } from "@/auth/supabase-server";
import type { LinkStatus } from "./types";

async function setStatus(linkId: string, status: Exclude<LinkStatus, "unread">): Promise<void> {
  const db = await createServerSupabase();
  // RLS limits the update to the signed-in user's own links.
  const { error } = await db
    .from("links")
    .update({ status, done_at: status === "done" ? new Date().toISOString() : null })
    .eq("id", linkId);
  if (error) throw error;
  refresh();
}

export async function markDone(linkId: string): Promise<void> {
  await setStatus(linkId, "done");
}

export async function deleteLink(linkId: string): Promise<void> {
  await setStatus(linkId, "deleted");
}
