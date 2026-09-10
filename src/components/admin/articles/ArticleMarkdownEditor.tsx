"use client";

import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";

import { ArticleImageUploader } from "@/components/admin/articles/ArticleImageUploader";
import { ArticlePreview } from "@/components/admin/articles/ArticlePreview";

interface SelectionRange {
  start: number;
  end: number;
}

interface MarkdownImage {
  alt: string;
  url: string;
  start: number;
  end: number;
}

interface ArticleMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  draftToken: string;
  title: string;
  excerpt: string;
  coverUrl: string;
  onFocusTitle: () => void;
  onUploadingChange: (uploading: boolean) => void;
}

function findMarkdownImages(content: string): MarkdownImage[] {
  const images: MarkdownImage[] = [];
  const pattern = /!\[([^\]]*)\]\s*\(\s*(https?:\/\/[^)\s]+)\s*\)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    images.push({
      alt: match[1],
      url: match[2],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return images;
}

function ToolButton({
  title,
  onClick,
  children,
  emphasis,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
  emphasis?: "bold" | "italic";
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`flex h-8 min-w-8 items-center justify-center rounded border border-black/10 bg-white px-2 text-xs text-[#334155] transition hover:border-[#E8547A] hover:bg-[#FFF7FA] hover:text-[#C43A62] ${
        emphasis === "bold" ? "font-black" : emphasis === "italic" ? "font-serif text-sm italic" : "font-semibold"
      }`}
    >
      {children}
    </button>
  );
}

