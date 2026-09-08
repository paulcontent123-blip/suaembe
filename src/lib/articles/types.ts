export interface ArticleCategory {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

// UC-20 - Đọc Tin Tức / Học Viện. Danh sách (không có content) dùng cho các
// trang liệt kê; ArticleDetail thêm content cho trang đọc bài.
export interface Article {
  id: string;
  category_id: string | null;
  title: string;
  slug: string | null;
  excerpt: string | null;
  meta_description: string | null;
  cover_url: string | null;
  view_count: number;
  published_at: string | null;
  article_categories: { id: string; name: string; slug: string; parent_id: string | null } | null;
}

export interface ArticleDetail extends Article {
  content: string | null;
}
