"use client";

import { useEffect, useState } from "react";

import { PaginationControls } from "@/components/admin/PaginationControls";
import type { AdminUserRow } from "@/lib/admin/types";
import type { PaginationMeta } from "@/lib/pagination";

const PAGE_SIZE = 8;

interface EditForm {
  full_name: string;
  phone: string;
  role: "admin" | "user";
  is_verified: boolean;
}

function toForm(u: AdminUserRow): EditForm {
  return { full_name: u.full_name ?? "", phone: u.phone ?? "", role: u.role, is_verified: u.is_verified };
}

export function UsersSection({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, page_size: PAGE_SIZE, total: 0, has_more: false });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    full_name: "",
    phone: "",
    role: "user",
    is_verified: false,
  });
  const [saving, setSaving] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);

    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter]);

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(PAGE_SIZE));
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (roleFilter !== "all") params.set("role", roleFilter);

      try {
        const res = await fetch(`/api/admin/users?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Không tải được danh sách người dùng.");

          return;
        }

        setUsers(data.items ?? data.users ?? []);
        setPagination(data.pagination ?? { page, page_size: PAGE_SIZE, total: data.users?.length ?? 0, has_more: false });
      } catch (err) {
        if ((err as Error).name !== "AbortError") setError("Có lỗi xảy ra, vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    }

    run();

    return () => controller.abort();
  }, [debouncedSearch, roleFilter, page]);

  async function handleSave(id: string) {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: editForm.full_name.trim() || null,
          phone: editForm.phone.trim() || null,
          is_verified: editForm.is_verified,
          // Chỉ gửi role khi không phải sửa chính mình — dòng của chính admin
          // luôn khoá select role (xem UI bên dưới), gửi lên sẽ bị backend
          // từ chối dù giá trị không đổi (chốt chống tự đổi role của mình).
          ...(id === currentUserId ? {} : { role: editForm.role }),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Lưu thất bại.");

        return;
      }

      setUsers((prev) => prev.map((u) => (u.id === id ? data.user : u)));
      setEditingId(null);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  // Nút xác minh nhanh 1 chạm ngay trên dòng — không cần vào chế độ Sửa như
  // trước, chỉ PUT đúng field is_verified.
  async function handleQuickVerify(id: string, nextValue: boolean) {
    setVerifyingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_verified: nextValue }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Thao tác thất bại.");

        return;
      }

      setUsers((prev) => prev.map((u) => (u.id === id ? data.user : u)));
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setVerifyingId(null);
    }
  }

  const inputCls =
    "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-lg font-extrabold text-[#0F172A]">👩 Mẹ bỉm</div>
        <span className="text-xs text-[#94A3B8]">{users.length} người dùng</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo email hoặc SĐT..."
          className={`${inputCls} w-64`}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as "all" | "admin" | "user")}
          className={inputCls}
        >
          <option value="all">Tất cả vai trò</option>
          <option value="user">Mẹ bỉm</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {!loading && users.length === 0 && !error ? (
        <p className="rounded-xl border border-black/10 bg-white p-6 text-center text-sm text-[#94A3B8]">
          Không có người dùng nào khớp bộ lọc.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-[12.5px]">
            <thead>
              <tr className="bg-[#F1F5F9] text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
                <th className="px-3 py-2.5">Họ tên</th>
                <th className="px-3 py-2.5">Email</th>
                <th className="px-3 py-2.5">SĐT</th>
                <th className="px-3 py-2.5">Vai trò</th>
                <th className="px-3 py-2.5">Xác minh</th>
                <th className="px-3 py-2.5">Ngày tham gia</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) =>
                editingId === u.id ? (
                  <tr key={u.id} className="border-t border-black/10 bg-[#E8547A]/5">
                    <td className="px-3 py-2.5">
                      <input
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        className={`${inputCls} w-full`}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-[#64748B]">{u.email}</td>
                    <td className="px-3 py-2.5">
                      <input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className={`${inputCls} w-full`}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      {u.id === currentUserId ? (
                        <span className="text-[11px] text-[#94A3B8]" title="Không thể tự đổi vai trò của chính mình">
                          {u.role === "admin" ? "Admin" : "Mẹ bỉm"} (chính bạn)
                        </span>
                      ) : (
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value as "admin" | "user" })}
                          className={inputCls}
                        >
                          <option value="user">Mẹ bỉm</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <label className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={editForm.is_verified}
                          onChange={(e) => setEditForm({ ...editForm, is_verified: e.target.checked })}
                        />
                        Đã xác minh
                      </label>
                    </td>
                    <td className="px-3 py-2.5 text-[#64748B]">
                      {new Date(u.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleSave(u.id)}
                          className="rounded bg-[#0F172A] px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-50"
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded border border-black/10 px-2.5 py-1 text-[11px] font-bold text-[#64748B]"
                        >
                          Huỷ
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={u.id} className="border-t border-black/10">
                    <td className="px-3 py-2.5 font-semibold text-[#0F172A]">{u.full_name ?? "—"}</td>
                    <td className="px-3 py-2.5">{u.email}</td>
                    <td className="px-3 py-2.5">{u.phone ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          u.role === "admin"
                            ? "bg-[#E8547A]/10 text-[#E8547A]"
                            : "bg-[#0D9488]/10 text-[#0D9488]"
                        }`}
                      >
                        {u.role === "admin" ? "Admin" : "Mẹ bỉm"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {u.is_verified ? (
                          <span className="rounded bg-[#16A34A]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#16A34A]">
                            ✓ Đã xác minh
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                        <button
                          type="button"
                          disabled={verifyingId === u.id}
                          onClick={() => handleQuickVerify(u.id, !u.is_verified)}
                          className={`rounded px-2 py-1 text-[10.5px] font-bold disabled:opacity-50 ${
                            u.is_verified
                              ? "text-[#94A3B8] hover:text-red-600"
                              : "bg-[#16A34A]/10 text-[#16A34A] hover:bg-[#16A34A]/20"
                          }`}
                        >
                          {verifyingId === u.id
                            ? "..."
                            : u.is_verified
                              ? "Bỏ xác minh"
                              : "✓ Xác minh"}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[#64748B]">
                      {new Date(u.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(u.id);
                          setEditForm(toForm(u));
                        }}
                        className="rounded bg-[#E8547A]/10 px-2.5 py-1 text-[11px] font-bold text-[#E8547A]"
                      >
                        Sửa
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
      <PaginationControls pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
