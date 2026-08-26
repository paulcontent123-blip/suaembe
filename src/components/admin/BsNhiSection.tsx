"use client";

import { useEffect, useRef, useState } from "react";

import type { AdminBsNhi } from "@/lib/admin/types";

interface DoctorForm {
  full_name: string;
  specialty: string;
  hospital: string;
  experience_years: string;
  response_hours: string;
  rating: string;
  bio: string;
  is_online: boolean;
}

const EMPTY_FORM: DoctorForm = {
  full_name: "",
  specialty: "",
  hospital: "",
  experience_years: "",
  response_hours: "2",
  rating: "",
  bio: "",
  is_online: false,
};

function toForm(d: AdminBsNhi): DoctorForm {
  return {
    full_name: d.full_name,
    specialty: d.specialty ?? "",
    hospital: d.hospital ?? "",
    experience_years: d.experience_years != null ? String(d.experience_years) : "",
    response_hours: String(d.response_hours),
    rating: d.rating != null ? String(d.rating) : "",
    bio: d.bio ?? "",
    is_online: d.is_online,
  };
}

function toPayload(form: DoctorForm) {
  return {
    full_name: form.full_name.trim(),
    specialty: form.specialty.trim() || null,
    hospital: form.hospital.trim() || null,
    experience_years: form.experience_years.trim() ? Number(form.experience_years) : null,
    response_hours: form.response_hours.trim() ? Number(form.response_hours) : 2,
    rating: form.rating.trim() ? Number(form.rating) : null,
    bio: form.bio.trim() || null,
    is_online: form.is_online,
  };
}

