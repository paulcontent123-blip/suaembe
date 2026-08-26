import type { MetadataRoute } from "next";

import { createSupabaseServerClient } from "@/lib/supabase/server";

// Next.js tự phục vụ file này tại /sitemap.xml (App Router convention, không
// cần route.ts riêng). Chỉ liệt kê trang public thật sự cần index — không
// đưa /tai-khoan, /admin (yêu cầu đăng nhập) vào sitemap. Bài viết lấy động
// từ DB thật (chỉ status='published' — RLS "articles_read_published_or_admin"
// tự lọc cho client ẩn danh), không liệt kê tin chợ C2C/sản phẩm Bách Hóa vì
// 2 trang đó hiển thị chi tiết qua modal client-side, không có URL riêng cho
// từng tin/sản phẩm để index.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/cho-me-be`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/bach-hoa`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/doi-tac`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/cong-cu-cho-me`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/tin-tuc`, changeFrequency: "daily", priority: 0.8 },
  ];

  const supabase = await createSupabaseServerClient();
  const { data: articles } = await supabase
    .from("articles")
    .select("slug, published_at")
    .not("slug", "is", null)
    .order("published_at", { ascending: false });

  const articleRoutes: MetadataRoute.Sitemap = (articles ?? [])
    .filter((article): article is { slug: string; published_at: string | null } => Boolean(article.slug))
    .map((article) => ({
      url: `${baseUrl}/tin-tuc/${article.slug}`,
      lastModified: article.published_at ?? undefined,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  return [...staticRoutes, ...articleRoutes];
}
