"use client";

import { useEffect, useState } from "react";

import type { Product } from "@/lib/catalog/types";
import { formatVnd } from "@/lib/format";

export function ProductDetailModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [activeImage, setActiveImage] = useState(0);
  const images = product.image_urls?.length ? product.image_urls : [];

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const milk = product.milk_products;
  const description = product.description ?? product.short_description;
  const outboundHost = (() => {
    if (!product.outbound_url) return null;

    try {
      return new URL(product.outbound_url).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  })();

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-3.5">
          <span className="text-sm font-bold text-[#0F172A]">Chi tiết sản phẩm</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-lg text-[#94A3B8] hover:bg-black/5 hover:text-[#0F172A]"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          <div className="mb-4 flex h-64 items-center justify-center overflow-hidden rounded-xl bg-[#FFF0F5] text-6xl">
            {images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              "📦"
            )}
          </div>

          {images.length > 1 && (
            <div className="mb-4 flex gap-2 overflow-x-auto">
              {images.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${
                    i === activeImage ? "border-[#E8547A]" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {product.brands?.name && (
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
              {product.brands.name}
            </div>
          )}
          <h2 className="mb-2 text-xl font-extrabold text-[#0F172A]">{product.name}</h2>

          <div className="mb-3 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-extrabold text-[#E8547A]">
              {formatVnd(product.price_vnd)}
            </span>
            {product.original_price_vnd != null &&
              product.price_vnd != null &&
              product.original_price_vnd > product.price_vnd && (
                <span className="font-mono text-sm text-[#94A3B8] line-through">
                  {formatVnd(product.original_price_vnd)}
                </span>
              )}
            {product.unit && <span className="text-xs text-[#94A3B8]">/ {product.unit}</span>}
          </div>

          {product.outbound_url && (
            <a
              href={product.outbound_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-4 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-4 py-3 text-sm font-bold text-white"
            >
              Mua ngay{outboundHost ? ` trên ${outboundHost}` : ""} ↗
            </a>
          )}

          {milk && (milk.stage || milk.age_min_months != null || milk.weight_g != null || milk.rating != null) && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {milk.stage && (
                <span className="rounded bg-[#0D9488]/10 px-2 py-1 text-[11px] font-bold text-[#0D9488]">
                  {milk.stage}
                </span>
              )}
              {milk.age_min_months != null && (
                <span className="rounded bg-black/5 px-2 py-1 text-[11px] font-semibold text-[#64748B]">
                  {milk.age_min_months}
                  {milk.age_max_months != null ? `–${milk.age_max_months}` : "+"} tháng tuổi
                </span>
              )}
              {milk.weight_g != null && (
                <span className="rounded bg-black/5 px-2 py-1 text-[11px] font-semibold text-[#64748B]">
                  {milk.weight_g}g
                </span>
              )}
              {milk.rating != null && (
                <span className="rounded bg-[#D97706]/10 px-2 py-1 text-[11px] font-bold text-[#D97706]">
                  ⭐ {milk.rating.toFixed(1)} ({milk.review_count})
                </span>
              )}
            </div>
          )}

          {milk?.nutrition_tags && milk.nutrition_tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {milk.nutrition_tags.map((t) => (
                <span key={t} className="rounded-full border border-black/10 px-2.5 py-1 text-[11px] text-[#64748B]">
                  {t}
                </span>
              ))}
            </div>
          )}

          {description && (
            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">Mô tả</div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-[#334155]">{description}</p>
            </div>
          )}

          {product.tags && product.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {product.tags.map((t) => (
                <span key={t} className="rounded bg-[#E8547A]/10 px-2 py-1 text-[11px] font-semibold text-[#E8547A]">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
