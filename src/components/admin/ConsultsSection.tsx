"use client";

import { useEffect, useState } from "react";

import { PaginationControls } from "@/components/admin/PaginationControls";
import type { AdminConsultRequest, ConsultStatus } from "@/lib/admin/types";
import type { PaginationMeta } from "@/lib/pagination";

const PAGE_SIZE = 8;

const STATUS_OPTIONS: { value: ConsultStatus | "all"; label: string }[] = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "answered", label: "Đã trả lời" },
  { value: "closed", label: "Đã đóng" },
  { value: "cancelled", label: "Đã hủy" },
];

const inputClass = "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]";

const statusMeta: Record<ConsultStatus, { label: string; className: string }> = {
  pending: { label: "Chờ xử lý", className: "bg-[#FFF7ED] text-[#B45309]" },
  answered: { label: "Đã trả lời", className: "bg-[#ECFDF3] text-[#16A34A]" },
  closed: { label: "Đã đóng", className: "bg-[#F1F5F9] text-[#64748B]" },
  cancelled: { label: "Đã hủy", className: "bg-[#FEF2F2] text-[#DC2626]" },
};

function dateTime(value: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "—";
}

export function ConsultsSection() {
  const [consults, setConsults] = useState<AdminConsultRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<ConsultStatus | "all">("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, page_size: PAGE_SIZE, total: 0, has_more: false });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});

  async function loadConsults(targetPage = page) {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("page", String(targetPage));
    params.set("page_size", String(PAGE_SIZE));
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search.trim()) params.set("q", search.trim());

    try {
      const response = await fetch(`/api/admin/consults?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Không tải được yêu cầu tư vấn.");
        return;
      }

      const rows = (data.items ?? data.consults ?? []) as AdminConsultRequest[];
      setConsults(rows);
      setPagination(data.pagination ?? { page: targetPage, page_size: PAGE_SIZE, total: data.consults?.length ?? 0, has_more: false });
      setNotes(Object.fromEntries(rows.map((item) => [item.id, item.internal_note ?? ""])));
      setAnswers(Object.fromEntries(rows.map((item) => [item.id, item.answer ?? ""])));
    } catch {
      setError("Có lỗi xảy ra khi tải yêu cầu tư vấn.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConsults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  async function forwardConsult(consult: AdminConsultRequest) {
    setSaving(`${consult.id}:forward`);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/admin/consults/${consult.id}/forward`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internal_note: notes[consult.id] ?? null }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Không cập nhật được trạng thái chuyển tiếp.");
        return;
      }

      setConsults((previous) => previous.map((item) => (item.id === consult.id ? data.consult : item)));
      setNotice("Đã ghi nhận yêu cầu được chuyển tiếp cho bác sĩ đối tác.");
    } catch {
      setError("Có lỗi xảy ra khi chuyển tiếp yêu cầu.");
    } finally {
      setSaving(null);
    }
  }

  async function answerConsult(consult: AdminConsultRequest) {
    const answer = (answers[consult.id] ?? "").trim();

    if (answer.length < 10) {
      setError("Câu trả lời cần ít nhất 10 ký tự.");
      return;
    }

    setSaving(`${consult.id}:answer`);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/admin/consults/${consult.id}/answer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Không lưu được câu trả lời.");
        return;
      }

      setConsults((previous) => previous.map((item) => (item.id === consult.id ? data.consult : item)));
      setNotice(data.notification_created === false ? "Đã lưu câu trả lời nhưng chưa tạo được thông báo cho mẹ bỉm." : "Đã lưu câu trả lời và tạo thông báo cho mẹ bỉm.");
    } catch {
      setError("Có lỗi xảy ra khi lưu câu trả lời.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-[#0F172A]">👨‍⚕️ Yêu cầu tư vấn bác sĩ</div>
          <p className="mt-1 text-sm text-[#64748B]">Admin tiếp nhận, chuyển tiếp phía sau cho bác sĩ đối tác và cập nhật câu trả lời cho mẹ bỉm.</p>
        </div>
        <span className="text-xs text-[#94A3B8]">{consults.length} yêu cầu</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ConsultStatus | "all")} className={`${inputClass} w-48`}>
          {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && loadConsults(1)} placeholder="Tìm câu hỏi..." className={`${inputClass} w-64`} />
        <button type="button" onClick={() => loadConsults(page)} disabled={loading} className="rounded-lg border border-black/10 px-3.5 py-2 text-xs font-bold text-[#64748B] disabled:opacity-50">{loading ? "Đang tải..." : "Tải lại"}</button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {notice && <p className="mb-3 text-sm font-semibold text-[#0D9488]">{notice}</p>}

      <div className="flex flex-col gap-3">
        {consults.map((consult) => {
          const meta = statusMeta[consult.status];
          const isForwarded = Boolean(consult.forwarded_at);
          const isSaving = saving?.startsWith(consult.id) ?? false;

          return (
            <article key={consult.id} className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-[#0F172A]">
                    {consult.users?.full_name || consult.users?.email || "Mẹ bỉm"}
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${meta.className}`}>{meta.label}</span>
                    {isForwarded && <span className="rounded bg-[#E8F7F5] px-1.5 py-0.5 text-[10px] font-bold text-[#0D9488]">Đã chuyển BS</span>}
                  </div>
                  <div className="mt-1 text-[11.5px] text-[#64748B]">{consult.users?.email ?? "—"} · {consult.users?.phone ?? "Chưa có SĐT"} · Gửi lúc {dateTime(consult.created_at)}</div>
                  <div className="mt-1 text-[11.5px] text-[#64748B]">Bác sĩ: <span className="font-semibold text-[#0F172A]">{consult.bs_nhi?.full_name ?? "Chưa chọn"}</span>{consult.bs_nhi?.specialty ? ` · ${consult.bs_nhi.specialty}` : ""}</div>
                </div>
                <span className="text-[11px] text-[#94A3B8]">Tuổi bé: {consult.baby_age_months != null ? `${consult.baby_age_months} tháng` : "Chưa cung cấp"}</span>
              </div>

              <div className="mt-3 rounded-lg bg-[#F8FAFC] p-3 text-sm leading-relaxed text-[#334155]">{consult.question}</div>

              <div className="mt-3 grid gap-2.5 lg:grid-cols-[1fr_auto]">
                <input value={notes[consult.id] ?? ""} onChange={(event) => setNotes((previous) => ({ ...previous, [consult.id]: event.target.value }))} placeholder="Ghi chú nội bộ khi chuyển tiếp..." className={inputClass} />
                <button type="button" disabled={isSaving} onClick={() => forwardConsult(consult)} className="rounded-lg bg-[#0D9488]/10 px-3.5 py-2 text-xs font-bold text-[#0D9488] disabled:opacity-50">{isSaving && saving?.endsWith(":forward") ? "Đang lưu..." : isForwarded ? "Cập nhật chuyển tiếp" : "Đã chuyển tiếp cho BS"}</button>
              </div>

              <div className="mt-3 border-t border-black/10 pt-3">
                <label className="block text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">Câu trả lời gửi cho mẹ bỉm</label>
                <textarea rows={4} value={answers[consult.id] ?? ""} onChange={(event) => setAnswers((previous) => ({ ...previous, [consult.id]: event.target.value }))} placeholder="Nhập câu trả lời sau khi nhận phản hồi từ bác sĩ..." className={`${inputClass} mt-1`} />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-[#94A3B8]">{consult.answered_at ? `Đã trả lời lúc ${dateTime(consult.answered_at)}` : "Chưa có câu trả lời"}</span>
                  <button type="button" disabled={isSaving} onClick={() => answerConsult(consult)} className="rounded-lg bg-[#E8547A] px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50">{isSaving && saving?.endsWith(":answer") ? "Đang lưu..." : "Lưu câu trả lời & báo mẹ"}</button>
                </div>
              </div>
            </article>
          );
        })}
        {!loading && consults.length === 0 && <p className="rounded-xl border border-black/10 bg-white p-8 text-center text-sm text-[#94A3B8]">Chưa có yêu cầu tư vấn khớp bộ lọc.</p>}
      </div>
      <PaginationControls pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
