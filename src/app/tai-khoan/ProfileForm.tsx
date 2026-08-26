"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import type { UserProfile } from "@/lib/auth/types";

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError(null);
    setNotice(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("owner_table", "users");
      formData.append("owner_id", profile.id);
      formData.append("asset_type", "avatar");

      const uploadRes = await fetch("/api/uploads", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        setError(uploadData.error ?? "Upload ảnh thất bại.");

        return;
      }

      const newAvatarUrl = uploadData.asset.secure_url as string;

      const profileRes = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: newAvatarUrl }),
      });
      const profileData = await profileRes.json();

      if (!profileRes.ok) {
        setError(profileData.error ?? "Cập nhật ảnh đại diện thất bại.");

        return;
      }

      setAvatarUrl(newAvatarUrl);
      router.refresh();
    } catch {
      setError("Có lỗi xảy ra khi upload ảnh.");
    } finally {
      setUploading(false);

      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Lưu thay đổi thất bại.");

        return;
      }

      setNotice("Đã lưu thay đổi.");
      router.refresh();
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl bg-[#FFF0F5] p-4">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#E8547A] text-white flex items-center justify-center text-lg font-bold">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Ảnh đại diện" className="h-full w-full object-cover" />
          ) : (
            (profile.full_name ?? profile.email).charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            disabled={uploading}
            className="text-xs text-[#64748B]"
          />
          <p className="mt-1 text-[11px] text-[#94A3B8]">
            {uploading ? "Đang upload..." : "JPEG/PNG/WEBP/GIF, tối đa 5MB"}
          </p>
        </div>
      </div>

      <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
            Họ tên
          </span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
            Số điện thoại
          </span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#E8547A]"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {notice && <p className="text-sm text-emerald-600">{notice}</p>}

        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>
    </div>
  );
}
