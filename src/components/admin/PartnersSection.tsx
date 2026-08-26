"use client";

import { useEffect, useState } from "react";

import { PaginationControls } from "@/components/admin/PaginationControls";
import type { AdminPartner, AdminPartnerBooking, AdminPartnerService } from "@/lib/admin/types";
import type { PaginationMeta } from "@/lib/pagination";

const PAGE_SIZE = 8;

export type PartnersTab = "partners" | "services" | "bookings";
type Tab = PartnersTab;

const TABS: { id: Tab; label: string }[] = [
  { id: "partners", label: "Đối tác" },
  { id: "services", label: "Gói/Dịch vụ" },
  { id: "bookings", label: "Lead & Booking" },
];

const PARTNER_TYPE_OPTIONS = [
  { value: "hospital", label: "Bệnh viện" },
  { value: "insurance", label: "Bảo hiểm" },
  { value: "equipment", label: "Trang thiết bị" },
  { value: "recovery", label: "Phục hồi" },
  { value: "service", label: "Dịch vụ Mẹ & Bé" },
  { value: "other", label: "Khác" },
];

const PARTNER_STATUS_OPTIONS = [
  { value: "pending", label: "Chờ xử lý" },
  { value: "active", label: "Đang hiển thị" },
  { value: "inactive", label: "Tạm tắt" },
  { value: "hidden", label: "Đã ẩn" },
];

const BOOKING_STATUS_OPTIONS = [
  { value: "pending", label: "Chờ xử lý" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "completed", label: "Hoàn tất" },
  { value: "cancelled", label: "Đã hủy" },
];

const REQUEST_TYPE_OPTIONS = [
  { value: "lead", label: "Lead/liên hệ" },
  { value: "booking", label: "Đặt lịch" },
  { value: "doctor_lead", label: "Liên hệ bác sĩ" },
];

const inputCls =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]";
const buttonPrimaryCls = "rounded-lg bg-[#0F172A] px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50";
const buttonGhostCls = "rounded-lg border border-black/10 px-3.5 py-2 text-xs font-bold text-[#64748B]";

interface PartnerForm {
  name: string;
  partner_type: string;
  category: string;
  description: string;
  logo_url: string;
  cover_url: string;
  phone: string;
  email: string;
  website_url: string;
  province: string;
  address: string;
  rating: string;
  verified: boolean;
  status: string;
}

interface ServiceForm {
  name: string;
  service_type: string;
  description: string;
  price_from: string;
  price_to: string;
  duration_minutes: string;
  active: boolean;
}

const EMPTY_PARTNER_FORM: PartnerForm = {
  name: "",
  partner_type: "hospital",
  category: "",
  description: "",
  logo_url: "",
  cover_url: "",
  phone: "",
  email: "",
  website_url: "",
  province: "",
  address: "",
  rating: "",
  verified: false,
  status: "pending",
};

const EMPTY_SERVICE_FORM: ServiceForm = {
  name: "",
  service_type: "",
  description: "",
  price_from: "",
  price_to: "",
  duration_minutes: "",
  active: true,
};

function money(value: number | null) {
  if (value == null) return "Chưa có giá";

  return `${value.toLocaleString("vi-VN")}đ`;
}

function partnerTypeLabel(value: string | null | undefined) {
  return PARTNER_TYPE_OPTIONS.find((item) => item.value === value)?.label ?? value ?? "Chưa phân loại";
}

function statusLabel(value: string | null | undefined) {
  return (
    [...PARTNER_STATUS_OPTIONS, ...BOOKING_STATUS_OPTIONS].find((item) => item.value === value)?.label ??
    value ??
    "Chưa rõ"
  );
}

function toPartnerForm(partner: AdminPartner): PartnerForm {
  return {
    name: partner.name,
    partner_type: partner.partner_type,
    category: partner.category ?? "",
    description: partner.description ?? "",
    logo_url: partner.logo_url ?? "",
    cover_url: partner.cover_url ?? "",
    phone: partner.phone ?? "",
    email: partner.email ?? "",
    website_url: partner.website_url ?? "",
    province: partner.province ?? "",
    address: partner.address ?? "",
    rating: partner.rating != null ? String(partner.rating) : "",
    verified: partner.verified,
    status: partner.status,
  };
}

