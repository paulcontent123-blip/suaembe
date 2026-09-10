"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { AdminFrame, type AdminSection } from "@/components/admin/AdminFrame";
import { ArticleImageUploader } from "@/components/admin/articles/ArticleImageUploader";
import { ArticleMarkdownEditor } from "@/components/admin/articles/ArticleMarkdownEditor";
import type { AdminArticle, AdminArticleCategory, ArticleStatus } from "@/lib/admin/types";
import type { UserProfile } from "@/lib/auth/types";
import { MAX_RELATED_ARTICLES } from "@/lib/articles/related";

interface ArticleForm {
  title: string;
  category_id: string;
  slug: string;
  excerpt: string;
  meta_description: string;
  content: string;
  cover_url: string;
  status: ArticleStatus;
  related_article_ids: string[];
}

interface ArticleEditorProps {
  mode: "create" | "edit";
  articleId?: string;
  profile: UserProfile;
}

interface SeoCheck {
  label: string;
  passed: boolean;
}

const EMPTY_FORM: ArticleForm = {
  title: "",
  category_id: "",
  slug: "",
  excerpt: "",
  meta_description: "",
  content: "",
  cover_url: "",
  status: "draft",
  related_article_ids: [],
};

const STATUS_LABEL: Record<ArticleStatus, string> = {
  draft: "Bản nháp",
  published: "Đã xuất bản",
  archived: "Đã ẩn",
};

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#E8547A] focus:ring-2 focus:ring-[#E8547A]/10";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function toForm(article: AdminArticle): ArticleForm {
  return {
    title: article.title,
    category_id: article.category_id ?? "",
    slug: article.slug ?? "",
    excerpt: article.excerpt ?? "",
    meta_description: article.meta_description ?? "",
    content: article.content ?? "",
    cover_url: article.cover_url ?? "",
    status: article.status,
    related_article_ids: article.related_article_ids ?? [],
  };
}

function toPayload(form: ArticleForm, mediaDraftToken: string) {
  return {
    title: form.title.trim(),
    category_id: form.category_id || null,
    slug: form.slug.trim() || null,
    excerpt: form.excerpt.trim() || null,
    meta_description: form.meta_description.trim() || null,
    content: form.content.trim() || null,
    cover_url: form.cover_url.trim() || null,
    status: form.status,
    related_article_ids: form.related_article_ids,
    media_draft_token: mediaDraftToken,
  };
}

function getSeoChecks(form: ArticleForm): SeoCheck[] {
  const markdownImages = [...form.content.matchAll(/!\[([^\]]*)\]\s*\(\s*https?:\/\/[^)\s]+\s*\)/g)];
  const wordCount = form.content.trim() ? form.content.trim().split(/\s+/).length : 0;

  return [
    { label: "Có tiêu đề H1", passed: form.title.trim().length > 0 },
    { label: "Slug hợp lệ", passed: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug) },
    { label: "Có tóm tắt", passed: form.excerpt.trim().length > 0 },
    {
      label: "Meta từ 120-160 ký tự",
      passed: form.meta_description.trim().length >= 120 && form.meta_description.trim().length <= 160,
    },
    { label: "Có ít nhất một H2", passed: /^##\s+\S+/m.test(form.content) },
    { label: "Nội dung từ 300 từ", passed: wordCount >= 300 },
    { label: "Có ảnh bìa", passed: Boolean(form.cover_url) },
    {
      label: "Ảnh nội dung có alt",
      passed: markdownImages.length === 0 || markdownImages.every((image) => image[1].trim().length > 0),
    },
  ];
}

