"use client";

import { useEffect, useState } from "react";

import { AdminFrame, type AdminSection } from "@/components/admin/AdminFrame";
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

export function AdminShell({
  profile,
  initialSection = "dashboard",
}: {
  profile: UserProfile;
  initialSection?: AdminSection;
}) {
  const [section, setSection] = useState<AdminSection>(initialSection);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [partnersInitialTab, setPartnersInitialTab] = useState<PartnersTab>("partners");

  useEffect(() => {
    async function run() {
      try {
        const response = await fetch("/api/admin/stats");
        const data = await response.json();

        if (!response.ok) {
          setStatsError(data.error ?? "Không tải được thống kê.");
          return;
        }

        setStats(data.stats as AdminStats);
      } catch {
        setStatsError("Có lỗi xảy ra, vui lòng thử lại.");
      }
    }

    void run();
  }, []);

  return (
    <AdminFrame
      profile={profile}
      activeSection={section}
      stats={stats}
      onNavigate={setSection}
    >
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
    </AdminFrame>
  );
}
