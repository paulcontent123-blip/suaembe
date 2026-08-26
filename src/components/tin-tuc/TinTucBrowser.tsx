"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { GrowthDiaryBrowser } from "@/components/growth/GrowthDiaryBrowser";
import { ACADEMY_CATEGORY_STYLE, NEWS_CATEGORY_STYLE } from "@/lib/articles/style";
import type { Article, ArticleCategory } from "@/lib/articles/types";
import type { Baby } from "@/lib/babies/types";
import type { UserProfile } from "@/lib/auth/types";

function readingMinutes(excerpt: string | null): number {
  const words = (excerpt ?? "").trim().split(/\s+/).filter(Boolean).length;

  return Math.max(3, Math.round((words * 8) / 200));
}

function ArticleListItem({ article }: { article: Article }) {
  const catSlug = article.article_categories?.slug ?? "";
  const style = NEWS_CATEGORY_STYLE[catSlug] ?? { emoji: "📰", color: "#E8547A" };

  return (
    <Link
      href={`/tin-tuc/${article.slug}`}
      className="flex overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#E8547A] hover:shadow-md"
    >
      <div
        className="flex w-[180px] shrink-0 items-center justify-center text-4xl"
        style={{ background: `linear-gradient(135deg, ${style.color}22, #F8FAFC)` }}
      >
        {article.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.cover_url} alt={article.title} className="h-full w-full object-cover" />
        ) : (
          style.emoji
        )}
      </div>
      <div className="p-4">
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: style.color }}>
          {article.article_categories?.name ?? "Tin tức"}
        </div>
        <div className="mb-1.5 text-[15px] font-bold leading-snug text-[#0F172A]">{article.title}</div>
        {article.excerpt && (
          <div className="mb-2 line-clamp-2 text-[12.5px] leading-relaxed text-[#64748B]">{article.excerpt}</div>
        )}
        <div className="text-[11px] text-[#94A3B8]">
          📅 {article.published_at ? new Date(article.published_at).toLocaleDateString("vi-VN") : "—"} · ⏱{" "}
          {readingMinutes(article.excerpt)} phút đọc · 👁 {article.view_count.toLocaleString("vi-VN")} lượt xem
        </div>
      </div>
    </Link>
  );
}

function AcademyCard({ article }: { article: Article }) {
  const catSlug = article.article_categories?.slug ?? "";
  const style = ACADEMY_CATEGORY_STYLE[catSlug] ?? { emoji: "💡", from: "#E8547A", to: "#C43A62" };

  return (
    <Link
      href={`/tin-tuc/${article.slug}`}
      className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div
        className="flex h-[120px] items-center justify-center text-4xl"
        style={{ background: `linear-gradient(135deg, ${style.from}, ${style.to})` }}
      >
        {article.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.cover_url} alt={article.title} className="h-full w-full object-cover" />
        ) : (
          style.emoji
        )}
      </div>
      <div className="p-4">
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: style.from }}>
          {article.article_categories?.name ?? "Học viện"}
        </div>
        <div className="mb-1.5 text-sm font-bold leading-snug text-[#0F172A]">{article.title}</div>
        {article.excerpt && <div className="text-xs text-[#64748B]">{article.excerpt}</div>}
        <div className="mt-2.5 text-[11px] font-bold" style={{ color: style.from }}>
          Xem bài →
        </div>
      </div>
    </Link>
  );
}

type Tab = "news" | "academy" | "nhatky";

