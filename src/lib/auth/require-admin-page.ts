import { redirect } from "next/navigation";

import { getUserProfile } from "@/lib/auth/profile";
import type { UserProfile } from "@/lib/auth/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdminPageProfile(redirectPath: string): Promise<UserProfile> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/?login=1&redirect=${encodeURIComponent(redirectPath)}`);
  }

  const profile = await getUserProfile(supabase, user.id);

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return profile;
}
