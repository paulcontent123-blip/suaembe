"use client";

import { useState } from "react";

import { BrandsTab } from "@/components/admin/catalog/BrandsTab";
import { CategoriesTab } from "@/components/admin/catalog/CategoriesTab";
import { ProductsTab } from "@/components/admin/catalog/ProductsTab";

type Tab = "products" | "categories" | "brands";

const TABS: { id: Tab; label: string }[] = [
  { id: "products", label: "Sản phẩm" },
  { id: "categories", label: "Danh mục" },
  { id: "brands", label: "Nhãn hàng" },
];

// UC-23 - Quản Lý Nhãn Hàng, Danh Mục Và Sản Phẩm.
export function ProductsSection() {
  const [tab, setTab] = useState<Tab>("products");

  return (
    <div>
      <div className="mb-5 text-lg font-extrabold text-[#0F172A]">🥛 Sản phẩm &amp; Danh mục</div>

      <div className="mb-4 flex gap-1 border-b border-black/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-[13px] font-bold transition ${
              tab === t.id ? "border-[#E8547A] text-[#E8547A]" : "border-transparent text-[#64748B]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "products" && <ProductsTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "brands" && <BrandsTab />}
    </div>
  );
}
