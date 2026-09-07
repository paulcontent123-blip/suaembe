import type { Metadata } from "next";

import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

import "./globals.css";

export const metadata: Metadata = {
  title: "SuaEmbe",
  description: "He sinh thai Me va Be cua VEA Group",
  // Xác minh quyền sở hữu site trên Google Search Console (thuộc tính dạng
  // "Tiền tố URL" — dùng thẻ HTML thay vì bản ghi DNS, vì DNS thật của domain
  // nằm ở Matbao chứ không phải Vietnix, không tiện chỉnh qua Zone Editor).
  verification: {
    google: "1Tibqz4E9mzwidlDLJaIguOa8am7yXOPN5JKWCeEx2E",
  },
};

// Nạp font qua <link> runtime (giống document/suaembe.html) thay vì
// next/font/google — next/font cần fetch Google Fonts lúc build, và mạng
// build hiện tại không kết nối được tới fonts.googleapis.com dù máy vẫn có
// mạng bình thường lúc chạy (nghi vấn IPv6, tương tự sự cố Supabase CLI).
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- rule nhắm vào Pages Router; ở đây là root layout của App Router nên áp dụng toàn site */}
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
