"use client";

import { useState } from "react";

import type { ConsultRequest, ConsultStatus } from "@/lib/consult/types";

const STATUS_META: Record<ConsultStatus, { label: string; className: string }> = {
  pending: { label: "Đang chờ xử lý", className: "bg-[#FFF7ED] text-[#B45309]" },
  answered: { label: "Đã có câu trả lời", className: "bg-[#ECFDF3] text-[#16A34A]" },
  closed: { label: "Đã đóng", className: "bg-[#F1F5F9] text-[#64748B]" },
  cancelled: { label: "Đã hủy", className: "bg-[#FEF2F2] text-[#DC2626]" },
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "—";
}

export function MyConsultsSection({ initialConsults }: { initialConsults: ConsultRequest[] }) {
  const [consults, setConsults] = useState(initialConsults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshConsults() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/consult/me", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Không tải được lịch sử tư vấn.");
        return;
      }

      setConsults((data.consults ?? []) as ConsultRequest[]);
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A]">Tư vấn bác sĩ của tôi</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">
            Theo dõi yêu cầu đã gửi và câu trả lời được Admin cập nhật từ bác sĩ đối tác.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshConsults}
          disabled={loading}
          className="rounded-lg border border-black/10 px-3 py-2 text-xs font-bold text-[#64748B] transition hover:border-[#E8547A] hover:text-[#E8547A] disabled:opacity-50"
        >
          {loading ? "Đang tải..." : "Cập nhật"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex flex-col gap-3">
        {consults.map((consult) => {
          const status = STATUS_META[consult.status];

          return (
            <article key={consult.id} className="rounded-xl border border-[#E8EDF3] bg-[#FCFDFE] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#0F172A]">
                    {consult.bs_nhi?.full_name ?? "Bác sĩ Nhi"}
                    <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${status.className}`}>{status.label}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#64748B]">
                    {consult.bs_nhi?.specialty || "Nhi khoa"}
                    {consult.baby_age_months != null ? ` · Bé ${consult.baby_age_months} tháng` : ""}
                    {` · Gửi lúc ${formatDate(consult.created_at)}`}
                  </p>
                </div>
                {consult.forwarded_at && <span className="text-[11px] font-semibold text-[#0D9488]">Đã chuyển tiếp lúc {formatDate(consult.forwarded_at)}</span>}
              </div>

              <div className="mt-3 rounded-lg bg-[#F8FAFC] p-3 text-sm leading-relaxed text-[#334155]">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">Câu hỏi của bạn</div>
                {consult.question}
              </div>

              {consult.answer ? (
                <div className="mt-3 rounded-lg border border-[#B7E4DF] bg-[#F2FCFB] p-3 text-sm leading-relaxed text-[#0D7168]">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#0D9488]">Câu trả lời</div>
                  <p className="whitespace-pre-line">{consult.answer}</p>
                  <p className="mt-2 text-[11px] text-[#5A9C96]">Cập nhật lúc {formatDate(consult.answered_at)}</p>
                </div>
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-[#94A3B8]">
                  Admin đang tiếp nhận và chuyển câu hỏi cho bác sĩ. Câu trả lời sẽ xuất hiện tại đây.
                </p>
              )}
            </article>
          );
        })}

        {consults.length === 0 && <p className="rounded-xl border border-dashed border-[#CBD5E1] p-8 text-center text-sm text-[#94A3B8]">Bạn chưa gửi yêu cầu tư vấn bác sĩ nào.</p>}
      </div>
    </section>
  );
}
