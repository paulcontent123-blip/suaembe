"use client";

import { useState } from "react";

import { ArticleCategoriesTab } from "@/components/admin/articles/ArticleCategoriesTab";
import { ArticlesTab } from "@/components/admin/articles/ArticlesTab";

type Tab = "articles" | "categories";

const TABS: { id: Tab; label: string }[] = [
  { id: "articles", label: "Bài viết" },
  { id: "categories", label: "Chuyên mục" },
];

// UC-21 - Quản Lý Chuyên Mục Và Bài Viết.
export function ArticlesSection() {
  const [tab, setTab] = useState<Tab>("articles");

  return (
    <div>
      <div className="mb-5 text-lg font-extrabold text-[#0F172A]">📝 Bài viết &amp; Blog</div>

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

      {tab === "articles" && <ArticlesTab />}
      {tab === "categories" && <ArticleCategoriesTab />}
    </div>
  );
}
