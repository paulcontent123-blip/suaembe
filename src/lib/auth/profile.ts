import type { SupabaseClient } from "@supabase/supabase-js";

import type { UserProfile } from "./types";

const PROFILE_COLUMNS = "id, email, phone, role, full_name, avatar_url, is_verified";

/**
 * Reads the public.users profile row for a signed-in user.
 * Relies on RLS ("users_select_own_or_admin") when called with a
 * user-scoped client, so it only ever returns the caller's own row
 * unless the caller is an admin.
 */
export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as UserProfile | null) ?? null;
}
