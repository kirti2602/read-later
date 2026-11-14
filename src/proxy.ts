import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/auth/supabase-env";

/** Refreshes the Supabase session cookie and sends signed-out visitors to /login. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = supabaseEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  // API routes answer 401 themselves; email Done links carry their own signed permission.
  const isPublic = pathname === "/login" || pathname.startsWith("/api/") || pathname.startsWith("/done/");
  if (!signedIn && !isPublic) {
    return redirectKeepingCookies("/login", request, response);
  }
  if (signedIn && pathname === "/login") {
    return redirectKeepingCookies("/", request, response);
  }
  return response;
}

/** A refreshed session lives only in `response`'s cookies; dropping them would log the user out. */
function redirectKeepingCookies(path: string, request: NextRequest, response: NextResponse) {
  const redirect = NextResponse.redirect(new URL(path, request.url));
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
