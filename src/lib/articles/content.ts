// UC-20/UC-21 - Nội dung bài viết lưu plain text, đoạn cách nhau bằng dòng
// trống, `**chữ**` để in đậm, và dòng bắt đầu bằng `## `/`### ` để tạo tiêu
// đề phụ (heading) — tự parse thủ công thay vì thêm thư viện markdown vì
// chỉ cần đúng 3 định dạng này. Heading dùng chung để: (1) render `<h2>`/
// `<h3>` có `id` neo, (2) tự sinh mục lục (TOC) ở trang đọc bài — 1 nguồn
// dữ liệu duy nhất nên id giữa nội dung và mục lục luôn khớp nhau.

export type ContentBlock =
  | { type: "heading"; level: 2 | 3; id: string; text: string }
  | { type: "paragraph"; text: string };

export interface TocItem {
  level: 2 | 3;
  id: string;
  text: string;
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function parseArticleContent(content: string): { blocks: ContentBlock[]; toc: TocItem[] } {
  const blocks: ContentBlock[] = [];
  const toc: TocItem[] = [];
  const usedIds = new Map<string, number>();

  for (const raw of content.split("\n\n")) {
    const block = raw.trim();
    if (!block) continue;

    const h3Match = block.match(/^###\s+(.+)$/);
    const h2Match = !h3Match ? block.match(/^##\s+(.+)$/) : null;

    if (h2Match || h3Match) {
      const level: 2 | 3 = h3Match ? 3 : 2;
      const text = (h3Match ?? h2Match)![1].trim();
      let id = slugify(text) || "muc";
      const seen = usedIds.get(id) ?? 0;

      usedIds.set(id, seen + 1);
      if (seen > 0) id = `${id}-${seen + 1}`;

      blocks.push({ type: "heading", level, id, text });
      toc.push({ level, id, text });
    } else {
      blocks.push({ type: "paragraph", text: block });
    }
  }

  return { blocks, toc };
}
