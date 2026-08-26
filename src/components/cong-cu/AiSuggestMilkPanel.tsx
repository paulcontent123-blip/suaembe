"use client";

import Link from "next/link";
import { useState } from "react";

import type { Baby } from "@/lib/babies/types";
import { ageInMonths } from "@/lib/growth/percentile";
import { CONDITIONS, CONDITION_LABEL, PRIORITIES, PRIORITY_LABEL, type Condition, type Priority } from "@/lib/ai/suggest-milk-types";
import { formatVnd } from "@/lib/format";

const BUDGET_OPTIONS: { label: string; min: number; max: number }[] = [
  { label: "Dưới 300.000đ", min: 0, max: 300000 },
  { label: "300.000–500.000đ", min: 300000, max: 500000 },
  { label: "500.000–800.000đ", min: 500000, max: 800000 },
  { label: "Trên 800.000đ", min: 800000, max: 5000000 },
];

interface ResultItem {
  rank: number;
  product_id: string;
  brand: string | null;
  name: string;
  price_vnd: number | null;
  image_url: string | null;
  match_percent: number;
  matched_priorities: string[];
  reason: string;
}

interface SuggestionResponse {
  query_summary: string;
  results: ResultItem[];
  disclaimer: string;
  fallback?: boolean;
  fallback_message?: string;
}

const inputCls =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#E8547A]";

// UC-08 - AI Gợi Ý Sữa. Public, không cần đăng nhập; nếu đã đăng nhập và có
// hồ sơ bé thì cho chọn bé để tự điền tuổi thay vì nhập tay.
export function AiSuggestMilkPanel({ babies }: { babies: Baby[] }) {
  const [babyId, setBabyId] = useState<string>("");
  const [ageMonths, setAgeMonths] = useState("7");
  const [weightG, setWeightG] = useState("8000");
  const [condition, setCondition] = useState<Condition>("binh_thuong");
  const [budgetIdx, setBudgetIdx] = useState(1);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SuggestionResponse | null>(null);

  function togglePriority(p: Priority) {
    setPriorities((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  function handleBabyChange(id: string) {
    setBabyId(id);
    const baby = babies.find((b) => b.id === id);

    if (baby?.birth_date) setAgeMonths(String(Math.round(ageInMonths(baby.birth_date))));
    if (baby?.weight_g) setWeightG(String(baby.weight_g));
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const budget = BUDGET_OPTIONS[budgetIdx];
      const res = await fetch("/api/ai/suggest-milk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baby_id: babyId || null,
          age_months: Number(ageMonths) || 0,
          weight_g: weightG.trim() ? Number(weightG) : null,
          condition,
          budget_min: budget.min,
          budget_max: budget.max,
          priorities,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Có lỗi xảy ra, vui lòng thử lại.");

        return;
      }

      setResult(data);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="mb-4 text-base font-bold text-[#0F172A]">🤖 AI Gợi ý sữa phù hợp cho bé</div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {babies.length > 0 && (
          <label className="col-span-full flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Chọn bé (tự điền tuổi)</span>
            <select value={babyId} onChange={(e) => handleBabyChange(e.target.value)} className={inputCls}>
              <option value="">— Nhập tay —</option>
              {babies.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name || "Bé chưa đặt tên"}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tuổi của bé (tháng)</span>
          <input
            type="number"
            min={0}
            max={60}
            value={ageMonths}
            onChange={(e) => setAgeMonths(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Cân nặng hiện tại (g)</span>
          <input type="number" min={0} value={weightG} onChange={(e) => setWeightG(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tình trạng bé</span>
          <select value={condition} onChange={(e) => setCondition(e.target.value as Condition)} className={inputCls}>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {CONDITION_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Ngân sách / hộp</span>
          <select value={budgetIdx} onChange={(e) => setBudgetIdx(Number(e.target.value))} className={inputCls}>
            {BUDGET_OPTIONS.map((b, i) => (
              <option key={b.label} value={i}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <div className="col-span-full flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Ưu tiên đặc biệt</span>
          <div className="flex flex-wrap gap-1.5">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePriority(p)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  priorities.includes(p)
                    ? "bg-[#E8547A] text-white"
                    : "bg-black/5 text-[#64748B] hover:bg-black/10"
                }`}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="mt-5 w-full rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {loading ? "Đang phân tích..." : "🤖 Phân tích & Gợi ý sữa phù hợp →"}
      </button>

      {error && (
        <p className="mt-3 rounded-lg bg-red-600/10 p-3 text-[12.5px] font-semibold text-red-600">{error}</p>
      )}

      {result && (
        <div className="mt-5 rounded-xl border border-[#E8547A]/20 bg-[#FFF0F5] p-4">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-[#E8547A]">
            Kết quả AI — {result.query_summary}
          </div>

          {result.fallback_message && (
            <p className="mb-3 rounded-lg bg-[#FFF7ED] p-3 text-[12.5px] font-semibold text-[#B45309]">
              {result.fallback_message}
            </p>
          )}

          {result.results.length === 0 ? (
            <p className="rounded-lg bg-white p-4 text-center text-[12.5px] text-[#64748B]">
              Chưa tìm được sản phẩm sữa nào phù hợp với tiêu chí này trong danh mục hiện tại. Thử nới ngân sách hoặc
              đổi độ tuổi.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {result.results.map((r) => (
                <div key={r.product_id} className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8547A]/10 text-sm font-black text-[#E8547A]">
                    {r.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-bold text-[#0F172A]">
                      {r.brand ? `${r.brand} ` : ""}
                      {r.name}
                    </div>
                    <div className="truncate text-[11.5px] text-[#64748B]">{r.reason}</div>
                    {r.price_vnd != null && (
                      <div className="mt-0.5 font-mono text-[12px] font-bold text-[#E8547A]">
                        {formatVnd(r.price_vnd)}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <div className="rounded bg-[#16A34A]/10 px-2 py-1 text-[12px] font-black text-[#16A34A]">
                      {result.fallback ? "Tham khảo" : `${r.match_percent}%`}
                    </div>
                    <Link href="/bach-hoa" className="text-[10.5px] font-semibold text-[#E8547A] hover:underline">
                      Xem tại Bách Hóa →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-3 text-[11px] leading-relaxed text-[#94A3B8]">💡 {result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
