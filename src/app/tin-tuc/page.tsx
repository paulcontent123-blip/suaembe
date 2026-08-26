import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteNav } from "@/components/home/SiteNav";
import { TinTucBrowser } from "@/components/tin-tuc/TinTucBrowser";
import { getUserProfile } from "@/lib/auth/profile";
import type { ArticleCategory } from "@/lib/articles/types";
import type { Baby } from "@/lib/babies/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// UC-20 - Đọc Tin Tức / Học Viện. Danh mục lấy sẵn ở server để hiển thị ngay
// khung sườn trang; danh sách bài viết do TinTucBrowser (client) tự gọi lại
// /api/articles mỗi khi đổi tab/chuyên mục.
//
// UC-04/05/06 (Nhật ký Dinh dưỡng Bé) là tab thứ 3 của trang này — khớp đúng
// bố cục demo suaembe.html (#pg-tintuc có 3 tab: Tin tức, Nhật ký, Học viện).
// Khác 2 tab kia (đọc công khai), tab Nhật ký cần đăng nhập + có hồ sơ bé
// (dữ liệu riêng tư theo UC-04/05/06) — hồ sơ bé được fetch sẵn ở server chỉ
// khi đã đăng nhập, TinTucBrowser tự hiện lời mời đăng nhập nếu chưa có profile.
export default async function TinTucPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getUserProfile(supabase, user.id) : null;

  const { data: categories } = await supabase
    .from("article_categories")
    .select("id, parent_id, name, slug, description, sort_order")
    .order("sort_order", { ascending: true });

  const { data: babies } = profile
    ? await supabase
        .from("babies")
        .select("id, user_id, name, gender, birth_date, weight_g, height_cm, head_cm, current_milk_stage, updated_at")
        .eq("user_id", profile.id)
        .order("updated_at", { ascending: false })
    : { data: null };

  const initialTab = tab === "nhatky" || tab === "academy" ? tab : "news";

  return (
    <main className="min-h-screen bg-[#FDF8FA]">
      <SiteNav profile={profile} />
      <TinTucBrowser
        categories={(categories as ArticleCategory[] | null) ?? []}
        profile={profile}
        initialBabies={(babies as Baby[] | null) ?? []}
        initialTab={initialTab}
      />
      <SiteFooter />
    </main>
  );
}
