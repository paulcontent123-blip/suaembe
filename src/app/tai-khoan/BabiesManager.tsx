"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Baby, BabyGender } from "@/lib/babies/types";

const GENDER_LABEL: Record<BabyGender, string> = {
  male: "Bé trai",
  female: "Bé gái",
  other: "Khác",
};

interface FormState {
  name: string;
  gender: BabyGender | "";
  birth_date: string;
  weight_g: string;
  height_cm: string;
  head_cm: string;
  current_milk_stage: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  gender: "",
  birth_date: "",
  weight_g: "",
  height_cm: "",
  head_cm: "",
  current_milk_stage: "",
};

function babyToForm(baby: Baby): FormState {
  return {
    name: baby.name ?? "",
    gender: baby.gender ?? "",
    birth_date: baby.birth_date ?? "",
    weight_g: baby.weight_g != null ? String(baby.weight_g) : "",
    height_cm: baby.height_cm != null ? String(baby.height_cm) : "",
    head_cm: baby.head_cm != null ? String(baby.head_cm) : "",
    current_milk_stage: baby.current_milk_stage ?? "",
  };
}

function formToPayload(form: FormState) {
  return {
    name: form.name.trim() || null,
    gender: form.gender || null,
    birth_date: form.birth_date || null,
    weight_g: form.weight_g.trim() ? Number(form.weight_g) : null,
    height_cm: form.height_cm.trim() ? Number(form.height_cm) : null,
    head_cm: form.head_cm.trim() ? Number(form.head_cm) : null,
    current_milk_stage: form.current_milk_stage.trim() || null,
  };
}

function BabyFields({
  form,
  onChange,
}: {
  form: FormState;
  onChange: (next: FormState) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
          Tên bé
        </span>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
          Giới tính
        </span>
        <select
          value={form.gender}
          onChange={(e) => onChange({ ...form, gender: e.target.value as BabyGender | "" })}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]"
        >
          <option value="">-- Chọn --</option>
          <option value="male">Bé trai</option>
          <option value="female">Bé gái</option>
          <option value="other">Khác</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
          Ngày sinh
        </span>
        <input
          type="date"
          value={form.birth_date}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => onChange({ ...form, birth_date: e.target.value })}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
          Cân nặng (g)
        </span>
        <input
          type="number"
          min={1}
          value={form.weight_g}
          onChange={(e) => onChange({ ...form, weight_g: e.target.value })}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
          Chiều cao (cm)
        </span>
        <input
          type="number"
          min={0.1}
          step={0.1}
          value={form.height_cm}
          onChange={(e) => onChange({ ...form, height_cm: e.target.value })}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
          Vòng đầu (cm)
        </span>
        <input
          type="number"
          min={0.1}
          step={0.1}
          value={form.head_cm}
          onChange={(e) => onChange({ ...form, head_cm: e.target.value })}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
          Giai đoạn sữa hiện tại
        </span>
        <input
          type="text"
          placeholder="VD: Số 2 (6-12 tháng)"
          value={form.current_milk_stage}
          onChange={(e) => onChange({ ...form, current_milk_stage: e.target.value })}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]"
        />
      </label>
    </div>
  );
}

function BabyCard({ baby, onSaved }: { baby: Baby; onSaved: (baby: Baby) => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(() => babyToForm(baby));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/babies/${baby.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPayload(form)),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Lưu thay đổi thất bại.");

        return;
      }

      onSaved(data.baby as Baby);
      setEditing(false);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="font-bold text-[#0F172A]">{baby.name || "(chưa đặt tên)"}</p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-bold text-[#E8547A] hover:underline"
          >
            Sửa
          </button>
        </div>
        <p className="mt-1 text-xs text-[#64748B]">
          {baby.gender ? GENDER_LABEL[baby.gender] : "Chưa rõ giới tính"}
          {baby.birth_date ? ` · Sinh ${baby.birth_date}` : ""}
        </p>
        <p className="mt-1 text-xs text-[#94A3B8]">
          {baby.weight_g ? `${baby.weight_g}g` : "--"} ·{" "}
          {baby.height_cm ? `${baby.height_cm}cm` : "--"} ·{" "}
          {baby.head_cm ? `vòng đầu ${baby.head_cm}cm` : "--"}
        </p>
        {baby.current_milk_stage && (
          <p className="mt-1 text-xs text-[#94A3B8]">Sữa: {baby.current_milk_stage}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E8547A]/30 bg-[#FFF0F5] p-4">
      <BabyFields form={form} onChange={setForm} />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            setForm(babyToForm(baby));
            setEditing(false);
            setError(null);
          }}
          className="rounded-lg border border-black/10 px-4 py-2 text-sm font-bold text-[#64748B]"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}

export function BabiesManager({ initialBabies }: { initialBabies: Baby[] }) {
  const router = useRouter();
  const [babies, setBabies] = useState<Baby[]>(initialBabies);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/babies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPayload(form)),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Tạo hồ sơ bé thất bại.");

        return;
      }

      setBabies((prev) => [data.baby as Baby, ...prev]);
      setForm(EMPTY_FORM);
      setCreating(false);
      router.refresh();
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      {babies.length === 0 && !creating && (
        <p className="text-sm text-[#64748B]">Bạn chưa có hồ sơ bé nào.</p>
      )}

      {babies.map((baby) => (
        <BabyCard
          key={baby.id}
          baby={baby}
          onSaved={(updated) =>
            setBabies((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
          }
        />
      ))}

      {creating ? (
        <div className="rounded-xl border border-[#E8547A]/30 bg-[#FFF0F5] p-4">
          <BabyFields form={form} onChange={setForm} />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleCreate}
              className="rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? "Đang tạo..." : "Tạo hồ sơ bé"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setForm(EMPTY_FORM);
                setCreating(false);
                setError(null);
              }}
              className="rounded-lg border border-black/10 px-4 py-2 text-sm font-bold text-[#64748B]"
            >
              Hủy
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="self-start rounded-lg border border-dashed border-[#E8547A] px-4 py-2 text-sm font-bold text-[#E8547A]"
        >
          + Thêm hồ sơ bé
        </button>
      )}
    </div>
  );
}
