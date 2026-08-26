"use client";

import { useEffect, useState } from "react";

import { PaginationControls } from "@/components/admin/PaginationControls";
import type { AdminC2cOrder } from "@/lib/admin/types";
import { formatVnd } from "@/lib/format";
import type { PaginationMeta } from "@/lib/pagination";

const PAGE_SIZE = 8;

type StatusFilter = "all" | AdminC2cOrder["order_status"];

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "pending_admin_review", label: "Chờ xử lý" },
  { id: "confirmed", label: "Đã xác nhận" },
  { id: "processing", label: "Đang xử lý" },
  { id: "completed", label: "Hoàn tất" },
  { id: "partially_available", label: "Còn 1 phần" },
  { id: "cancelled", label: "Đã huỷ" },
  { id: "all", label: "Tất cả" },
];

const ORDER_STATUS_LABEL: Record<AdminC2cOrder["order_status"], string> = {
  pending_admin_review: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  processing: "Đang xử lý",
  completed: "Hoàn tất",
  cancelled: "Đã huỷ",
  partially_available: "Còn 1 phần",
};

const ORDER_STATUS_BADGE: Record<AdminC2cOrder["order_status"], string> = {
  pending_admin_review: "bg-[#F59E0B]/10 text-[#B45309]",
  confirmed: "bg-[#0D9488]/10 text-[#0D9488]",
  processing: "bg-[#7C3AED]/10 text-[#7C3AED]",
  completed: "bg-[#16A34A]/10 text-[#16A34A]",
  cancelled: "bg-red-600/10 text-red-600",
  partially_available: "bg-black/5 text-[#64748B]",
};

const PAYMENT_STATUS_LABEL: Record<AdminC2cOrder["payment_status"], string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  refunded: "Đã hoàn tiền",
};

// UC-12 - Đặt Mua C2C Thanh Toán Thường, bước 8-12: Admin thấy đơn mới,
// xác nhận còn đủ số lượng thì xử lý (chuyển 'confirmed' sẽ tự trừ
// quantity_available của tin — xem PUT /api/admin/c2c-orders/:id), hết hàng
// thì huỷ đơn, còn 1 phần thì liên hệ người mua rồi cập nhật lại. Thay hẳn
// màn "Đơn hàng & Escrow" cũ vì escrow không còn thuộc MVP hiện tại.
export function OrdersSection() {
  const [orders, setOrders] = useState<AdminC2cOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending_admin_review");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, page_size: PAGE_SIZE, total: 0, has_more: false });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(PAGE_SIZE));
      if (statusFilter !== "all") params.set("status", statusFilter);

      try {
        const res = await fetch(`/api/admin/c2c-orders?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Không tải được danh sách đơn hàng.");

          return;
        }

        setOrders(data.items ?? data.orders ?? []);
        setPagination(data.pagination ?? { page, page_size: PAGE_SIZE, total: data.orders?.length ?? 0, has_more: false });
      } catch (err) {
        if ((err as Error).name !== "AbortError") setError("Có lỗi xảy ra, vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    }

    run();

    return () => controller.abort();
  }, [statusFilter, page]);

  async function patchOrder(id: string, fields: Record<string, string>) {
    setSavingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/c2c-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Cập nhật thất bại.");

        return;
      }

      const updated = data.order as AdminC2cOrder;

      setOrders((prev) =>
        statusFilter !== "all" && fields.order_status && updated.order_status !== statusFilter
          ? prev.filter((o) => o.id !== id)
          : prev.map((o) => (o.id === id ? updated : o)),
      );
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-lg font-extrabold text-[#0F172A]">💳 Đơn hàng C2C</div>
        <span className="text-xs text-[#94A3B8]">{orders.length} đơn</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`rounded-full px-3 py-1.5 text-[11.5px] font-bold transition ${
              statusFilter === tab.id ? "bg-[#E8547A] text-white" : "bg-black/5 text-[#64748B] hover:bg-black/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {!loading && orders.length === 0 && !error ? (
        <p className="rounded-xl border border-black/10 bg-white p-6 text-center text-sm text-[#94A3B8]">
          Không có đơn nào khớp bộ lọc.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-black/10 bg-white p-4">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-[#0F172A]">{o.c2c_listings?.title ?? "(tin đã xoá)"}</div>
                  <div className="mt-0.5 text-[11.5px] text-[#64748B]">
                    Người mua: {o.buyer_name} · {o.buyer_phone}
                    {o.buyer_email && ` · ${o.buyer_email}`}
                  </div>
                  {o.shipping_address && (
                    <div className="text-[11.5px] text-[#64748B]">Địa chỉ: {o.shipping_address}</div>
                  )}
                  {o.c2c_listings && (
                    <div className="mt-1 text-[11.5px] text-[#0D9488]">
                      Người bán: {o.c2c_listings.users?.full_name ?? o.c2c_listings.seller_name ?? "—"}
                      {o.c2c_listings.users?.is_verified && " ✓"}
                      {o.c2c_listings.phone_hidden && ` · ĐT ${o.c2c_listings.phone_hidden}`}
                      {o.c2c_listings.zalo && ` · Zalo ${o.c2c_listings.zalo}`}
                      {!o.c2c_listings.users?.email &&
                        !o.c2c_listings.phone_hidden &&
                        !o.c2c_listings.zalo &&
                        " · chưa để lại liên hệ"}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-mono text-base font-extrabold text-[#E8547A]">
                    {formatVnd(o.total_amount)}
                  </div>
                  <div className="text-[11px] text-[#94A3B8]">
                    {o.quantity} × {formatVnd(o.unit_price)}
                  </div>
                </div>
              </div>

              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${ORDER_STATUS_BADGE[o.order_status]}`}>
                  {ORDER_STATUS_LABEL[o.order_status]}
                </span>
                <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-bold text-[#64748B]">
                  {PAYMENT_STATUS_LABEL[o.payment_status]}
                </span>
                {o.c2c_listings && (
                  <span className="rounded bg-[#0D9488]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#0D9488]">
                    Tin còn {o.c2c_listings.quantity_available}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={o.order_status}
                  disabled={savingId === o.id}
                  onChange={(e) => patchOrder(o.id, { order_status: e.target.value })}
                  className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-[11.5px] outline-none focus:border-[#E8547A]"
                >
                  {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  value={o.payment_status}
                  disabled={savingId === o.id}
                  onChange={(e) => patchOrder(o.id, { payment_status: e.target.value })}
                  className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-[11.5px] outline-none focus:border-[#E8547A]"
                >
                  {Object.entries(PAYMENT_STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  value={noteDrafts[o.id] ?? o.admin_note ?? ""}
                  onChange={(e) => setNoteDrafts({ ...noteDrafts, [o.id]: e.target.value })}
                  placeholder="Ghi chú nội bộ..."
                  className="min-w-[160px] flex-1 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-[11.5px] outline-none focus:border-[#E8547A]"
                />
                <button
                  type="button"
                  disabled={savingId === o.id}
                  onClick={() => patchOrder(o.id, { admin_note: noteDrafts[o.id] ?? o.admin_note ?? "" })}
                  className="rounded-lg bg-[#0F172A] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                >
                  {savingId === o.id ? "..." : "Lưu ghi chú"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <PaginationControls pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
