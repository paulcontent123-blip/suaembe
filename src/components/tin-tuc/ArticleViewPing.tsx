"use client";

import { useEffect, useRef } from "react";

// UC-20 - Đọc Tin Tức / Học Viện. Gọi đúng 1 lần khi trang chi tiết bài viết
// mount trong trình duyệt (không tính view khi chỉ SSR/bot fetch HTML thô) —
// tăng articles.view_count qua POST /api/articles/:slug/view. Không dedupe
// theo phiên/trình duyệt — số liệu mang tính tham khảo, giống phần lớn bộ
// đếm lượt xem đơn giản khác, không phải analytics chính xác tuyệt đối.
export function ArticleViewPing({ slug }: { slug: string }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    fetch(`/api/articles/${encodeURIComponent(slug)}/view`, { method: "POST" }).catch(() => {});
  }, [slug]);

  return null;
}
