"use client";

import { useEffect, useState } from "react";

import { PaginationControls } from "@/components/admin/PaginationControls";
import { ListingDetailModal, type ListingDetailData } from "@/components/cho-me-be/ListingDetailModal";
import type { AdminPendingListing } from "@/lib/admin/types";
import { formatVnd } from "@/lib/format";
import type { PaginationMeta } from "@/lib/pagination";

const PAGE_SIZE = 8;

function toListingDetail(l: AdminPendingListing): ListingDetailData {
  return {
    ...l,
    sellerName: l.users?.full_name ?? l.users?.email ?? l.seller_name,
    sellerVerified: l.users?.is_verified ?? false,
  };
}

type StatusFilter = "all" | "pending" | "approved" | "sold" | "hidden";

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "pending", label: "Chờ duyệt" },
  { id: "approved", label: "Đã duyệt" },
  { id: "sold", label: "Đã bán" },
  { id: "hidden", label: "Đã ẩn" },
  { id: "all", label: "Tất cả" },
];

const STATUS_BADGE: Record<AdminPendingListing["status"], { label: string; cls: string }> = {
  pending: { label: "Chờ duyệt", cls: "bg-[#F59E0B]/10 text-[#B45309]" },
  approved: { label: "Đã duyệt", cls: "bg-[#16A34A]/10 text-[#16A34A]" },
  sold: { label: "Đã bán", cls: "bg-[#0D9488]/10 text-[#0D9488]" },
  hidden: { label: "Đã ẩn", cls: "bg-red-600/10 text-red-600" },
};

interface EditForm {
  title: string;
  category: string;
  condition: string;
  price: string;
  original_price: string;
  quantity_available: string;
  province: string;
  description: string;
  seller_name: string;
}

function toEditForm(l: AdminPendingListing): EditForm {
  return {
    title: l.title,
    category: l.category ?? "",
    condition: l.condition ?? "",
    price: String(l.price),
    original_price: l.original_price != null ? String(l.original_price) : "",
    quantity_available: String(l.quantity_available),
    province: l.province ?? "",
    description: l.description ?? "",
    seller_name: l.seller_name ?? "",
  };
}

const inputCls =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]";

