"use client";

import { useEffect, useState, type ReactNode } from "react";

import { formatVnd } from "@/lib/format";

export interface ListingDetailData {
  id: string;
  title: string;
  category: string | null;
  condition: string | null;
  price: number;
  original_price: number | null;
  province: string | null;
  delivery_method: string | null;
  description: string | null;
  images: string[];
  zalo: string | null;
  phone_hidden: string | null;
  quantity_available: number;
  status: "pending" | "approved" | "sold" | "hidden";
  created_at: string;
  sellerName: string | null;
  sellerVerified: boolean;
}

// Khớp đúng CATEGORY_OPTIONS/CONDITION_OPTIONS/DELIVERY_OPTIONS trong
// SellListingForm.tsx (UC-10) — trùng lặp có chủ đích thay vì import chéo,
// giống cách ProductsTab/CategoriesTab admin cũng tự khai báo field riêng.
const CATEGORY_OPTIONS = [
  "Sữa dư / Sữa mẹ",
  "Quần áo trẻ em",
  "Xe đẩy / Địu / Ghế ô tô",
  "Đồ chơi & Phụ kiện",
  "Bình sữa / Núm ti / Máy hút sữa",
  "Đồ dùng phòng bé",
];
const CONDITION_OPTIONS = ["Mới 100% (chưa dùng)", "Như mới (95%+)", "Tốt (80–94%)", "Còn tốt (60–79%)"];
const DELIVERY_OPTIONS = ["Gặp mặt trực tiếp", "Ship toàn quốc (có phí ship)", "Cả hai đều được"];

const STATUS_LABEL: Record<ListingDetailData["status"], { label: string; cls: string }> = {
  pending: { label: "Chờ duyệt", cls: "bg-[#F59E0B]/10 text-[#B45309]" },
  approved: { label: "Đã duyệt", cls: "bg-[#16A34A]/10 text-[#16A34A]" },
  sold: { label: "Đã bán", cls: "bg-[#0D9488]/10 text-[#0D9488]" },
  hidden: { label: "Đã ẩn", cls: "bg-red-600/10 text-red-600" },
};

const inputCls =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]";

interface BuyFormState {
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string;
  shipping_address: string;
  quantity: string;
  payment_method: "momo" | "vnpay" | "cod";
}

const PAYMENT_METHODS: { id: BuyFormState["payment_method"]; label: string; icon: string }[] = [
  { id: "momo", label: "Ví MoMo", icon: "💗" },
  { id: "vnpay", label: "VNPay", icon: "🔵" },
  { id: "cod", label: "Thanh toán khi nhận hàng", icon: "💵" },
];

