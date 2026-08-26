"use client";

import { useRef, useState } from "react";

import type { Listing } from "@/lib/catalog/types";

const CATEGORY_OPTIONS = [
  "Sữa dư / Sữa mẹ",
  "Quần áo trẻ em",
  "Xe đẩy / Địu / Ghế ô tô",
  "Đồ chơi & Phụ kiện",
  "Bình sữa / Núm ti / Máy hút sữa",
  "Đồ dùng phòng bé",
];

const CONDITION_OPTIONS = [
  "Mới 100% (chưa dùng)",
  "Như mới (95%+)",
  "Tốt (80–94%)",
  "Còn tốt (60–79%)",
];

const DELIVERY_OPTIONS = ["Gặp mặt trực tiếp", "Ship toàn quốc (có phí ship)", "Cả hai đều được"];
const MAX_IMAGES = 5;

const inputCls =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]";

interface FormState {
  seller_name: string;
  title: string;
  category: string;
  condition: string;
  price: string;
  original_price: string;
  quantity_available: string;
  province: string;
  delivery_method: string;
  description: string;
  phone_hidden: string;
  zalo: string;
}

function emptyForm(defaultSellerName: string, defaultPhone: string): FormState {
  return {
    seller_name: defaultSellerName,
    title: "",
    category: CATEGORY_OPTIONS[0],
    condition: CONDITION_OPTIONS[0],
    price: "",
    original_price: "",
    quantity_available: "1",
    province: "",
    delivery_method: DELIVERY_OPTIONS[0],
    description: "",
    phone_hidden: defaultPhone,
    zalo: "",
  };
}