export function ListingsSection() {
  const [listings, setListings] = useState<AdminPendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, page_size: PAGE_SIZE, total: 0, has_more: false });
  const [selectedListing, setSelectedListing] = useState<AdminPendingListing | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);

    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(PAGE_SIZE));
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (debouncedSearch) params.set("q", debouncedSearch);

      try {
        const res = await fetch(`/api/admin/listings?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Không tải được danh sách tin đăng.");

          return;
        }

        setListings(data.items ?? data.listings ?? []);
        setPagination(data.pagination ?? { page, page_size: PAGE_SIZE, total: data.listings?.length ?? 0, has_more: false });
      } catch (err) {
        if ((err as Error).name !== "AbortError") setError("Có lỗi xảy ra, vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    }

    run();

    return () => controller.abort();
  }, [statusFilter, debouncedSearch, page]);

  async function handleAction(id: string, action: "approve" | "hide") {
    setActingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/listings/${id}/${action}`, { method: "PUT" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Thao tác thất bại.");

        return;
      }

      const newStatus = data.listing.status as AdminPendingListing["status"];

      // Tab hiện tại lọc theo 1 trạng thái cụ thể → tin vừa đổi trạng thái
      // không còn khớp bộ lọc, bỏ khỏi danh sách đang xem. Tab "Tất cả" thì
      // giữ lại, chỉ cập nhật badge trạng thái tại chỗ.
      setListings((prev) =>
        statusFilter !== "all" && newStatus !== statusFilter
          ? prev.filter((l) => l.id !== id)
          : prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)),
      );
      // Đã quyết định xong (duyệt/ẩn) thì đóng popup chi tiết luôn, không cần
      // admin tự bấm đóng thêm 1 lần nữa.
      setSelectedListing(null);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setActingId(null);
    }
  }

  // UC-11 bước 3: Admin chỉnh sửa/chuẩn hoá nội dung tin (tiêu đề, danh mục,
  // giá, số lượng, tên người bán khách vãng lai nhập...) trước khi duyệt.
  async function handleSaveEdit(id: string) {
    if (!editForm) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title.trim(),
          category: editForm.category.trim() || null,
          condition: editForm.condition.trim() || null,
          price: Number(editForm.price),
          original_price: editForm.original_price.trim() ? Number(editForm.original_price) : null,
          quantity_available: editForm.quantity_available.trim() ? Number(editForm.quantity_available) : 0,
          province: editForm.province.trim() || null,
          description: editForm.description.trim() || null,
          seller_name: editForm.seller_name.trim() || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Lưu thất bại.");

        return;
      }

      setListings((prev) => prev.map((l) => (l.id === id ? data.listing : l)));
      setEditingId(null);
      setEditForm(null);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  function renderActions(l: AdminPendingListing) {
    return (
      <div className="flex gap-1.5">
        {l.status === "pending" && (
          <button
            type="button"
            disabled={actingId === l.id}
            onClick={() => handleAction(l.id, "approve")}
            className="rounded bg-[#16A34A]/10 px-2.5 py-1 text-[11px] font-bold text-[#16A34A] disabled:opacity-50"
          >
            ✓ Duyệt
          </button>
        )}
        {(l.status === "pending" || l.status === "approved") && (
          <button
            type="button"
            disabled={actingId === l.id}
            onClick={() => handleAction(l.id, "hide")}
            className="rounded bg-red-600/10 px-2.5 py-1 text-[11px] font-bold text-red-600 disabled:opacity-50"
          >
            {actingId === l.id ? "..." : l.status === "pending" ? "Từ chối" : "Ẩn tin"}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setEditingId(l.id);
            setEditForm(toEditForm(l));
            setSelectedListing(null);
          }}
          className="rounded bg-black/5 px-2.5 py-1 text-[11px] font-bold text-[#64748B]"
        >
          Sửa
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-lg font-extrabold text-[#0F172A]">♻️ Tin Chợ C2C</div>
        <span className="text-xs text-[#94A3B8]">{listings.length} tin</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-full px-3 py-1.5 text-[11.5px] font-bold transition ${
                statusFilter === tab.id
                  ? "bg-[#E8547A] text-white"
                  : "bg-black/5 text-[#64748B] hover:bg-black/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tiêu đề tin..."
          className="w-64 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]"
        />
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {editingId && editForm && (
        <div className="mb-4 rounded-xl border border-[#E8547A]/25 bg-[#E8547A]/5 p-4">
          <div className="mb-3 text-[13px] font-bold text-[#0F172A]">Chuẩn hoá tin trước khi duyệt</div>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="col-span-2 flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tiêu đề</span>
              <input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Danh mục</span>
              <input
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tình trạng</span>
              <input
                value={editForm.condition}
                onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Giá (VNĐ)</span>
              <input
                type="number"
                min={0}
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Giá gốc (VNĐ)</span>
              <input
                type="number"
                min={0}
                value={editForm.original_price}
                onChange={(e) => setEditForm({ ...editForm, original_price: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Số lượng còn</span>
              <input
                type="number"
                min={0}
                value={editForm.quantity_available}
                onChange={(e) => setEditForm({ ...editForm, quantity_available: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tỉnh/thành</span>
              <input
                value={editForm.province}
                onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tên người bán</span>
              <input
                value={editForm.seller_name}
                onChange={(e) => setEditForm({ ...editForm, seller_name: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="col-span-2 flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Mô tả</span>
              <textarea
                rows={2}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className={inputCls}
              />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveEdit(editingId)}
              className="rounded-lg bg-[#0F172A] px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              Lưu
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setEditForm(null);
              }}
              className="rounded-lg border border-black/10 px-3.5 py-2 text-xs font-bold text-[#64748B]"
            >
              Huỷ
            </button>
          </div>
        </div>
      )}

      {!loading && listings.length === 0 && !error ? (
        <p className="rounded-xl border border-black/10 bg-white p-6 text-center text-sm text-[#94A3B8]">
          Không có tin nào khớp bộ lọc.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-[12.5px]">
            <thead>
              <tr className="bg-[#F1F5F9] text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
                <th className="px-3 py-2.5">Sản phẩm</th>
                <th className="px-3 py-2.5">Người bán</th>
                <th className="px-3 py-2.5">Danh mục</th>
                <th className="px-3 py-2.5">Giá</th>
                <th className="px-3 py-2.5">Số lượng</th>
                <th className="px-3 py-2.5">Trạng thái</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id} className="border-t border-black/10">
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedListing(l)}
                      className="text-left font-bold text-[#0F172A] hover:text-[#E8547A] hover:underline"
                    >
                      {l.title}
                    </button>
                    <div className="text-[11px] text-[#64748B]">
                      {l.province ?? "—"} · {new Date(l.created_at).toLocaleDateString("vi-VN")}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    {l.users?.full_name ?? l.users?.email ?? l.seller_name ?? "—"}
                    {l.users?.is_verified && " ✓"}
                    {!l.seller_id && (
                      <span className="ml-1 rounded bg-black/5 px-1 py-0.5 text-[9.5px] font-bold text-[#94A3B8]">
                        Khách
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">{l.category ?? "—"}</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-[#E8547A]">{formatVnd(l.price)}</td>
                  <td className="px-3 py-2.5">{l.quantity_available}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${STATUS_BADGE[l.status].cls}`}
                    >
                      {STATUS_BADGE[l.status].label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">{renderActions(l)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PaginationControls pagination={pagination} onPageChange={setPage} />

      {selectedListing && (
        <ListingDetailModal
          listing={toListingDetail(selectedListing)}
          onClose={() => setSelectedListing(null)}
          footer={renderActions(selectedListing)}
        />
      )}
    </div>
  );
}
