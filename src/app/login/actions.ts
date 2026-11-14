"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/auth/supabase-server";
import { isValidTimeZone } from "@/links/week-window";

export type LoginState = { error: string | null };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const db = await createServerSupabase();
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error: error.code === "invalid_credentials" ? "Wrong email or password." : error.message,
    };
  }

  // The browser's zone sets where "Saturday 09:00" falls for this user.
  const timeZone = String(formData.get("timezone") ?? "");
  if (isValidTimeZone(timeZone)) {
    const { error: tzError } = await db
      .from("users")
      .update({ timezone: timeZone })
      .eq("id", data.user.id);
    if (tzError) console.error("Could not save timezone", tzError);
  }

  redirect("/");
}

export async function signOut(): Promise<void> {
  const db = await createServerSupabase();
  await db.auth.signOut();
  redirect("/login");
}