export function ArticleEditor({ mode, articleId, profile }: ArticleEditorProps) {
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ArticleForm>(EMPTY_FORM);
  const [categories, setCategories] = useState<AdminArticleCategory[]>([]);
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [draftToken, setDraftToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [inlineUploading, setInlineUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [relatedSearch, setRelatedSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const uploading = coverUploading || inlineUploading;
  const seoChecks = useMemo(() => getSeoChecks(form), [form]);
  const seoPassed = seoChecks.filter((check) => check.passed).length;

  useEffect(() => {
    setDraftToken(crypto.randomUUID());
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEditor() {
      setLoading(true);
      setReady(false);
      setError(null);

      try {
        const requests: Promise<Response>[] = [
          fetch("/api/admin/article-categories", { signal: controller.signal }),
          fetch("/api/admin/articles?page=1&page_size=50", { signal: controller.signal }),
        ];

        if (mode === "edit" && articleId) {
          requests.push(fetch(`/api/admin/articles/${articleId}`, { signal: controller.signal }));
        }

        const [categoryResponse, articleListResponse, articleResponse] = await Promise.all(requests);
        const [categoryData, articleListData, articleData] = await Promise.all([
          categoryResponse.json(),
          articleListResponse.json(),
          articleResponse?.json(),
        ]);

        if (!categoryResponse.ok) {
          throw new Error(categoryData.error ?? "Không tải được chuyên mục.");
        }

        if (!articleListResponse.ok) {
          throw new Error(articleListData.error ?? "Không tải được danh sách bài viết.");
        }

        if (articleResponse && !articleResponse.ok) {
          throw new Error(articleData.error ?? "Không tải được bài viết.");
        }

        setCategories(categoryData.categories ?? []);
        setArticles(articleListData.items ?? articleListData.articles ?? []);

        if (mode === "edit") {
          if (!articleData?.article) throw new Error("Không tìm thấy bài viết.");
          setForm(toForm(articleData.article as AdminArticle));
          setSlugTouched(true);
        }

        setDirty(false);
        setReady(true);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Không tải được trình soạn bài.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadEditor();

    return () => controller.abort();
  }, [articleId, mode]);

  useEffect(() => {
    if (!dirty) return;

    const warnBeforeLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeLeave);

    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [dirty]);

  function updateForm(patch: Partial<ArticleForm>) {
    setForm((current) => ({ ...current, ...patch }));
    setDirty(true);
    setNotice(null);
  }

  function updateTitle(title: string) {
    setForm((current) => ({
      ...current,
      title,
      slug: !slugTouched ? slugify(title) : current.slug,
    }));
    setDirty(true);
    setNotice(null);
  }

  function updateSlug(slug: string) {
    setSlugTouched(true);
    updateForm({ slug: slugify(slug) });
  }

  function toggleRelatedArticle(id: string) {
    const selected = form.related_article_ids;
    const relatedArticleIds = selected.includes(id)
      ? selected.filter((selectedId) => selectedId !== id)
      : selected.length < MAX_RELATED_ARTICLES
        ? [...selected, id]
        : selected;

    updateForm({ related_article_ids: relatedArticleIds });
  }

  async function cleanupDraftAssets() {
    if (!draftToken) return;

    try {
      await fetch("/api/uploads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_token: draftToken }),
      });
    } catch {
      // Cleanup should not trap the admin on the editor page.
    }
  }

  async function prepareToLeave(): Promise<boolean> {
    if (uploading) {
      setError("Vui lòng chờ ảnh tải xong trước khi rời trang.");
      return false;
    }

    if (dirty && !window.confirm("Các thay đổi chưa lưu sẽ bị mất. Bạn vẫn muốn rời trang?")) {
      return false;
    }

    await cleanupDraftAssets();
    return true;
  }

  async function navigateToSection(section: AdminSection) {
    if (!(await prepareToLeave())) return;
    router.push(`/admin?section=${section}`);
  }

  async function goBack() {
    await navigateToSection("bai-viet");
  }

  async function saveArticle() {
    if (!form.title.trim()) {
      setError("Vui lòng nhập tiêu đề bài viết.");
      titleRef.current?.focus();
      return;
    }

    if (form.status === "published" && !form.slug.trim()) {
      setError("Bài xuất bản cần có slug.");
      return;
    }

    if (form.status === "published" && !form.content.trim()) {
      setError("Bài xuất bản cần có nội dung.");
      return;
    }

    if (!draftToken) {
      setError("Trình tải ảnh chưa sẵn sàng. Vui lòng thử lại.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const endpoint = mode === "create" ? "/api/admin/articles" : `/api/admin/articles/${articleId}`;
      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form, draftToken)),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Không lưu được bài viết.");
      }

      const savedArticle = data.article as AdminArticle;
      setForm(toForm(savedArticle));
      setDirty(false);
      setNotice(mode === "create" ? "Đã tạo bài viết." : "Đã lưu thay đổi.");

      if (mode === "create") {
        router.replace(`/admin/articles/${savedArticle.id}/edit`);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Không lưu được bài viết.");
    } finally {
      setSaving(false);
    }
  }

  const selectedOrder = new Map(form.related_article_ids.map((id, index) => [id, index]));
  const normalizedSearch = relatedSearch.trim().toLocaleLowerCase("vi-VN");
  const relatedCandidates = articles
    .filter(
      (article) =>
        article.id !== articleId &&
        Boolean(article.slug) &&
        (article.status === "published" || form.related_article_ids.includes(article.id)),
    )
    .filter(
      (article) =>
        !normalizedSearch ||
        article.title.toLocaleLowerCase("vi-VN").includes(normalizedSearch) ||
        form.related_article_ids.includes(article.id),
    )
    .sort((left, right) => {
      const leftOrder = selectedOrder.get(left.id);
      const rightOrder = selectedOrder.get(right.id);

      if (leftOrder !== undefined && rightOrder !== undefined) return leftOrder - rightOrder;
      if (leftOrder !== undefined) return -1;
      if (rightOrder !== undefined) return 1;
      return left.title.localeCompare(right.title, "vi");
    });

  return (
    <AdminFrame
      profile={profile}
      activeSection="bai-viet"
      onNavigate={(section) => void navigateToSection(section)}
      beforeLeave={prepareToLeave}
      contentClassName="p-4 sm:p-5 lg:p-6"
    >
      <main className="mx-auto w-full max-w-[1500px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => void goBack()}
              className="flex h-9 items-center gap-1.5 rounded border border-black/10 bg-white px-3 text-xs font-semibold text-[#64748B] hover:border-[#E8547A] hover:text-[#E8547A]"
            >
              <span aria-hidden="true">←</span>
              <span className="hidden sm:inline">Danh sách bài viết</span>
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold text-[#0F172A]">
                {mode === "create" ? "Viết bài mới" : form.title || "Sửa bài viết"}
              </h1>
              <p className="text-[10px] text-[#94A3B8]">Bài viết / Blog</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {mode === "edit" && form.status === "published" && form.slug && (
              <a
                href={`/tin-tuc/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden rounded border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[#64748B] hover:border-[#E8547A] hover:text-[#E8547A] sm:block"
              >
                Xem bài
              </a>
            )}
            <button
              type="button"
              onClick={() => void saveArticle()}
              disabled={loading || saving || uploading || !draftToken}
              className="rounded bg-[#E8547A] px-4 py-2 text-xs font-bold text-white hover:bg-[#D83F6A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : uploading ? "Đang tải ảnh..." : "Lưu bài viết"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="font-bold" aria-label="Đóng thông báo">×</button>
          </div>
        )}
        {notice && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {notice}
          </div>
        )}

        {loading || !draftToken ? (
          <div className="rounded-lg border border-black/10 bg-white px-6 py-16 text-center text-sm text-[#64748B]">
            Đang tải trình soạn bài...
          </div>
        ) : !ready ? (
          <div className="rounded-lg border border-black/10 bg-white px-6 py-16 text-center">
            <p className="text-sm text-[#64748B]">Không thể mở dữ liệu bài viết.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 rounded border border-black/10 px-3 py-2 text-xs font-bold text-[#D83F6A] hover:border-[#E8547A]"
            >
              Thử tải lại
            </button>
          </div>
        ) : (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
            <section className="min-w-0 space-y-4">
              <div className="rounded-lg border border-black/10 bg-white p-4 sm:p-5">
                <label htmlFor="article-title" className="mb-1.5 flex items-center justify-between gap-3 text-[11px] font-bold uppercase text-[#64748B]">
                  <span>Tiêu đề bài viết (H1) *</span>
                  <span className="font-normal normal-case text-[#94A3B8]">{form.title.length} ký tự</span>
                </label>
                <input
                  id="article-title"
                  ref={titleRef}
                  value={form.title}
                  onChange={(event) => updateTitle(event.target.value)}
                  placeholder="Nhập tiêu đề chính của bài viết"
                  className="w-full border-0 border-b border-black/10 px-0 pb-3 text-2xl font-extrabold text-[#0F172A] outline-none focus:border-[#E8547A] sm:text-3xl"
                />

                <label htmlFor="article-excerpt" className="mb-1.5 mt-5 block text-[11px] font-bold uppercase text-[#64748B]">
                  Sapo / Tóm tắt
                </label>
                <textarea
                  id="article-excerpt"
                  rows={3}
                  value={form.excerpt}
                  onChange={(event) => updateForm({ excerpt: event.target.value })}
                  placeholder="Tóm tắt ngắn nội dung và lợi ích chính của bài viết"
                  className={`${inputClass} resize-y leading-relaxed`}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-extrabold text-[#0F172A]">Nội dung bài viết</h2>
                  <span className="text-[11px] text-[#64748B]">H1 dùng tiêu đề; nội dung dùng H2/H3</span>
                </div>
                <ArticleMarkdownEditor
                  value={form.content}
                  onChange={(content) => updateForm({ content })}
                  draftToken={draftToken}
                  title={form.title}
                  excerpt={form.excerpt}
                  coverUrl={form.cover_url}
                  onFocusTitle={() => titleRef.current?.focus()}
                  onUploadingChange={setInlineUploading}
                />
              </div>
            </section>

            <aside className="overflow-hidden rounded-lg border border-black/10 bg-white xl:sticky xl:top-4">
              <section className="border-b border-black/10 p-4">
                <h2 className="mb-3 text-xs font-extrabold uppercase text-[#0F172A]">Xuất bản</h2>
                <label className="mb-3 block">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-[#94A3B8]">Trạng thái</span>
                  <select
                    value={form.status}
                    onChange={(event) => updateForm({ status: event.target.value as ArticleStatus })}
                    className={inputClass}
                  >
                    {(Object.keys(STATUS_LABEL) as ArticleStatus[]).map((status) => (
                      <option key={status} value={status}>{STATUS_LABEL[status]}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-[#94A3B8]">Chuyên mục</span>
                  <select
                    value={form.category_id}
                    onChange={(event) => updateForm({ category_id: event.target.value })}
                    className={inputClass}
                  >
                    <option value="">Chưa chọn chuyên mục</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.parent_id ? `↳ ${category.name}` : category.name}
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              <section className="border-b border-black/10 p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label htmlFor="article-slug" className="text-[10px] font-bold uppercase text-[#94A3B8]">Slug</label>
                  <button
                    type="button"
                    onClick={() => {
                      setSlugTouched(true);
                      updateForm({ slug: slugify(form.title) });
                    }}
                    className="text-[11px] font-semibold text-[#D83F6A] hover:underline"
                  >
                    Tạo từ tiêu đề
                  </button>
                </div>
                <input
                  id="article-slug"
                  value={form.slug}
                  onChange={(event) => updateSlug(event.target.value)}
                  placeholder="duong-dan-bai-viet"
                  className={inputClass}
                />
                {form.slug && <p className="mt-1.5 truncate text-[10px] text-[#94A3B8]">/tin-tuc/{form.slug}</p>}
              </section>

              <section className="border-b border-black/10 p-4">
                <label className="mb-1 flex items-center justify-between gap-2 text-[10px] font-bold uppercase text-[#94A3B8]">
                  <span>Meta description</span>
                  <span className={form.meta_description.length >= 120 ? "text-green-600" : "font-normal text-[#94A3B8]"}>
                    {form.meta_description.length}/160
                  </span>
                </label>
                <textarea
                  rows={5}
                  maxLength={160}
                  value={form.meta_description}
                  onChange={(event) => updateForm({ meta_description: event.target.value })}
                  placeholder="Mô tả hiển thị trên kết quả tìm kiếm"
                  className={`${inputClass} resize-y leading-relaxed`}
                />
              </section>

              <section className="border-b border-black/10 p-4">
                <ArticleImageUploader
                  draftToken={draftToken}
                  assetType="cover"
                  previewUrl={form.cover_url || undefined}
                  previewAlt={form.title}
                  onUploaded={({ url }) => updateForm({ cover_url: url })}
                  onRemove={() => updateForm({ cover_url: "" })}
                  onUploadingChange={setCoverUploading}
                />
              </section>

              <section className="border-b border-black/10 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="text-xs font-extrabold uppercase text-[#0F172A]">Bài viết liên quan</h2>
                  <span className="text-[10px] text-[#64748B]">
                    {form.related_article_ids.length}/{MAX_RELATED_ARTICLES}
                  </span>
                </div>
                <input
                  value={relatedSearch}
                  onChange={(event) => setRelatedSearch(event.target.value)}
                  placeholder="Lọc theo tên bài viết..."
                  aria-label="Lọc bài viết liên quan theo tên"
                  className={`${inputClass} mb-2 text-xs`}
                />
                <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                  {relatedCandidates.length === 0 ? (
                    <p className="py-3 text-center text-[11px] text-[#94A3B8]">Không có bài viết phù hợp.</p>
                  ) : (
                    relatedCandidates.map((article) => {
                      const checked = form.related_article_ids.includes(article.id);
                      const disabled = !checked && form.related_article_ids.length >= MAX_RELATED_ARTICLES;

                      return (
                        <label
                          key={article.id}
                          className={`flex cursor-pointer items-start gap-2 rounded border px-2.5 py-2 text-[11px] leading-snug ${
                            checked ? "border-[#E8547A]/40 bg-[#FFF0F5]" : "border-black/5 bg-[#F8FAFC]"
                          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => toggleRelatedArticle(article.id)}
                            className="mt-0.5 accent-[#E8547A]"
                          />
                          <span className="min-w-0">
                            <span className="line-clamp-2 font-semibold text-[#0F172A]">{article.title}</span>
                            <span className="mt-0.5 block text-[9px] text-[#94A3B8]">
                              {article.article_categories?.name ?? "Chưa có chuyên mục"}
                            </span>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="text-xs font-extrabold uppercase text-[#0F172A]">Kiểm tra SEO</h2>
                  <span className={`text-[11px] font-bold ${seoPassed === seoChecks.length ? "text-green-600" : "text-[#D97706]"}`}>
                    {seoPassed}/{seoChecks.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-1">
                  {seoChecks.map((check) => (
                    <div key={check.label} className="flex items-center gap-2 text-[11px] text-[#475569]">
                      <span
                        aria-hidden="true"
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ${
                          check.passed ? "bg-green-600" : "bg-[#CBD5E1]"
                        }`}
                      >
                        {check.passed ? "✓" : ""}
                      </span>
                      <span>{check.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        )}
      </main>
    </AdminFrame>
  );
}
