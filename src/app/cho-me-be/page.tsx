import { ChoMeBeBrowser } from "@/components/cho-me-be/ChoMeBeBrowser";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteNav } from "@/components/home/SiteNav";
import { getUserProfile } from "@/lib/auth/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// UC-09 (xem tin, Khách/Mẹ bỉm) + UC-10 (gửi form pass đồ, Khách/Mẹ bỉm,
// không bắt buộc đăng nhập) + UC-12 (đặt mua thanh toán thường, Khách/Mẹ
// bỉm) — duyệt tin (UC-11) ở /admin.
export default async function ChoMeBePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getUserProfile(supabase, user.id) : null;

  return (
    <main className="min-h-screen bg-[#FDF8FA]">
      <SiteNav profile={profile} />
      <ChoMeBeBrowser
        defaultName={profile?.full_name ?? ""}
        defaultPhone={profile?.phone ?? ""}
        isAuthenticated={profile != null}
      />
      <SiteFooter />
    </main>
  );
}
