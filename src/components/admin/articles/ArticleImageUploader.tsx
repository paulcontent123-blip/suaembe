"use client";

import { useRef, useState } from "react";

interface UploadedArticleImage {
  url: string;
  alt: string;
}

interface ArticleImageUploaderProps {
  draftToken: string;
  assetType: "cover" | "article_inline";
  onUploaded?: (image: UploadedArticleImage) => void;
  onUploadedBatch?: (images: UploadedArticleImage[]) => void;
  multiple?: boolean;
  previewUrl?: string;
}

function altFromFile(file: File): string {
  return file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim()
    .slice(0, 120);
}

export function ArticleImageUploader({
  draftToken,
  assetType,
  onUploaded,
  onUploadedBatch,
  multiple = false,
  previewUrl,
}: ArticleImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = `article-image-${assetType}-${draftToken}`;

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    const uploadedImages: UploadedArticleImage[] = [];

    try {
      for (const file of files) {
        const alt = altFromFile(file) || "Hình ảnh bài viết";
        const formData = new FormData();

        formData.append("file", file);
        formData.append("draft_token", draftToken);
        formData.append("asset_type", assetType);
        formData.append("alt_text", alt);

        const response = await fetch("/api/uploads", { method: "POST", body: formData });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Upload ảnh thất bại.");
        }

        const url = data.asset?.secure_url ?? data.asset?.url;
        if (typeof url !== "string" || !url) {
          throw new Error("Upload ảnh không trả về URL hợp lệ.");
        }

        const uploadedImage = { url, alt };
        uploadedImages.push(uploadedImage);

        if (!onUploadedBatch) onUploaded?.(uploadedImage);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload ảnh thất bại.");
    } finally {
      if (onUploadedBatch && uploadedImages.length > 0) onUploadedBatch(uploadedImages);
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (assetType === "article_inline") {
    return (
      <div className="inline-flex flex-col items-start gap-1">
        <label className="cursor-pointer rounded border border-black/10 bg-white px-2 py-1 text-xs font-bold text-[#0F172A] hover:border-[#E8547A]">
          {uploading ? "Đang upload..." : "Ảnh"}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple={multiple}
            onChange={handleChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {error && <span className="text-[11px] font-normal text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <div className="col-span-2 flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Ảnh bìa</span>
      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="" className="h-28 w-full rounded-lg border border-black/10 object-cover" />
      )}
      <label
        htmlFor={inputId}
        className={`inline-flex w-fit cursor-pointer items-center rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-[#E8547A]/30 ${
          uploading ? "pointer-events-none opacity-60" : ""
        }`}
      >
        {uploading ? "Đang upload..." : previewUrl ? "Đổi ảnh bìa" : "Chọn ảnh bìa"}
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleChange}
          disabled={uploading}
          className="sr-only"
        />
      </label>
      <span className="text-[11px] text-[#94A3B8]">JPEG, PNG, WEBP hoặc GIF; tối đa 5MB.</span>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