function partnerPayload(form: PartnerForm) {
  return {
    name: form.name.trim(),
    partner_type: form.partner_type,
    category: form.category.trim() || null,
    description: form.description.trim() || null,
    logo_url: form.logo_url.trim() || null,
    cover_url: form.cover_url.trim() || null,
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    website_url: form.website_url.trim() || null,
    province: form.province.trim() || null,
    address: form.address.trim() || null,
    rating: form.rating.trim() ? Number(form.rating) : null,
    verified: form.verified,
    status: form.status,
  };
}

function toServiceForm(service: AdminPartnerService): ServiceForm {
  return {
    name: service.name,
    service_type: service.service_type ?? "",
    description: service.description ?? "",
    price_from: service.price_from != null ? String(service.price_from) : "",
    price_to: service.price_to != null ? String(service.price_to) : "",
    duration_minutes: service.duration_minutes != null ? String(service.duration_minutes) : "",
    active: service.active,
  };
}

function servicePayload(form: ServiceForm) {
  return {
    name: form.name.trim(),
    service_type: form.service_type.trim() || null,
    description: form.description.trim() || null,
    price_from: form.price_from.trim() ? Number(form.price_from) : null,
    price_to: form.price_to.trim() ? Number(form.price_to) : null,
    duration_minutes: form.duration_minutes.trim() ? Number(form.duration_minutes) : null,
    active: form.active,
  };
}

