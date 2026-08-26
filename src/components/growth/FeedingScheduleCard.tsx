"use client";

import { useEffect, useState } from "react";

import type { FeedingScheduleItem } from "@/lib/growth/types";

const inputCls =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]";

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  pending: { label: "Chưa đến", cls: "bg-black/5 text-[#64748B]" },
  upcoming: { label: "Sắp đến", cls: "bg-[#E8547A]/10 text-[#E8547A]" },
  done: { label: "✓ Xong", cls: "bg-[#16A34A]/10 text-[#16A34A]" },
  skipped: { label: "Đã bỏ qua", cls: "bg-black/5 text-[#94A3B8]" },
  cancelled: { label: "Đã huỷ", cls: "bg-red-600/10 text-red-600" },
};

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// UC-06 - Quản Lý Lịch Ăn/Sữa/Ăn Dặm. Chỉ làm phần CRUD lõi (bước 1-3, 6 của
// UC-06) — không tạo `notifications`/gửi push (bước 4-5), giống cách UC-11
// cũng chưa gắn notifications thật.
export function FeedingScheduleCard({ babyId, onSaved }: { babyId: string; onSaved: () => void }) {
  const [items, setItems] = useState<FeedingScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", scheduled_time: "", meal_type: "Sữa công thức", amount_ml: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);

    try {
      const res = await fetch(`/api/babies/${babyId}/feeding-schedule?date=${todayDate()}`);
      const data = await res.json();

      if (res.ok) setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    setAdding(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [babyId]);

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError("Cần nhập tên bữa ăn.");

      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/babies/${babyId}/feeding-schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          scheduled_date: todayDate(),
          scheduled_time: form.scheduled_time || null,
          meal_type: form.meal_type,
          amount_ml: form.amount_ml.trim() ? Number(form.amount_ml) : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Thêm lịch ăn thất bại.");

        return;
      }

      setItems((prev) => [...prev, data.item].sort((a, b) => (a.scheduled_time ?? "").localeCompare(b.scheduled_time ?? "")));
      setForm({ title: "", scheduled_time: "", meal_type: "Sữa công thức", amount_ml: "" });
      setAdding(false);
      onSaved();
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  async function markStatus(itemId: string, status: "done" | "skipped" | "cancelled") {
    try {
      const res = await fetch(`/api/babies/${babyId}/feeding-schedule/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();

      if (!res.ok) return;

      setItems((prev) => prev.map((it) => (it.id === itemId ? data.item : it)));
      onSaved();
    } catch {
      // giữ nguyên UI, không chặn thao tác khác nếu lỗi mạng tạm thời
    }
  }

  async function deleteItem(itemId: string) {
    if (!window.confirm("Xóa lịch ăn này?")) return;

    setDeletingId(itemId);

    try {
      const res = await fetch(`/api/babies/${babyId}/feeding-schedule/${itemId}`, { method: "DELETE" });

      if (!res.ok) return;

      setItems((prev) => prev.filter((it) => it.id !== itemId));
      onSaved();
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteAllToday() {
    if (items.length === 0) return;
    if (!window.confirm("Xóa toàn bộ lịch ăn hôm nay?")) return;

    setDeletingAll(true);

    try {
      const res = await fetch(`/api/babies/${babyId}/feeding-schedule?date=${todayDate()}`, { method: "DELETE" });

      if (!res.ok) return;

      setItems([]);
      onSaved();
    } finally {
      setDeletingAll(false);
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-[#0F172A]">🍽 Lịch ăn dặm hôm nay</h2>
        {items.length > 0 && (
          <button
            type="button"
            onClick={deleteAllToday}
            disabled={deletingAll}
            className="rounded-lg bg-red-600/10 px-3 py-1.5 text-[12px] font-bold text-red-600 disabled:opacity-60"
          >
            {deletingAll ? "Đang xóa..." : "Xóa hết"}
          </button>
        )}
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="rounded-lg bg-[#E8547A]/10 px-3 py-1.5 text-[12px] font-bold text-[#E8547A]"
        >
          {adding ? "Đóng" : "+ Thêm bữa"}
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="mb-4 rounded-xl border border-[#E8547A]/25 bg-[#FFF0F5] p-3.5">
          <div className="grid grid-cols-2 gap-2">
            <label className="col-span-2 flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Tên bữa *</span>
              <input
                placeholder="VD: Sữa công thức, Cháo rau củ..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Giờ</span>
              <input
                type="time"
                value={form.scheduled_time}
                onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Lượng sữa (ml, nếu có)</span>
              <input
                type="number"
                min="0"
                value={form.amount_ml}
                onChange={(e) => setForm({ ...form, amount_ml: e.target.value })}
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
            {saving ? "Đang lưu..." : "Thêm vào lịch"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-[#94A3B8]">Đang tải...</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg bg-black/5 p-3 text-center text-[12.5px] text-[#94A3B8]">
          Chưa có lịch ăn nào hôm nay.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-[#F8FAFC] px-3 py-2.5"
            >
              <div>
                <span className="text-[13px] font-semibold text-[#0F172A]">
                  {item.scheduled_time ? item.scheduled_time.slice(0, 5) : "--:--"} — {item.title}
                </span>
                {item.amount_ml && <span className="ml-1 text-[11.5px] text-[#64748B]">({item.amount_ml}ml)</span>}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {item.status === "pending" || item.status === "upcoming" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => markStatus(item.id, "done")}
                      className="rounded px-2 py-1 text-[10.5px] font-bold text-[#16A34A] hover:bg-[#16A34A]/10"
                    >
                      ✓ Xong
                    </button>
                    <button
                      type="button"
                      onClick={() => markStatus(item.id, "skipped")}
                      className="rounded px-2 py-1 text-[10.5px] font-bold text-[#94A3B8] hover:bg-black/5"
                    >
                      Bỏ qua
                    </button>
                  </>
                ) : (
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${STATUS_STYLE[item.status].cls}`}>
                    {STATUS_STYLE[item.status].label}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => deleteItem(item.id)}
                  disabled={deletingId === item.id}
                  className="rounded px-2 py-1 text-[10.5px] font-bold text-red-600 hover:bg-red-600/10 disabled:opacity-60"
                >
                  {deletingId === item.id ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