// Bước "cổng thanh toán" MoMo/VNPay ở đây là MOCK (giả lập luôn thành công)
// — sẽ thay bằng sandbox test thật sau khi chốt tích hợp. Chọn COD thì bỏ
// qua bước giả lập này, đúng tinh thần "thanh toán thường" (không giữ tiền
// qua Escrow) đã ghi trong USECASE.md.
function MockGateway({
  method,
  orderId,
  totalAmount,
  onPaid,
}: {
  method: "momo" | "vnpay";
  orderId: string;
  totalAmount: number;
  onPaid: () => void;
}) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const brand = method === "momo" ? { name: "MoMo", cls: "text-[#D82D8B]" } : { name: "VNPay", cls: "text-[#004A9F]" };

  async function handleConfirm() {
    setPaying(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/mock-pay`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Xác nhận thanh toán thất bại.");

        return;
      }

      onPaid();
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-black/10 bg-white p-4 text-center">
      <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
        Cổng thanh toán (giả lập demo)
      </div>
      <div className={`mb-3 text-lg font-black ${brand.cls}`}>{brand.name}</div>
      <p className="mb-3 text-sm text-[#64748B]">
        Số tiền cần thanh toán:{" "}
        <span className="font-mono font-bold text-[#0F172A]">{formatVnd(totalAmount)}</span>
      </p>
      <p className="mb-4 text-[11.5px] text-[#94A3B8]">
        Đây là bước thanh toán demo — chưa kết nối cổng {brand.name} thật. Bấm nút bên dưới để giả lập
        thanh toán thành công.
      </p>
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <button
        type="button"
        disabled={paying}
        onClick={handleConfirm}
        className="w-full rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {paying ? "Đang xác nhận..." : `✅ Xác nhận đã thanh toán qua ${brand.name} (demo)`}
      </button>
    </div>
  );
}

function BuyForm({
  listing,
  defaultBuyerName,
  defaultBuyerPhone,
}: {
  listing: ListingDetailData;
  defaultBuyerName: string;
  defaultBuyerPhone: string;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BuyFormState>({
    buyer_name: defaultBuyerName,
    buyer_phone: defaultBuyerPhone,
    buyer_email: "",
    shipping_address: "",
    quantity: "1",
    payment_method: "momo",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<{ id: string; total_amount: number } | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/listings/${listing.id}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_name: form.buyer_name,
          buyer_phone: form.buyer_phone,
          buyer_email: form.buyer_email || null,
          shipping_address: form.shipping_address || null,
          quantity: form.quantity.trim() ? Number(form.quantity) : 1,
          payment_method: form.payment_method,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Đặt mua thất bại.");

        return;
      }

      if (form.payment_method === "cod") {
        setDone(true);
      } else {
        setCreatedOrder({ id: data.order.id, total_amount: data.order.total_amount });
      }
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  if (listing.status !== "approved" || listing.quantity_available <= 0) return null;

  if (done) {
    return (
      <div className="mt-4 rounded-xl border border-[#16A34A]/25 bg-[#16A34A]/10 p-3.5 text-sm font-semibold text-[#16A34A]">
        🚀 Đã gửi yêu cầu đặt mua! SữaEmbe sẽ liên hệ xác nhận và hướng dẫn giao hàng.
      </div>
    );
  }

  if (createdOrder && form.payment_method !== "cod") {
    return (
      <MockGateway
        method={form.payment_method}
        orderId={createdOrder.id}
        totalAmount={createdOrder.total_amount}
        onPaid={() => setDone(true)}
      />
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 w-full rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] py-3 text-sm font-bold text-white"
      >
        🛒 Đặt mua
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-[#E8547A]/25 bg-[#FFF0F5] p-4">
      <div className="mb-3 text-[13px] font-bold text-[#0F172A]">Thông tin đặt mua</div>
      <div className="grid grid-cols-2 gap-2.5">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tên người nhận *</span>
          <input
            required
            value={form.buyer_name}
            onChange={(e) => setForm({ ...form, buyer_name: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-[#94A3B8]">SĐT *</span>
          <input
            required
            type="tel"
            value={form.buyer_phone}
            onChange={(e) => setForm({ ...form, buyer_phone: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="col-span-2 flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Địa chỉ nhận hàng</span>
          <input
            value={form.shipping_address}
            onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-[#94A3B8]">
            Số lượng (còn {listing.quantity_available})
          </span>
          <input
            type="number"
            min={1}
            max={listing.quantity_available}
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Email (không bắt buộc)</span>
          <input
            type="email"
            value={form.buyer_email}
            onChange={(e) => setForm({ ...form, buyer_email: e.target.value })}
            className={inputCls}
          />
        </label>
      </div>

      <div className="mt-3">
        <span className="mb-1.5 block text-[10px] font-bold uppercase text-[#94A3B8]">Phương thức thanh toán</span>
        <div className="grid grid-cols-3 gap-1.5">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setForm({ ...form, payment_method: m.id })}
              className={`rounded-lg border px-2 py-2 text-[11.5px] font-semibold transition ${
                form.payment_method === m.id
                  ? "border-[#E8547A] bg-[#E8547A]/10 text-[#E8547A]"
                  : "border-black/10 bg-white text-[#64748B] hover:border-[#E8547A]"
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[12.5px] text-[#64748B]">
        Tổng tạm tính:{" "}
        <span className="font-mono font-bold text-[#E8547A]">
          {formatVnd(listing.price * (Number(form.quantity) || 0))}
        </span>{" "}
        · Thanh toán thường (không qua Escrow), SữaEmbe liên hệ xác nhận trước khi giao.
      </p>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Đang gửi..." : "Xác nhận đặt mua"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-black/10 px-4 py-2 text-sm font-bold text-[#64748B]"
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}

interface EditFormState {
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

function toEditForm(listing: ListingDetailData): EditFormState {
  return {
    title: listing.title,
    category: listing.category ?? CATEGORY_OPTIONS[0],
    condition: listing.condition ?? CONDITION_OPTIONS[0],
    price: String(listing.price),
    original_price: listing.original_price != null ? String(listing.original_price) : "",
    quantity_available: String(listing.quantity_available),
    province: listing.province ?? "",
    delivery_method: listing.delivery_method ?? DELIVERY_OPTIONS[0],
    description: listing.description ?? "",
    phone_hidden: listing.phone_hidden ?? "",
    zalo: listing.zalo ?? "",
  };
}

// UC-28 - Quản Lý Tin Đăng Của Tôi. Chủ tin (mẹ bỉm đã đăng nhập) tự sửa nội
// dung tin của chính mình — dùng lại PUT /api/listings/:id sẵn có (đã giới
// hạn seller_id = auth.uid() ở tầng route/RLS). Không cho tự đổi `status`
// (vẫn phải qua Admin duyệt lại theo UC-11), nên form này không có field đó.
function EditListingForm({
  listing,
  onSaved,
  onCancel,
}: {
  listing: ListingDetailData;
  onSaved: (updated: ListingDetailData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<EditFormState>(() => toEditForm(listing));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          condition: form.condition,
          price: Number(form.price),
          original_price: form.original_price.trim() ? Number(form.original_price) : null,
          quantity_available: form.quantity_available.trim() ? Number(form.quantity_available) : 0,
          province: form.province || null,
          delivery_method: form.delivery_method,
          description: form.description || null,
          phone_hidden: form.phone_hidden || null,
          zalo: form.zalo || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Lưu thất bại.");

        return;
      }

      onSaved({ ...listing, ...data.listing });
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-[#E8547A]/25 bg-[#FFF0F5] p-4">
      <div className="mb-3 text-[13px] font-bold text-[#0F172A]">Sửa tin đăng</div>
      <div className="grid grid-cols-2 gap-2.5">
        <label className="col-span-2 flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tiêu đề</span>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
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
          <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Giá bán (VNĐ)</span>
          <input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Giá gốc (VNĐ)</span>
          <input
            type="number"
            min={0}
            value={form.original_price}
            onChange={(e) => setForm({ ...form, original_price: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Số lượng còn</span>
          <input
            type="number"
            min={0}
            value={form.quantity_available}
            onChange={(e) => setForm({ ...form, quantity_available: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tỉnh/thành</span>
          <input
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
          <span className="text-[10px] font-bold uppercase text-[#94A3B8]">SĐT liên hệ</span>
          <input
            type="tel"
            value={form.phone_hidden}
            onChange={(e) => setForm({ ...form, phone_hidden: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Zalo liên hệ</span>
          <input value={form.zalo} onChange={(e) => setForm({ ...form, zalo: e.target.value })} className={inputCls} />
        </label>
        <label className="col-span-2 flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Mô tả</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputCls}
          />
        </label>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-black/10 px-4 py-2 text-sm font-bold text-[#64748B]"
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}

// Dùng chung cho cả 2 nơi: popup xem tin ở Chợ Mẹ & Bé (Khách, Mẹ bỉm) và
// popup xem chi tiết trong bảng duyệt tin của admin (UC-11) — admin cần thấy
// đủ ảnh, mô tả, thông tin liên hệ trước khi duyệt/ẩn, không chỉ tiêu đề và
// giá như bảng tóm tắt. `footer` để mỗi nơi tự gắn hành động riêng (admin:
// nút Duyệt/Ẩn; `allowPurchase` bật form "Đặt mua" — UC-12 — chỉ ở trang
// công khai, không hiện trong popup xem trước của admin.
// UC-28 - chủ tin tự đánh dấu đã bán / gỡ tin / xoá tin. Chỉ hiện khi
// `canEdit` (đang ở chế độ "Tin của tôi") và không phải lúc đang sửa nội
// dung, tránh rối giao diện.
function ListingSelfActions({
  listing,
  onStatusChanged,
  onDeleted,
}: {
  listing: ListingDetailData;
  onStatusChanged: (updated: ListingDetailData) => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState<"sold" | "hidden" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function changeStatus(status: "sold" | "hidden") {
    setBusy(status);
    setError(null);

    try {
      const res = await fetch(`/api/listings/${listing.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Cập nhật trạng thái thất bại.");

        return;
      }

      onStatusChanged({ ...listing, status: data.listing.status });
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Xoá hẳn tin đăng này? Không thể hoàn tác.")) return;

    setBusy("delete");
    setError(null);

    try {
      const res = await fetch(`/api/listings/${listing.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Xoá tin thất bại.");

        return;
      }

      onDeleted();
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 border-t border-black/10 pt-3.5">
      <div className="flex flex-wrap gap-2">
        {listing.status === "approved" && (
          <>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => changeStatus("sold")}
              className="rounded-lg bg-[#0D9488]/10 px-3 py-2 text-[12.5px] font-bold text-[#0D9488] disabled:opacity-60"
            >
              {busy === "sold" ? "Đang lưu..." : "✅ Đánh dấu đã bán"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => changeStatus("hidden")}
              className="rounded-lg bg-black/5 px-3 py-2 text-[12.5px] font-bold text-[#64748B] disabled:opacity-60"
            >
              {busy === "hidden" ? "Đang lưu..." : "🙈 Gỡ tin"}
            </button>
          </>
        )}
        <button
          type="button"
          disabled={busy !== null}
          onClick={handleDelete}
          className="rounded-lg bg-red-600/10 px-3 py-2 text-[12.5px] font-bold text-red-600 disabled:opacity-60"
        >
          {busy === "delete" ? "Đang xoá..." : "🗑 Xoá tin"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function ListingDetailModal({
  listing,
  onClose,
  footer,
  allowPurchase = false,
  defaultBuyerName = "",
  defaultBuyerPhone = "",
  canEdit = false,
  onSaved,
  onDeleted,
}: {
  listing: ListingDetailData;
  onClose: () => void;
  footer?: ReactNode;
  allowPurchase?: boolean;
  defaultBuyerName?: string;
  defaultBuyerPhone?: string;
  /** UC-28 - cho chủ tin (đã đăng nhập) tự sửa tin của mình ngay trong popup. */
  canEdit?: boolean;
  onSaved?: (updated: ListingDetailData) => void;
  /** UC-28 - báo cho nơi gọi biết tin vừa bị xoá để gỡ khỏi danh sách + đóng popup. */
  onDeleted?: () => void;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [editing, setEditing] = useState(false);
  const images = listing.images ?? [];

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-3.5">
          <span className="text-sm font-bold text-[#0F172A]">Chi tiết tin đăng</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-lg text-[#94A3B8] hover:bg-black/5 hover:text-[#0F172A]"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          <div className="mb-4 flex h-64 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#FFF0F5] to-[#F1F5F9] text-6xl">
            {images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[activeImage]} alt={listing.title} className="h-full w-full object-cover" />
            ) : (
              "🛍"
            )}
          </div>

          {images.length > 1 && (
            <div className="mb-4 flex gap-2 overflow-x-auto">
              {images.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${
                    i === activeImage ? "border-[#E8547A]" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${STATUS_LABEL[listing.status].cls}`}>
              {STATUS_LABEL[listing.status].label}
            </span>
            {listing.category && (
              <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-bold text-[#64748B]">
                {listing.category}
              </span>
            )}
            {listing.status === "approved" && (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  listing.quantity_available > 0
                    ? "bg-[#0D9488]/10 text-[#0D9488]"
                    : "bg-black/5 text-[#64748B]"
                }`}
              >
                {listing.quantity_available > 0 ? `Còn ${listing.quantity_available}` : "Hết hàng"}
              </span>
            )}
          </div>

          <div className="mb-2 flex items-start justify-between gap-2">
            <h2 className="text-xl font-extrabold text-[#0F172A]">{listing.title}</h2>
            {canEdit && !editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="shrink-0 rounded-lg border border-black/10 px-2.5 py-1.5 text-[11px] font-bold text-[#64748B] hover:border-[#E8547A] hover:text-[#E8547A]"
              >
                ✏️ Sửa tin
              </button>
            )}
          </div>

          <div className="mb-3 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-extrabold text-[#E8547A]">{formatVnd(listing.price)}</span>
            {listing.original_price != null && listing.original_price > listing.price && (
              <span className="font-mono text-sm text-[#94A3B8] line-through">
                {formatVnd(listing.original_price)}
              </span>
            )}
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2 text-[12.5px] text-[#64748B]">
            {listing.condition && (
              <div>
                <span className="font-semibold text-[#0F172A]">Tình trạng: </span>
                {listing.condition}
              </div>
            )}
            {listing.province && (
              <div>
                <span className="font-semibold text-[#0F172A]">Khu vực: </span>📍 {listing.province}
              </div>
            )}
            {listing.delivery_method && (
              <div className="col-span-2">
                <span className="font-semibold text-[#0F172A]">Giao hàng: </span>
                {listing.delivery_method}
              </div>
            )}
          </div>

          {listing.description && (
            <div className="mb-4">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">Mô tả</div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-[#334155]">{listing.description}</p>
            </div>
          )}

          <div className="rounded-xl border border-black/10 bg-[#F8FAFC] p-3.5">
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
              Người bán & liên hệ
            </div>
            <div className="text-sm font-semibold text-[#0F172A]">
              {listing.sellerVerified ? (
                <span className="text-[#0D9488]">✓ {listing.sellerName ?? "Người bán"} · Đã xác minh</span>
              ) : (
                listing.sellerName ?? "Người bán ẩn danh"
              )}
            </div>
            {listing.zalo && (
              <div className="mt-1 text-[12.5px] text-[#64748B]">
                <span className="font-semibold text-[#0F172A]">Zalo: </span>
                {listing.zalo}
              </div>
            )}
            {listing.phone_hidden && (
              <div className="mt-1 text-[12.5px] text-[#64748B]">
                <span className="font-semibold text-[#0F172A]">SĐT: </span>
                {listing.phone_hidden}
              </div>
            )}
            {!listing.zalo && !listing.phone_hidden && (
              <div className="mt-1 text-[12.5px] text-[#94A3B8]">Người bán chưa để lại thông tin liên hệ.</div>
            )}
          </div>

          {canEdit && editing && (
            <EditListingForm
              listing={listing}
              onCancel={() => setEditing(false)}
              onSaved={(updated) => {
                setEditing(false);
                onSaved?.(updated);
              }}
            />
          )}

          {canEdit && !editing && (
            <ListingSelfActions
              listing={listing}
              onStatusChanged={(updated) => onSaved?.(updated)}
              onDeleted={() => onDeleted?.()}
            />
          )}

          {allowPurchase && (
            <BuyForm listing={listing} defaultBuyerName={defaultBuyerName} defaultBuyerPhone={defaultBuyerPhone} />
          )}
        </div>

        {footer && <div className="flex justify-end gap-2 border-t border-black/10 px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}
