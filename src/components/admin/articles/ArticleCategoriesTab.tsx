"use client";

import { useEffect, useMemo, useState } from "react";

import type { AdminArticleCategory } from "@/lib/admin/types";

interface CategoryForm {
  name: string;
  slug: string;
  parent_id: string;
  description: string;
  sort_order: string;
  active: boolean;
}

const EMPTY_FORM: CategoryForm = {
  name: "",
  slug: "",
  parent_id: "",
  description: "",
  sort_order: "0",
  active: true,
};

function toForm(c: AdminArticleCategory): CategoryForm {
  return {
    name: c.name,
    slug: c.slug,
    parent_id: c.parent_id ?? "",
    description: c.description ?? "",
    sort_order: String(c.sort_order),
    active: c.active,
  };
}

function toPayload(form: CategoryForm) {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    parent_id: form.parent_id || null,
    description: form.description.trim() || null,
    sort_order: Number(form.sort_order) || 0,
    active: form.active,
  };
}

// article_categories tự tham chiếu chính nó (parent_id), giống hệt
// product_categories — tái dùng đúng thuật toán dựng cây cha-con-cháu và
// loại hậu duệ khi sửa để tránh vòng lặp cha-con.
function collectDescendantIds(categories: AdminArticleCategory[], rootId: string): Set<string> {
  const childrenByParent = new Map<string, AdminArticleCategory[]>();

  for (const c of categories) {
    if (!c.parent_id) continue;

    const arr = childrenByParent.get(c.parent_id) ?? [];
    arr.push(c);
    childrenByParent.set(c.parent_id, arr);
  }

  const result = new Set<string>();
  const stack = [rootId];

  while (stack.length > 0) {
    const id = stack.pop() as string;

    for (const child of childrenByParent.get(id) ?? []) {
      if (!result.has(child.id)) {
        result.add(child.id);
        stack.push(child.id);
      }
    }
  }

  return result;
}

function buildParentOptions(
  categories: AdminArticleCategory[],
  excludeId?: string,
): { id: string; name: string; depth: number }[] {
  const blocked = excludeId ? new Set([excludeId, ...collectDescendantIds(categories, excludeId)]) : null;
  const childrenByParent = new Map<string | null, AdminArticleCategory[]>();

  for (const c of categories) {
    const arr = childrenByParent.get(c.parent_id) ?? [];
    arr.push(c);
    childrenByParent.set(c.parent_id, arr);
  }

  const options: { id: string; name: string; depth: number }[] = [];

  function walk(parentId: string | null, depth: number) {
    for (const c of childrenByParent.get(parentId) ?? []) {
      if (blocked?.has(c.id)) continue;

      options.push({ id: c.id, name: c.name, depth });
      walk(c.id, depth + 1);
    }
  }

  walk(null, 0);

  return options;
}

function CategoryFields({
  form,
  onChange,
  categories,
  excludeId,
}: {
  form: CategoryForm;
  onChange: (f: CategoryForm) => void;
  categories: AdminArticleCategory[];
  excludeId?: string;
}) {
  const inputCls =
    "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]";
  const parentOptions = useMemo(() => buildParentOptions(categories, excludeId), [categories, excludeId]);

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tên chuyên mục *</span>
        <input value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} className={inputCls} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Slug *</span>
        <input value={form.slug} onChange={(e) => onChange({ ...form, slug: e.target.value })} className={inputCls} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Chuyên mục cha</span>
        <select
          value={form.parent_id}
          onChange={(e) => onChange({ ...form, parent_id: e.target.value })}
          className={inputCls}
        >
          <option value="">— Chuyên mục gốc —</option>
          {parentOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.depth > 0 ? `${"—".repeat(o.depth)} ` : ""}
              {o.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Thứ tự hiển thị</span>
        <input
          type="number"
          value={form.sort_order}
          onChange={(e) => onChange({ ...form, sort_order: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Mô tả</span>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="col-span-2 flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
        <input type="checkbox" checked={form.active} onChange={(e) => onChange({ ...form, active: e.target.checked })} />
        Đang hiển thị công khai
      </label>
    </div>
  );
}

export function ArticleCategoriesTab() {
  const [categories, setCategories] = useState<AdminArticleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CategoryForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CategoryForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/article-categories");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Không tải được chuyên mục.");

        return;
      }

      setCategories(data.categories ?? []);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/article-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(createForm)),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Tạo chuyên mục thất bại.");

        return;
      }

      setCategories((prev) => [...prev, data.category]);
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
      const res = await fetch(`/api/admin/article-categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(editForm)),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Lưu thất bại.");

        return;
      }

      setCategories((prev) => prev.map((c) => (c.id === id ? data.category : c)));
      setEditingId(null);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  const parentName = (id: string | null) => categories.find((c) => c.id === id)?.name;

  return (
    <div>
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-xs text-[#94A3B8]">{categories.length} chuyên mục</span>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-3.5 py-2 text-xs font-bold text-white"
        >
          + Thêm chuyên mục
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {creating && (
        <div className="mb-4 rounded-xl border border-[#E8547A]/25 bg-[#E8547A]/5 p-4">
          <CategoryFields form={createForm} onChange={setCreateForm} categories={categories} />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={saving || !createForm.name.trim() || !createForm.slug.trim()}
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

      {!loading && categories.length === 0 ? (
        <p className="rounded-xl border border-black/10 bg-white p-6 text-center text-sm text-[#94A3B8]">
          Chưa có chuyên mục nào.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {categories.map((c) =>
            editingId === c.id ? (
              <div key={c.id} className="rounded-xl border border-[#E8547A]/25 bg-[#E8547A]/5 p-4">
                <CategoryFields form={editForm} onChange={setEditForm} categories={categories} excludeId={c.id} />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSave(c.id)}
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
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
                    {c.parent_id && <span className="text-[#94A3B8]">↳</span>}
                    {c.name}
                    {!c.active && (
                      <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-bold text-[#64748B]">
                        Đã ẩn
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-[#64748B]">
                    {c.parent_id ? `Thuộc: ${parentName(c.parent_id) ?? "—"}` : "Chuyên mục gốc"} · /{c.slug}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(c.id);
                    setEditForm(toForm(c));
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
