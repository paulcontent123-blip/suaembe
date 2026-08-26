import type { AdminStats } from "@/lib/admin/types";

interface StatCard {
  icon: string;
  label: string;
  value: (s: AdminStats) => number;
  delta?: (s: AdminStats) => string;
}

// 4 thẻ khớp bố cục demo (Mẹ bỉm / Tin chợ C2C / [Bách Hóa thay cho Review —
// hệ thống chưa có bảng review] / BS Nhi). Dòng "+X tuần này"/"+X hôm nay"
// tính thật từ created_at, không phải số cố định như demo.
const STAT_CARDS: StatCard[] = [
  {
    icon: "👩",
    label: "Mẹ bỉm đăng ký",
    value: (s) => s.users_total,
    delta: (s) => `+${s.users_new_7d} tuần này`,
  },
  {
    icon: "♻️",
    label: "Tin chợ C2C",
    value: (s) => s.listings_total,
    delta: (s) => `+${s.listings_new_today} hôm nay`,
  },
  {
    icon: "🛍",
    label: "Sản phẩm Bách Hóa",
    value: (s) => s.products_total,
    delta: (s) => `+${s.products_new_7d} tuần này`,
  },
  {
    icon: "👨‍⚕️",
    label: "BS Nhi trong hệ thống",
    value: (s) => s.bs_nhi_total,
  },
];

export function DashboardSection({
  stats,
  error,
  onGoToListings,
  onGoToOrders,
  onGoToConsults,
  onGoToArticles,
  onGoToPartners,
  onGoToPartnerBookings,
}: {
  stats: AdminStats | null;
  error: string | null;
  onGoToListings: () => void;
  onGoToOrders: () => void;
  onGoToConsults: () => void;
  onGoToArticles: () => void;
  onGoToPartners: () => void;
  onGoToPartnerBookings: () => void;
}) {
  return (
    <div>
      <div className="mb-5 text-lg font-extrabold text-[#0F172A]">📊 Dashboard</div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_CARDS.map((c) => (
          <div key={c.label} className="rounded-xl border border-black/10 bg-white p-5">
            <div className="font-mono text-[28px] font-black leading-tight text-[#0F172A]">
              {stats ? c.value(stats).toLocaleString("vi-VN") : "—"}
            </div>
            <div className="mt-1.5 text-[12px] text-[#64748B]">{c.label}</div>
            {c.delta && stats && (
              <div className="mt-0.5 text-[11px] font-bold text-[#16A34A]">{c.delta(stats)}</div>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-5">
          <div className="mb-3 text-sm font-bold text-[#0F172A]">⏳ Cần xử lý</div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between rounded-lg border border-[#E8547A]/25 bg-[#E8547A]/10 px-3.5 py-2.5 text-[12.5px]">
              <span className="text-[#0F172A]">Tin C2C chờ duyệt</span>
              <strong className="text-[#E8547A]">{stats?.listings_pending ?? "—"}</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#E8547A]/25 bg-[#E8547A]/10 px-3.5 py-2.5 text-[12.5px]">
              <span className="text-[#0F172A]">Yêu cầu tư vấn BS chờ xử lý</span>
              <strong className="text-[#E8547A]">{stats?.consults_pending ?? "—"}</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#E8547A]/25 bg-[#E8547A]/10 px-3.5 py-2.5 text-[12.5px]">
              <span className="text-[#0F172A]">Đơn hàng C2C chờ xử lý</span>
              <strong className="text-[#E8547A]">{stats?.orders_pending_review ?? "—"}</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#E8547A]/25 bg-[#E8547A]/10 px-3.5 py-2.5 text-[12.5px]">
              <span className="text-[#0F172A]">Lead &amp; Booking đối tác chờ xử lý</span>
              <strong className="text-[#E8547A]">{stats?.partner_bookings_pending ?? "—"}</strong>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5">
          <div className="mb-3 text-sm font-bold text-[#0F172A]">⚡ Truy cập nhanh</div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onGoToListings}
              className="w-full rounded-lg border border-[#E8547A]/25 bg-[#E8547A]/10 px-3.5 py-2.5 text-left text-[12.5px] font-bold text-[#E8547A]"
            >
              ♻️ Duyệt tin chợ C2C ({stats?.listings_pending ?? "…"} chờ)
            </button>
            <button
              type="button"
              onClick={onGoToOrders}
              className="w-full rounded-lg border border-[#E8547A]/25 bg-[#E8547A]/10 px-3.5 py-2.5 text-left text-[12.5px] font-bold text-[#E8547A]"
            >
              💳 Xử lý đơn hàng C2C ({stats?.orders_pending_review ?? "…"} chờ)
            </button>
            <button
              type="button"
              onClick={onGoToConsults}
              className="w-full rounded-lg border border-[#E8547A]/25 bg-[#E8547A]/10 px-3.5 py-2.5 text-left text-[12.5px] font-bold text-[#E8547A]"
            >
              💬 Xử lý tư vấn BS ({stats?.consults_pending ?? "…"} chờ)
            </button>
            <button
              type="button"
              onClick={onGoToPartnerBookings}
              className="w-full rounded-lg border border-[#E8547A]/25 bg-[#E8547A]/10 px-3.5 py-2.5 text-left text-[12.5px] font-bold text-[#E8547A]"
            >
              🤝 Xử lý Lead &amp; Booking ({stats?.partner_bookings_pending ?? "…"} chờ)
            </button>
            <button
              type="button"
              onClick={onGoToArticles}
              className="w-full rounded-lg border border-black/10 bg-[#F1F5F9] px-3.5 py-2.5 text-left text-[12.5px] font-bold text-[#64748B]"
            >
              📝 Viết bài mới
            </button>
            <button
              type="button"
              onClick={onGoToPartners}
              className="w-full rounded-lg border border-black/10 bg-[#F1F5F9] px-3.5 py-2.5 text-left text-[12.5px] font-bold text-[#64748B]"
            >
              🤝 Quản lý đối tác
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
