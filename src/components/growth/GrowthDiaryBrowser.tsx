"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { FeedingScheduleCard } from "@/components/growth/FeedingScheduleCard";
import { GrowthChartCard } from "@/components/growth/GrowthChartCard";
import { MilestoneCard } from "@/components/growth/MilestoneCard";
import type { Baby } from "@/lib/babies/types";
import { ageInMonths } from "@/lib/growth/percentile";

const GENDER_LABEL: Record<string, string> = { male: "Nam", female: "Nữ", other: "Khác" };

export function ageLabel(birthDate: string | null): string {
  if (!birthDate) return "Chưa rõ ngày sinh";

  const months = ageInMonths(birthDate);

  if (months < 1) return `${Math.round(months * 30.4375)} ngày tuổi`;
  if (months < 24) return `${Math.floor(months)} tháng tuổi`;

  const years = Math.floor(months / 12);
  const rem = Math.floor(months % 12);

  return rem > 0 ? `${years} tuổi ${rem} tháng` : `${years} tuổi`;
}

// `embedded` bỏ wrapper max-width/padding + tiêu đề riêng khi component này
// được nhúng làm 1 tab bên trong trang khác (VD /tin-tuc) đã tự có
// container + <h1> của riêng trang đó — tránh lồng 2 lớp padding và 2 thẻ h1.
export function GrowthDiaryBrowser({
  initialBabies,
  embedded = false,
}: {
  initialBabies: Baby[];
  embedded?: boolean;
}) {
  const [babies] = useState<Baby[]>(initialBabies);
  const [selectedId, setSelectedId] = useState<string | null>(initialBabies[0]?.id ?? null);
  const [toast, setToast] = useState<string | null>(null);

  const selectedBaby = useMemo(() => babies.find((b) => b.id === selectedId) ?? null, [babies, selectedId]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  if (babies.length === 0) {
    return (
      <div className={embedded ? "py-10 text-center" : "mx-auto max-w-[600px] px-6 py-16 text-center"}>
        <div className="mb-3 text-5xl">👶</div>
        {!embedded && <h1 className="mb-2 font-serif text-2xl font-black text-[#0F172A]">Nhật ký Dinh dưỡng Bé</h1>}
        <p className="mb-6 text-sm text-[#64748B]">
          Bạn chưa có hồ sơ bé nào. Tạo hồ sơ bé trước để theo dõi chỉ số tăng trưởng, mốc phát triển và lịch ăn.
        </p>
        <Link
          href="/tai-khoan"
          className="inline-block rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-5 py-2.5 text-sm font-bold text-white"
        >
          + Tạo hồ sơ bé
        </Link>
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "mx-auto max-w-[1120px] px-6 py-10"}>
      {!embedded && (
        <>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#E8547A]">
            Theo dõi tăng trưởng · Mốc phát triển · Lịch ăn
          </div>
          <h1 className="mb-6 font-serif text-3xl font-black text-[#0F172A]">
            Nhật ký <em className="not-italic text-[#E8547A]">Dinh dưỡng Bé</em>
          </h1>
        </>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
        <div className="flex flex-col gap-3">
          {babies.length > 1 && (
            <select
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(e.target.value)}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#0F172A]"
            >
              {babies.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name || "Bé chưa đặt tên"}
                </option>
              ))}
            </select>
          )}

          {selectedBaby && (
            <div className="rounded-2xl border border-black/10 bg-white p-5 text-center shadow-sm">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF0F5] text-2xl">
                👶
              </div>
              <div className="text-base font-extrabold text-[#0F172A]">{selectedBaby.name || "Bé chưa đặt tên"}</div>
              <div className="mt-0.5 text-[12.5px] text-[#64748B]">
                {ageLabel(selectedBaby.birth_date)}
                {selectedBaby.gender && ` · ${GENDER_LABEL[selectedBaby.gender]}`}
              </div>

              <div className="mt-4 flex flex-col gap-1.5 border-t border-black/10 pt-3 text-left text-[12.5px]">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Cân nặng</span>
                  <span className="font-semibold text-[#0F172A]">
                    {selectedBaby.weight_g ? `${(selectedBaby.weight_g / 1000).toFixed(1)} kg ✓` : "Chưa có"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Chiều cao</span>
                  <span className="font-semibold text-[#0F172A]">
                    {selectedBaby.height_cm ? `${selectedBaby.height_cm} cm ✓` : "Chưa có"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Giai đoạn sữa</span>
                  <span className="font-semibold text-[#E8547A]">{selectedBaby.current_milk_stage || "Chưa rõ"}</span>
                </div>
              </div>

              <Link
                href="/tai-khoan"
                className="mt-4 inline-block text-[11.5px] font-semibold text-[#E8547A] hover:underline"
              >
                Sửa hồ sơ bé →
              </Link>
            </div>
          )}
        </div>

        {selectedBaby && (
          <div className="flex flex-col gap-5">
            <GrowthChartCard baby={selectedBaby} onSaved={() => showToast("Đã lưu chỉ số mới.")} />
            <FeedingScheduleCard babyId={selectedBaby.id} onSaved={() => showToast("Đã cập nhật lịch ăn.")} />
            <MilestoneCard babyId={selectedBaby.id} babyBirthDate={selectedBaby.birth_date} onSaved={() => showToast("Đã cập nhật mốc phát triển.")} />
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-7 right-7 z-[300] flex items-center gap-2 rounded-lg bg-[#16A34A] px-5 py-3 text-sm font-bold text-white shadow-2xl">
          ✅ {toast}
        </div>
      )}
    </div>
  );
}
