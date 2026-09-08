import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";

import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteNav } from "@/components/home/SiteNav";
import { ArticleViewPing } from "@/components/tin-tuc/ArticleViewPing";
import { parseArticleContent } from "@/lib/articles/content";
import { isAcademyCategorySlug } from "@/lib/articles/style";
import type { ArticleDetail } from "@/lib/articles/types";
import { getUserProfile } from "@/lib/auth/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ARTICLE_DETAIL_COLUMNS =
  "id, category_id, title, slug, excerpt, meta_description, content, cover_url, view_count, published_at, article_categories(id, name, slug, parent_id)";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: article } = await supabase
    .from("articles")
    .select("title, excerpt, meta_description, cover_url")
    .eq("slug", slug)
    .maybeSingle();

  if (!article) return {};

  return {
    title: article.title,
    description: article.meta_description ?? article.excerpt ?? undefined,
    openGraph: {
      title: article.title,
      description: article.meta_description ?? article.excerpt ?? undefined,
      images: article.cover_url ? [article.cover_url] : undefined,
      type: "article",
    },
  };
}

// `**chữ**` bên trong 1 đoạn/heading vẫn cần parse riêng để in đậm.
function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={j} className="font-bold text-[#0F172A]">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={j}>{part}</Fragment>
    ),
  );
}

function readingMinutes(content: string | null): number {
  const words = (content ?? "").trim().split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.round(words / 200));
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getUserProfile(supabase, user.id) : null;

  const { data: article } = await supabase
    .from("articles")
    .select(ARTICLE_DETAIL_COLUMNS)
    .eq("slug", slug)
    .maybeSingle<ArticleDetail>();

  if (!article) notFound();

  const isNews = !isAcademyCategorySlug(article.article_categories?.slug);
  const { blocks, toc } = parseArticleContent(article.content ?? "");
  const hasToc = toc.length > 0;

  const articleBody = (
    <>
      <Link href="/tin-tuc" className="mb-5 inline-block text-[12.5px] font-semibold text-[#E8547A]">
        ← Về Tin tức Mẹ &amp; Bé
      </Link>

      {article.article_categories && (
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#E8547A]">
          {article.article_categories.name}
        </div>
      )}
      <h1 className="mb-3 font-serif text-[26px] font-black leading-tight text-[#0F172A]">{article.title}</h1>
      {article.excerpt && (
        <p className="mb-5 text-[15px] font-medium leading-relaxed text-[#475569]">{renderInline(article.excerpt)}</p>
      )}
      <div className="mb-6 text-[12px] text-[#94A3B8]">
        📅 {article.published_at ? new Date(article.published_at).toLocaleDateString("vi-VN") : "—"} · ⏱{" "}
        {readingMinutes(article.content)} phút đọc · 👁 {article.view_count.toLocaleString("vi-VN")} lượt xem
      </div>

      {article.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.cover_url} alt={article.title} className="mb-6 w-full rounded-xl object-cover" />
      )}

      {blocks.length > 0 ? (
        <div>
          {blocks.map((block, i) => {
            if (block.type === "heading") {
              return block.level === 2 ? (
                <h2
                  key={i}
                  id={block.id}
                  className="mb-3 mt-7 scroll-mt-24 font-serif text-lg font-black text-[#0F172A] first:mt-0"
                >
                  {renderInline(block.text)}
                </h2>
              ) : (
                <h3 key={i} id={block.id} className="mb-2 mt-5 scroll-mt-24 text-[15px] font-bold text-[#0F172A]">
                  {renderInline(block.text)}
                </h3>
              );
            }

            if (block.type === "image") {
              return (
                <figure key={i} className="mb-6 mt-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={block.url}
                    alt={block.alt || article.title}
                    loading="lazy"
                    className="w-full rounded-xl border border-black/5 object-cover"
                  />
                  {block.alt && <figcaption className="mt-2 text-center text-xs text-[#94A3B8]">{block.alt}</figcaption>}
                </figure>
              );
            }

            if (block.type === "table") {
              return (
                <div key={i} className="mb-6 mt-5 overflow-x-auto rounded-lg border border-black/10 bg-white">
                  <table className="w-full min-w-[480px] border-collapse text-left text-[13px] text-[#334155]">
                    <thead className="bg-[#FFF0F5] text-[#0F172A]">
                      <tr>
                        {block.headers.map((header, headerIndex) => (
                          <th key={headerIndex} className="border-b border-black/10 px-3 py-2.5 font-bold">
                            {renderInline(header)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-black/5 last:border-b-0">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2.5 align-top leading-relaxed">
                              {renderInline(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }

            return (
              <p key={i} className="mb-4 whitespace-pre-line text-[14.5px] leading-[1.85] text-[#334155]">
                {renderInline(block.text)}
              </p>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-[#94A3B8]">Nội dung đang được cập nhật.</p>
      )}

      <div className="mt-8 rounded-xl border border-[#E8547A]/20 bg-[#E8547A]/5 p-4 text-[12.5px] leading-relaxed text-[#64748B]">
        ⚠️ Bài viết mang tính tham khảo, không thay thế chỉ định của bác sĩ chuyên khoa. Vui lòng tham khảo ý kiến
        bác sĩ trước khi áp dụng cho trường hợp cụ thể của bé.
      </div>

      <Link
        href="/tin-tuc"
        className="mt-8 inline-block rounded-lg bg-[#E8547A]/10 px-4 py-2 text-[13px] font-bold text-[#E8547A]"
      >
        {isNews ? "← Xem thêm Tin tức & Cập nhật" : "← Xem thêm Học viện Làm Mẹ"}
      </Link>
    </>
  );

  return (
    <main className="min-h-screen bg-[#FDF8FA]">
      <ArticleViewPing slug={slug} />
      <SiteNav profile={profile} />

      {hasToc ? (
        <div className="mx-auto grid max-w-[980px] grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[1fr_240px]">
          <div className="max-w-[760px]">{articleBody}</div>
          <aside className="hidden lg:block">
            <nav className="sticky top-24 rounded-xl border border-black/10 bg-white p-4">
              <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
                Mục lục nội dung
              </div>
              <ul className="flex flex-col gap-1.5">
                {toc.map((item) => (
                  <li key={item.id} className={item.level === 3 ? "pl-3" : ""}>
                    <a
                      href={`#${item.id}`}
                      className="block text-[12.5px] leading-snug text-[#64748B] hover:text-[#E8547A]"
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      ) : (
        <div className="mx-auto max-w-[760px] px-6 py-10">{articleBody}</div>
      )}

      <SiteFooter />
    </main>
  );
}
