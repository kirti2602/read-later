import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./supabase-env";

/**
 * Database client with the secret key: it bypasses row-level security, so it is only for
 * work that runs without a signed-in user (the digest job, email Done links). Every query
 * made with it must filter by user id itself. `server-only` fails the build if a client
 * component ever imports this file.
 */
export function createAdminSupabase(): SupabaseClient {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) throw new Error("Missing SUPABASE_SECRET_KEY; add it to .env.local and Vercel (server-only)");
  return createClient(supabaseEnv().url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
