"use client";

import { useEffect, useRef, useState } from "react";

import { ProductDetailModal } from "@/components/bach-hoa/ProductDetailModal";
import type { AdminBrand, AdminCategory, AdminProduct, ProductStatus } from "@/lib/admin/types";
import { formatVnd } from "@/lib/format";

const STATUS_LABEL: Record<ProductStatus, string> = {
  draft: "Nháp",
  active: "Đang bán",
  archived: "Đã ẩn",
};

interface ProductForm {
  name: string;
  brand_id: string;
  category_id: string;
  short_description: string;
  price_vnd: string;
  original_price_vnd: string;
  unit: string;
  tags: string;
  status: ProductStatus;
  outbound_url: string;
  isMilk: boolean;
  milk_stage: string;
  milk_age_min: string;
  milk_age_max: string;
}

const EMPTY_FORM: ProductForm = {
  name: "",
  brand_id: "",
  category_id: "",
  short_description: "",
  price_vnd: "",
  original_price_vnd: "",
  unit: "",
  tags: "",
  status: "draft",
  outbound_url: "",
  isMilk: false,
  milk_stage: "",
  milk_age_min: "",
  milk_age_max: "",
};

function toForm(p: AdminProduct): ProductForm {
  return {
    name: p.name,
    brand_id: p.brand_id ?? "",
    category_id: p.category_id ?? "",
    short_description: p.short_description ?? "",
    price_vnd: p.price_vnd != null ? String(p.price_vnd) : "",
    original_price_vnd: p.original_price_vnd != null ? String(p.original_price_vnd) : "",
    unit: p.unit ?? "",
    tags: p.tags.join(", "),
    status: p.status,
    outbound_url: p.outbound_url ?? "",
    isMilk: p.milk_products != null,
    milk_stage: p.milk_products?.stage ?? "",
    milk_age_min: p.milk_products?.age_min_months != null ? String(p.milk_products.age_min_months) : "",
    milk_age_max: p.milk_products?.age_max_months != null ? String(p.milk_products.age_max_months) : "",
  };
}

function toPayload(form: ProductForm) {
  return {
    name: form.name.trim(),
    brand_id: form.brand_id || null,
    category_id: form.category_id || null,
    short_description: form.short_description.trim() || null,
    price_vnd: form.price_vnd.trim() ? Number(form.price_vnd) : null,
    original_price_vnd: form.original_price_vnd.trim() ? Number(form.original_price_vnd) : null,
    unit: form.unit.trim() || null,
    tags: form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    status: form.status,
    outbound_url: form.outbound_url.trim() || null,
    milk: form.isMilk
      ? {
          stage: form.milk_stage.trim() || null,
          age_min_months: form.milk_age_min.trim() ? Number(form.milk_age_min) : null,
          age_max_months: form.milk_age_max.trim() ? Number(form.milk_age_max) : null,
        }
      : null,
  };
}

