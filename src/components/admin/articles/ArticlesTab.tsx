"use client";

import { useEffect, useRef, useState } from "react";

import { ArticleImageUploader } from "@/components/admin/articles/ArticleImageUploader";
import type { AdminArticle, AdminArticleCategory, ArticleStatus } from "@/lib/admin/types";
import { MAX_RELATED_ARTICLES } from "@/lib/articles/related";

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

function newDraftToken(): string {
  return crypto.randomUUID();
}

function toForm(a: AdminArticle): ArticleForm {
  return {
    title: a.title,
    category_id: a.category_id ?? "",
    slug: a.slug ?? "",
    excerpt: a.excerpt ?? "",
    meta_description: a.meta_description ?? "",
    content: a.content ?? "",
    cover_url: a.cover_url ?? "",
    status: a.status,
    related_article_ids: a.related_article_ids ?? [],
  };
}

function toPayload(form: ArticleForm, mediaDraftToken?: string | null) {
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
    ...(mediaDraftToken ? { media_draft_token: mediaDraftToken } : {}),
  };
}

function ArticleFields({
  form,
  onChange,
  categories,
  draftToken,
  articles,
  articleId,
}: {
  form: ArticleForm;
  onChange: (f: ArticleForm) => void;
  categories: AdminArticleCategory[];
  draftToken: string;
  articles: AdminArticle[];
  articleId?: string | null;
}) {
  const inputCls =
    "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]";
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef(form);
  const [relatedSearch, setRelatedSearch] = useState("");
  formRef.current = form;

  function insertContent(value: string) {
    const currentForm = formRef.current;
    const textarea = contentRef.current;
    const start = textarea?.selectionStart ?? currentForm.content.length;
    const end = textarea?.selectionEnd ?? currentForm.content.length;
    const nextForm = {
      ...currentForm,
      content: `${currentForm.content.slice(0, start)}${value}${currentForm.content.slice(end)}`,
    };

    formRef.current = nextForm;
    onChange(nextForm);

    requestAnimationFrame(() => {
      if (!contentRef.current) return;
      const cursor = start + value.length;
      contentRef.current.focus();
      contentRef.current.setSelectionRange(cursor, cursor);
    });
  }

  function insertHeading(prefix: "##" | "###") {
    const textarea = contentRef.current;
    const start = textarea?.selectionStart ?? form.content.length;
    const end = textarea?.selectionEnd ?? form.content.length;
    const selected = form.content.slice(start, end).trim() || "Tiêu đề mục";

    insertContent(`${prefix} ${selected}`);
  }

  function insertTable() {
    insertContent(
      "| Cột 1 | Cột 2 |\n| --- | --- |\n| Nội dung | Nội dung |",
    );
  }

  const relatedCandidates = articles.filter(
    (article) =>
      article.id !== articleId &&
      (article.status === "published" || form.related_article_ids.includes(article.id)) &&
      Boolean(article.slug),
  );
  const normalizedRelatedSearch = relatedSearch.trim().toLocaleLowerCase();
  const visibleRelatedCandidates = relatedCandidates.filter(
    (article) =>
      !normalizedRelatedSearch ||
      article.title.toLocaleLowerCase().includes(normalizedRelatedSearch) ||
      form.related_article_ids.includes(article.id),
  );

  function toggleRelatedArticle(articleIdToToggle: string) {
    const selected = form.related_article_ids;
    const related_article_ids = selected.includes(articleIdToToggle)
      ? selected.filter((id) => id !== articleIdToToggle)
      : selected.length >= MAX_RELATED_ARTICLES
        ? selected
        : [...selected, articleIdToToggle];

    onChange({ ...form, related_article_ids });
  }

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <aside className="col-span-2 rounded-lg border border-[#E8547A]/20 bg-[#FFF7FA] px-3 py-2.5 text-[11px] text-[#475569]">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
          <span className="font-bold uppercase text-[#C43A62]">Hướng dẫn SEO nhanh</span>
          <span className="text-[#94A3B8]">Áp dụng cho cả Thêm và Sửa</span>
        </div>
        <div className="grid gap-x-5 gap-y-1 sm:grid-cols-2">
          <p><strong>H1:</strong> một tiêu đề duy nhất, nêu rõ chủ đề và từ khóa chính.</p>
          <p><strong>Slug:</strong> viết thường, không dấu, ngăn cách bằng dấu gạch ngang.</p>
          <p><strong>Tóm tắt:</strong> nêu lợi ích chính, ngắn gọn và khác với bài khác.</p>
          <p><strong>Meta:</strong> mô tả riêng, ưu tiên 120–160 ký tự và đặt từ khóa sớm.</p>
          <p><strong>Nội dung:</strong> dùng H2/H3 theo đúng thứ tự; mỗi đoạn cách nhau một dòng trống.</p>
          <p><strong>Ảnh:</strong> chọn ảnh đúng chủ đề, đặt alt mô tả; kiểm tra bảng và liên kết trước khi xuất bản.</p>
        </div>
      </aside>
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tiêu đề (H1) *</span>
        <input value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })} className={inputCls} />
        <span className="text-[11px] text-[#94A3B8]">Mỗi bài viết có một H1, được lấy từ tiêu đề này.</span>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Chuyên mục</span>
        <select
          value={form.category_id}
          onChange={(e) => onChange({ ...form, category_id: e.target.value })}
          className={inputCls}
        >
          <option value="">— Chọn —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.parent_id ? `↳ ${c.name}` : c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Slug</span>
        <input
          placeholder="tu-dong-tao-neu-de-trong"
          value={form.slug}
          onChange={(e) => onChange({ ...form, slug: e.target.value })}
          className={inputCls}
        />
      </label>
      <ArticleImageUploader
        draftToken={draftToken}
        assetType="cover"
        previewUrl={form.cover_url || undefined}
        onUploaded={({ url }) => onChange({ ...formRef.current, cover_url: url })}
      />
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tóm tắt</span>
        <textarea
          rows={2}
          value={form.excerpt}
          onChange={(e) => onChange({ ...form, excerpt: e.target.value })}
          className={inputCls}
        />
      </label>
      <fieldset className="col-span-2 flex flex-col gap-1">
        <legend className="flex items-center justify-between text-[10px] font-bold uppercase text-[#94A3B8]">
          <span>Bài viết liên quan</span>
          <span className="font-normal normal-case">
            {form.related_article_ids.length}/{MAX_RELATED_ARTICLES}
          </span>
        </legend>
        <input
          value={relatedSearch}
          onChange={(e) => setRelatedSearch(e.target.value)}
          placeholder="Lọc theo tên bài viết..."
          aria-label="Lọc bài viết liên quan theo tên"
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs outline-none focus:border-[#E8547A]"
        />
        <div className="grid max-h-48 grid-cols-1 gap-1.5 overflow-y-auto rounded-lg border border-black/10 bg-white p-2 sm:grid-cols-2">
          {relatedCandidates.length === 0 ? (
            <p className="col-span-full px-2 py-2 text-[11px] text-[#94A3B8]">
              Chưa có bài viết đã xuất bản để liên kết.
            </p>
          ) : visibleRelatedCandidates.length === 0 ? (
            <p className="col-span-full px-2 py-2 text-[11px] text-[#94A3B8]">
              Không tìm thấy bài viết phù hợp.
            </p>
          ) : (
            visibleRelatedCandidates.map((article) => {
              const checked = form.related_article_ids.includes(article.id);
              const disabled = !checked && form.related_article_ids.length >= MAX_RELATED_ARTICLES;

              return (
                <label
                  key={article.id}
                  className={`flex cursor-pointer items-start gap-2 rounded-md border px-2.5 py-2 text-xs ${
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
                    <span className="block font-semibold leading-snug text-[#0F172A]">{article.title}</span>
                    <span className="mt-0.5 block text-[10px] text-[#64748B]">
                      {article.article_categories?.name ?? "Chưa gán chuyên mục"}
                    </span>
                  </span>
                </label>
              );
            })
          )}
        </div>
        <span className="text-[11px] text-[#94A3B8]">
          Chỉ hiển thị bài đã xuất bản trên trang chi tiết. Thứ tự hiển thị theo thứ tự chọn.
        </span>
      </fieldset>
      <label className="col-span-2 flex flex-col gap-1">
        <span className="flex items-center justify-between text-[10px] font-bold uppercase text-[#94A3B8]">
          <span>Meta description (SEO)</span>
          <span className="font-normal normal-case">{form.meta_description.length}/160</span>
        </span>
        <textarea
          rows={2}
          maxLength={160}
          placeholder="Mô tả ngắn hiển thị trên kết quả tìm kiếm Google..."
          value={form.meta_description}
          onChange={(e) => onChange({ ...form, meta_description: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Nội dung</span>
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-black/10 bg-[#F8FAFC] p-1.5">
          <button
            type="button"
            onClick={() => insertHeading("##")}
            className="rounded border border-black/10 bg-white px-2 py-1 text-xs font-bold text-[#0F172A] hover:border-[#E8547A]"
            title="Chèn tiêu đề H2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => insertHeading("###")}
            className="rounded border border-black/10 bg-white px-2 py-1 text-xs font-bold text-[#0F172A] hover:border-[#E8547A]"
            title="Chèn tiêu đề H3"
          >
            H3
          </button>
          <button
            type="button"
            onClick={insertTable}
            className="rounded border border-black/10 bg-white px-2 py-1 text-xs font-bold text-[#0F172A] hover:border-[#E8547A]"
            title="Chèn bảng Markdown"
          >
            Bảng
          </button>
          <span className="ml-1 text-[11px] text-[#94A3B8]">H1 dùng tiêu đề bài viết; H2/H3 sẽ tự tạo mục lục.</span>
          <ArticleImageUploader
            draftToken={draftToken}
            assetType="article_inline"
            multiple
            onUploadedBatch={(images) =>
              insertContent(`\n\n${images.map(({ url, alt }) => `![${alt}](${url})`).join("\n\n")}\n\n`)
            }
          />
        </div>
        <textarea
          ref={contentRef}
          rows={18}
          placeholder={
            "Mỗi đoạn cách nhau 1 dòng trống. Dùng **chữ đậm** để in đậm.\n" +
            "Dùng H2/H3 trên thanh công cụ để tạo mục lục. Bảng được lưu theo định dạng Markdown."
          }
          value={form.content}
          onChange={(e) => onChange({ ...form, content: e.target.value })}
          className={`${inputCls} min-h-[420px] resize-y leading-relaxed`}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Trạng thái</span>
        <select
          value={form.status}
          onChange={(e) => onChange({ ...form, status: e.target.value as ArticleStatus })}
          className={inputCls}
        >
          <option value="draft">Nháp</option>
          <option value="published">Xuất bản</option>
          <option value="archived">Ẩn</option>
        </select>
      </label>
    </div>
  );
}

export function ArticlesTab() {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [categories, setCategories] = useState<AdminArticleCategory[]>([]);
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ArticleForm>(EMPTY_FORM);
  const [editDraftToken, setEditDraftToken] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<ArticleForm>(EMPTY_FORM);
  const [createDraftToken, setCreateDraftToken] = useState(() => newDraftToken());
  const [saving, setSaving] = useState(false);

  async function loadAll(targetPage = page, targetStatus = statusFilter) {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        page_size: String(ARTICLE_PAGE_SIZE),
      });

      if (targetStatus !== "all") params.set("status", targetStatus);

      const [aRes, cRes] = await Promise.all([
        fetch(`/api/admin/articles?${params.toString()}`),
        fetch("/api/admin/article-categories"),
      ]);
      const [aData, cData] = await Promise.all([aRes.json(), cRes.json()]);

      if (!aRes.ok) {
        setError(aData.error ?? "Không tải được bài viết.");

        return;
      }

      setArticles(aData.items ?? aData.articles ?? []);
      setPagination(
        aData.pagination ?? {
          page: targetPage,
          page_size: ARTICLE_PAGE_SIZE,
          total: aData.items?.length ?? aData.articles?.length ?? 0,
          has_more: false,
        },
      );
      setCategories(cData.categories ?? []);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll(page, statusFilter);
    // loadAll chỉ là helper dùng chung cho các thao tác lưu; page/status là
    // hai dependency thực sự quyết định dữ liệu cần tải.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  async function cleanupDraftAssets(draftToken: string | null) {
    if (!draftToken) return;

    try {
      await fetch("/api/uploads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_token: draftToken }),
      });
    } catch {
      // Dọn rác không được làm gián đoạn thao tác đóng form.
    }
  }

  function cancelCreate() {
    void cleanupDraftAssets(createDraftToken);
    setCreating(false);
    setCreateForm(EMPTY_FORM);
    setCreateDraftToken(newDraftToken());
  }

  function cancelEdit() {
    void cleanupDraftAssets(editDraftToken);
    setEditingId(null);
    setEditDraftToken(null);
  }

  async function handleCreate() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(createForm, createDraftToken)),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Tạo bài viết thất bại.");

        return;
      }

      setCreateForm(EMPTY_FORM);
      setCreateDraftToken(newDraftToken());
      setCreating(false);
      setPage(1);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(id: string) {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(editForm, editDraftToken)),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Lưu thất bại.");

        return;
      }

      setArticles((prev) => prev.map((a) => (a.id === id ? data.article : a)));
      setEditingId(null);
      setEditDraftToken(null);
      await loadAll(page, statusFilter);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = articles;

  return (
    <div>
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex gap-1.5">
          {(["all", "draft", "published", "archived"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                statusFilter === s ? "bg-[#E8547A] text-white" : "bg-black/5 text-[#64748B] hover:bg-black/10"
              }`}
            >
              {s === "all" ? "Tất cả" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            if (creating) {
              cancelCreate();
            } else {
              setCreateForm(EMPTY_FORM);
              setCreateDraftToken(newDraftToken());
              setCreating(true);
            }
          }}
          className="rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-3.5 py-2 text-xs font-bold text-white"
        >
          + Viết bài mới
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {creating && (
        <div className="mb-4 rounded-xl border border-[#E8547A]/25 bg-[#E8547A]/5 p-4">
          <ArticleFields
            form={createForm}
            onChange={setCreateForm}
            categories={categories}
            draftToken={createDraftToken}
            articles={articles}
            articleId={null}
          />
          <p className="mt-2 text-[11px] text-[#94A3B8]">Ảnh bìa và ảnh trong nội dung sẽ được upload ngay, sau đó gắn vào bài viết khi bấm Lưu.</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={saving || !createForm.title.trim()}
              onClick={handleCreate}
              className="rounded-lg bg-[#0F172A] px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              Lưu
            </button>
            <button
              type="button"
              onClick={cancelCreate}
              className="rounded-lg border border-black/10 px-3.5 py-2 text-xs font-bold text-[#64748B]"
            >
              Huỷ
            </button>
          </div>
        </div>
      )}

      {!loading && filtered.length === 0 ? (
        <p className="rounded-xl border border-black/10 bg-white p-6 text-center text-sm text-[#94A3B8]">
          Chưa có bài viết nào.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((a) =>
            editingId === a.id ? (
              <div key={a.id} className="rounded-xl border border-[#E8547A]/25 bg-[#E8547A]/5 p-4">
                <ArticleFields
                  form={editForm}
                  onChange={setEditForm}
                  categories={categories}
                  draftToken={editDraftToken ?? "00000000-0000-4000-8000-000000000000"}
                  articles={articles}
                  articleId={a.id}
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSave(a.id)}
                    className="rounded-lg bg-[#0F172A] px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    Lưu
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-lg border border-black/10 px-3.5 py-2 text-xs font-bold text-[#64748B]"
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#FFF0F5] text-lg">
                    {a.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.cover_url} alt="" className="h-full w-full rounded-lg object-cover" />
                    ) : (
                      "📝"
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0F172A]">{a.title}</div>
                    <div className="mt-0.5 text-[11.5px] text-[#64748B]">
                      {a.article_categories?.name ?? "Chưa gán chuyên mục"} ·{" "}
                      <span
                        className={
                          a.status === "published"
                            ? "text-[#16A34A]"
                            : a.status === "draft"
                              ? "text-[#D97706]"
                              : ""
                        }
                      >
                        {STATUS_LABEL[a.status]}
                      </span>{" "}
                      · 👁 {a.view_count.toLocaleString("vi-VN")}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(a.id);
                    setEditForm(toForm(a));
                    setEditDraftToken(newDraftToken());
                  }}
                  className="rounded bg-[#E8547A]/10 px-2.5 py-1 text-[11px] font-bold text-[#E8547A]"
                >
                  Sửa
                </button>
              </div>
            ),
          )}
        </div>
      )}

      {!loading && pagination.total > 0 && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-4 py-3">
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
