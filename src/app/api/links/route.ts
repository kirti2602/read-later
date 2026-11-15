import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { after } from "next/server";
import { getCurrentUser } from "@/auth/current-user";
import { createServerSupabase } from "@/auth/supabase-server";
import { InvalidUrlError } from "@/links/canonicalize";
import { enrichLink, saveLink } from "@/links/save-link";
import type { LinkSource } from "@/links/types";

const SOURCES: LinkSource[] = ["web", "share", "extension"];

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const rawUrl =
    body && typeof body === "object" && "url" in body && typeof body.url === "string"
      ? body.url
      : null;
  if (!rawUrl) return Response.json({ error: "Send JSON like {\"url\": \"https://…\"}" }, { status: 400 });
  // Where the save came from: the web app, a phone share, or the browser extension.
  const requested = body && typeof body === "object" && "source" in body ? body.source : "web";
  const source = SOURCES.find((s) => s === requested);
  if (!source) return Response.json({ error: "Unknown source." }, { status: 400 });

  try {
    const db = await createServerSupabase();
    const user = await getCurrentUser(db);
    if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

    const { link, result } = await saveLink(db, user, rawUrl, source);
    // Reply as soon as the link is stored; the preview lands in after() and the client re-checks.
    // Re-fetching on restore lets delete + re-save repair a preview that failed earlier.
    const previewPending = result === "saved" || result === "restored";
    if (previewPending) {
      after(() =>
        enrichLink(db, link).catch((error) => console.error("Link preview failed", link.id, error)),
      );
    }
    return Response.json(
      { link, result, previewPending },
      { status: result === "already_saved" ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof InvalidUrlError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (isAuthRetryableFetchError(error)) {
      return Response.json({ error: "Couldn't reach the server. Try again." }, { status: 503 });
    }
    throw error;
  }
}
