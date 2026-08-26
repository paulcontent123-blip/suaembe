"use client";

import { useState } from "react";

import { AiSuggestMilkPanel } from "@/components/cong-cu/AiSuggestMilkPanel";
import { DueDateCalculatorPanel } from "@/components/cong-cu/DueDateCalculatorPanel";
import { PregnancyChecklistPanel } from "@/components/cong-cu/PregnancyChecklistPanel";
import type { Baby } from "@/lib/babies/types";

type Tool = "ai-sua" | "du-sinh" | "cam-nang";

const TOOLS: { id: Tool; icon: string; name: string; desc: string; tag: string }[] = [
  {
    id: "ai-sua",
    icon: "🍼",
    name: "Gợi ý sữa theo AI",
    desc: "Đề xuất sữa phù hợp theo thể trạng, tuổi và nhu cầu của bé",
    tag: "AI-powered",
  },
  {
    id: "du-sinh",
    icon: "📅",
    name: "Tính ngày dự sinh",
    desc: "Tính ngày sinh dự kiến, tuần thai và các mốc quan trọng",
    tag: "Cẩm nang",
  },
  {
    id: "cam-nang",
    icon: "📖",
    name: "Cẩm nang sinh con",
    desc: "Checklist hành trang, chuẩn bị sinh và chăm sóc sau sinh",
    tag: "Mới",
  },
];

export function CongCuChoMeBrowser({ babies }: { babies: Baby[] }) {
  const [tool, setTool] = useState<Tool>("ai-sua");

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-10">
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#E8547A]">Công cụ thông minh</div>
      <h1 className="mb-6 font-serif text-3xl font-black text-[#0F172A]">
        Công cụ dành cho <em className="not-italic text-[#E8547A]">Mẹ &amp; Gia đình</em>
      </h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTool(t.id)}
            className={`rounded-2xl border p-5 text-left transition ${
              tool === t.id
                ? "border-[#E8547A] bg-[#E8547A]/5 shadow-md"
                : "border-black/10 bg-white hover:border-[#E8547A]/40 hover:shadow-sm"
            }`}
          >
            <div className="mb-2 text-3xl">{t.icon}</div>
            <div className="mb-1 text-sm font-bold text-[#0F172A]">{t.name}</div>
            <div className="mb-2.5 text-[12px] leading-relaxed text-[#64748B]">{t.desc}</div>
            <span
              className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                tool === t.id ? "bg-[#E8547A] text-white" : "bg-black/5 text-[#64748B]"
              }`}
            >
              {t.tag}
            </span>
          </button>
        ))}
      </div>

      {tool === "ai-sua" && <AiSuggestMilkPanel babies={babies} />}
      {tool === "du-sinh" && <DueDateCalculatorPanel />}
      {tool === "cam-nang" && <PregnancyChecklistPanel />}
    </div>
  );
}
