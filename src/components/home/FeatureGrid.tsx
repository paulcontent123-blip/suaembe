import Link from "next/link";

interface FeatureCard {
  icon: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  accent: "pink" | "teal";
}

// 6 thẻ theo đúng section "Tính năng nổi bật" trong demo (document/suaembe.html)
// — chỉ tham khảo bố cục/nội dung mô tả, không phải nguồn dữ liệu. Cả 6 thẻ
// giờ đều có trang thật.
const FEATURES: FeatureCard[] = [
  {
    icon: "🤖",
    title: "AI Gợi ý sữa thông minh",
    description:
      "Nhập tuổi, cân nặng, tình trạng bé → AI gợi ý top 3 loại sữa phù hợp nhất. Tính ngày dự sinh và cẩm nang sinh con.",
    cta: "Dùng ngay →",
    href: "/cong-cu-cho-me",
    accent: "pink",
  },
  {
    icon: "♻️",
    title: "Chợ Mẹ Bỉm C2C",
    description:
      "Mua bán/pass đồ mẹ bỉm: sữa dư, quần áo, xe đẩy, đồ chơi... Gửi form không cần đăng nhập, đặt mua thanh toán thường.",
    cta: "Vào chợ →",
    href: "/cho-me-be",
    accent: "pink",
  },
  {
    icon: "🛍",
    title: "Bách Hóa Mẹ & Bé",
    description:
      "Sữa bột, tã bỉm, đồ dùng ăn dặm, mỹ phẩm mẹ bé, đồ chơi phát triển — tất cả từ các nhãn uy tín với giá tốt.",
    cta: "Mua ngay →",
    href: "/bach-hoa",
    accent: "pink",
  },
  {
    icon: "👨‍⚕️",
    title: "Hỏi BS Nhi xác minh",
    description:
      "45+ Bác sĩ Nhi khoa xác minh từ DanhBaBacSi.com.vn. Tư vấn chọn sữa, dinh dưỡng và phát triển bé — phản hồi trong 2h.",
    cta: "Hỏi ngay →",
    href: "/doi-tac",
    accent: "teal",
  },
  {
    icon: "📊",
    title: "Nhật ký dinh dưỡng bé",
    description:
      "Theo dõi chiều cao, cân nặng bé theo tháng. Hệ thống nhắc đổi giai đoạn sữa tự động. Biểu đồ phát triển chuẩn WHO.",
    cta: "Mở nhật ký →",
    href: "/tin-tuc?tab=nhatky",
    accent: "pink",
  },
  {
    icon: "🤝",
    title: "Đối tác đồng hành",
    description:
      "Bệnh viện phụ sản, bảo hiểm sinh con, trang thiết bị hành trang mẹ bỉm — đối tác uy tín cho từng giai đoạn.",
    cta: "Xem đối tác →",
    href: "/doi-tac",
    accent: "teal",
  },
];

const ACCENT_TEXT = { pink: "text-[#E8547A]", teal: "text-[#0D9488]" };
const ACCENT_BORDER = { pink: "hover:border-[#E8547A]", teal: "hover:border-[#0D9488]" };

export function FeatureGrid() {
  return (
    <div className="bg-[#FDF8FA] px-7 py-16">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[#E8547A]">
          <span className="h-px w-5 bg-[#E8547A]" /> Tính năng nổi bật
        </div>
        <h2 className="mb-8 font-serif text-3xl font-black leading-tight text-[#0F172A] sm:text-4xl">
          Mọi thứ mẹ cần —<br />
          <em className="not-italic text-[#E8547A]">ở một nơi</em>
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className={`block rounded-2xl border border-black/10 bg-white p-[22px] text-left shadow-sm transition ${ACCENT_BORDER[f.accent]}`}
            >
              <div className="mb-2.5 text-[28px]">{f.icon}</div>
              <div className="mb-1.5 text-sm font-bold text-[#0F172A]">{f.title}</div>
              <div className="text-[12.5px] leading-relaxed text-[#64748B]">{f.description}</div>
              <div className={`mt-2.5 text-[11px] font-bold ${ACCENT_TEXT[f.accent]}`}>{f.cta}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
