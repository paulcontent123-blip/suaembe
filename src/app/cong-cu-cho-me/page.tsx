import { CongCuChoMeBrowser } from "@/components/cong-cu/CongCuChoMeBrowser";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteNav } from "@/components/home/SiteNav";
import { getUserProfile } from "@/lib/auth/profile";
import type { Baby } from "@/lib/babies/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// UC-08 (AI Gợi Ý Sữa, public) + 2 công cụ giữ client-side theo quyết định
// đã chốt với techlead (xem database.md §3.1): Tính ngày dự sinh, Cẩm nang
// sinh con — không cần bảng/API riêng, tính toán/lưu trạng thái hoàn toàn ở
// trình duyệt. Hồ sơ bé lấy sẵn ở server (nếu đã đăng nhập) để tự điền tuổi
// bé vào công cụ AI, không bắt buộc.
export default async function CongCuChoMePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getUserProfile(supabase, user.id) : null;

  const { data: babies } = profile
    ? await supabase
        .from("babies")
        .select("id, user_id, name, gender, birth_date, weight_g, height_cm, head_cm, current_milk_stage, updated_at")
        .eq("user_id", profile.id)
        .order("updated_at", { ascending: false })
    : { data: null };

  return (
    <main className="min-h-screen bg-[#FDF8FA]">
      <SiteNav profile={profile} />
      <CongCuChoMeBrowser babies={(babies as Baby[] | null) ?? []} />
      <SiteFooter />
    </main>
  );
}
