"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";

import type { PublicDoctor, PublicPartner, PublicPartnerService } from "@/lib/partners/types";

export type PartnerTab = "all" | "hospital" | "insurance" | "doctor" | "equipment" | "service";

const TABS: { id: PartnerTab; label: string; icon: string }[] = [
  { id: "all", label: "Tất cả", icon: "🤝" },
  { id: "hospital", label: "Bệnh viện", icon: "🏥" },
  { id: "insurance", label: "Bảo hiểm", icon: "🛡" },
  { id: "doctor", label: "Tư vấn Bác sĩ", icon: "👩‍⚕️" },
  { id: "equipment", label: "Trang thiết bị", icon: "🛒" },
  { id: "service", label: "Dịch vụ Mẹ & Bé", icon: "💆" },
];

const PARTNER_META: Record<string, { label: string; icon: string; tone: string; badge: string }> = {
  hospital: {
    label: "Bệnh viện",
    icon: "🏥",
    tone: "bg-[#E8F7F5] text-[#0D9488]",
    badge: "border-[#86D7CE] bg-[#E8F7F5] text-[#0D9488]",
  },
  insurance: {
    label: "Bảo hiểm",
    icon: "🛡",
    tone: "bg-[#F1EDFF] text-[#6D42D8]",
    badge: "border-[#CFC0FF] bg-[#F7F4FF] text-[#6D42D8]",
  },
  equipment: {
    label: "Trang thiết bị",
    icon: "🛒",
    tone: "bg-[#FFF4E5] text-[#B45309]",
    badge: "border-[#F2C98E] bg-[#FFF8EE] text-[#B45309]",
  },
  recovery: {
    label: "Phục hồi",
    icon: "💆",
    tone: "bg-[#FFF0F5] text-[#E8547A]",
    badge: "border-[#F6B9CB] bg-[#FFF5F8] text-[#E8547A]",
  },
  service: {
    label: "Dịch vụ Mẹ & Bé",
    icon: "💆",
    tone: "bg-[#FFF0F5] text-[#E8547A]",
    badge: "border-[#F6B9CB] bg-[#FFF5F8] text-[#E8547A]",
  },
  other: {
    label: "Đối tác",
    icon: "🤝",
    tone: "bg-[#F1F5F9] text-[#64748B]",
    badge: "border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]",
  },
};

const inputClass =
  "w-full rounded-lg border border-[#DCE3EC] bg-white px-3 py-2.5 text-sm text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#E8547A] focus:ring-2 focus:ring-[#E8547A]/10";

function partnerMeta(type: string) {
  return PARTNER_META[type] ?? PARTNER_META.other;
}

function formatMoney(value: number | null) {
  if (value == null) return null;

  return `${value.toLocaleString("vi-VN")}đ`;
}

