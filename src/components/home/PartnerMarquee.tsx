const MILK_BRANDS = [
  "🥛 Aptamil",
  "🥛 Nan Nestlé",
  "🥛 Enfamil",
  "🥛 Friso Gold",
  "🥛 Vinamilk",
  "🥛 HiPP Organic",
  "🥛 Abbott Similac",
  "🥛 Meiji",
  "🥛 Wakodo",
  "🥛 Morinaga",
];

const PARTNERS: { label: string; cls: string }[] = [
  { label: "🏥 BV Từ Dũ", cls: "bg-[#E8547A]/10 border-[#E8547A]/25 text-[#E8547A]" },
  { label: "🛡 Prudential", cls: "bg-[#0D9488]/10 border-[#0D9488]/20 text-[#0D9488]" },
  { label: "🛒 Mamago", cls: "bg-[#D97706]/10 border-[#D97706]/20 text-[#D97706]" },
  { label: "📦 Pampers", cls: "bg-[#16A34A]/10 border-[#16A34A]/20 text-[#16A34A]" },
  { label: "🏥 BV Nhi Đồng", cls: "bg-[#E8547A]/10 border-[#E8547A]/25 text-[#E8547A]" },
  { label: "🛡 FWD BH", cls: "bg-[#7C3AED]/10 border-[#7C3AED]/15 text-[#7C3AED]" },
  { label: "🧸 Fisher-Price", cls: "bg-[#0D9488]/10 border-[#0D9488]/20 text-[#0D9488]" },
  { label: "👶 Huggies", cls: "bg-[#D97706]/10 border-[#D97706]/20 text-[#D97706]" },
];

export function PartnerMarquee() {
  return (
    <div className="border-b border-black/10 bg-white py-7">
      <div className="mx-auto max-w-[1120px] px-7">
        <div className="mb-4 text-center text-[11px] font-bold uppercase tracking-[1.5px] text-[#94A3B8]">
          Nhãn sữa &amp; Đối tác tin cậy
        </div>

        <div className="marquee-mask overflow-hidden">
          <div className="animate-marquee-left flex w-max gap-3">
            {[...MILK_BRANDS, ...MILK_BRANDS].map((b, i) => (
              <div
                key={`${b}-${i}`}
                className="whitespace-nowrap rounded-3xl border border-black/10 bg-white px-4 py-2 text-[12.5px] font-semibold text-[#0F172A]"
              >
                {b}
              </div>
            ))}
          </div>
        </div>

        <div className="marquee-mask mt-2 overflow-hidden">
          <div className="animate-marquee-right flex w-max gap-3">
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <div
                key={`${p.label}-${i}`}
                className={`whitespace-nowrap rounded-3xl border px-4 py-2 text-[12.5px] font-semibold ${p.cls}`}
              >
                {p.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