function PartnerFields({ form, onChange }: { form: PartnerForm; onChange: (next: PartnerForm) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tên đối tác *</span>
        <input value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} className={inputCls} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Nhóm đối tác</span>
        <select
          value={form.partner_type}
          onChange={(e) => onChange({ ...form, partner_type: e.target.value })}
          className={inputCls}
        >
          {PARTNER_TYPE_OPTIONS.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Trạng thái</span>
        <select value={form.status} onChange={(e) => onChange({ ...form, status: e.target.value })} className={inputCls}>
          {PARTNER_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Danh mục/nhãn hiển thị</span>
        <input
          value={form.category}
          onChange={(e) => onChange({ ...form, category: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tỉnh/thành</span>
        <input
          value={form.province}
          onChange={(e) => onChange({ ...form, province: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Hotline</span>
        <input value={form.phone} onChange={(e) => onChange({ ...form, phone: e.target.value })} className={inputCls} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Email</span>
        <input value={form.email} onChange={(e) => onChange({ ...form, email: e.target.value })} className={inputCls} />
      </label>
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Website/Zalo/Link liên hệ</span>
        <input
          value={form.website_url}
          onChange={(e) => onChange({ ...form, website_url: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Địa chỉ</span>
        <input
          value={form.address}
          onChange={(e) => onChange({ ...form, address: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Logo URL</span>
        <input
          value={form.logo_url}
          onChange={(e) => onChange({ ...form, logo_url: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Cover URL</span>
        <input
          value={form.cover_url}
          onChange={(e) => onChange({ ...form, cover_url: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Rating 0-5</span>
        <input
          type="number"
          min={0}
          max={5}
          step={0.1}
          value={form.rating}
          onChange={(e) => onChange({ ...form, rating: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="flex items-end gap-2 pb-2 text-xs font-semibold text-[#0F172A]">
        <input
          type="checkbox"
          checked={form.verified}
          onChange={(e) => onChange({ ...form, verified: e.target.checked })}
        />
        Đối tác đã xác minh
      </label>
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Mô tả</span>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          className={inputCls}
        />
      </label>
    </div>
  );
}

function ServiceFields({ form, onChange }: { form: ServiceForm; onChange: (next: ServiceForm) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tên gói/dịch vụ *</span>
        <input value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} className={inputCls} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Loại dịch vụ</span>
        <input
          value={form.service_type}
          onChange={(e) => onChange({ ...form, service_type: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Thời lượng phút</span>
        <input
          type="number"
          min={0}
          value={form.duration_minutes}
          onChange={(e) => onChange({ ...form, duration_minutes: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Giá từ</span>
        <input
          type="number"
          min={0}
          value={form.price_from}
          onChange={(e) => onChange({ ...form, price_from: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Giá đến</span>
        <input
          type="number"
          min={0}
          value={form.price_to}
          onChange={(e) => onChange({ ...form, price_to: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="col-span-2 flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
        <input type="checkbox" checked={form.active} onChange={(e) => onChange({ ...form, active: e.target.checked })} />
        Đang mở nhận lead/booking
      </label>
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Mô tả</span>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          className={inputCls}
        />
      </label>
    </div>
  );
}

function PartnersTab({
  partners,
  initialPagination,
  onReload,
}: {
  partners: AdminPartner[];
  initialPagination: PaginationMeta;
  onReload: () => void;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState<PaginationMeta>(initialPagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<PartnerForm>(EMPTY_PARTNER_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PartnerForm>(EMPTY_PARTNER_FORM);
  const [localPartners, setLocalPartners] = useState(partners);

  useEffect(() => {
    setLocalPartners(partners);
    setPagination(initialPagination);
  }, [initialPagination, partners]);

  async function loadFiltered(targetPage = 1) {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("page", String(targetPage));
    params.set("page_size", String(PAGE_SIZE));
    if (search.trim()) params.set("q", search.trim());
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);

    try {
      const res = await fetch(`/api/admin/partners?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Không tải được danh sách đối tác.");

        return;
      }

      setLocalPartners(data.items ?? data.partners ?? []);
      setPagination(data.pagination ?? { page: targetPage, page_size: PAGE_SIZE, total: data.partners?.length ?? 0, has_more: false });
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partnerPayload(createForm)),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Tạo đối tác thất bại.");

        return;
      }

      setCreateForm(EMPTY_PARTNER_FORM);
      setCreating(false);
      onReload();
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(id: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/partners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partnerPayload(editForm)),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Lưu đối tác thất bại.");

        return;
      }

      setLocalPartners((prev) => prev.map((partner) => (partner.id === id ? data.partner : partner)));
      setEditingId(null);
      onReload();
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Ẩn/xóa đối tác này? Nếu đã có gói hoặc booking, hệ thống sẽ chuyển sang trạng thái ẩn.")) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/partners/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Thao tác thất bại.");

        return;
      }

      if (data.deleted) setLocalPartners((prev) => prev.filter((partner) => partner.id !== id));
      else setLocalPartners((prev) => prev.map((partner) => (partner.id === id ? data.partner : partner)));
      onReload();
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm tên, danh mục, tỉnh/thành..."
          className={`${inputCls} w-72`}
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`${inputCls} w-44`}>
          <option value="all">Tất cả nhóm</option>
          {PARTNER_TYPE_OPTIONS.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputCls} w-40`}>
          <option value="all">Tất cả trạng thái</option>
          {PARTNER_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => loadFiltered(1)} disabled={loading} className={buttonGhostCls}>
          Lọc
        </button>
        <button
          type="button"
          onClick={() => setCreating((value) => !value)}
          className="ml-auto rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-3.5 py-2 text-xs font-bold text-white"
        >
          + Thêm đối tác
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {creating && (
        <div className="mb-4 rounded-xl border border-[#E8547A]/25 bg-[#E8547A]/5 p-4">
          <PartnerFields form={createForm} onChange={setCreateForm} />
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={loading || !createForm.name.trim()} onClick={handleCreate} className={buttonPrimaryCls}>
              Lưu
            </button>
            <button type="button" onClick={() => setCreating(false)} className={buttonGhostCls}>
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {localPartners.map((partner) =>
          editingId === partner.id ? (
            <div key={partner.id} className="rounded-xl border border-[#E8547A]/25 bg-[#E8547A]/5 p-4">
              <PartnerFields form={editForm} onChange={setEditForm} />
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={loading} onClick={() => handleSave(partner.id)} className={buttonPrimaryCls}>
                  Lưu
                </button>
                <button type="button" onClick={() => setEditingId(null)} className={buttonGhostCls}>
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <div key={partner.id} className="rounded-xl border border-black/10 bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-[#0F172A]">
                    {partner.name}
                    <span className="rounded bg-[#0D9488]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#0D9488]">
                      {partnerTypeLabel(partner.partner_type)}
                    </span>
                    <span className="rounded bg-[#E8547A]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#E8547A]">
                      {statusLabel(partner.status)}
                    </span>
                    {partner.verified && (
                      <span className="rounded bg-[#16A34A]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#16A34A]">
                        Đã xác minh
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[12px] text-[#64748B]">
                    {partner.category ?? "Chưa có danh mục"} · {partner.province ?? "Chưa có tỉnh/thành"} ·{" "}
                    {partner.phone ?? "Chưa có hotline"}
                  </div>
                  {partner.description && <p className="mt-2 line-clamp-2 text-sm text-[#475569]">{partner.description}</p>}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(partner.id);
                      setEditForm(toPartnerForm(partner));
                    }}
                    className="rounded bg-[#E8547A]/10 px-2.5 py-1 text-[11px] font-bold text-[#E8547A]"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(partner.id)}
                    className="rounded px-2.5 py-1 text-[11px] font-bold text-[#94A3B8] hover:text-red-600"
                  >
                    Ẩn/Xóa
                  </button>
                </div>
              </div>
            </div>
          ),
        )}
        {localPartners.length === 0 && (
          <p className="rounded-xl border border-black/10 bg-white p-6 text-center text-sm text-[#94A3B8]">
            Chưa có đối tác nào khớp bộ lọc.
          </p>
        )}
      </div>
      <PaginationControls pagination={pagination} onPageChange={loadFiltered} />
    </div>
  );
}

function ServicesTab({ partners, onReload }: { partners: AdminPartner[]; onReload: () => void }) {
  const servicePartners = partners.filter((partner) => partner.status !== "hidden");
  const [partnerId, setPartnerId] = useState("");
  const [services, setServices] = useState<AdminPartnerService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<ServiceForm>(EMPTY_SERVICE_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ServiceForm>(EMPTY_SERVICE_FORM);

  useEffect(() => {
    if (!partnerId && servicePartners[0]) setPartnerId(servicePartners[0].id);
  }, [partnerId, servicePartners]);

  useEffect(() => {
    if (!partnerId) return;

    const controller = new AbortController();

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/admin/partners/${partnerId}/services`, { signal: controller.signal });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Không tải được gói/dịch vụ.");

          return;
        }

        setServices(data.services ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setError("Có lỗi xảy ra, vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    }

    run();

    return () => controller.abort();
  }, [partnerId]);

  async function reloadServices() {
    if (!partnerId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/services`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Không tải được gói/dịch vụ.");

        return;
      }

      setServices(data.services ?? []);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!partnerId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(servicePayload(createForm)),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Tạo gói/dịch vụ thất bại.");

        return;
      }

      setServices((prev) => [data.service, ...prev]);
      setCreateForm(EMPTY_SERVICE_FORM);
      setCreating(false);
      onReload();
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(id: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/partner-services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(servicePayload(editForm)),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Lưu gói/dịch vụ thất bại.");

        return;
      }

      setServices((prev) => prev.map((service) => (service.id === id ? data.service : service)));
      setEditingId(null);
      onReload();
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Ẩn/xóa gói/dịch vụ này? Nếu đã có booking, hệ thống sẽ tắt active.")) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/partner-services/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Thao tác thất bại.");

        return;
      }

      if (data.deleted) setServices((prev) => prev.filter((service) => service.id !== id));
      else setServices((prev) => prev.map((service) => (service.id === id ? data.service : service)));
      reloadServices();
      onReload();
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className={`${inputCls} w-80`}>
          {servicePartners.map((partner) => (
            <option key={partner.id} value={partner.id}>
              {partner.name} · {partnerTypeLabel(partner.partner_type)}
            </option>
          ))}
        </select>
        <button type="button" onClick={reloadServices} disabled={loading || !partnerId} className={buttonGhostCls}>
          Tải lại
        </button>
        <button
          type="button"
          onClick={() => setCreating((value) => !value)}
          disabled={!partnerId}
          className="ml-auto rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          + Thêm gói/dịch vụ
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {creating && (
        <div className="mb-4 rounded-xl border border-[#E8547A]/25 bg-[#E8547A]/5 p-4">
          <ServiceFields form={createForm} onChange={setCreateForm} />
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={loading || !createForm.name.trim()} onClick={handleCreate} className={buttonPrimaryCls}>
              Lưu
            </button>
            <button type="button" onClick={() => setCreating(false)} className={buttonGhostCls}>
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {services.map((service) =>
          editingId === service.id ? (
            <div key={service.id} className="rounded-xl border border-[#E8547A]/25 bg-[#E8547A]/5 p-4">
              <ServiceFields form={editForm} onChange={setEditForm} />
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={loading} onClick={() => handleSave(service.id)} className={buttonPrimaryCls}>
                  Lưu
                </button>
                <button type="button" onClick={() => setEditingId(null)} className={buttonGhostCls}>
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <div key={service.id} className="rounded-xl border border-black/10 bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-[#0F172A]">
                    {service.name}
                    <span className="rounded bg-[#0D9488]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#0D9488]">
                      {service.service_type ?? "Dịch vụ"}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        service.active ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-black/5 text-[#94A3B8]"
                      }`}
                    >
                      {service.active ? "Đang mở" : "Đã tắt"}
                    </span>
                  </div>
                  <div className="mt-1 text-[12px] text-[#64748B]">
                    {money(service.price_from)} {service.price_to != null ? `- ${money(service.price_to)}` : ""} ·{" "}
                    {service.duration_minutes ? `${service.duration_minutes} phút` : "Chưa có thời lượng"}
                  </div>
                  {service.description && <p className="mt-2 line-clamp-2 text-sm text-[#475569]">{service.description}</p>}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(service.id);
                      setEditForm(toServiceForm(service));
                    }}
                    className="rounded bg-[#E8547A]/10 px-2.5 py-1 text-[11px] font-bold text-[#E8547A]"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(service.id)}
                    className="rounded px-2.5 py-1 text-[11px] font-bold text-[#94A3B8] hover:text-red-600"
                  >
                    Ẩn/Xóa
                  </button>
                </div>
              </div>
            </div>
          ),
        )}
        {services.length === 0 && (
          <p className="rounded-xl border border-black/10 bg-white p-6 text-center text-sm text-[#94A3B8]">
            Chưa có gói/dịch vụ cho đối tác đang chọn.
          </p>
        )}
      </div>
    </div>
  );
}

function BookingsTab() {
  const [bookings, setBookings] = useState<AdminPartnerBooking[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [requestTypeFilter, setRequestTypeFilter] = useState("all");
  const [partnerTypeFilter, setPartnerTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, page_size: PAGE_SIZE, total: 0, has_more: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function loadBookings(targetPage = page) {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("page", String(targetPage));
    params.set("page_size", String(PAGE_SIZE));
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (requestTypeFilter !== "all") params.set("request_type", requestTypeFilter);
    if (partnerTypeFilter !== "all") params.set("partner_type", partnerTypeFilter);

    try {
      const res = await fetch(`/api/admin/bookings?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Không tải được lead/booking.");

        return;
      }

      setBookings(data.items ?? data.bookings ?? []);
      setPagination(data.pagination ?? { page: targetPage, page_size: PAGE_SIZE, total: data.bookings?.length ?? 0, has_more: false });
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, requestTypeFilter, partnerTypeFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, requestTypeFilter, partnerTypeFilter]);

  async function updateBooking(id: string, payload: Record<string, unknown>) {
    setSavingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Cập nhật thất bại.");

        return;
      }

      setBookings((prev) => prev.map((booking) => (booking.id === id ? data.booking : booking)));
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteBooking(id: string) {
    if (!window.confirm("Xóa lead/booking này khỏi hệ thống?")) return;

    setSavingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Xóa thất bại.");

        return;
      }

      setBookings((prev) => prev.filter((booking) => booking.id !== id));
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputCls} w-44`}>
          <option value="all">Tất cả trạng thái</option>
          {BOOKING_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <select
          value={requestTypeFilter}
          onChange={(e) => setRequestTypeFilter(e.target.value)}
          className={`${inputCls} w-44`}
        >
          <option value="all">Tất cả loại yêu cầu</option>
          {REQUEST_TYPE_OPTIONS.map((requestType) => (
            <option key={requestType.value} value={requestType.value}>
              {requestType.label}
            </option>
          ))}
        </select>
        <select
          value={partnerTypeFilter}
          onChange={(e) => setPartnerTypeFilter(e.target.value)}
          className={`${inputCls} w-44`}
        >
          <option value="all">Tất cả nhóm đối tác</option>
          {PARTNER_TYPE_OPTIONS.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => loadBookings()} disabled={loading} className={buttonGhostCls}>
          Tải lại
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-3">
        {bookings.map((booking) => (
          <div key={booking.id} className="rounded-xl border border-black/10 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-[#0F172A]">
                  {booking.customer_name ?? "Khách chưa có tên"}
                  <span className="rounded bg-[#0D9488]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#0D9488]">
                    {booking.request_type === "doctor_lead" ? "Liên hệ bác sĩ" : booking.request_type === "lead" ? "Lead/liên hệ" : "Đặt lịch"}
                  </span>
                  <span className="rounded bg-[#E8547A]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#E8547A]">
                    {statusLabel(booking.status)}
                  </span>
                </div>
                <div className="mt-1 text-[12px] text-[#64748B]">
                  {booking.customer_phone ?? "Chưa có SĐT"} · {booking.customer_email ?? "Chưa có email"}
                </div>
                <div className="mt-1 text-[12px] text-[#64748B]">
                  {booking.bs_nhi?.full_name ?? booking.partners?.name ?? "Không rõ đối tác"} · {booking.service ?? booking.partner_services?.name ?? "Chưa chọn gói"}
                  {booking.amount != null && ` · ${money(booking.amount)}`}
                </div>
                {booking.scheduled_at && (
                  <div className="mt-1 text-[12px] font-semibold text-[#0F172A]">
                    Lịch mong muốn: {new Date(booking.scheduled_at).toLocaleString("vi-VN")}
                  </div>
                )}
                {booking.address && <p className="mt-2 text-sm text-[#475569]">Địa chỉ: {booking.address}</p>}
                {booking.note && <p className="mt-1 text-sm text-[#475569]">Ghi chú khách: {booking.note}</p>}
                {booking.forwarded_at && (
                  <p className="mt-1 text-[11px] font-semibold text-[#16A34A]">
                    Đã chuyển đối tác lúc {new Date(booking.forwarded_at).toLocaleString("vi-VN")}
                  </p>
                )}
                {booking.notification_sent_at && (
                  <p className="mt-1 text-[11px] font-semibold text-[#0D9488]">
                    Đã đánh dấu gửi SMS/email lúc {new Date(booking.notification_sent_at).toLocaleString("vi-VN")}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-1.5">
                <select
                  value={booking.status}
                  onChange={(e) => updateBooking(booking.id, { status: e.target.value })}
                  disabled={savingId === booking.id}
                  className="rounded border border-black/10 bg-white px-2 py-1 text-[11px] font-bold text-[#64748B]"
                >
                  {BOOKING_STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => updateBooking(booking.id, { forwarded: true })}
                  disabled={savingId === booking.id}
                  className="rounded bg-[#16A34A]/10 px-2.5 py-1 text-[11px] font-bold text-[#16A34A] disabled:opacity-50"
                >
                  Đã chuyển đối tác
                </button>
                <button
                  type="button"
                  onClick={() => deleteBooking(booking.id)}
                  disabled={savingId === booking.id}
                  className="rounded px-2.5 py-1 text-[11px] font-bold text-[#94A3B8] hover:text-red-600 disabled:opacity-50"
                >
                  Xóa
                </button>
              </div>
            </div>
            <div className="mt-3 flex gap-2 border-t border-black/10 pt-3">
              <input
                defaultValue={booking.internal_note ?? ""}
                onBlur={(e) => updateBooking(booking.id, { internal_note: e.target.value.trim() || null })}
                placeholder="Ghi chú nội bộ cho admin..."
                className={inputCls}
              />
            </div>
          </div>
        ))}
        {bookings.length === 0 && (
          <p className="rounded-xl border border-black/10 bg-white p-6 text-center text-sm text-[#94A3B8]">
            Chưa có lead/booking nào khớp bộ lọc.
          </p>
        )}
      </div>
      <PaginationControls pagination={pagination} onPageChange={loadBookings} />
    </div>
  );
}

export function PartnersSection({ initialTab = "partners" }: { initialTab?: PartnersTab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [partnerPagination, setPartnerPagination] = useState<PaginationMeta>({ page: 1, page_size: PAGE_SIZE, total: 0, has_more: false });
  const [stats, setStats] = useState({ visible_partners: 0, active_services: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPartners() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/partners?page=1&page_size=${PAGE_SIZE}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Không tải được danh sách đối tác.");

        return;
      }

      setPartners(data.items ?? data.partners ?? []);
      setPartnerPagination(data.pagination ?? { page: 1, page_size: PAGE_SIZE, total: data.partners?.length ?? 0, has_more: false });
      setStats(data.stats ?? { visible_partners: data.partners?.length ?? 0, active_services: 0 });
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPartners();
  }, []);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-[#0F172A]">🤝 Đối tác, gói dịch vụ & booking</div>
          <p className="mt-1 text-sm text-[#64748B]">
            Admin quản lý đối tác trung gian, gói dịch vụ hiển thị public và lead/booking khách gửi không cần đăng nhập.
          </p>
        </div>
        <span className="text-xs text-[#94A3B8]">{partners.length} đối tác</span>
      </div>

      <div className="mb-5 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-black/10 bg-white px-4 py-3 shadow-sm">
          <div className="text-xl font-extrabold text-[#0F172A]">{stats.visible_partners}</div>
          <div className="mt-0.5 text-sm text-[#64748B]">Đối tác đang hiển thị</div>
        </div>
        <div className="rounded-xl border border-black/10 bg-white px-4 py-3 shadow-sm">
          <div className="text-xl font-extrabold text-[#0F172A]">{stats.active_services}</div>
          <div className="mt-0.5 text-sm text-[#64748B]">Gói/dịch vụ tham khảo</div>
        </div>
        <div className="rounded-xl border border-black/10 bg-white px-4 py-3 shadow-sm">
          <div className="text-base font-extrabold text-[#0F172A]">Trung gian</div>
          <div className="mt-0.5 text-sm text-[#64748B]">SữaEmbe tư vấn & chuyển tiếp</div>
        </div>
      </div>

      <div className="mb-4 flex gap-1 border-b border-black/10">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-[13px] font-bold transition ${
              tab === item.id ? "border-[#E8547A] text-[#E8547A]" : "border-transparent text-[#64748B]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && <p className="mb-3 text-sm text-[#94A3B8]">Đang tải dữ liệu đối tác...</p>}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {tab === "partners" && <PartnersTab partners={partners} initialPagination={partnerPagination} onReload={loadPartners} />}
      {tab === "services" && <ServicesTab partners={partners} onReload={loadPartners} />}
      {tab === "bookings" && <BookingsTab />}
    </div>
  );
}
