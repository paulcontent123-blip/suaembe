"use client";

import type { PaginationMeta } from "@/lib/pagination";

export function PaginationControls({
  pagination,
  onPageChange,
}: {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  if (pagination.total <= pagination.page_size && pagination.page === 1) return null;

  const firstItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.page_size + 1;
  const lastItem = Math.min(pagination.page * pagination.page_size, pagination.total);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#64748B]">
      <span>
        Hiển thị {firstItem}-{lastItem} / {pagination.total}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Trang trước"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
          className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 font-semibold transition hover:border-[#E8547A] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Trước
        </button>
        <span className="min-w-20 text-center font-semibold text-[#0F172A]">
          Trang {pagination.page}
        </span>
        <button
          type="button"
          aria-label="Trang sau"
          disabled={!pagination.has_more}
          onClick={() => onPageChange(pagination.page + 1)}
          className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 font-semibold transition hover:border-[#E8547A] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau →
        </button>
      </div>
    </div>
  );
}
