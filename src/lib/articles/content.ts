// UC-20/UC-21 - Nội dung bài viết lưu plain text, hỗ trợ Markdown giới hạn cho
// bold, heading, table, image, list và quote. Heading dùng chung để: (1) render
// `<h2>`/`<h3>` có `id` neo, (2) tự sinh mục lục (TOC) ở trang đọc bài — 1 nguồn
// dữ liệu duy nhất nên id giữa nội dung và mục lục luôn khớp nhau.

export type ContentBlock =
  | { type: "heading"; level: 2 | 3; id: string; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "image"; url: string; alt: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; text: string }
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

function parseTableRow(line: string): string[] | null {
  const value = line.trim();
  if (!value.includes("|")) return null;

  const withoutOuterPipes = value.replace(/^\|/, "").replace(/\|$/, "");
  const cells = withoutOuterPipes.split("|").map((cell) => cell.trim());

  return cells.length > 0 && cells.every(Boolean) ? cells : null;
}

function isTableSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseTable(block: string): { headers: string[]; rows: string[][] } | null {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return null;

  const headers = parseTableRow(lines[0]);
  const separator = parseTableRow(lines[1]);

  if (!headers || !separator || separator.length !== headers.length || !isTableSeparatorRow(separator)) {
    return null;
  }

  const rows: string[][] = [];

  for (const line of lines.slice(2)) {
    const row = parseTableRow(line);
    if (!row || row.length !== headers.length) return null;
    rows.push(row);
  }

  return { headers, rows };
}

function parseImage(block: string): { url: string; alt: string } | null {
  const match = block.match(/^!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)$/);

  return match ? { alt: match[1].trim(), url: match[2] } : null;
}

function parseListItem(line: string): { ordered: boolean; text: string } | null {
  const unordered = line.match(/^[-*+]\s+(.+)$/);
  if (unordered) return { ordered: false, text: unordered[1].trim() };

  const ordered = line.match(/^\d+[.)]\s+(.+)$/);
  return ordered ? { ordered: true, text: ordered[1].trim() } : null;
}

function parseQuoteLine(line: string): string | null {
  const match = line.match(/^>\s?(.*)$/);
  return match ? match[1].trim() : null;
}

export function parseArticleContent(content: string): { blocks: ContentBlock[]; toc: TocItem[] } {
  const blocks: ContentBlock[] = [];
  const toc: TocItem[] = [];
  const usedIds = new Map<string, number>();
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  let pendingLines: string[] = [];

  const flushPending = () => {
    const block = pendingLines.join("\n").trim();
    pendingLines = [];

    if (!block) return;

    const table = parseTable(block);
    if (table) {
      blocks.push({ type: "table", ...table });
    } else {
      blocks.push({ type: "paragraph", text: block });
    }
  };

  const pushHeading = (level: 2 | 3, rawText: string) => {
    const text = rawText.trim();
    let id = slugify(text) || "muc";
    const seen = usedIds.get(id) ?? 0;

    usedIds.set(id, seen + 1);
    if (seen > 0) id = `${id}-${seen + 1}`;

    blocks.push({ type: "heading", level, id, text });
    toc.push({ level, id, text });
  };

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (!line) {
      flushPending();
      continue;
    }

    const h3Match = line.match(/^###\s+(.+)$/);
    const h2Match = !h3Match ? line.match(/^##\s+(.+)$/) : null;

    if (h2Match || h3Match) {
      const level: 2 | 3 = h3Match ? 3 : 2;
      flushPending();
      pushHeading(level, (h3Match ?? h2Match)![1]);
      continue;
    }

    const listItem = parseListItem(line);
    if (listItem) {
      flushPending();
      const items = [listItem.text];

      while (index + 1 < lines.length) {
        const nextItem = parseListItem(lines[index + 1].trim());
        if (!nextItem || nextItem.ordered !== listItem.ordered) break;
        items.push(nextItem.text);
        index += 1;
      }

      blocks.push({ type: "list", ordered: listItem.ordered, items });
      continue;
    }

    const quoteText = parseQuoteLine(line);
    if (quoteText !== null) {
      flushPending();
      const quoteLines = [quoteText];

      while (index + 1 < lines.length) {
        const nextQuote = parseQuoteLine(lines[index + 1].trim());
        if (nextQuote === null) break;
        quoteLines.push(nextQuote);
        index += 1;
      }

      blocks.push({ type: "quote", text: quoteLines.join("\n") });
      continue;
    }

    let image = parseImage(line);

    // Accept content copied with the alt text and URL split across two lines.
    if (!image && /^!\[[^\]]*\]\s*$/.test(line)) {
      const nextLine = lines[index + 1]?.trim();
      if (nextLine && /^\(https?:\/\/[^)\s]+\)$/.test(nextLine)) {
        image = parseImage(`${line}${nextLine}`);
        index += 1;
      }
    }

    if (image) {
      flushPending();
      blocks.push({ type: "image", ...image });
      continue;
    }

    // Parse a table even when the author did not add a blank line before it.
    const nextLine = lines[index + 1]?.trim();
    if (nextLine && parseTable(`${line}\n${nextLine}`)) {
      flushPending();
      const tableLines = [line, nextLine];
      index += 1;

      while (index + 1 < lines.length) {
        const row = lines[index + 1].trim();
        if (!row || !parseTableRow(row)) break;
        tableLines.push(row);
        index += 1;
      }

      const table = parseTable(tableLines.join("\n"));
      if (table) blocks.push({ type: "table", ...table });
      continue;
    }

    pendingLines.push(rawLine);
  }

  flushPending();

  return { blocks, toc };
}
