"use client";

import { useState } from "react";

import type { C2cOrder } from "@/lib/catalog/types";
import { formatVnd } from "@/lib/format";

const ORDER_STATUS_LABEL: Record<C2cOrder["order_status"], { label: string; cls: string }> = {
  pending_admin_review: { label: "Chờ xử lý", cls: "bg-[#F59E0B]/10 text-[#B45309]" },
  confirmed: { label: "Đã xác nhận", cls: "bg-[#0D9488]/10 text-[#0D9488]" },
  processing: { label: "Đang xử lý", cls: "bg-[#7C3AED]/10 text-[#7C3AED]" },
  completed: { label: "Hoàn tất", cls: "bg-[#16A34A]/10 text-[#16A34A]" },
  cancelled: { label: "Đã huỷ", cls: "bg-red-600/10 text-red-600" },
  partially_available: { label: "Còn 1 phần", cls: "bg-black/5 text-[#64748B]" },
};

const PAYMENT_STATUS_LABEL: Record<C2cOrder["payment_status"], string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  refunded: "Đã hoàn tiền",
};

function OrderCard({ order, onChange }: { order: C2cOrder; onChange: (order: C2cOrder) => void }) {
  const [busy, setBusy] = useState<"pay" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleMockPay() {
    setBusy("pay");
    setError(null);

    try {
      const res = await fetch(`/api/orders/${order.id}/mock-pay`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Xác nhận thanh toán thất bại.");

        return;
      }

      onChange({ ...order, ...data.order });
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setBusy(null);
    }
  }

  async function handleCancel() {
    setBusy("cancel");
    setError(null);

    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, { method: "PUT" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Huỷ đơn thất bại.");

        return;
      }

      onChange({ ...order, ...data.order });
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setBusy(null);
    }
  }

  const canMockPay =
    order.payment_status === "pending" &&
    (order.payment_method === "momo" || order.payment_method === "vnpay") &&
    order.order_status !== "cancelled";
  const canCancel = order.order_status === "pending_admin_review";

  return (
    <div className="rounded-xl border border-black/10 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-[#0F172A]">{order.c2c_listings?.title ?? "(tin đã xoá)"}</div>
          <div className="mt-0.5 text-[11.5px] text-[#64748B]">
            {order.quantity} sản phẩm ·{" "}
            {new Date(order.created_at).toLocaleDateString("vi-VN")}
          </div>
        </div>
        <div className="text-right font-mono text-base font-extrabold text-[#E8547A]">
          {formatVnd(order.total_amount)}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${ORDER_STATUS_LABEL[order.order_status].cls}`}>
          {ORDER_STATUS_LABEL[order.order_status].label}
        </span>
        <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-bold text-[#64748B]">
          {PAYMENT_STATUS_LABEL[order.payment_status]}
          {order.payment_method && ` · ${order.payment_method.toUpperCase()}`}
        </span>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {(canMockPay || canCancel) && (
        <div className="mt-3 flex gap-2">
          {canMockPay && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={handleMockPay}
              className="rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-3.5 py-1.5 text-[12px] font-bold text-white disabled:opacity-60"
            >
              {busy === "pay" ? "Đang xác nhận..." : "💳 Thanh toán ngay (demo)"}
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={handleCancel}
              className="rounded-lg border border-black/10 px-3.5 py-1.5 text-[12px] font-bold text-[#64748B] disabled:opacity-60"
            >
              {busy === "cancel" ? "Đang huỷ..." : "Huỷ đơn"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// UC-29 - Quản Lý Đơn Hàng Của Tôi (Mẹ bỉm). Tự tra cứu và quản lý đơn đã
// đặt qua UC-12 — trước đây người mua có tài khoản cũng không có nơi nào
// xem lại đơn của mình dù RLS đã cho phép đọc.
export function MyOrdersSection({ initialOrders }: { initialOrders: C2cOrder[] }) {
  const [orders, setOrders] = useState<C2cOrder[]>(initialOrders);

  function handleChange(updated: C2cOrder) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
      <h2 className="text-lg font-bold text-[#0F172A]">Đơn hàng của tôi</h2>
      <p className="mt-1 text-xs text-[#94A3B8]">
        Các đơn đặt mua trên Chợ Mẹ & Bé (UC-12) — tự tra cứu trạng thái, thanh toán demo hoặc huỷ đơn
        khi còn chờ xử lý.
      </p>

      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-[#64748B]">Bạn chưa đặt mua đơn nào.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} onChange={handleChange} />
          ))}
        </div>
      )}
    </div>
  );
}
