"use client";

import { useEffect, useMemo, useState } from "react";

import { ageInMonths } from "@/lib/growth/percentile";
import type { BabyMilestoneRecord, DevelopmentMilestone, MilestoneStatus } from "@/lib/growth/types";

const STATUS_OPTIONS: { value: MilestoneStatus; label: string }[] = [
  { value: "not_observed", label: "Chưa quan sát" },
  { value: "in_progress", label: "Đang phát triển" },
  { value: "achieved", label: "Đã đạt" },
  { value: "delayed", label: "Chậm hơn dự kiến" },
];

const STATUS_CLS: Record<MilestoneStatus, string> = {
  not_observed: "border-black/10 text-[#94A3B8]",
  in_progress: "border-[#D97706]/40 text-[#D97706]",
  achieved: "border-[#16A34A]/40 text-[#16A34A] bg-[#16A34A]/5",
  delayed: "border-red-600/40 text-red-600",
};

// UC-05 - Theo Dõi Mốc Phát Triển Của Bé. Hiển thị đúng 1 mốc tháng tuổi gần
// nhất với tuổi hiện tại của bé (làm tròn xuống) — giống cách demo suaembe.html
// hiện "Cột mốc phát triển 7 tháng" chỉ cho đúng 1 mốc, không liệt kê hết
// mọi mốc từ sơ sinh tới hiện tại.
export function MilestoneCard({
  babyId,
  babyBirthDate,
  onSaved,
}: {
  babyId: string;
  babyBirthDate: string | null;
  onSaved: () => void;
}) {
  const [milestones, setMilestones] = useState<DevelopmentMilestone[]>([]);
  const [records, setRecords] = useState<BabyMilestoneRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);

    try {
      const res = await fetch(`/api/babies/${babyId}/milestones`);
      const data = await res.json();

      if (res.ok) {
        setMilestones(data.milestones ?? []);
        setRecords(data.records ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [babyId]);

  const currentAgeMonths = babyBirthDate ? Math.floor(ageInMonths(babyBirthDate)) : null;

  const targetAgeMonths = useMemo(() => {
    if (milestones.length === 0) return null;

    const buckets = [...new Set(milestones.map((m) => m.age_months))].sort((a, b) => a - b);

    if (currentAgeMonths === null) return buckets[0];

    const eligible = buckets.filter((b) => b <= currentAgeMonths);

    return eligible.length > 0 ? eligible[eligible.length - 1] : buckets[0];
  }, [milestones, currentAgeMonths]);

  const visibleMilestones = milestones.filter((m) => m.age_months === targetAgeMonths);

  async function changeStatus(milestoneId: string, status: MilestoneStatus) {
    setSavingId(milestoneId);

    try {
      const res = await fetch(`/api/babies/${babyId}/milestones/${milestoneId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();

      if (!res.ok) return;

      setRecords((prev) => {
        const others = prev.filter((r) => r.milestone_id !== milestoneId);

        return [...others, data.record];
      });
      onSaved();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-[15px] font-bold text-[#0F172A]">
        🎯 Cột mốc phát triển{targetAgeMonths !== null ? ` ${targetAgeMonths} tháng` : ""}
      </h2>

      {loading ? (
        <p className="text-sm text-[#94A3B8]">Đang tải...</p>
      ) : visibleMilestones.length === 0 ? (
        <p className="rounded-lg bg-black/5 p-3 text-center text-[12.5px] text-[#94A3B8]">
          Chưa có dữ liệu mốc phát triển cho độ tuổi này.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {visibleMilestones.map((m) => {
            const record = records.find((r) => r.milestone_id === m.id);
            const status = record?.status ?? "not_observed";

            return (
              <div key={m.id} className={`rounded-lg border p-2.5 ${STATUS_CLS[status]}`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[13px] font-semibold text-[#0F172A]">{m.title}</div>
                    {m.description && <div className="mt-0.5 text-[11.5px] text-[#64748B]">{m.description}</div>}
                    <div className="mt-0.5 text-[10px] uppercase tracking-wide text-[#94A3B8]">{m.category}</div>
                  </div>
                  <select
                    value={status}
                    disabled={savingId === m.id}
                    onChange={(e) => changeStatus(m.id, e.target.value as MilestoneStatus)}
                    className="shrink-0 rounded-lg border border-black/10 bg-white px-2 py-1 text-[11px] font-semibold text-[#0F172A]"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-3 border-t border-black/10 pt-2 text-[11px] leading-relaxed text-[#94A3B8]">
        ⚠️ Mốc phát triển mang tính tham khảo — mỗi bé phát triển theo nhịp độ riêng. Nếu bé chưa đạt mốc quá lâu so
        với dự kiến, nên trao đổi với bác sĩ Nhi khoa.
      </p>
    </div>
  );
}