function formatServicePrice(service: PublicPartnerService) {
  const from = formatMoney(service.price_from);
  const to = formatMoney(service.price_to);

  if (!from && !to) return "Liên hệ để được tư vấn";
  if (from && to && from !== to) return `${from} – ${to}`;

  return from ?? to;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function PartnerLogo({ partner, className = "" }: { partner: PublicPartner; className?: string }) {
  const meta = partnerMeta(partner.partner_type);

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl text-2xl ${meta.tone} ${className}`}>
      {partner.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={partner.logo_url} alt={partner.name} className="h-full w-full object-cover" />
      ) : (
        meta.icon
      )}
    </div>
  );
}

function ServicePreview({ services }: { services: PublicPartnerService[] }) {
  if (services.length === 0) {
    return <p className="text-[12.5px] text-[#94A3B8]">Chưa cập nhật gói/dịch vụ nổi bật.</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {services.slice(0, 3).map((service) => (
        <div key={service.id} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-[#64748B]">
          <span className="mt-1 text-[#E8547A]">•</span>
          <span>
            {service.name}
            {service.price_from != null && <span className="font-semibold text-[#0D9488]"> · {formatServicePrice(service)}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

function PartnerCard({ partner, onOpen }: { partner: PublicPartner; onOpen: () => void }) {
  const meta = partnerMeta(partner.partner_type);
  const isService = partner.partner_type === "service" || partner.partner_type === "recovery";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#E0E6EE] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-[#F0A2B8] hover:shadow-[0_14px_34px_rgba(15,23,42,0.1)]">
      <div className="flex items-center gap-3 border-b border-[#E8EDF3] px-5 py-4">
        <PartnerLogo partner={partner} className="h-14 w-14" />
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-[15px] font-extrabold leading-snug text-[#0F172A]">{partner.name}</h2>
          <p className="mt-0.5 text-[12px] text-[#64748B]">{partner.category || meta.label}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 py-4">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className={`rounded-md border px-2 py-1 text-[10.5px] font-bold ${meta.badge}`}>{meta.label}</span>
          {partner.verified && (
            <span className="rounded-md bg-[#ECFDF3] px-2 py-1 text-[10.5px] font-bold text-[#16A34A]">✓ Đã xác minh</span>
          )}
        </div>

        <p className="mb-3 line-clamp-3 min-h-[66px] text-[13.5px] leading-relaxed text-[#64748B]">
          {partner.description || "Thông tin đối tác đang được SữaEmbe cập nhật."}
        </p>

        <div className="mb-4 min-h-[64px]">
          <ServicePreview services={partner.services} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#EEF1F5] pt-3">
          <span className="truncate text-[11px] text-[#94A3B8]">{partner.province ? `📍 ${partner.province}` : "Tư vấn qua SữaEmbe"}</span>
          <button
            type="button"
            onClick={onOpen}
            className="shrink-0 rounded-lg border border-[#F6B9CB] bg-[#FFF5F8] px-3 py-2 text-[12px] font-extrabold text-[#E8547A] transition hover:bg-[#E8547A] hover:text-white"
          >
            {isService ? "Xem chi tiết & Đặt lịch" : "Xem chi tiết & Liên hệ"} →
          </button>
        </div>
      </div>
    </article>
  );
}

type DoctorModalMode = "contact" | "consult";

function DoctorCard({ doctor, onOpen, onConsult }: { doctor: PublicDoctor; onOpen: () => void; onConsult: () => void }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#E0E6EE] bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-[#8ED8D0] hover:shadow-[0_14px_34px_rgba(15,23,42,0.1)]">
      <div className="flex items-start gap-3">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E8F7F5] text-sm font-extrabold text-[#0D9488]">
          {doctor.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doctor.avatar_url} alt={doctor.full_name} className="h-full w-full object-cover" />
          ) : (
            initials(doctor.full_name)
          )}
          {doctor.is_online && <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#16A34A]" />}
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-extrabold leading-snug text-[#0F172A]">{doctor.full_name}</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-[#64748B]">{doctor.specialty || "Nhi khoa"}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="rounded-md border border-[#86D7CE] bg-[#E8F7F5] px-2 py-1 text-[10.5px] font-bold text-[#0D9488]">BS Nhi</span>
        {doctor.verified && <span className="rounded-md bg-[#ECFDF3] px-2 py-1 text-[10.5px] font-bold text-[#16A34A]">✓ Đã xác minh</span>}
      </div>
      <p className="mt-3 line-clamp-3 min-h-[66px] text-[13.5px] leading-relaxed text-[#64748B]">
        {doctor.bio || `${doctor.experience_years ?? "Nhiều"} năm kinh nghiệm${doctor.hospital ? ` · ${doctor.hospital}` : ""}.`}
      </p>
      <div className="mt-auto border-t border-[#EEF1F5] pt-3">
        <div className="mb-3 flex items-center gap-4 text-[11px] text-[#64748B]">
          {doctor.rating != null && <span>⭐ {doctor.rating.toFixed(1)}</span>}
          <span>{doctor.consult_count.toLocaleString("vi-VN")} lượt tư vấn</span>
          <span>Phản hồi ~{doctor.response_hours}h</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <button
            type="button"
            onClick={onOpen}
            className="rounded-lg border border-[#F6B9CB] bg-[#FFF5F8] px-3 py-2.5 text-[12px] font-extrabold text-[#E8547A] transition hover:bg-[#E8547A] hover:text-white"
          >
            Xem chi tiết & Liên hệ →
          </button>
          <button
            type="button"
            onClick={onConsult}
            title={`Hỏi ngay, phản hồi trong ${doctor.response_hours} giờ`}
            className="rounded-lg bg-[#0D9488] px-3 py-2.5 text-[12px] font-extrabold text-white transition hover:bg-[#08786E]"
          >
            Hỏi ngay
          </button>
        </div>
      </div>
    </article>
  );
}

interface LeadFormState {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  address: string;
  scheduled_at: string;
  partner_service_id: string;
  note: string;
}

function emptyForm(serviceId = ""): LeadFormState {
  return {
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    address: "",
    scheduled_at: "",
    partner_service_id: serviceId,
    note: "",
  };
}

function PartnerDetailModal({ partner, onClose, onSuccess }: { partner: PublicPartner; onClose: () => void; onSuccess: (message: string) => void }) {
  const meta = partnerMeta(partner.partner_type);
  const isService = partner.partner_type === "service" || partner.partner_type === "recovery";
  const [form, setForm] = useState<LeadFormState>(() => emptyForm(partner.services[0]?.id ?? ""));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const selectedService = partner.services.find((service) => service.id === form.partner_service_id) ?? null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      partner_id: partner.id,
      partner_service_id: isService ? form.partner_service_id || null : null,
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      customer_email: form.customer_email.trim() || null,
      address: form.address.trim() || null,
      note: form.note.trim() || null,
      service: selectedService?.name ?? (isService ? `Tư vấn dịch vụ: ${partner.name}` : `Tư vấn đối tác: ${partner.name}`),
    };

    if (isService) {
      payload.scheduled_at = form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null;
    }

    try {
      const response = await fetch(isService ? "/api/partner-bookings" : "/api/partner-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Không gửi được thông tin. Vui lòng thử lại.");
        return;
      }

      setSubmitted(true);
      onSuccess(isService ? "Đã gửi yêu cầu đặt lịch. SữaEmbe sẽ liên hệ để xác nhận." : "Đã gửi thông tin. SữaEmbe sẽ tư vấn và liên hệ lại với bạn.");
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-[#0F172A]/55 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="partner-detail-title">
        <div className="relative h-28 overflow-hidden bg-gradient-to-r from-[#FFF0F5] via-[#FDF8FA] to-[#E8F7F5]">
          {partner.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={partner.cover_url} alt="" className="h-full w-full object-cover opacity-80" />
          )}
          <button type="button" onClick={onClose} aria-label="Đóng" className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg text-[#64748B] shadow-sm hover:text-[#0F172A]">×</button>
        </div>

        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-8 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-end gap-3">
              <PartnerLogo partner={partner} className="h-16 w-16 border-4 border-white shadow-md" />
              <div className="pb-1">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-md border px-2 py-1 text-[10.5px] font-bold ${meta.badge}`}>{meta.label}</span>
                  {partner.verified && <span className="rounded-md bg-[#ECFDF3] px-2 py-1 text-[10.5px] font-bold text-[#16A34A]">✓ Đã xác minh</span>}
                </div>
                <h2 id="partner-detail-title" className="text-xl font-extrabold text-[#0F172A]">{partner.name}</h2>
              </div>
            </div>
            {partner.rating != null && <span className="pb-1 text-sm font-bold text-[#D97706]">⭐ {partner.rating.toFixed(1)}</span>}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-[#475569]">{partner.description || "Thông tin đối tác đang được SữaEmbe cập nhật."}</p>

              <div className="mt-5 grid gap-2 text-[12.5px] text-[#64748B]">
                {partner.province && <div><span className="font-bold text-[#0F172A]">Khu vực:</span> 📍 {partner.province}</div>}
                {partner.address && <div><span className="font-bold text-[#0F172A]">Địa chỉ:</span> {partner.address}</div>}
                {partner.phone && <div><span className="font-bold text-[#0F172A]">Hotline tham khảo:</span> {partner.phone}</div>}
                {partner.website_url && <div><span className="font-bold text-[#0F172A]">Website/Link:</span> {partner.website_url}</div>}
              </div>

              <div className="mt-6">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">Gói / dịch vụ nổi bật</div>
                {partner.services.length > 0 ? (
                  <div className="divide-y divide-[#EEF1F5] rounded-xl border border-[#E8EDF3]">
                    {partner.services.map((service) => (
                      <div key={service.id} className="p-3.5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-bold text-[#0F172A]">{service.name}</div>
                            {service.service_type && <div className="mt-0.5 text-[11px] text-[#E8547A]">{service.service_type}</div>}
                          </div>
                          <span className="text-[12px] font-bold text-[#0D9488]">{formatServicePrice(service)}</span>
                        </div>
                        {service.description && <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">{service.description}</p>}
                        {service.duration_minutes && <p className="mt-1 text-[11px] text-[#94A3B8]">Thời lượng: {service.duration_minutes} phút</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-[#CBD5E1] p-4 text-sm text-[#94A3B8]">Chưa có gói/dịch vụ được công bố.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#F6B9CB] bg-[#FFF8FA] p-4 sm:p-5">
              {submitted ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#ECFDF3] text-2xl text-[#16A34A]">✓</div>
                  <h3 className="text-base font-extrabold text-[#0F172A]">Đã tiếp nhận thông tin</h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#64748B]">SữaEmbe sẽ kiểm tra và liên hệ lại theo số điện thoại bạn đã đăng ký.</p>
                  <button type="button" onClick={onClose} className="mt-5 rounded-lg bg-[#E8547A] px-4 py-2.5 text-sm font-bold text-white">Đóng</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-1 text-base font-extrabold text-[#0F172A]">{isService ? "Đặt lịch dịch vụ" : "Nhận tư vấn từ SữaEmbe"}</div>
                  <p className="mb-4 text-[12px] leading-relaxed text-[#64748B]">{isService ? "Bạn không cần đăng nhập. Hãy để lại thông tin và thời gian mong muốn, SữaEmbe sẽ liên hệ xác nhận lịch." : "SữaEmbe tiếp nhận thông tin, tư vấn và chuyển tiếp nhu cầu phù hợp cho đối tác."}</p>

                  <div className="grid gap-2.5">
                    <input required value={form.customer_name} onChange={(event) => setForm({ ...form, customer_name: event.target.value })} placeholder="Họ và tên *" className={inputClass} />
                    <input required type="tel" value={form.customer_phone} onChange={(event) => setForm({ ...form, customer_phone: event.target.value })} placeholder="Số điện thoại *" className={inputClass} />
                    <input type="email" value={form.customer_email} onChange={(event) => setForm({ ...form, customer_email: event.target.value })} placeholder="Email (nếu có)" className={inputClass} />

                    {isService && partner.services.length > 0 && (
                      <select required value={form.partner_service_id} onChange={(event) => setForm({ ...form, partner_service_id: event.target.value })} className={inputClass}>
                        <option value="">Chọn gói/dịch vụ *</option>
                        {partner.services.map((service) => <option key={service.id} value={service.id}>{service.name} · {formatServicePrice(service)}</option>)}
                      </select>
                    )}

                    {isService && <input required type="datetime-local" value={form.scheduled_at} onChange={(event) => setForm({ ...form, scheduled_at: event.target.value })} className={inputClass} />}
                    {isService && <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Địa chỉ thực hiện (nếu cần)" className={inputClass} />}
                    <textarea rows={isService ? 3 : 5} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder={isService ? "Ghi chú thêm về nhu cầu..." : "Bạn cần tư vấn về điều gì?"} className={inputClass} />
                  </div>

                  {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
                  <button type="submit" disabled={submitting} className="mt-3 w-full rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-4 py-3 text-sm font-extrabold text-white transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60">
                    {submitting ? "Đang gửi..." : isService ? "Gửi yêu cầu đặt lịch" : "Gửi thông tin tư vấn"}
                  </button>
                  <p className="mt-2 text-center text-[10.5px] leading-relaxed text-[#94A3B8]">Thông tin được dùng để SữaEmbe liên hệ và xử lý yêu cầu.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DoctorConsultModal({
  doctor,
  isAuthenticated,
  initialMode,
  onClose,
  onSuccess,
}: {
  doctor: PublicDoctor;
  isAuthenticated: boolean;
  initialMode: DoctorModalMode;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [mode, setMode] = useState<DoctorModalMode>(initialMode);
  const [question, setQuestion] = useState("");
  const [babyAgeMonths, setBabyAgeMonths] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ customer_name: "", customer_phone: "", customer_email: "", note: "" });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bs_id: doctor.id,
          question: question.trim(),
          baby_age_months: babyAgeMonths.trim() ? Number(babyAgeMonths) : null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Không gửi được yêu cầu tư vấn.");
        return;
      }

      setSubmitted(true);
      onSuccess("Đã gửi câu hỏi. Admin sẽ chuyển tiếp cho bác sĩ và cập nhật câu trả lời cho bạn.");
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setContactError(null);
    setContactSubmitting(true);

    try {
      const response = await fetch("/api/doctor-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bs_id: doctor.id,
          customer_name: contactForm.customer_name.trim(),
          customer_phone: contactForm.customer_phone.trim(),
          customer_email: contactForm.customer_email.trim() || null,
          note: contactForm.note.trim() || null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setContactError(data.error ?? "Không gửi được thông tin liên hệ.");
        return;
      }

      setContactSubmitted(true);
      onSuccess("Đã gửi thông tin liên hệ. SữaEmbe sẽ tư vấn và chuyển tiếp cho bác sĩ.");
    } catch {
      setContactError("Không thể kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      setContactSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-[#0F172A]/55 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="doctor-detail-title">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#E8F7F5] text-sm font-extrabold text-[#0D9488]">
              {doctor.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={doctor.avatar_url} alt={doctor.full_name} className="h-full w-full object-cover" />
              ) : initials(doctor.full_name)}
            </div>
            <div>
              <div className="mb-1 flex flex-wrap gap-1.5"><span className="rounded bg-[#E8F7F5] px-2 py-1 text-[10.5px] font-bold text-[#0D9488]">BS Nhi</span>{doctor.verified && <span className="rounded bg-[#ECFDF3] px-2 py-1 text-[10.5px] font-bold text-[#16A34A]">✓ Đã xác minh</span>}</div>
              <h2 id="doctor-detail-title" className="text-lg font-extrabold text-[#0F172A]">{doctor.full_name}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="text-2xl leading-none text-[#94A3B8] hover:text-[#0F172A]">×</button>
        </div>

        <div className="mt-6 grid gap-3 text-sm text-[#475569]">
          <div><span className="font-bold text-[#0F172A]">Chuyên môn:</span> {doctor.specialty || "Nhi khoa"}</div>
          {doctor.hospital && <div><span className="font-bold text-[#0F172A]">Nơi công tác:</span> {doctor.hospital}</div>}
          {doctor.experience_years != null && <div><span className="font-bold text-[#0F172A]">Kinh nghiệm:</span> {doctor.experience_years} năm</div>}
          {doctor.bio && <p className="whitespace-pre-line leading-relaxed">{doctor.bio}</p>}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-[#F8FAFC] p-3 text-center">
          <div><div className="font-mono text-base font-extrabold text-[#0F172A]">{doctor.consult_count.toLocaleString("vi-VN")}</div><div className="text-[10px] text-[#94A3B8]">Lượt tư vấn</div></div>
          <div><div className="font-mono text-base font-extrabold text-[#D97706]">{doctor.rating?.toFixed(1) ?? "—"}</div><div className="text-[10px] text-[#94A3B8]">Đánh giá</div></div>
          <div><div className="font-mono text-base font-extrabold text-[#0D9488]">~{doctor.response_hours}h</div><div className="text-[10px] text-[#94A3B8]">Phản hồi</div></div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-[#F8FAFC] p-1">
          <button type="button" onClick={() => setMode("contact")} className={`rounded-md px-3 py-2 text-xs font-bold transition ${mode === "contact" ? "bg-white text-[#E8547A] shadow-sm" : "text-[#64748B] hover:text-[#E8547A]"}`}>
            Xem chi tiết & Liên hệ
          </button>
          <button type="button" onClick={() => setMode("consult")} className={`rounded-md px-3 py-2 text-xs font-bold transition ${mode === "consult" ? "bg-[#0D9488] text-white shadow-sm" : "text-[#64748B] hover:text-[#0D9488]"}`}>
            Hỏi ngay
          </button>
        </div>
        {mode === "contact" ? contactSubmitted ? (
          <div className="mt-5 rounded-xl border border-[#F6B9CB] bg-[#FFF8FA] p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#ECFDF3] text-xl font-bold text-[#16A34A]">✓</div>
            <div className="text-sm font-extrabold text-[#0F172A]">Đã gửi thông tin liên hệ</div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">SữaEmbe sẽ liên hệ lại để tư vấn và chuyển tiếp thông tin cho {doctor.full_name}.</p>
            <button type="button" onClick={onClose} className="mt-3 rounded-lg bg-[#E8547A] px-4 py-2 text-xs font-bold text-white">Đóng</button>
          </div>
        ) : (
          <form onSubmit={handleContactSubmit} className="mt-5 rounded-xl border border-[#F6B9CB] bg-[#FFF8FA] p-4">
            <div className="text-sm font-extrabold text-[#0F172A]">Liên hệ {doctor.full_name}</div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">SữaEmbe sẽ tiếp nhận thông tin, tư vấn và chuyển tiếp cho bác sĩ đối tác.</p>
            <div className="mt-3 grid gap-2.5">
              <input required value={contactForm.customer_name} onChange={(event) => setContactForm((previous) => ({ ...previous, customer_name: event.target.value }))} placeholder="Họ và tên *" className={inputClass} />
              <input required type="tel" value={contactForm.customer_phone} onChange={(event) => setContactForm((previous) => ({ ...previous, customer_phone: event.target.value }))} placeholder="Số điện thoại *" className={inputClass} />
              <input type="email" value={contactForm.customer_email} onChange={(event) => setContactForm((previous) => ({ ...previous, customer_email: event.target.value }))} placeholder="Email (không bắt buộc)" className={inputClass} />
              <textarea rows={4} maxLength={2000} value={contactForm.note} onChange={(event) => setContactForm((previous) => ({ ...previous, note: event.target.value }))} placeholder="Bạn muốn được tư vấn hoặc liên hệ về nội dung gì?" className={inputClass} />
            </div>
            {contactError && <p className="mt-2 text-xs font-semibold text-red-600">{contactError}</p>}
            <button type="submit" disabled={contactSubmitting} className="mt-3 w-full rounded-lg bg-[#E8547A] px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#C43A62] disabled:opacity-60">
              {contactSubmitting ? "Đang gửi..." : "Gửi thông tin liên hệ →"}
            </button>
          </form>
        ) : submitted ? (
          <div className="mt-5 rounded-xl border border-[#86D7CE] bg-[#E8F7F5] p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#ECFDF3] text-xl font-bold text-[#16A34A]">✓</div>
            <div className="text-sm font-extrabold text-[#0F172A]">Đã gửi yêu cầu tư vấn</div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#0D7168]">Admin sẽ tiếp nhận, chuyển tiếp phía sau cho bác sĩ và gửi câu trả lời về tài khoản của bạn.</p>
            <button type="button" onClick={onClose} className="mt-3 rounded-lg bg-[#0D9488] px-4 py-2 text-xs font-bold text-white">Đóng</button>
          </div>
        ) : !isAuthenticated ? (
          <div className="mt-5 rounded-xl border border-[#F6B9CB] bg-[#FFF8FA] p-4 text-center">
            <div className="text-sm font-extrabold text-[#0F172A]">Đăng nhập để hỏi bác sĩ</div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">Yêu cầu tư vấn được lưu vào tài khoản để bạn xem lại câu hỏi và câu trả lời.</p>
            <Link href="/?login=1&redirect=%2Fdoi-tac" onClick={onClose} className="mt-3 inline-flex rounded-lg bg-[#E8547A] px-4 py-2.5 text-xs font-bold text-white">Đăng nhập mẹ bỉm →</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 rounded-xl border border-[#B7E4DF] bg-[#F2FCFB] p-4">
            <div className="text-sm font-extrabold text-[#0F172A]">Hỏi {doctor.full_name}</div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">Nhập câu hỏi cụ thể để Admin chuyển tiếp cho bác sĩ đối tác.</p>
            <div className="mt-3 grid gap-2.5">
              <textarea
                required
                minLength={10}
                maxLength={2000}
                rows={5}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ví dụ: Bé 7 tháng biếng ăn và hay táo bón, mẹ nên điều chỉnh như thế nào? *"
                className={inputClass}
              />
              <input
                type="number"
                min={0}
                max={240}
                value={babyAgeMonths}
                onChange={(event) => setBabyAgeMonths(event.target.value)}
                placeholder="Tuổi của bé (tháng, không bắt buộc)"
                className={inputClass}
              />
            </div>
            {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
            <button type="submit" disabled={submitting} className="mt-3 w-full rounded-lg bg-[#0D9488] px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#08786E] disabled:opacity-60">
              {submitting ? "Đang gửi..." : "Gửi câu hỏi cho Admin →"}
            </button>
            <p className="mt-2 text-center text-[10.5px] leading-relaxed text-[#94A3B8]">Câu trả lời sẽ được cập nhật vào tài khoản của bạn.</p>
          </form>
        )}
      </div>
    </div>
  );
}

export function PartnerBrowser({
  partners,
  doctors,
  isAuthenticated,
  initialTab = "all",
}: {
  partners: PublicPartner[];
  doctors: PublicDoctor[];
  isAuthenticated: boolean;
  /** Cho phép deep-link thẳng vào 1 tab, vd footer "Hỏi BS Nhi" -> ?tab=doctor. */
  initialTab?: PartnerTab;
}) {
  const [activeTab, setActiveTab] = useState<PartnerTab>(initialTab);
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState<PublicPartner | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<PublicDoctor | null>(null);
  const [doctorModalMode, setDoctorModalMode] = useState<DoctorModalMode>("consult");
  const [toast, setToast] = useState<string | null>(null);

  const provinces = useMemo(
    () =>
      Array.from(
        new Set(partners.map((partner) => partner.province).filter((value): value is string => Boolean(value))),
      ).sort(),
    [partners],
  );
  const normalizedSearch = search.trim().toLowerCase();
  const visiblePartners = useMemo(() => partners.filter((partner) => {
    const tabMatches = activeTab === "all" || activeTab === "doctor" || (activeTab === "service" ? partner.partner_type === "service" || partner.partner_type === "recovery" : partner.partner_type === activeTab);
    const textMatches = !normalizedSearch || [partner.name, partner.category, partner.description, partner.province].filter(Boolean).join(" ").toLowerCase().includes(normalizedSearch);
    const provinceMatches = province === "all" || partner.province === province;
    return tabMatches && textMatches && provinceMatches;
  }), [activeTab, normalizedSearch, partners, province]);
  const visibleDoctors = useMemo(() => doctors.filter((doctor) => {
    if (activeTab !== "doctor") return false;
    if (!normalizedSearch) return true;
    return [doctor.full_name, doctor.specialty, doctor.hospital, doctor.bio].filter(Boolean).join(" ").toLowerCase().includes(normalizedSearch);
  }), [activeTab, doctors, normalizedSearch]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }

  function chooseTab(tab: PartnerTab) {
    setActiveTab(tab);
    if (tab === "doctor") showToast("Đang xem các bác sĩ nhi đã xác minh.");
  }

  function openDoctor(doctor: PublicDoctor, mode: DoctorModalMode) {
    setDoctorModalMode(mode);
    setSelectedDoctor(doctor);
  }

  const showDoctorSection = activeTab === "doctor";

  return (
    <div className="flex-1">
      <section className="border-b border-[#F3DCE4] bg-gradient-to-b from-[#FFF8FA] to-[#FDF8FA] px-6 pb-7 pt-10 sm:pt-14">
        <div className="mx-auto max-w-[1120px]">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#E8547A]"><span className="h-px w-6 bg-[#E8547A]" /> Đối tác đồng hành trong hành trình mẹ bỉm</div>
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl font-black leading-tight text-[#0F172A] sm:text-5xl">Đối tác <em className="not-italic text-[#E8547A]">tin cậy</em> từ A đến Z</h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#64748B]">Từ lúc mang thai đến khi nuôi con lớn, SữaEmbe kết nối mẹ với các đối tác được xác minh và đồng hành tư vấn theo từng nhu cầu.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-6 pb-12 pt-5">
        <div className="overflow-x-auto border-b border-[#DCE3EC]">
          <div className="flex min-w-max gap-1">
            {TABS.map((tab) => (
              <button key={tab.id} type="button" onClick={() => chooseTab(tab.id)} className={`border-b-2 px-3.5 py-3 text-[13px] font-semibold transition ${activeTab === tab.id ? "border-[#E8547A] text-[#E8547A]" : "border-transparent text-[#64748B] hover:text-[#E8547A]"}`}>
                <span className="mr-1">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <label className="relative block flex-1"><span className="sr-only">Tìm đối tác</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên đối tác, dịch vụ, chuyên môn..." className={`${inputClass} pl-10`} /><span className="pointer-events-none absolute left-3 top-2.5 text-sm text-[#94A3B8]">🔍</span></label>
          <label className="block sm:w-56"><span className="sr-only">Lọc theo tỉnh thành</span><select value={province} onChange={(event) => setProvince(event.target.value)} className={inputClass}><option value="all">Tất cả tỉnh/thành</option>{provinces.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        </div>

        {activeTab !== "doctor" && (
          <div className="mt-7">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-lg font-extrabold text-[#0F172A]">{activeTab === "all" ? "Đối tác nổi bật" : TABS.find((tab) => tab.id === activeTab)?.label}</h2><p className="mt-1 text-xs text-[#94A3B8]">{visiblePartners.length} kết quả phù hợp</p></div></div>
            {visiblePartners.length > 0 ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visiblePartners.map((partner) => <PartnerCard key={partner.id} partner={partner} onOpen={() => setSelectedPartner(partner)} />)}</div> : <EmptyState text="Chưa có đối tác phù hợp. Admin có thể thêm và bật trạng thái hiển thị trong trang quản trị." />}
          </div>
        )}

        {showDoctorSection && (
          <div className="mt-10">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#B7E4DF] bg-gradient-to-br from-[#F2FCFB] to-[#F8FFFE] px-5 py-4"><div><div className="text-sm font-extrabold text-[#0D9488]">👨‍⚕️ 45+ Bác sĩ Nhi khoa xác minh</div><p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#64748B]">Liên kết từ hệ thống danh bạ bác sĩ uy tín. Xem chi tiết, liên hệ qua SữaEmbe hoặc gửi câu hỏi để Admin chuyển tiếp cho bác sĩ.</p></div><button type="button" disabled={visibleDoctors.length === 0} onClick={() => visibleDoctors[0] && openDoctor(visibleDoctors[0], "consult")} className="shrink-0 rounded-lg bg-[#0D9488] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#08786E] disabled:cursor-not-allowed disabled:opacity-50">Hỏi BS Nhi ngay →</button></div>
            {visibleDoctors.length > 0 ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleDoctors.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} onOpen={() => openDoctor(doctor, "contact")} onConsult={() => openDoctor(doctor, "consult")} />)}</div> : <EmptyState text="Chưa có hồ sơ bác sĩ phù hợp." />}
          </div>
        )}
      </section>

      {selectedPartner && <PartnerDetailModal key={selectedPartner.id} partner={selectedPartner} onClose={() => setSelectedPartner(null)} onSuccess={showToast} />}
      {selectedDoctor && <DoctorConsultModal key={`${selectedDoctor.id}-${doctorModalMode}`} doctor={selectedDoctor} isAuthenticated={isAuthenticated} initialMode={doctorModalMode} onClose={() => setSelectedDoctor(null)} onSuccess={showToast} />}
      {toast && <div className="fixed bottom-7 right-7 z-[500] max-w-sm rounded-lg bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white shadow-2xl">{toast}</div>}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-white px-5 py-12 text-center text-sm text-[#94A3B8]">{text}</div>;
}
