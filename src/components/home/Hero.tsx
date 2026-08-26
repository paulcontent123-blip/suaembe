import Link from "next/link";

const STATS = [
  { n: "200+", l: "Loại sữa so sánh" },
  { n: "12K+", l: "Review xác minh" },
  { n: "45+", l: "BS Nhi xác minh" },
  { n: "50K+", l: "Mẹ bỉm tham gia" },
];

const ACTIVITY = [
  { ico: "🥛", bg: "bg-[#E8547A]/10", name: "Aptamil Pronutra 2 · 800g", sub: "Mẹ Linh · HCM · 2h trước", badge: "Vừa bán", badgeCls: "bg-[#0D9488]/10 text-[#0D9488]" },
  { ico: "👕", bg: "bg-[#16A34A]/10", name: "Set quần áo bé 3-6 tháng", sub: "Mẹ Hoa · Hà Nội · 4h trước", badge: "Mới đăng", badgeCls: "bg-[#E8547A]/10 text-[#E8547A]" },
  { ico: "🛒", bg: "bg-[#D97706]/10", name: "Xe đẩy Joie Chrome", sub: "Mẹ Mai · ĐN · 5h trước", badge: "Đã đặt mua", badgeCls: "bg-[#16A34A]/10 text-[#16A34A]" },
  { ico: "👨‍⚕️", bg: "bg-[#0D9488]/10", name: "BS. Nguyễn Thị Thanh", sub: "Phản hồi tư vấn · 1h trước", badge: "Online", badgeCls: "bg-[#0D9488]/10 text-[#0D9488]" },
];

// Cả 3 nút đều có trang thật: "Gợi ý sữa miễn phí" (UC-08) trỏ
// /cong-cu-cho-me, "Vào Chợ Mẹ Bỉm" (UC-09) và "Bách Hóa Mẹ & Bé" (UC-07)
// điều hướng thẳng.
export function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#FDF0F4] via-[#FFF8FA] to-[#F0FDF9] px-7 pb-15 pt-20">
      <div className="pointer-events-none absolute -right-20 -top-15 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(232,84,122,.1),transparent_70%)]" />
      <div className="pointer-events-none absolute -bottom-10 -left-15 h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(13,148,136,.08),transparent_70%)]" />

      <div className="relative z-[1] mx-auto grid max-w-[1120px] items-center gap-12 lg:grid-cols-[1fr_420px]">
        <div>
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#E8547A]/25 bg-[#E8547A]/10 px-3.5 py-1.5 text-xs font-bold text-[#E8547A]">
            🇻🇳 Dành riêng cho mẹ bỉm Việt Nam
          </div>
          <h1 className="mb-4 font-serif text-4xl font-black leading-[1.1] text-[#0F172A] sm:text-5xl">
            Hành trình
            <br />
            nuôi con —
            <br />
            <em className="text-[#E8547A] not-italic">trọn vẹn hơn.</em>
          </h1>
          <p className="mb-7 max-w-[520px] text-base leading-relaxed text-[#64748B]">
            So sánh sữa bằng AI · Chợ mẹ bỉm đa ngành · Hỏi BS Nhi · Nhật ký dinh dưỡng · Đối tác
            từ A đến Z trong hành trình mang thai và nuôi con.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/cong-cu-cho-me"
              className="rounded-[10px] bg-gradient-to-br from-[#E8547A] to-[#C43A62] px-6 py-3.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              🤖 Gợi ý sữa miễn phí
            </Link>
            <Link
              href="/cho-me-be"
              className="rounded-[10px] bg-gradient-to-br from-[#0D9488] to-[#0a7c72] px-6 py-3.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              ♻️ Vào Chợ Mẹ Bỉm
            </Link>
            <Link
              href="/bach-hoa"
              className="rounded-[10px] border-[1.5px] border-[#CBD5E1] px-6 py-3.5 text-sm font-bold text-[#64748B] transition hover:border-[#E8547A] hover:text-[#E8547A]"
            >
              🛍 Bách Hóa Mẹ &amp; Bé
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.l}
                className="rounded-xl border border-black/10 bg-white/70 p-3.5 text-center backdrop-blur-sm"
              >
                <div className="font-mono text-xl font-black text-[#0F172A]">{s.n}</div>
                <div className="mt-0.5 text-[11px] text-[#64748B]">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[18px] border border-black/10 bg-white p-5 shadow-2xl">
          <div className="mb-3.5 flex items-center gap-1.5 border-b border-black/10 pb-2.5 text-[13px] font-bold text-[#0F172A]">
            ⚡ Hoạt động gần đây
          </div>
          {ACTIVITY.map((a) => (
            <div key={a.name} className="flex items-center gap-2.5 border-b border-black/10 py-2.5 last:border-b-0">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-lg ${a.bg}`}>
                {a.ico}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-[#0F172A]">{a.name}</div>
                <div className="text-[11px] text-[#64748B]">{a.sub}</div>
              </div>
              <div className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${a.badgeCls}`}>
                {a.badge}
              </div>
            </div>
          ))}
          <div className="mt-3.5 border-t border-black/10 pt-3">
            <div className="mb-2 text-[11.5px] text-[#64748B]">
              AI đang gợi ý sữa cho bé 7 tháng hay táo bón...
            </div>
            <div className="rounded-lg border border-[#E8547A]/25 bg-[#E8547A]/10 px-3 py-2.5">
              <div className="mb-1 text-[11px] font-bold text-[#E8547A]">#1 Phù hợp 96%</div>
              <div className="text-[12.5px] font-semibold text-[#0F172A]">
                Aptamil Pronutra Advance 2
              </div>
              <div className="text-[11.5px] text-[#64748B]">GOS/FOS prebiotics · Hỗ trợ tiêu hoá</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
