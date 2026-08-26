"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "suaembe:cam-nang-sinh-con:checklist";

type ChecklistGroup = { id: string; icon: string; title: string; items: string[] };

const GROUPS: ChecklistGroup[] = [
  {
    id: "chuan-bi-sinh",
    icon: "🏥",
    title: "Chuẩn bị sinh",
    items: [
      "Hồ sơ khám thai, sổ khám thai",
      "Giấy tờ tuỳ thân, thẻ BHYT",
      "Đăng ký sinh tại bệnh viện",
      "Chuẩn bị túi đồ đi sinh",
      "Danh sách người thân hỗ trợ",
      "Tìm hiểu dấu hiệu chuyển dạ",
      "Lên kế hoạch phương án di chuyển đến viện",
    ],
  },
  {
    id: "do-dung-cho-be",
    icon: "🍼",
    title: "Đồ dùng cho bé",
    items: [
      "Quần áo sơ sinh (5-10 bộ)",
      "Tã/bỉm sơ sinh",
      "Bình sữa, dụng cụ tiệt trùng",
      "Sữa công thức dự phòng",
      "Chăn, khăn quấn bé",
      "Nôi/cũi, nệm sơ sinh",
      "Xe đẩy, ghế ngồi ô tô",
      "Đồ vệ sinh cho bé (sữa tắm, khăn ướt...)",
    ],
  },
  {
    id: "suc-khoe-me",
    icon: "💊",
    title: "Sức khoẻ mẹ",
    items: [
      "Vitamin/sắt/canxi theo chỉ định",
      "Đồ dùng cá nhân sau sinh",
      "Áo cho con bú, miếng lót sữa",
      "Tìm hiểu chăm sóc sau sinh",
      "Chuẩn bị chế độ dinh dưỡng sau sinh",
      "Tham khảo lớp học tiền sản",
      "Chuẩn bị tâm lý, nghỉ ngơi hợp lý",
    ],
  },
];

// Checklist thuần client-side, lưu vào localStorage của trình duyệt — đã
// chốt với techlead (database.md §3.1), không có bảng/API riêng.
export function PregnancyChecklistPanel() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      // ignore corrupted/unavailable storage
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {
      // ignore unavailable storage (private browsing, quota...)
    }
  }, [checked, loaded]);

  function toggle(key: string) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const totalItems = GROUPS.reduce((sum, g) => sum + g.items.length, 0);
  const totalChecked = Object.values(checked).filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-base font-bold text-[#0F172A]">📖 Cẩm nang chuẩn bị sinh con</div>
        <div className="text-[12px] font-bold text-[#E8547A]">
          {totalChecked}/{totalItems} mục
        </div>
      </div>
      <p className="mb-4 text-[12.5px] text-[#64748B]">
        Đánh dấu các mục đã chuẩn bị xong. Danh sách được lưu ngay trên trình duyệt này.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {GROUPS.map((group) => {
          const groupCheckedCount = group.items.filter((item) => checked[`${group.id}:${item}`]).length;

          return (
            <div key={group.id} className="rounded-xl border border-black/10 bg-[#FDF8FA] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-bold text-[#0F172A]">
                  {group.icon} {group.title}
                </div>
                <span className="text-[11px] font-semibold text-[#94A3B8]">
                  {groupCheckedCount}/{group.items.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {group.items.map((item) => {
                  const key = `${group.id}:${item}`;
                  const isChecked = Boolean(checked[key]);

                  return (
                    <label
                      key={key}
                      className="flex cursor-pointer items-start gap-2 rounded-lg bg-white px-2.5 py-2 text-[12.5px] leading-snug"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(key)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#E8547A]"
                      />
                      <span className={isChecked ? "text-[#94A3B8] line-through" : "text-[#334155]"}>{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
