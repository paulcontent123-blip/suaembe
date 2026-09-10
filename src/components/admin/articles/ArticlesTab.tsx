"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { AdminArticle, ArticleStatus } from "@/lib/admin/types";

const STATUS_LABEL: Record<ArticleStatus, string> = {
  draft: "Nháp",
  published: "Đã xuất bản",
  archived: "Đã ẩn",
};

const ARTICLE_PAGE_SIZE = 8;

interface ArticlePagination {
  page: number;
  page_size: number;
  total: number;
  has_more: boolean;
}

export function ArticlesTab() {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ArticlePagination>({
    page: 1,
    page_size: ARTICLE_PAGE_SIZE,
    total: 0,
    has_more: false,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadArticles() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          page_size: String(ARTICLE_PAGE_SIZE),
        });

        if (statusFilter !== "all") params.set("status", statusFilter);

        const response = await fetch(`/api/admin/articles?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Không tải được bài viết.");
        }

        setArticles(data.items ?? data.articles ?? []);
        setPagination(
          data.pagination ?? {
            page,
            page_size: ARTICLE_PAGE_SIZE,
            total: data.items?.length ?? data.articles?.length ?? 0,
            has_more: false,
          },
        );
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Không tải được bài viết.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadArticles();

    return () => controller.abort();
  }, [page, statusFilter]);

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex max-w-full gap-1.5 overflow-x-auto pb-0.5">
          {(["all", "draft", "published", "archived"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                statusFilter === status
                  ? "bg-[#E8547A] text-white"
                  : "bg-black/5 text-[#64748B] hover:bg-black/10"
              }`}
            >
              {status === "all" ? "Tất cả" : STATUS_LABEL[status]}
            </button>
          ))}
        </div>
        <Link
          href="/admin/articles/new"
          className="rounded-lg bg-[#E8547A] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#D83F6A]"
        >
          + Viết bài mới
        </Link>
      </div>

      {error && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <div className="rounded-lg border border-black/10 bg-white p-8 text-center text-sm text-[#94A3B8]">
          Đang tải bài viết...
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-lg border border-black/10 bg-white p-8 text-center">
          <p className="text-sm text-[#64748B]">Chưa có bài viết trong trạng thái này.</p>
          <Link href="/admin/articles/new" className="mt-3 inline-block text-xs font-bold text-[#D83F6A] hover:underline">
            Tạo bài viết đầu tiên
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {articles.map((article) => (
            <div
              key={article.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-white px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#FFF0F5] text-lg">
                  {article.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={article.cover_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span aria-hidden="true">✎</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#0F172A]">{article.title}</p>
                  <p className="mt-0.5 truncate text-[11.5px] text-[#64748B]">
                    {article.article_categories?.name ?? "Chưa gán chuyên mục"} ·{" "}
                    <span
                      className={
                        article.status === "published"
                          ? "text-[#16A34A]"
                          : article.status === "draft"
                            ? "text-[#D97706]"
                            : ""
                      }
                    >
                      {STATUS_LABEL[article.status]}
                    </span>{" "}
                    · {article.view_count.toLocaleString("vi-VN")} lượt xem
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {article.status === "published" && article.slug && (
                  <a
                    href={`/tin-tuc/${article.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden rounded border border-black/10 px-2.5 py-1 text-[11px] font-semibold text-[#64748B] hover:border-[#E8547A] hover:text-[#E8547A] sm:block"
                  >
                    Xem
                  </a>
                )}
                <Link
                  href={`/admin/articles/${article.id}/edit`}
                  className="rounded bg-[#E8547A]/10 px-2.5 py-1 text-[11px] font-bold text-[#E8547A] hover:bg-[#E8547A]/20"
                >
                  Sửa
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && pagination.total > 0 && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-white px-4 py-3">
          <span className="text-xs text-[#64748B]">
            Trang {pagination.page} · {pagination.total.toLocaleString("vi-VN")} bài viết
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#64748B] disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Trước
            </button>
            <button
              type="button"
              disabled={!pagination.has_more}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-[#E8547A]/30 bg-[#FFF0F5] px-3 py-1.5 text-xs font-semibold text-[#E8547A] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sau →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