function DoctorFields({ form, onChange }: { form: DoctorForm; onChange: (f: DoctorForm) => void }) {
  const inputCls =
    "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]";

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Họ tên bác sĩ *</span>
        <input
          value={form.full_name}
          onChange={(e) => onChange({ ...form, full_name: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Chuyên khoa</span>
        <input
          placeholder="VD: Nhi khoa tiêu hoá"
          value={form.specialty}
          onChange={(e) => onChange({ ...form, specialty: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Bệnh viện / Phòng khám</span>
        <input
          value={form.hospital}
          onChange={(e) => onChange({ ...form, hospital: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Số năm kinh nghiệm</span>
        <input
          type="number"
          min={0}
          value={form.experience_years}
          onChange={(e) => onChange({ ...form, experience_years: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Thời gian phản hồi (giờ)</span>
        <input
          type="number"
          min={1}
          value={form.response_hours}
          onChange={(e) => onChange({ ...form, response_hours: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Điểm đánh giá (0–5)</span>
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
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Giới thiệu chuyên môn</span>
        <textarea
          rows={2}
          value={form.bio}
          onChange={(e) => onChange({ ...form, bio: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="col-span-2 flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
        <input
          type="checkbox"
          checked={form.is_online}
          onChange={(e) => onChange({ ...form, is_online: e.target.checked })}
        />
        Đang online, sẵn sàng nhận tư vấn
      </label>
    </div>
  );
}

function AvatarUploader({ doctor, onUploaded }: { doctor: AdminBsNhi; onUploaded: (url: string) => void }) {
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
      formData.append("owner_table", "bs_nhi");
      formData.append("owner_id", doctor.id);
      formData.append("asset_type", "avatar");

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
    <div className="mt-3 flex items-center gap-3 border-t border-black/10 pt-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF0F5] text-lg">
        {doctor.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={doctor.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          "👨‍⚕️"
        )}
      </div>
      <div>
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
    </div>
  );
}

export function BsNhiSection() {
  const [doctors, setDoctors] = useState<AdminBsNhi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<DoctorForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DoctorForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);

    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);

      try {
        const res = await fetch(`/api/admin/bs-nhi?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Không tải được danh sách bác sĩ.");

          return;
        }

        setDoctors(data.doctors ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setError("Có lỗi xảy ra, vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    }

    run();

    return () => controller.abort();
  }, [debouncedSearch]);

  async function handleCreate() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/bs-nhi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(createForm)),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Tạo hồ sơ bác sĩ thất bại.");

        return;
      }

      setDoctors((prev) => [...prev, data.doctor].sort((a, b) => a.full_name.localeCompare(b.full_name)));
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
      const res = await fetch(`/api/admin/bs-nhi/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(editForm)),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Lưu thất bại.");

        return;
      }

      setDoctors((prev) => prev.map((d) => (d.id === id ? data.doctor : d)));
      setEditingId(null);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  // Xác minh nhanh 1 chạm ngay trên dòng — không cần vào chế độ Sửa, giống
  // mẫu đã làm cho UC-27 (xác minh nhanh người dùng).
  async function handleQuickVerify(id: string, nextValue: boolean) {
    setVerifyingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/bs-nhi/${id}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: nextValue }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Thao tác thất bại.");

        return;
      }

      setDoctors((prev) => prev.map((d) => (d.id === id ? data.doctor : d)));
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setVerifyingId(null);
    }
  }

  // Upload chỉ tạo dòng media_assets — phải PUT lại /api/admin/bs-nhi/:id để
  // lưu URL vào avatar_url của chính hồ sơ, nếu không ảnh sẽ "biến mất" khi
  // tải lại trang.
  async function handleAvatarUploaded(doctorId: string, url: string) {
    setDoctors((prev) => prev.map((d) => (d.id === doctorId ? { ...d, avatar_url: url } : d)));

    try {
      await fetch(`/api/admin/bs-nhi/${doctorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: url }),
      });
    } catch {
      // Ảnh đã lưu ở media_assets; nếu PUT lỗi, admin có thể thử lại bằng
      // cách upload lại — không chặn luồng sửa hồ sơ.
    }
  }

  const inputCls =
    "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-lg font-extrabold text-[#0F172A]">👨‍⚕️ BS Nhi đối tác</div>
        <span className="text-xs text-[#94A3B8]">{doctors.length} bác sĩ</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên, chuyên khoa, bệnh viện..."
          className={`${inputCls} w-72`}
        />
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="ml-auto rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-3.5 py-2 text-xs font-bold text-white"
        >
          + Thêm bác sĩ
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {creating && (
        <div className="mb-4 rounded-xl border border-[#E8547A]/25 bg-[#E8547A]/5 p-4">
          <DoctorFields form={createForm} onChange={setCreateForm} />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={saving || !createForm.full_name.trim()}
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
          <p className="mt-2 text-[11px] text-[#94A3B8]">Lưu hồ sơ trước, rồi upload ảnh ở phần sửa bên dưới.</p>
        </div>
      )}

      {!loading && doctors.length === 0 ? (
        <p className="rounded-xl border border-black/10 bg-white p-6 text-center text-sm text-[#94A3B8]">
          Chưa có bác sĩ nào khớp bộ lọc.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {doctors.map((d) =>
            editingId === d.id ? (
              <div key={d.id} className="rounded-xl border border-[#E8547A]/25 bg-[#E8547A]/5 p-4">
                <DoctorFields form={editForm} onChange={setEditForm} />
                <AvatarUploader doctor={d} onUploaded={(url) => handleAvatarUploaded(d.id, url)} />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSave(d.id)}
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
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF0F5] text-lg">
                    {d.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      "👨‍⚕️"
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-[#0F172A]">
                      {d.full_name}
                      {d.verified && (
                        <span className="rounded bg-[#16A34A]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#16A34A]">
                          ✓ Đã xác minh
                        </span>
                      )}
                      {d.is_online && (
                        <span className="rounded bg-[#0D9488]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#0D9488]">
                          Online
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-[#64748B]">
                      {d.specialty ?? "—"} · {d.hospital ?? "—"}
                      {d.experience_years != null && ` · ${d.experience_years} năm KN`}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#94A3B8]">
                      {d.rating != null ? `⭐ ${d.rating.toFixed(1)}` : "Chưa có đánh giá"} · {d.consult_count} lượt tư
                      vấn · Phản hồi trong {d.response_hours}h
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    disabled={verifyingId === d.id}
                    onClick={() => handleQuickVerify(d.id, !d.verified)}
                    className={`rounded px-2.5 py-1 text-[11px] font-bold disabled:opacity-50 ${
                      d.verified
                        ? "text-[#94A3B8] hover:text-red-600"
                        : "bg-[#16A34A]/10 text-[#16A34A] hover:bg-[#16A34A]/20"
                    }`}
                  >
                    {verifyingId === d.id ? "..." : d.verified ? "Bỏ xác minh" : "✓ Xác minh"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(d.id);
                      setEditForm(toForm(d));
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
    </div>
  );
}
