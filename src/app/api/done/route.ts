import { createAdminSupabase } from "@/auth/supabase-admin";
import { doneSecret } from "@/digest/config";
import { verifyDoneToken } from "@/digest/token";

export type DoneResponse = { state: "done" | "already_done" | "undone"; title: string | null } | { error: string };

/**
 * Marks a link done (or undoes it) from an email Done link, with no login. The signed token
 * names the link and its owner, so the secret-key client is limited to exactly that row.
 */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const token = body && typeof body === "object" && "token" in body && typeof body.token === "string" ? body.token : "";
  const undo = Boolean(body && typeof body === "object" && "undo" in body && body.undo === true);

  const payload = verifyDoneToken(token, doneSecret());
  if (!payload) return Response.json({ error: "This link has expired or isn't valid." } satisfies DoneResponse, { status: 400 });

  const db = createAdminSupabase();
  const { data, error } = await db
    .from("links")
    .update(undo ? { status: "unread", done_at: null } : { status: "done", done_at: new Date().toISOString() })
    .eq("id", payload.linkId)
    .eq("user_id", payload.userId)
    .eq("status", undo ? "done" : "unread")
    .select("title")
    .maybeSingle<{ title: string | null }>();
  if (error) throw error;
  if (data) return Response.json({ state: undo ? "undone" : "done", title: data.title } satisfies DoneResponse);

  // Nothing changed: either it was already in that state or the link is gone.
  const { data: current } = await db
    .from("links")
    .select("title, status")
    .eq("id", payload.linkId)
    .eq("user_id", payload.userId)
    .maybeSingle<{ title: string | null; status: string }>();
  if (current?.status === "done" && !undo) return Response.json({ state: "already_done", title: current.title } satisfies DoneResponse);
  if (current?.status === "unread" && undo) return Response.json({ state: "undone", title: current.title } satisfies DoneResponse);
  return Response.json({ error: "That link is no longer in your list." } satisfies DoneResponse, { status: 404 });
}
