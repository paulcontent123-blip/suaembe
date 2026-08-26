"use client";

import { useEffect, useState } from "react";

import type { AdminBrand } from "@/lib/admin/types";

interface BrandForm {
  name: string;
  slug: string;
  country: string;
  website_url: string;
  description: string;
  verified: boolean;
}

const EMPTY_FORM: BrandForm = {
  name: "",
  slug: "",
  country: "",
  website_url: "",
  description: "",
  verified: false,
};

function toForm(b: AdminBrand): BrandForm {
  return {
    name: b.name,
    slug: b.slug ?? "",
    country: b.country ?? "",
    website_url: b.website_url ?? "",
    description: b.description ?? "",
    verified: b.verified,
  };
}

function toPayload(form: BrandForm) {
  return {
    name: form.name.trim(),
    slug: form.slug.trim() || null,
    country: form.country.trim() || null,
    website_url: form.website_url.trim() || null,
    description: form.description.trim() || null,
    verified: form.verified,
  };
}

function BrandFields({ form, onChange }: { form: BrandForm; onChange: (f: BrandForm) => void }) {
  const inputCls =
    "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]";

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tên nhãn hàng *</span>
        <input value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} className={inputCls} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Slug</span>
        <input value={form.slug} onChange={(e) => onChange({ ...form, slug: e.target.value })} className={inputCls} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Quốc gia</span>
        <input
          value={form.country}
          onChange={(e) => onChange({ ...form, country: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Website</span>
        <input
          value={form.website_url}
          onChange={(e) => onChange({ ...form, website_url: e.target.value })}
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
        <input
          type="checkbox"
          checked={form.verified}
          onChange={(e) => onChange({ ...form, verified: e.target.checked })}
        />
        Đã xác minh (hiển thị công khai trong Bách Hóa)
      </label>
    </div>
  );
}

export function BrandsTab() {
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<BrandForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<BrandForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/brands");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Không tải được danh sách nhãn hàng.");

        return;
      }

      setBrands(data.brands ?? []);
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
      const res = await fetch("/api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(createForm)),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Tạo nhãn hàng thất bại.");

        return;
      }

      setBrands((prev) => [...prev, data.brand].sort((a, b) => a.name.localeCompare(b.name)));
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
      const res = await fetch(`/api/admin/brands/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(editForm)),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Lưu thất bại.");

        return;
      }

      setBrands((prev) => prev.map((b) => (b.id === id ? data.brand : b)));
      setEditingId(null);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-xs text-[#94A3B8]">{brands.length} nhãn hàng</span>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-3.5 py-2 text-xs font-bold text-white"
        >
          + Thêm nhãn hàng
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {creating && (
        <div className="mb-4 rounded-xl border border-[#E8547A]/25 bg-[#E8547A]/5 p-4">
          <BrandFields form={createForm} onChange={setCreateForm} />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={saving || !createForm.name.trim()}
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

      {!loading && brands.length === 0 ? (
        <p className="rounded-xl border border-black/10 bg-white p-6 text-center text-sm text-[#94A3B8]">
          Chưa có nhãn hàng nào.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {brands.map((b) =>
            editingId === b.id ? (
              <div key={b.id} className="rounded-xl border border-[#E8547A]/25 bg-[#E8547A]/5 p-4">
                <BrandFields form={editForm} onChange={setEditForm} />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSave(b.id)}
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
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
                    {b.name}
                    {b.verified ? (
                      <span className="rounded bg-[#16A34A]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#16A34A]">
                        ✓ Verified
                      </span>
                    ) : (
                      <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-bold text-[#64748B]">
                        Chưa xác minh
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-[#64748B]">{b.country ?? "—"}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(b.id);
                    setEditForm(toForm(b));
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
