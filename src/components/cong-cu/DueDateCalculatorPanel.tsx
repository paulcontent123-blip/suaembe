"use client";

import { useMemo, useState } from "react";

const inputCls =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#E8547A]";

// Mốc khám thai/tiêm chủng tham khảo theo hướng dẫn chăm sóc thai sản phổ
// biến tại Việt Nam (không phải dữ liệu cá nhân hoá) — chỉ mang tính tham
// khảo chung, không thay thế lịch hẹn thật với bác sĩ sản khoa.
const ANC_MILESTONES: { label: string; fromWeek: number; toWeek: number }[] = [
  { label: "🔬 Khám thai lần 1 — Xác nhận thai", fromWeek: 5, toWeek: 8 },
  { label: "🔬 Khám thai lần 2 — Đo độ mờ da gáy", fromWeek: 11, toWeek: 13 },
  { label: "🔬 Khám thai lần 3 — Siêu âm hình thái", fromWeek: 16, toWeek: 20 },
  { label: "💉 Tiêm uốn ván mũi 1", fromWeek: 20, toWeek: 24 },
  { label: "🔬 Khám thai lần 4 — Tầm soát tiểu đường thai kỳ", fromWeek: 24, toWeek: 28 },
  { label: "💉 Tiêm uốn ván mũi 2", fromWeek: 24, toWeek: 28 },
  { label: "🔬 Khám thai lần 5", fromWeek: 28, toWeek: 32 },
  { label: "🏥 Đăng ký sinh tại bệnh viện", fromWeek: 32, toWeek: 34 },
];

function statusFor(currentWeek: number, m: { fromWeek: number; toWeek: number }): { label: string; color: string } {
  if (currentWeek > m.toWeek) return { label: "Đã xong", color: "#86efac" };
  if (currentWeek >= m.fromWeek) return { label: "Sắp đến", color: "#FDE68A" };

  return { label: "Chưa làm", color: "#F9A8BE" };
}

// "Tính ngày dự sinh & Cẩm nang sinh con" giữ client-side hoàn toàn (đã chốt
// với techlead, xem database.md §3.1) — không có bảng/API riêng, không lưu
// trữ, chỉ tính toán ngay trên trình duyệt theo quy tắc Naegele có điều
// chỉnh theo độ dài chu kỳ kinh.
export function DueDateCalculatorPanel() {
  const [lmpDate, setLmpDate] = useState("");
  const [cycleLength, setCycleLength] = useState("28");
  const [calculated, setCalculated] = useState(false);

  const result = useMemo(() => {
    if (!lmpDate) return null;

    const lmp = new Date(`${lmpDate}T00:00:00`);
    if (Number.isNaN(lmp.getTime())) return null;

    const cycleAdjustDays = (Number(cycleLength) || 28) - 28;
    const dueDate = new Date(lmp);
    dueDate.setDate(dueDate.getDate() + 280 + cycleAdjustDays);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const gestationDays = Math.floor((today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24));
    const gestationWeeks = Math.floor(gestationDays / 7);
    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return { dueDate, gestationWeeks, gestationDaysRemainder: gestationDays % 7, daysRemaining };
  }, [lmpDate, cycleLength]);

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="mb-4 text-base font-bold text-[#0F172A]">📅 Tính ngày dự sinh &amp; Lịch thai kỳ</div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Ngày đầu kỳ kinh cuối (LMP)</span>
          <input type="date" value={lmpDate} onChange={(e) => setLmpDate(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Chu kỳ kinh (ngày)</span>
          <input
            type="number"
            min={20}
            max={45}
            value={cycleLength}
            onChange={(e) => setCycleLength(e.target.value)}
            className={inputCls}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => setCalculated(true)}
        disabled={!lmpDate}
        className="mt-3 w-full rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        📅 Tính ngày dự sinh →
      </button>

      {calculated && result && (
        <div className="mt-4 rounded-xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-5">
          <div className="mb-3.5 text-[11px] font-bold uppercase tracking-wide text-[#E8547A]/70">
            Kết quả tính toán
          </div>
          <div className="mb-3.5 grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="font-mono text-lg font-black text-[#F9A8BE]">
                {result.dueDate.toLocaleDateString("vi-VN")}
              </div>
              <div className="mt-0.5 text-[11px] text-white/50">Ngày dự sinh</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-lg font-black text-[#6EE7B7]">
                {result.gestationWeeks < 0 ? "—" : `${result.gestationWeeks} tuần`}
              </div>
              <div className="mt-0.5 text-[11px] text-white/50">Tuần thai hiện tại</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-lg font-black text-[#FDE68A]">
                {result.daysRemaining < 0 ? "Đã qua dự sinh" : `${result.daysRemaining} ngày`}
              </div>
              <div className="mt-0.5 text-[11px] text-white/50">Còn lại</div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {ANC_MILESTONES.map((m) => {
              const status = statusFor(result.gestationWeeks, m);

              return (
                <div key={m.label} className="flex items-center justify-between rounded-lg bg-white/[0.06] px-3.5 py-2.5">
                  <span className="text-[12.5px] text-white/60">{m.label}</span>
                  <span className="text-[12px] font-bold" style={{ color: status.color }}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-[#94A3B8]">
        ⚠️ Kết quả tính theo quy tắc Naegele tham khảo, chỉ mang tính ước lượng — ngày dự sinh và lịch khám chính xác
        cần bác sĩ sản khoa xác nhận qua siêu âm.
      </p>
    </div>
  );
}
