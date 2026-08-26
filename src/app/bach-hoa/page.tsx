import { BachHoaBrowser } from "@/components/bach-hoa/BachHoaBrowser";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteNav } from "@/components/home/SiteNav";
import { getUserProfile } from "@/lib/auth/profile";
import type { Brand, ProductCategory } from "@/lib/catalog/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// UC-07 - Xem Bách Hóa Và Sản Phẩm. Danh mục + nhãn hàng lấy sẵn ở server để
// hiển thị ngay khung sườn trang; danh sách sản phẩm do BachHoaBrowser (client)
// tự gọi lại /api/products mỗi khi đổi bộ lọc.
export default async function BachHoaPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getUserProfile(supabase, user.id) : null;

  const [{ data: categories }, { data: brands }] = await Promise.all([
    supabase
      .from("product_categories")
      .select("id, parent_id, name, slug, description, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("brands")
      .select("id, name, slug, logo_url, country, description, website_url, verified")
      .order("name", { ascending: true }),
  ]);

  return (
    <main className="min-h-screen bg-[#FDF8FA]">
      <SiteNav profile={profile} />
      <BachHoaBrowser
        categories={(categories as ProductCategory[] | null) ?? []}
        brands={(brands as Brand[] | null) ?? []}
      />
      <SiteFooter />
    </main>
  );
}
