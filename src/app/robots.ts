import type { MetadataRoute } from "next";

// Next.js tự phục vụ file này tại /robots.txt (App Router convention, không
// cần route.ts riêng) — cùng cơ chế với src/app/sitemap.ts. Chặn crawler vào
// API routes (không phải nội dung để index) và các trang riêng tư yêu cầu
// đăng nhập (/tai-khoan, /admin) — 2 trang này RLS/middleware đã chặn người
// chưa đăng nhập rồi, disallow ở đây chỉ để tránh Google phí công crawl và
// vô tình hiện link trang login trong kết quả tìm kiếm.
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/tai-khoan", "/admin"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
