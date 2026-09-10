"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import type { AdminStats } from "@/lib/admin/types";
import type { UserProfile } from "@/lib/auth/types";

export type AdminSection =
  | "dashboard"
  | "san-pham"
  | "listings"
  | "bai-viet"
  | "users"
  | "bs-nhi"
  | "consults"
  | "orders"
  | "doi-tac"
  | "settings";

interface SidebarItem {
  id: AdminSection;
  icon: string;
  label: string;
  badge?: (stats: AdminStats | null) => number;
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

interface AdminFrameProps {
  profile: UserProfile;
  activeSection: AdminSection;
  children: ReactNode;
  onNavigate: (section: AdminSection) => void;
  beforeLeave?: () => boolean | Promise<boolean>;
  stats?: AdminStats | null;
  contentClassName?: string;
}

const SIDEBAR: SidebarGroup[] = [
  { label: "Tổng quan", items: [{ id: "dashboard", icon: "📊", label: "Dashboard" }] },
  {
    label: "Nội dung",
    items: [
      { id: "san-pham", icon: "🥛", label: "Sản phẩm & Danh mục" },
      { id: "listings", icon: "♻️", label: "Tin chợ C2C" },
      { id: "bai-viet", icon: "📝", label: "Bài viết / Blog" },
    ],
  },
  {
    label: "Người dùng",
    items: [
      { id: "users", icon: "👩", label: "Mẹ bỉm" },
      { id: "bs-nhi", icon: "👨‍⚕️", label: "BS Nhi" },
      { id: "consults", icon: "💬", label: "Tư vấn BS", badge: (value) => value?.consults_pending ?? 0 },
    ],
  },
  {
    label: "Kinh doanh",
    items: [
      { id: "orders", icon: "💳", label: "Đơn hàng C2C" },
      { id: "doi-tac", icon: "🤝", label: "Đối tác", badge: (value) => value?.partner_bookings_pending ?? 0 },
      { id: "settings", icon: "⚙️", label: "Cài đặt" },
    ],
  },
];

export function AdminFrame({
  profile,
  activeSection,
  children,
  onNavigate,
  beforeLeave,
  stats,
  contentClassName = "p-7",
}: AdminFrameProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [loadedStats, setLoadedStats] = useState<AdminStats | null>(null);
  const sidebarStats = stats === undefined ? loadedStats : stats;

  useEffect(() => {
    if (stats !== undefined) return;

    const controller = new AbortController();

    async function loadStats() {
      try {
        const response = await fetch("/api/admin/stats", { signal: controller.signal });
        const data = await response.json();

        if (response.ok) setLoadedStats(data.stats as AdminStats);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setLoadedStats(null);
        }
      }
    }

    void loadStats();

    return () => controller.abort();
  }, [stats]);

  async function mayLeave(): Promise<boolean> {
    return beforeLeave ? await beforeLeave() : true;
  }

  async function handleHome() {
    if (!(await mayLeave())) return;
    router.push("/");
  }

  async function handleLogout() {
    if (!(await mayLeave())) return;
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F1F5F9]">
      <div className="flex items-center justify-between bg-[#0F172A] px-7 py-3.5">
        <div className="font-serif text-base font-black text-white">
          Sữa<em className="not-italic text-[#E8547A]">Embe</em> — Quản trị
        </div>
        <div className="flex items-center gap-2.5">
          <span className="hidden text-xs text-white/45 sm:inline">{profile.full_name ?? profile.email}</span>
          <span className="rounded bg-[#E8547A]/25 px-2.5 py-0.5 text-[10px] font-bold text-[#F9A8BE]">
            Admin
          </span>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="rounded border border-white/15 px-3 py-1 text-xs text-white/40 disabled:opacity-50"
          >
            {loggingOut ? "..." : "Đăng xuất"}
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        <div className="w-[200px] shrink-0 border-r border-black/10 bg-white py-3.5">
          <button
            type="button"
            onClick={() => void handleHome()}
            className="mx-3.5 mb-2 flex w-[172px] items-center gap-2 rounded-lg border border-black/10 px-3.5 py-2 text-left text-[12.5px] font-semibold text-[#64748B] transition hover:border-[#E8547A] hover:text-[#E8547A]"
          >
            ← Về trang chủ
          </button>

          {SIDEBAR.map((group) => (
            <div key={group.label}>
              <span className="mb-1 mt-3 block px-3.5 text-[9px] font-bold uppercase tracking-wide text-[#94A3B8]">
                {group.label}
              </span>
              {group.items.map((item) => {
                const badgeCount = item.badge?.(sidebarStats) ?? 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className={`flex w-full items-center gap-2 border-l-2 px-3.5 py-2 text-left text-[12.5px] transition ${
                      activeSection === item.id
                        ? "border-[#E8547A] bg-[#E8547A]/10 font-bold text-[#E8547A]"
                        : "border-transparent text-[#64748B] hover:bg-[#E8547A]/5 hover:text-[#E8547A]"
                    }`}
                  >
                    <span className="w-4 text-center">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {badgeCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E8547A] px-1 text-[9.5px] font-bold text-white">
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className={`min-w-0 flex-1 bg-[#F1F5F9] ${contentClassName}`}>{children}</div>
      </div>
    </div>
  );
}