// Upload TRƯỚC khi tạo tin (chưa có listing.id) — theo đúng "Google Form"
// đơn giản của UC-10 MVP mới: chọn ảnh, gửi kèm 1 lần cùng toàn bộ form,
// không cần bước "thêm ảnh sau khi tạo" như trước. Cũng là điều kiện bắt
// buộc để khách vãng lai (chưa đăng nhập) đính kèm được ảnh, vì /api/uploads
// chỉ cho gắn media vào 1 dòng đã tồn tại khi đã đăng nhập.
function ImageUploader({ images, onChange }: { images: string[]; onChange: (images: string[]) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gỡ khỏi form ngay (không chờ mạng), rồi dọn Cloudinary/media_assets ở
  // nền — ảnh này chưa gắn vào tin nào nên xoá thất bại không ảnh hưởng gì
  // tới việc điền form, chỉ để lại rác (chưa có job dọn định kỳ, xem
  // database.md phần media_assets).
  function handleRemove(url: string) {
    onChange(images.filter((u) => u !== url));

    fetch("/api/uploads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secure_url: url }),
    }).catch(() => {});
  }

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (images.length >= MAX_IMAGES) {
      setError(`Tối đa ${MAX_IMAGES} ảnh mỗi tin.`);
      if (fileInputRef.current) fileInputRef.current.value = "";

      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("asset_type", "listing_image");

      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload ảnh thất bại.");

        return;
      }

      onChange([...images, data.asset.secure_url as string]);
    } catch {
      setError("Có lỗi xảy ra khi upload ảnh.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="col-span-2 flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Ảnh sản phẩm</span>
      {images.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1.5">
          {images.map((url) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-16 w-16 rounded-lg border border-black/10 object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0F172A] text-[10px] text-white"
                aria-label="Xoá ảnh"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        disabled={uploading}
        className="text-xs text-[#64748B]"
      />
      <p className="text-[11px] text-[#94A3B8]">
        {uploading ? "Đang upload..." : `JPG/PNG, tối đa 5MB/ảnh · ${images.length}/${MAX_IMAGES} ảnh`}
      </p>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

// UC-10 - Gửi Form Pass Đồ C2C. MVP mới không bắt buộc đăng nhập (Khách, Mẹ
// bỉm đều gửi được) — SữaEmbe/Admin là trung gian chuẩn hoá và duyệt tin
// (UC-11), người gửi form không tự quản lý/sửa/xoá tin sau khi gửi.
export function SellListingForm({
  defaultSellerName = "",
  defaultPhone = "",
  onCreated,
  onClose,
}: {
  defaultSellerName?: string;
  defaultPhone?: string;
  onCreated: (listing: Listing) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultSellerName, defaultPhone));
  const [images, setImages] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_name: form.seller_name,
          title: form.title,
          category: form.category,
          condition: form.condition,
          price: Number(form.price),
          original_price: form.original_price.trim() ? Number(form.original_price) : null,
          quantity_available: form.quantity_available.trim() ? Number(form.quantity_available) : 1,
          province: form.province || null,
          delivery_method: form.delivery_method,
          description: form.description || null,
          phone_hidden: form.phone_hidden || null,
          zalo: form.zalo || null,
          images,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Gửi tin thất bại.");

        return;
      }

      onCreated(data.listing as Listing);
      setSubmitted(true);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-7 rounded-2xl border-[1.5px] border-[#E8547A]/25 bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between border-b border-black/10 pb-3.5">
        <div className="text-[15px] font-extrabold text-[#0F172A]">📋 Gửi form pass đồ mẹ bé</div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F1F5F9] text-sm text-[#64748B]"
        >
          ✕
        </button>
      </div>

      {submitted ? (
        <div>
          <p className="mb-3 rounded-lg bg-[#16A34A]/10 px-3.5 py-2.5 text-sm font-semibold text-[#16A34A]">
            🚀 Đã gửi thông tin cho SữaEmbe! Admin sẽ kiểm tra và đăng tin trong 1–2 giờ.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-bold text-white"
          >
            Xong
          </button>
        </div>
      ) : (
        <form className="grid grid-cols-2 gap-3" onSubmit={handleSubmit}>
          <p className="col-span-2 -mt-1 mb-1 text-xs text-[#64748B]">
            Không cần tài khoản — điền thông tin bên dưới, SữaEmbe sẽ kiểm tra và đăng tin giúp bạn.
          </p>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tên của bạn *</span>
            <input
              required
              placeholder="VD: Mẹ Linh"
              value={form.seller_name}
              onChange={(e) => setForm({ ...form, seller_name: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-[#94A3B8]">SĐT liên hệ *</span>
            <input
              required
              type="tel"
              placeholder="0909 123 456"
              value={form.phone_hidden}
              onChange={(e) => setForm({ ...form, phone_hidden: e.target.value })}
              className={inputCls}
            />
          </label>

          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tên sản phẩm *</span>
            <input
              required
              placeholder="VD: Aptamil 2 · 800g · Còn 85% · Hộp mới mở 1 tuần"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Danh mục</span>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputCls}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tình trạng</span>
            <select
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
              className={inputCls}
            >
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Giá bán/pass (VNĐ) *</span>
            <input
              required
              type="number"
              min={0}
              placeholder="420000"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Giá gốc (VNĐ) — để so sánh</span>
            <input
              type="number"
              min={0}
              placeholder="680000"
              value={form.original_price}
              onChange={(e) => setForm({ ...form, original_price: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Số lượng có thể bán/pass</span>
            <input
              type="number"
              min={1}
              value={form.quantity_available}
              onChange={(e) => setForm({ ...form, quantity_available: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tỉnh / Thành phố</span>
            <input
              placeholder="VD: TP. Hồ Chí Minh"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Hình thức giao dịch</span>
            <select
              value={form.delivery_method}
              onChange={(e) => setForm({ ...form, delivery_method: e.target.value })}
              className={inputCls}
            >
              {DELIVERY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Zalo liên hệ (không bắt buộc)</span>
            <input
              placeholder="0909 123 456 hoặc link Zalo"
              value={form.zalo}
              onChange={(e) => setForm({ ...form, zalo: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Mô tả chi tiết</span>
            <textarea
              rows={3}
              placeholder="Mô tả tình trạng, lý do bán, thông tin thêm về sản phẩm..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputCls}
            />
          </label>

          <ImageUploader images={images} onChange={setImages} />

          {error && <p className="col-span-2 text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="col-span-2 mt-1 rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Đang gửi..." : "🚀 Gửi thông tin (Miễn phí)"}
          </button>
          <p className="col-span-2 text-center text-[11px] text-[#94A3B8]">
            Miễn phí · SữaEmbe kiểm tra và đăng tin trong 1–2 giờ
          </p>
        </form>
      )}
    </div>
  );
}
