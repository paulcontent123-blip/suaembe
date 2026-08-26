"use client";

import { useEffect, useRef, useState } from "react";

import type { AdminArticle, AdminArticleCategory, ArticleStatus } from "@/lib/admin/types";

const STATUS_LABEL: Record<ArticleStatus, string> = {
  draft: "Nháp",
  published: "Đã xuất bản",
  archived: "Đã ẩn",
};

interface ArticleForm {
  title: string;
  category_id: string;
  slug: string;
  excerpt: string;
  content: string;
  status: ArticleStatus;
}

const EMPTY_FORM: ArticleForm = {
  title: "",
  category_id: "",
  slug: "",
  excerpt: "",
  content: "",
  status: "draft",
};

function toForm(a: AdminArticle): ArticleForm {
  return {
    title: a.title,
    category_id: a.category_id ?? "",
    slug: a.slug ?? "",
    excerpt: a.excerpt ?? "",
    content: a.content ?? "",
    status: a.status,
  };
}

function toPayload(form: ArticleForm) {
  return {
    title: form.title.trim(),
    category_id: form.category_id || null,
    slug: form.slug.trim() || null,
    excerpt: form.excerpt.trim() || null,
    content: form.content.trim() || null,
    status: form.status,
  };
}

function ArticleFields({
  form,
  onChange,
  categories,
}: {
  form: ArticleForm;
  onChange: (f: ArticleForm) => void;
  categories: AdminArticleCategory[];
}) {
  const inputCls =
    "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]";

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tiêu đề *</span>
        <input value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })} className={inputCls} />
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
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tóm tắt</span>
        <textarea
          rows={2}
          value={form.excerpt}
          onChange={(e) => onChange({ ...form, excerpt: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Nội dung</span>
        <textarea
          rows={8}
          placeholder={
            "Mỗi đoạn cách nhau 1 dòng trống. Dùng **chữ đậm** để in đậm.\n" +
            "Dòng bắt đầu bằng \"## \" tạo tiêu đề phụ, \"### \" tạo tiêu đề nhỏ hơn — tự sinh Mục lục nội dung ở trang đọc bài."
          }
          value={form.content}
          onChange={(e) => onChange({ ...form, content: e.target.value })}
          className={inputCls}
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

function CoverUploader({ article, onUploaded }: { article: AdminArticle; onUploaded: (url: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("owner_table", "articles");
      formData.append("owner_id", article.id);
      formData.append("asset_type", "cover");

      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload ảnh thất bại.");

        return;
      }

      onUploaded(data.asset.secure_url as string);
    } catch {
      setError("Có lỗi xảy ra khi upload ảnh.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="mt-3 border-t border-black/10 pt-3">
      {article.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.cover_url} alt="" className="mb-1.5 h-24 w-full rounded-lg border border-black/10 object-cover" />
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        disabled={uploading}
        className="text-xs text-[#64748B]"
      />
      {uploading && <p className="mt-1 text-[11px] text-[#94A3B8]">Đang upload...</p>}
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

export function ArticlesTab() {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [categories, setCategories] = useState<AdminArticleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ArticleForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<ArticleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    setLoading(true);

    try {
      const [aRes, cRes] = await Promise.all([
        fetch("/api/admin/articles"),
        fetch("/api/admin/article-categories"),
      ]);
      const [aData, cData] = await Promise.all([aRes.json(), cRes.json()]);

      if (!aRes.ok) {
        setError(aData.error ?? "Không tải được bài viết.");

        return;
      }

      setArticles(aData.articles ?? []);
      setCategories(cData.categories ?? []);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreate() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(createForm)),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Tạo bài viết thất bại.");

        return;
      }

      setArticles((prev) => [data.article, ...prev]);
      setCreateForm(EMPTY_FORM);
      setCreating(false);
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
        body: JSON.stringify(toPayload(editForm)),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Lưu thất bại.");

        return;
      }

      setArticles((prev) => prev.map((a) => (a.id === id ? data.article : a)));
      setEditingId(null);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  // Upload chỉ tạo dòng media_assets — phải PUT lại /api/admin/articles/:id
  // để lưu URL vào cột cover_url của chính bài viết, giống ImageUploader ở
  // ProductsTab (nếu không ảnh sẽ mồ côi trong media_assets).
  async function handleCoverUploaded(articleId: string, url: string) {
    setArticles((prev) => prev.map((a) => (a.id === articleId ? { ...a, cover_url: url } : a)));

    try {
      await fetch(`/api/admin/articles/${articleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover_url: url }),
      });
    } catch {
      // Ảnh đã lưu ở media_assets; nếu PUT lỗi, admin có thể thử upload lại.
    }
  }

  const filtered = statusFilter === "all" ? articles : articles.filter((a) => a.status === statusFilter);

  return (
    <div>
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex gap-1.5">
          {(["all", "draft", "published", "archived"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
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
          onClick={() => setCreating((v) => !v)}
          className="rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-3.5 py-2 text-xs font-bold text-white"
        >
          + Viết bài mới
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {creating && (
        <div className="mb-4 rounded-xl border border-[#E8547A]/25 bg-[#E8547A]/5 p-4">
          <ArticleFields form={createForm} onChange={setCreateForm} categories={categories} />
          <p className="mt-2 text-[11px] text-[#94A3B8]">Lưu bài viết trước, rồi upload ảnh bìa ở phần sửa bên dưới.</p>
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
              onClick={() => {
                setCreating(false);
                setCreateForm(EMPTY_FORM);
              }}
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
                <ArticleFields form={editForm} onChange={setEditForm} categories={categories} />
                <CoverUploader article={a} onUploaded={(url) => handleCoverUploaded(a.id, url)} />
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
                    onClick={() => setEditingId(null)}
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
    </div>
  );
}