export function ArticleMarkdownEditor({
  value,
  onChange,
  draftToken,
  title,
  excerpt,
  coverUrl,
  onFocusTitle,
  onUploadingChange,
}: ArticleMarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const valueRef = useRef(value);
  const selectionRef = useRef<SelectionRange>({ start: value.length, end: value.length });
  const [view, setView] = useState<"write" | "preview">("write");
  const [uploadingImages, setUploadingImages] = useState(false);
  const images = useMemo(() => findMarkdownImages(value), [value]);
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  valueRef.current = value;

  function currentSelection(): SelectionRange {
    const textarea = textareaRef.current;
    if (!textarea) return selectionRef.current;

    return { start: textarea.selectionStart, end: textarea.selectionEnd };
  }

  function rememberSelection() {
    selectionRef.current = currentSelection();
  }

  function focusRange(start: number, end = start) {
    selectionRef.current = { start, end };
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start, end);
    });
  }

  function replaceRange(replacement: string, range = currentSelection(), selectedRange?: SelectionRange) {
    const currentValue = valueRef.current;
    const next = `${currentValue.slice(0, range.start)}${replacement}${currentValue.slice(range.end)}`;
    onChange(next);

    const target = selectedRange ?? {
      start: range.start + replacement.length,
      end: range.start + replacement.length,
    };
    focusRange(target.start, target.end);
  }

  function wrapSelection(before: string, after: string, placeholder: string) {
    const range = currentSelection();
    const selected = valueRef.current.slice(range.start, range.end) || placeholder;
    const replacement = `${before}${selected}${after}`;

    replaceRange(replacement, range, {
      start: range.start + before.length,
      end: range.start + before.length + selected.length,
    });
  }

  function formatSelectedLines(formatter: (line: string, index: number) => string, placeholder: string) {
    const range = currentSelection();
    const currentValue = valueRef.current;
    const lineStart = currentValue.lastIndexOf("\n", Math.max(0, range.start - 1)) + 1;
    const nextBreak = currentValue.indexOf("\n", range.end);
    const lineEnd = nextBreak === -1 ? currentValue.length : nextBreak;
    const source = currentValue.slice(lineStart, lineEnd) || placeholder;
    const replacement = source.split(/\r?\n/).map(formatter).join("\n");

    replaceRange(replacement, { start: lineStart, end: lineEnd });
  }

  function insertBlock(block: string, range = currentSelection()) {
    const currentValue = valueRef.current;
    const prefix = range.start > 0 && !currentValue.slice(0, range.start).endsWith("\n\n")
      ? currentValue[range.start - 1] === "\n" ? "\n" : "\n\n"
      : "";
    const suffix = range.end < currentValue.length && !currentValue.slice(range.end).startsWith("\n\n")
      ? currentValue[range.end] === "\n" ? "\n" : "\n\n"
      : "";
    const replacement = `${prefix}${block}${suffix}`;
    const cursor = range.start + prefix.length + block.length;

    replaceRange(replacement, range, { start: cursor, end: cursor });
  }

  function insertHeading(level: 2 | 3) {
    const prefix = `${"#".repeat(level)} `;
    formatSelectedLines(
      (line) => `${prefix}${line.replace(/^#{1,6}\s+/, "").trim()}`,
      `Tiêu đề H${level}`,
    );
  }

  function insertUnorderedList() {
    formatSelectedLines(
      (line) => `- ${line.replace(/^(?:[-*+]\s+|\d+[.)]\s+)/, "").trim()}`,
      "Mục danh sách",
    );
  }

  function insertOrderedList() {
    formatSelectedLines(
      (line, index) => `${index + 1}. ${line.replace(/^(?:[-*+]\s+|\d+[.)]\s+)/, "").trim()}`,
      "Mục danh sách",
    );
  }

  function insertQuote() {
    formatSelectedLines((line) => `> ${line.replace(/^>\s?/, "").trim()}`, "Nội dung trích dẫn");
  }

  function insertLink() {
    const range = currentSelection();
    selectionRef.current = range;
    const href = window.prompt("Nhập đường dẫn liên kết", "https://");
    if (!href) return;

    const normalizedHref = href.trim();
    if (!normalizedHref.startsWith("https://") && !normalizedHref.startsWith("http://") && !normalizedHref.startsWith("/")) {
      window.alert("Liên kết phải bắt đầu bằng https://, http:// hoặc /.");
      focusRange(range.start, range.end);
      return;
    }

    const label = valueRef.current.slice(range.start, range.end) || "Nội dung liên kết";
    replaceRange(`[${label}](${normalizedHref})`, range, {
      start: range.start + 1,
      end: range.start + 1 + label.length,
    });
  }

  function updateImageAlt(image: MarkdownImage, alt: string) {
    const safeAlt = alt.replace(/[\[\]\r\n]/g, "").slice(0, 160);
    const replacement = `![${safeAlt}](${image.url})`;
    const currentValue = valueRef.current;
    onChange(`${currentValue.slice(0, image.start)}${replacement}${currentValue.slice(image.end)}`);
  }

  function removeImage(image: MarkdownImage) {
    const currentValue = valueRef.current;
    const next = `${currentValue.slice(0, image.start)}${currentValue.slice(image.end)}`.replace(/\n{3,}/g, "\n\n");
    onChange(next);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-black/10 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 bg-[#F8FAFC] px-2.5 py-2">
        <div className="flex flex-wrap items-center gap-1">
          <div className="mr-1 flex items-center gap-1 border-r border-black/10 pr-2">
            <ToolButton title="H1 là tiêu đề chính của bài viết" onClick={onFocusTitle}>H1</ToolButton>
            <ToolButton title="Định dạng tiêu đề H2" onClick={() => insertHeading(2)}>H2</ToolButton>
            <ToolButton title="Định dạng tiêu đề H3" onClick={() => insertHeading(3)}>H3</ToolButton>
          </div>
          <div className="mr-1 flex items-center gap-1 border-r border-black/10 pr-2">
            <ToolButton title="In đậm" onClick={() => wrapSelection("**", "**", "văn bản in đậm")} emphasis="bold">B</ToolButton>
            <ToolButton title="In nghiêng" onClick={() => wrapSelection("*", "*", "văn bản in nghiêng")} emphasis="italic">I</ToolButton>
            <ToolButton title="Chèn liên kết" onClick={insertLink}>Link</ToolButton>
          </div>
          <div className="mr-1 flex items-center gap-1 border-r border-black/10 pr-2">
            <ToolButton title="Danh sách bullet" onClick={insertUnorderedList}>• List</ToolButton>
            <ToolButton title="Danh sách đánh số" onClick={insertOrderedList}>1. List</ToolButton>
            <ToolButton title="Chèn trích dẫn" onClick={insertQuote}>Quote</ToolButton>
          </div>
          <ToolButton
            title="Chèn bảng 3 cột"
            onClick={() => insertBlock("| Cột 1 | Cột 2 | Cột 3 |\n| --- | --- | --- |\n| Nội dung | Nội dung | Nội dung |")}
          >
            Bảng
          </ToolButton>
          <ArticleImageUploader
            draftToken={draftToken}
            assetType="article_inline"
            multiple
            buttonLabel="Tải ảnh"
            onBeforeSelect={rememberSelection}
            onUploadingChange={(uploading) => {
              setUploadingImages(uploading);
              onUploadingChange(uploading);
            }}
            onUploadedBatch={(uploadedImages) =>
              insertBlock(
                uploadedImages.map(({ url, alt }) => `![${alt}](${url})`).join("\n\n"),
                selectionRef.current,
              )
            }
          />
        </div>

        <div className="flex h-8 overflow-hidden rounded border border-black/10 bg-white p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setView("write")}
            className={`px-3 ${view === "write" ? "bg-[#0F172A] text-white" : "text-[#64748B]"}`}
          >
            Soạn thảo
          </button>
          <button
            type="button"
            onClick={() => setView("preview")}
            className={`px-3 ${view === "preview" ? "bg-[#0F172A] text-white" : "text-[#64748B]"}`}
          >
            Xem trước
          </button>
        </div>
      </div>

      {view === "write" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onSelect={rememberSelection}
          onKeyUp={rememberSelection}
          onClick={rememberSelection}
          rows={28}
          readOnly={uploadingImages}
          spellCheck
          placeholder="Bắt đầu viết nội dung. Dùng H2/H3 để chia mục; mỗi đoạn cách nhau một dòng trống."
          className="min-h-[680px] w-full resize-y border-0 bg-white px-5 py-4 font-mono text-[14px] leading-7 text-[#1E293B] outline-none read-only:cursor-wait read-only:bg-[#F8FAFC]"
        />
      ) : (
        <div className="min-h-[680px] bg-[#F8FAFC] py-5">
          <ArticlePreview title={title} excerpt={excerpt} content={value} coverUrl={coverUrl} />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/10 bg-[#F8FAFC] px-4 py-2 text-[11px] text-[#64748B]">
        <span>{wordCount.toLocaleString("vi-VN")} từ · {value.length.toLocaleString("vi-VN")} ký tự</span>
        <span>{images.length.toLocaleString("vi-VN")} ảnh trong nội dung</span>
      </div>

      {images.length > 0 && (
        <div className="border-t border-black/10 px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-bold text-[#0F172A]">Ảnh trong nội dung</span>
            <span className="text-[#94A3B8]">{images.length} ảnh</span>
          </div>
          <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
            {images.map((image, index) => (
              <div key={`${image.url}-${image.start}`} className="flex items-center gap-2 rounded border border-black/10 bg-[#F8FAFC] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="h-12 w-16 shrink-0 rounded object-cover" />
                <label className="min-w-0 flex-1">
                  <span className="mb-0.5 block text-[10px] font-bold uppercase text-[#94A3B8]">Alt ảnh {index + 1}</span>
                  <input
                    value={image.alt}
                    onChange={(event) => updateImageAlt(image, event.target.value)}
                    className="w-full rounded border border-black/10 bg-white px-2 py-1 text-xs outline-none focus:border-[#E8547A]"
                    aria-label={`Alt ảnh ${index + 1}`}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeImage(image)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-red-200 bg-white text-base text-red-600 hover:bg-red-50"
                  title="Xóa ảnh khỏi nội dung"
                  aria-label={`Xóa ảnh ${index + 1} khỏi nội dung`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
