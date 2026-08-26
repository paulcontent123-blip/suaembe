"use client";

import Link from "next/link";
import { useState } from "react";

interface FooterLink {
  label: string;
  href?: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

// Bố cục 4 cột theo đúng footer demo (document/suaembe.html, chỉ tham khảo
// hình ảnh/bố cục — không phải nguồn dữ liệu). Cột "Tính năng" và 4/5 mục
// cột "Đối tác" đã có trang thật, còn deep-link thẳng tới đúng tab tương ứng
// ở /doi-tac (?tab=hospital/insurance/equipment/service/doctor) thay vì chỉ
// mở trang mặc định. "Danh mục sữa" (lọc theo độ tuổi cụ thể), "Hỗ trợ" và
// "DanhBaBacSi.com.vn" (đối tác ngoài SuaEmbe, chưa có link thật) chưa có
// route/API nên không href, bấm vào chỉ hiện toast "đang phát triển" — giống
// đúng cách SiteNav xử lý các mục nav chưa triển khai, tránh dẫn tới trang chết.
const COLUMNS: FooterColumn[] = [
  {
    title: "Tính năng",
    links: [
      { label: "AI Gợi ý sữa", href: "/cong-cu-cho-me" },
      { label: "Chợ Mẹ Bỉm", href: "/cho-me-be" },
      { label: "Bách Hóa Mẹ & Bé", href: "/bach-hoa" },
      { label: "Hỏi BS Nhi", href: "/doi-tac?tab=doctor" },
      { label: "Nhật ký Bé", href: "/tin-tuc?tab=nhatky" },
    ],
  },
  {
    title: "Danh mục sữa",
    links: [
      { label: "Sữa 0–6 tháng" },
      { label: "Sữa 6–12 tháng" },
      { label: "Sữa 1–3 tuổi" },
      { label: "Sữa bầu" },
      { label: "Sữa đặc trị" },
    ],
  },
  {
    title: "Đối tác",
    links: [
      { label: "Bệnh viện phụ sản", href: "/doi-tac?tab=hospital" },
      { label: "Bảo hiểm sinh con", href: "/doi-tac?tab=insurance" },
      { label: "Hành trang mẹ bỉm", href: "/doi-tac?tab=equipment" },
      { label: "Dịch vụ Mẹ & Bé", href: "/doi-tac?tab=service" },
      // Đối tác thật ngoài SuaEmbe, chưa có trang/link thật để trỏ tới —
      // giữ như mục "sắp ra mắt" (toast) tới khi có đích đến thật.
      { label: "DanhBaBacSi.com.vn" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Hướng dẫn sử dụng" },
      { label: "Chính sách đặt mua & pass đồ" },
      { label: "Liên hệ hỗ trợ" },
      { label: "Bảo mật dữ liệu" },
    ],
  },
];

export function SiteFooter() {
  const [toast, setToast] = useState<string | null>(null);

  function showComingSoon() {
    setToast("Tính năng đang được phát triển, sẽ ra mắt sớm.");
    window.setTimeout(() => setToast(null), 2500);
  }

  return (
    <footer className="bg-[#0F172A] px-7 pb-6 pt-10 text-white/60">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-7 grid grid-cols-2 gap-10 border-b border-white/[0.08] pb-7 sm:grid-cols-3 lg:grid-cols-[1fr_repeat(4,auto)]">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <div className="mb-2 font-serif text-lg font-black text-white">
              Sữa<em className="not-italic text-[#E8547A]">Embe</em>
            </div>
            <p className="max-w-[220px] text-[12.5px] leading-relaxed text-white/45">
              Hệ sinh thái Mẹ &amp; Bé Việt Nam — So sánh sữa, Chợ C2C, Hỏi BS Nhi và đối tác đồng
              hành từ mang thai đến nuôi con. Thành viên VEA Group.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-white/50">
                {col.title}
              </h4>
              <div className="flex flex-col gap-1.5">
                {col.links.map((link) =>
                  link.href ? (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="text-[12.5px] text-white/45 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <button
                      key={link.label}
                      type="button"
                      onClick={showComingSoon}
                      className="text-left text-[12.5px] text-white/45 transition hover:text-white"
                    >
                      {link.label}
                    </button>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
          <span>© 2026 SuaEmbe.com · Thành viên VEA Group · 🇻🇳</span>
          <span className="flex items-center gap-1 text-white/60">
            <button type="button" onClick={showComingSoon} className="hover:text-white">
              Bảo mật · Điều khoản · Cookie
            </button>
            <span aria-hidden>·</span>
            <Link href="/sitemap.xml" className="hover:text-white">
              Sitemap
            </Link>
          </span>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-7 right-7 z-[300] rounded-lg bg-[#E8547A] px-5 py-3 text-sm font-semibold text-white shadow-2xl">
          {toast}
        </div>
      )}
    </footer>
  );
}
