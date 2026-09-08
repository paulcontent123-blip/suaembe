"use client";

import { useEffect, useRef, useState } from "react";

import { ArticleImageUploader } from "@/components/admin/articles/ArticleImageUploader";
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
  meta_description: string;
  content: string;
  cover_url: string;
  status: ArticleStatus;
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
    ...(mediaDraftToken ? { media_draft_token: mediaDraftToken } : {}),
  };
}

function ArticleFields({
  form,
  onChange,
  categories,
  draftToken,
}: {
  form: ArticleForm;
  onChange: (f: ArticleForm) => void;
  categories: AdminArticleCategory[];
  draftToken: string;
}) {
  const inputCls =
    "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]";
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef(form);
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

  return (
    <div className="grid grid-cols-2 gap-2.5">
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
            onUploaded={({ url, alt }) => insertContent(`\n\n![${alt}](${url})\n\n`)}
          />
        </div>
        <textarea
          ref={contentRef}
          rows={8}
          placeholder={
            "Mỗi đoạn cách nhau 1 dòng trống. Dùng **chữ đậm** để in đậm.\n" +
            "Dùng H2/H3 trên thanh công cụ để tạo mục lục. Bảng được lưu theo định dạng Markdown."
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

export function ArticlesTab() {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [categories, setCategories] = useState<AdminArticleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ArticleForm>(EMPTY_FORM);
  const [editDraftToken, setEditDraftToken] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<ArticleForm>(EMPTY_FORM);
  const [createDraftToken, setCreateDraftToken] = useState(() => newDraftToken());
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

      setArticles((prev) => [data.article, ...prev]);
      setCreateForm(EMPTY_FORM);
      setCreateDraftToken(newDraftToken());
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
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
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
    </div>
  );
}