function ProductFields({
  form,
  onChange,
  brands,
  categories,
}: {
  form: ProductForm;
  onChange: (f: ProductForm) => void;
  brands: AdminBrand[];
  categories: AdminCategory[];
}) {
  const inputCls =
    "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]";

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tên sản phẩm *</span>
        <input value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} className={inputCls} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Nhãn hàng</span>
        <select
          value={form.brand_id}
          onChange={(e) => onChange({ ...form, brand_id: e.target.value })}
          className={inputCls}
        >
          <option value="">— Chọn —</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Danh mục</span>
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
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Giá bán (₫)</span>
        <input
          type="number"
          value={form.price_vnd}
          onChange={(e) => onChange({ ...form, price_vnd: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Giá gốc (₫)</span>
        <input
          type="number"
          value={form.original_price_vnd}
          onChange={(e) => onChange({ ...form, original_price_vnd: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Đơn vị</span>
        <input
          placeholder="hộp, chai, chiếc..."
          value={form.unit}
          onChange={(e) => onChange({ ...form, unit: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Trạng thái</span>
        <select
          value={form.status}
          onChange={(e) => onChange({ ...form, status: e.target.value as ProductStatus })}
          className={inputCls}
        >
          <option value="draft">Nháp</option>
          <option value="active">Đang bán</option>
          <option value="archived">Đã ẩn</option>
        </select>
      </label>
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Mô tả ngắn</span>
        <textarea
          rows={2}
          value={form.short_description}
          onChange={(e) => onChange({ ...form, short_description: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tags (cách nhau bởi dấu phẩy)</span>
        <input
          placeholder="dha, tieu_hoa, huu_co"
          value={form.tags}
          onChange={(e) => onChange({ ...form, tags: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">
          Link mua hàng (Affiliate — VD: Shopee, Tiki...)
        </span>
        <input
          placeholder="https://shopee.vn/..."
          value={form.outbound_url}
          onChange={(e) => onChange({ ...form, outbound_url: e.target.value })}
          className={inputCls}
        />
      </label>

      <label className="col-span-2 flex items-center gap-2 border-t border-black/10 pt-3 text-xs font-semibold text-[#0F172A]">
        <input type="checkbox" checked={form.isMilk} onChange={(e) => onChange({ ...form, isMilk: e.target.checked })} />
        Đây là sản phẩm sữa (lưu thêm dữ liệu dinh dưỡng, dùng cho AI gợi ý sữa)
      </label>

      {form.isMilk && (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Giai đoạn</span>
            <input
              placeholder="VD: Số 2 (6-12 tháng)"
              value={form.milk_stage}
              onChange={(e) => onChange({ ...form, milk_stage: e.target.value })}
              className={inputCls}
            />
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tuổi từ (tháng)</span>
              <input
                type="number"
                value={form.milk_age_min}
                onChange={(e) => onChange({ ...form, milk_age_min: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tuổi đến (tháng)</span>
              <input
                type="number"
                value={form.milk_age_max}
                onChange={(e) => onChange({ ...form, milk_age_max: e.target.value })}
                className={inputCls}
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
}

function ImageUploader({ product, onUploaded }: { product: AdminProduct; onUploaded: (url: string) => void }) {
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
      formData.append("owner_table", "products");
      formData.append("owner_id", product.id);
      formData.append("asset_type", "product_image");

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
      <div className="mb-1.5 flex flex-wrap gap-1.5">
        {product.image_urls.map((url) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={url} src={url} alt="" className="h-14 w-14 rounded-lg border border-black/10 object-cover" />
        ))}
      </div>
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

export function ProductsTab() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProductForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<AdminProduct | null>(null);

  async function loadAll() {
    setLoading(true);

    try {
      const [pRes, bRes, cRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/brands"),
        fetch("/api/admin/product-categories"),
      ]);
      const [pData, bData, cData] = await Promise.all([pRes.json(), bRes.json(), cRes.json()]);

      if (!pRes.ok) {
        setError(pData.error ?? "Không tải được sản phẩm.");

        return;
      }

      setProducts(pData.products ?? []);
      setBrands(bData.brands ?? []);
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
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(createForm)),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Tạo sản phẩm thất bại.");

        return;
      }

      setProducts((prev) => [data.product, ...prev]);
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
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(editForm)),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Lưu thất bại.");

        return;
      }

      setProducts((prev) => prev.map((p) => (p.id === id ? data.product : p)));
      setEditingId(null);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  // Upload chỉ tạo dòng media_assets — phải PUT lại /api/admin/products/:id
  // để lưu URL vào cột image_urls của chính sản phẩm, nếu không ảnh sẽ "biến
  // mất" khi tải lại trang (chỉ tồn tại mồ côi trong media_assets).
  async function handleImageUploaded(productId: string, url: string) {
    const product = products.find((p) => p.id === productId);
    const image_urls = [...(product?.image_urls ?? []), url];

    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, image_urls } : p)));

    try {
      await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_urls }),
      });
    } catch {
      // Ảnh đã lưu ở media_assets; nếu PUT lỗi, admin có thể thử lại bằng
      // cách upload lại — không chặn luồng sửa sản phẩm.
    }
  }

  return (
    <div>
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-xs text-[#94A3B8]">{products.length} sản phẩm</span>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-3.5 py-2 text-xs font-bold text-white"
        >
          + Thêm sản phẩm
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {creating && (
        <div className="mb-4 rounded-xl border border-[#E8547A]/25 bg-[#E8547A]/5 p-4">
          <ProductFields form={createForm} onChange={setCreateForm} brands={brands} categories={categories} />
          <p className="mt-2 text-[11px] text-[#94A3B8]">Lưu sản phẩm trước, rồi upload ảnh ở phần sửa bên dưới.</p>
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

      {!loading && products.length === 0 ? (
        <p className="rounded-xl border border-black/10 bg-white p-6 text-center text-sm text-[#94A3B8]">
          Chưa có sản phẩm nào.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {products.map((p) =>
            editingId === p.id ? (
              <div key={p.id} className="rounded-xl border border-[#E8547A]/25 bg-[#E8547A]/5 p-4">
                <ProductFields form={editForm} onChange={setEditForm} brands={brands} categories={categories} />
                <ImageUploader product={p} onUploaded={(url) => handleImageUploaded(p.id, url)} />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSave(p.id)}
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
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#FFF0F5] text-lg">
                    {p.image_urls[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_urls[0]} alt="" className="h-full w-full rounded-lg object-cover" />
                    ) : (
                      "📦"
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0F172A]">
                      {p.name}
                      {p.milk_products && (
                        <span className="ml-1.5 rounded bg-[#0D9488]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#0D9488]">
                          Sữa
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-[#64748B]">
                      {p.brands?.name ?? "—"} · {formatVnd(p.price_vnd)} ·{" "}
                      <span
                        className={
                          p.status === "active" ? "text-[#16A34A]" : p.status === "draft" ? "text-[#D97706]" : ""
                        }
                      >
                        {STATUS_LABEL[p.status]}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewProduct(p)}
                    className="rounded bg-black/5 px-2.5 py-1 text-[11px] font-bold text-[#64748B]"
                  >
                    👁 Xem
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(p.id);
                      setEditForm(toForm(p));
                    }}
                    className="rounded bg-[#E8547A]/10 px-2.5 py-1 text-[11px] font-bold text-[#E8547A]"
                  >
                    Sửa
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {previewProduct && (
        <ProductDetailModal product={previewProduct} onClose={() => setPreviewProduct(null)} />
      )}
    </div>
  );
}
