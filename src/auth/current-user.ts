import type { SupabaseClient } from "@supabase/supabase-js";

export type AppUser = {
  id: string;
  email: string;
  timezone: string;
  digestDay: number;
  digestTime: string;
};

/** The signed-in user's profile row, or null when there is no valid session. */
export async function getCurrentUser(db: SupabaseClient): Promise<AppUser | null> {
  const { data: claims } = await db.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return null;

  const { data, error } = await db
    .from("users")
    .select("id, email, timezone, digest_day, digest_time")
    .eq("id", userId)
    .single();
  if (error) throw error;

  return {
    id: data.id,
    email: data.email,
    timezone: data.timezone,
    digestDay: data.digest_day,
    digestTime: data.digest_time,
  };
}