export function TinTucBrowser({
  categories,
  profile,
  initialBabies,
  initialTab = "news",
}: {
  categories: ArticleCategory[];
  /** UC-04/05/06 - tab "Nhật ký" cần đăng nhập; null nghĩa là khách chưa đăng nhập. */
  profile: UserProfile | null;
  initialBabies: Baby[];
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  const newsParent = categories.find((c) => c.slug === "tin-tuc-cap-nhat");
  const academyParent = categories.find((c) => c.slug === "hoc-vien-lam-me");
  const newsCategories = categories.filter((c) => c.parent_id === newsParent?.id);
  const academyCategories = categories.filter((c) => c.parent_id === academyParent?.id);

  const [activeNewsCategory, setActiveNewsCategory] = useState<string | null>(null);
  const [newsArticles, setNewsArticles] = useState<Article[]>([]);
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [academyArticles, setAcademyArticles] = useState<Article[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    fetch("/api/articles?sort=views&limit=4")
      .then((r) => r.json())
      .then((d) => setPopularArticles(d.articles ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const academyIds = academyCategories.map((c) => c.id);

    if (academyIds.length === 0) return;

    fetch(`/api/articles?category_id=${academyIds.join(",")}&limit=${academyIds.length}`)
      .then((r) => r.json())
      .then((d) => setAcademyArticles(d.articles ?? []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  useEffect(() => {
    const newsIds = newsCategories.map((c) => c.id);
    const categoryIds = activeNewsCategory ? [activeNewsCategory] : newsIds;

    if (categoryIds.length === 0) return;

    setLoadingNews(true);

    fetch(`/api/articles?category_id=${categoryIds.join(",")}&limit=20`)
      .then((r) => r.json())
      .then((d) => setNewsArticles(d.articles ?? []))
      .catch(() => {})
      .finally(() => setLoadingNews(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNewsCategory, categories]);

  const academyByCategory = useMemo(() => {
    const map = new Map<string, Article>();

    for (const a of academyArticles) {
      if (a.category_id && !map.has(a.category_id)) map.set(a.category_id, a);
    }

    return map;
  }, [academyArticles]);

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-10">
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#E8547A]">
        Kiến thức · Nhật ký · Mẹo hay
      </div>
      <h1 className="mb-6 font-serif text-3xl font-black text-[#0F172A]">
        Tin tức <em className="not-italic text-[#E8547A]">Mẹ &amp; Bé</em>
      </h1>

      <div className="mb-6 flex gap-1.5 border-b border-black/10">
        <button
          type="button"
          onClick={() => setTab("news")}
          className={`rounded-t-lg px-4 py-2.5 text-[13px] font-bold ${
            tab === "news" ? "border-b-2 border-[#E8547A] text-[#E8547A]" : "text-[#64748B]"
          }`}
        >
          📰 Tin tức &amp; Cập nhật
        </button>
        <button
          type="button"
          onClick={() => setTab("nhatky")}
          className={`rounded-t-lg px-4 py-2.5 text-[13px] font-bold ${
            tab === "nhatky" ? "border-b-2 border-[#E8547A] text-[#E8547A]" : "text-[#64748B]"
          }`}
        >
          📊 Nhật ký Dinh dưỡng Bé
        </button>
        <button
          type="button"
          onClick={() => setTab("academy")}
          className={`rounded-t-lg px-4 py-2.5 text-[13px] font-bold ${
            tab === "academy" ? "border-b-2 border-[#E8547A] text-[#E8547A]" : "text-[#64748B]"
          }`}
        >
          💡 Học viện Làm Mẹ
        </button>
      </div>

      {tab === "nhatky" ? (
        profile ? (
          <GrowthDiaryBrowser initialBabies={initialBabies} embedded />
        ) : (
          <div className="rounded-xl border border-black/10 bg-white p-10 text-center">
            <div className="mb-3 text-4xl">🔒</div>
            <p className="mb-1 text-sm font-bold text-[#0F172A]">Cần đăng nhập để xem Nhật ký Dinh dưỡng Bé</p>
            <p className="mb-5 text-[12.5px] text-[#64748B]">
              Theo dõi chỉ số tăng trưởng, mốc phát triển và lịch ăn riêng cho từng bé — chỉ dành cho mẹ bỉm đã đăng
              nhập.
            </p>
            <Link
              href="/?login=1&redirect=%2Ftin-tuc%3Ftab%3Dnhatky"
              className="inline-block rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-5 py-2.5 text-sm font-bold text-white"
            >
              Đăng nhập ngay
            </Link>
          </div>
        )
      ) : tab === "news" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveNewsCategory(null)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  activeNewsCategory === null
                    ? "bg-[#E8547A] text-white"
                    : "bg-black/5 text-[#64748B] hover:bg-black/10"
                }`}
              >
                Tất cả
              </button>
              {newsCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveNewsCategory(c.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    activeNewsCategory === c.id
                      ? "bg-[#E8547A] text-white"
                      : "bg-black/5 text-[#64748B] hover:bg-black/10"
                  }`}
                >
                  {NEWS_CATEGORY_STYLE[c.slug]?.emoji ?? "📰"} {c.name}
                </button>
              ))}
            </div>

            {loadingNews ? (
              <p className="text-sm text-[#94A3B8]">Đang tải...</p>
            ) : newsArticles.length === 0 ? (
              <p className="rounded-xl border border-black/10 bg-white p-6 text-center text-sm text-[#94A3B8]">
                Chưa có bài viết nào trong chuyên mục này.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {newsArticles.map((a) => (
                  <ArticleListItem key={a.id} article={a} />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="mb-3 border-b border-black/10 pb-2 text-[13px] font-bold text-[#0F172A]">
                🔥 Đọc nhiều nhất
              </div>
              <div className="flex flex-col gap-2.5">
                {popularArticles.map((a, i) => (
                  <Link key={a.id} href={`/tin-tuc/${a.slug}`} className="flex gap-2">
                    <span className="font-mono text-xl font-black text-[#F3A0B7]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div className="text-[12.5px] font-semibold leading-snug text-[#0F172A]">{a.title}</div>
                      <div className="text-[11px] text-[#94A3B8]">
                        {a.view_count.toLocaleString("vi-VN")} lượt xem
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-6 text-sm leading-relaxed text-[#64748B]">
            Kho kiến thức thực chiến từ các chuyên gia và mẹ bỉm có kinh nghiệm — không lý thuyết, toàn mẹo hay áp
            dụng ngay.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {academyCategories.map((c) => {
              const article = academyByCategory.get(c.id);

              return article ? <AcademyCard key={c.id} article={article} /> : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
