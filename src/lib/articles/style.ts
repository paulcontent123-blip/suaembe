// article_categories không có cột icon/màu riêng trong schema — suy ra theo
// slug (chỉ để trang trí, tên/slug danh mục vẫn là dữ liệu thật 100% từ DB).
// Dùng chung giữa TinTucBrowser (danh sách) và trang đọc bài (chi tiết).
export const NEWS_CATEGORY_STYLE: Record<string, { emoji: string; color: string }> = {
  "dinh-duong": { emoji: "🥛", color: "#E8547A" },
  "suc-khoe": { emoji: "💊", color: "#16A34A" },
  "phat-trien": { emoji: "👶", color: "#D97706" },
  "mang-thai": { emoji: "🤰", color: "#0D9488" },
  "phap-ly-me": { emoji: "⚖", color: "#7C3AED" },
};

export const ACADEMY_CATEGORY_STYLE: Record<string, { emoji: string; from: string; to: string }> = {
  "nuoi-con-bang-sua-me": { emoji: "🍼", from: "#E8547A", to: "#C43A62" },
  "an-dam": { emoji: "🍽", from: "#0D9488", to: "#0A7C72" },
  "giac-ngu": { emoji: "😴", from: "#D97706", to: "#B45309" },
  "phat-trien-tri-nao": { emoji: "🧠", from: "#7C3AED", to: "#5B21B6" },
  "suc-khoe-me-sau-sinh": { emoji: "💆‍♀️", from: "#16A34A", to: "#15803D" },
  "tai-chinh-me-bim": { emoji: "💰", from: "#BE185D", to: "#9D174D" },
};

export function isAcademyCategorySlug(slug: string | undefined | null): boolean {
  return !!slug && slug in ACADEMY_CATEGORY_STYLE;
}
