"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ArticlesSection } from "@/components/admin/ArticlesSection";
import { BsNhiSection } from "@/components/admin/BsNhiSection";
import { ConsultsSection } from "@/components/admin/ConsultsSection";
import { DashboardSection } from "@/components/admin/DashboardSection";
import { ListingsSection } from "@/components/admin/ListingsSection";
import { OrdersSection } from "@/components/admin/OrdersSection";
import { PartnersSection, type PartnersTab } from "@/components/admin/PartnersSection";
import { PlaceholderSection } from "@/components/admin/PlaceholderSection";
import { ProductsSection } from "@/components/admin/ProductsSection";
import { UsersSection } from "@/components/admin/UsersSection";
import type { AdminStats } from "@/lib/admin/types";
import type { UserProfile } from "@/lib/auth/types";

type Section =
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
  id: Section;
  icon: string;
  label: string;
  /** Đếm số theo stats hiện tại (vd yêu cầu tư vấn BS chờ xử lý) — hiện dạng chấm đỏ nếu > 0. */
  badge?: (stats: AdminStats | null) => number;
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
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
      { id: "consults", icon: "💬", label: "Tư vấn BS", badge: (s) => s?.consults_pending ?? 0 },
    ],
  },
  {
    label: "Kinh doanh",
    items: [
      { id: "orders", icon: "💳", label: "Đơn hàng C2C" },
      { id: "doi-tac", icon: "🤝", label: "Đối tác", badge: (s) => s?.partner_bookings_pending ?? 0 },
      { id: "settings", icon: "⚙️", label: "Cài đặt" },
    ],
  },
];

// Các mục chưa có API/UC đứng sau (Đối tác, Cài đặt không nằm trong danh
// sách Admin APIs ở USECASE.md §6) chỉ hiện placeholder — giống chính demo
// suaembe.html cũng để các mục này ở dạng "đang phát triển", không phải giản
// lược so với demo. "Sản phẩm & Danh mục" (UC-23), "BS Nhi" (UC-22), "Đơn
// hàng C2C" (UC-12 MVP mới) và "Bài viết / Blog" (UC-21) đã có API + giao
// diện thật, không còn ở đây nữa — Escrow/tranh chấp (UC-13) là hướng phát
// triển tương lai, không thuộc MVP hiện tại nên không còn placeholder riêng.
const PLACEHOLDERS: Record<string, { icon: string; title: string; note: string }> = {
  "doi-tac": {
    icon: "🤝",
    title: "Đối tác",
    note: "Quản lý bệnh viện, bảo hiểm, đối tác (UC-19) — chưa có API quản trị trong USECASE.md §6.",
  },
  settings: {
    icon: "⚙️",
    title: "Cài đặt",
    note: "Cài đặt hệ thống SữaEmbe — chưa có trong phạm vi TechSpec hiện tại.",
  },
};

export function AdminShell({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("dashboard");
  const [loggingOut, setLoggingOut] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [partnersInitialTab, setPartnersInitialTab] = useState<PartnersTab>("partners");

  // Lấy ở đây (không phải trong DashboardSection) để sidebar cũng dùng được
  // cho badge số ở mục "Tư vấn BS" mà không phải gọi API 2 lần.
  useEffect(() => {
    async function run() {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();

        if (!res.ok) {
          setStatsError(data.error ?? "Không tải được thống kê.");

          return;
        }

        setStats(data.stats as AdminStats);
      } catch {
        setStatsError("Có lỗi xảy ra, vui lòng thử lại.");
      }
    }

    run();
  }, []);

  async function handleLogout() {
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
          <span className="text-xs text-white/45">{profile.full_name ?? profile.email}</span>
          <span className="rounded bg-[#E8547A]/25 px-2.5 py-0.5 text-[10px] font-bold text-[#F9A8BE]">
            Admin
          </span>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded border border-white/15 px-3 py-1 text-xs text-white/40 disabled:opacity-50"
          >
            {loggingOut ? "..." : "Đăng xuất"}
          </button>
        </div>
      </div>

      {/* flex-1 (thay vì grid không có chiều cao) để sidebar trắng và nền xám
          của nội dung luôn cao bằng nhau và lấp hết màn hình, tránh khoảng
          trắng/xám lệch nhau khi nội dung 1 section ngắn hơn viewport. */}
      <div className="flex flex-1">
        <div className="w-[200px] shrink-0 border-r border-black/10 bg-white py-3.5">
          <Link
            href="/"
            className="mx-3.5 mb-2 flex items-center gap-2 rounded-lg border border-black/10 px-3.5 py-2 text-[12.5px] font-semibold text-[#64748B] transition hover:border-[#E8547A] hover:text-[#E8547A]"
          >
            ← Về trang chủ
          </Link>

          {SIDEBAR.map((group) => (
            <div key={group.label}>
              <span className="mb-1 mt-3 block px-3.5 text-[9px] font-bold uppercase tracking-wide text-[#94A3B8]">
                {group.label}
              </span>
              {group.items.map((item) => {
                const badgeCount = item.badge?.(stats) ?? 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={`flex w-full items-center gap-2 border-l-2 px-3.5 py-2 text-left text-[12.5px] transition ${
                      section === item.id
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

        <div className="flex-1 bg-[#F1F5F9] p-7">
          {section === "dashboard" && (
            <DashboardSection
              stats={stats}
              error={statsError}
              onGoToListings={() => setSection("listings")}
              onGoToOrders={() => setSection("orders")}
              onGoToConsults={() => setSection("consults")}
              onGoToArticles={() => setSection("bai-viet")}
              onGoToPartners={() => {
                setPartnersInitialTab("partners");
                setSection("doi-tac");
              }}
              onGoToPartnerBookings={() => {
                setPartnersInitialTab("bookings");
                setSection("doi-tac");
              }}
            />
          )}
          {section === "san-pham" && <ProductsSection />}
          {section === "listings" && <ListingsSection />}
          {section === "bai-viet" && <ArticlesSection />}
          {section === "users" && <UsersSection currentUserId={profile.id} />}
          {section === "bs-nhi" && <BsNhiSection />}
          {section === "consults" && <ConsultsSection />}
          {section === "orders" && <OrdersSection />}
          {section === "doi-tac" && <PartnersSection initialTab={partnersInitialTab} />}
          {section !== "doi-tac" && PLACEHOLDERS[section] && <PlaceholderSection {...PLACEHOLDERS[section]} />}
        </div>
      </div>
    </div>
  );
}
