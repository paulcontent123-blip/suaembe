"use client";

import { useEffect, useState } from "react";

import type { Baby } from "@/lib/babies/types";
import type { BabyMeasurement } from "@/lib/growth/types";

const inputCls =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]";

function levelFromLabel(label: string): string {
  if (label.includes("Thấp hơn")) return "#DC2626";
  if (label.includes("Cao hơn")) return "#DC2626";
  if (label.includes("theo dõi")) return "#D97706";

  return "#16A34A";
}

function ProgressRow({ label, percentile }: { label: string; percentile: number | null }) {
  if (percentile === null) return null;

  const color = percentile < 15 || percentile > 85 ? (percentile < 3 || percentile > 97 ? "#DC2626" : "#D97706") : "#16A34A";

  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="w-16 shrink-0 text-[12px] text-[#64748B]">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5">
        <div className="h-full rounded-full" style={{ width: `${percentile}%`, backgroundColor: color }} />
      </div>
      <span className="w-20 shrink-0 text-right font-mono text-[11.5px] font-bold" style={{ color }}>
        P{Math.round(percentile)} WHO
      </span>
    </div>
  );
}

// UC-04 - Cập Nhật Chỉ Số Và Đánh Giá Tăng Trưởng WHO.
export function GrowthChartCard({ baby, onSaved }: { baby: Baby; onSaved: () => void }) {
  const [measurements, setMeasurements] = useState<BabyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ weight_g: "", height_cm: "", head_cm: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);

    try {
      const res = await fetch(`/api/babies/${baby.id}/measurements`);
      const data = await res.json();

      if (res.ok) setMeasurements(data.measurements ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    setAdding(false);
    setForm({ weight_g: "", height_cm: "", head_cm: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baby.id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!baby.birth_date) {
      setError("Cần nhập ngày sinh của bé trong hồ sơ trước khi cập nhật chỉ số.");

      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/babies/${baby.id}/measurements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight_g: form.weight_g.trim() ? Math.round(Number(form.weight_g) * 1000) : undefined,
          height_cm: form.height_cm.trim() ? Number(form.height_cm) : undefined,
          head_cm: form.head_cm.trim() ? Number(form.head_cm) : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Lưu chỉ số thất bại.");

        return;
      }

      setMeasurements((prev) => [...prev, data.measurement]);
      setForm({ weight_g: "", height_cm: "", head_cm: "" });
      setAdding(false);
      onSaved();
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  const latest = measurements[measurements.length - 1] ?? null;

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-[#0F172A]">📈 Biểu đồ phát triển (so chuẩn WHO)</h2>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="rounded-lg bg-[#E8547A]/10 px-3 py-1.5 text-[12px] font-bold text-[#E8547A]"
        >
          {adding ? "Đóng" : "+ Cập nhật thông số"}
        </button>
      </div>

      {adding && (
        <form onSubmit={handleSubmit} className="mb-4 rounded-xl border border-[#E8547A]/25 bg-[#FFF0F5] p-3.5">
          <div className="grid grid-cols-3 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Cân nặng (kg)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.weight_g}
                onChange={(e) => setForm({ ...form, weight_g: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Chiều cao (cm)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.height_cm}
                onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Vòng đầu (cm)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.head_cm}
                onChange={(e) => setForm({ ...form, head_cm: e.target.value })}
                className={inputCls}
              />
            </label>
          </div>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="mt-3 rounded-lg bg-[#0F172A] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu chỉ số"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-[#94A3B8]">Đang tải...</p>
      ) : !latest ? (
        <p className="rounded-lg bg-black/5 p-3 text-center text-[12.5px] text-[#94A3B8]">
          Chưa có số đo nào. Bấm &quot;+ Cập nhật thông số&quot; để bắt đầu theo dõi.
        </p>
      ) : (
        <div>
          <ProgressRow label="Cân nặng" percentile={latest.weight_percentile} />
          <ProgressRow label="Chiều cao" percentile={latest.height_percentile} />
          <ProgressRow label="Vòng đầu" percentile={latest.head_percentile} />
          {latest.assessment && (
            <p className="mt-2 text-[12px] font-semibold" style={{ color: levelFromLabel(latest.assessment) }}>
              {latest.assessment}
            </p>
          )}
          <p className="mt-3 border-t border-black/10 pt-2 text-[11px] leading-relaxed text-[#94A3B8]">
            ⚠️ Kết quả mang tính tham khảo dựa trên WHO Child Growth Standards, không thay thế chẩn đoán/tư vấn của
            bác sĩ Nhi khoa. Cập nhật lần gần nhất:{" "}
            {new Date(latest.measured_at).toLocaleDateString("vi-VN")}.
          </p>
        </div>
      )}
    </div>
  );
}
