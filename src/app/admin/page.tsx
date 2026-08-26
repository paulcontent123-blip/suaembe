import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { getUserProfile } from "@/lib/auth/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Middleware đã chặn route /admin cho user không phải role 'admin', nhưng vẫn
// kiểm tra lại ở đây (defense in depth) phòng trường hợp middleware bị bypass/lỗi.
export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?login=1&redirect=/admin");
  }

  const profile = await getUserProfile(supabase, user.id);

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return <AdminShell profile={profile} />;
}
