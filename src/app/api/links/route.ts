import { after } from "next/server";
import { getCurrentUser } from "@/auth/current-user";
import { createServerSupabase } from "@/auth/supabase-server";
import { InvalidUrlError } from "@/links/canonicalize";
import { enrichLink, saveLink } from "@/links/save-link";

// Most previews land within this budget so the list shows them right away;
// slower ones finish in after() and appear on the next refresh.
const PREVIEW_WAIT_MS = 2500;

export async function POST(request: Request) {
  const db = await createServerSupabase();
  const user = await getCurrentUser(db);
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const rawUrl =
    body && typeof body === "object" && "url" in body && typeof body.url === "string"
      ? body.url
      : null;
  if (!rawUrl) return Response.json({ error: "Send JSON like {\"url\": \"https://…\"}" }, { status: 400 });

  try {
    const { link, result } = await saveLink(db, user, rawUrl, "web");
    // Re-fetching on restore lets delete + re-save repair a preview that failed earlier.
    if (result === "saved" || result === "restored") {
      // The link is already saved; a preview failure must not turn this into an error.
      const preview = enrichLink(db, link).catch((error) =>
        console.error("Link preview failed", link.id, error),
      );
      after(() => preview);
      await Promise.race([preview, new Promise((resolve) => setTimeout(resolve, PREVIEW_WAIT_MS))]);
    }
    return Response.json({ link, result }, { status: result === "already_saved" ? 200 : 201 });
  } catch (error) {
    if (error instanceof InvalidUrlError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
