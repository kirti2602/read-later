"use server";

import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/auth/supabase-server";
import { isValidTimeZone } from "@/links/week-window";

export type LoginState = { error: string | null };

/** Column default of users.timezone in the init migration. */
const DEFAULT_TIMEZONE = "UTC";

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const db = await createServerSupabase();
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    if (isAuthRetryableFetchError(error)) return { error: "Couldn't reach the server. Try again." };
    return {
      error: error.code === "invalid_credentials" ? "Wrong email or password." : error.message,
    };
  }

  // First login sets where "Saturday 09:00" falls. Later logins from a travelling
  // laptop must not move the week boundary.
  // yagni: no timezone setting yet; add one to a settings page when it's needed.
  const timeZone = String(formData.get("timezone") ?? "");
  if (isValidTimeZone(timeZone)) {
    const { error: tzError } = await db
      .from("users")
      .update({ timezone: timeZone })
      .eq("id", data.user.id)
      .eq("timezone", DEFAULT_TIMEZONE);
    if (tzError) console.error("Could not save timezone", tzError);
  }

  redirect("/");
}

export async function signOut(): Promise<void> {
  const db = await createServerSupabase();
  await db.auth.signOut();
  redirect("/login");
}
