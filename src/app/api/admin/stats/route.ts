import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// UC-11/UC-27 (khu vực Admin). GET /api/admin/stats theo đúng danh sách API
// §6. Dùng server client (không phải service-role) — is_admin() trong RLS đã
// cho phép admin đọc toàn bộ dữ liệu nên count vẫn chính xác.
//
// Bố cục 4 thẻ + 2 panel khớp Dashboard trong demo suaembe.html, nhưng mọi
// số liệu (kể cả các dòng "+X tuần này"/"+X hôm nay") đều tính thật từ DB —
// không có số nào bịa như trong demo.
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    usersTotal,
    usersNew7d,
    listingsTotal,
    listingsNewToday,
    listingsPending,
    productsTotal,
    productsNew7d,
    bsNhiTotal,
    bsNhiPendingVerification,
    ordersPendingReview,
    consultsPending,
    partnerBookingsPending,
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
    supabase.from("c2c_listings").select("id", { count: "exact", head: true }),
    supabase
      .from("c2c_listings")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    supabase.from("c2c_listings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString()),
    supabase.from("bs_nhi").select("id", { count: "exact", head: true }),
    supabase.from("bs_nhi").select("id", { count: "exact", head: true }).eq("verified", false),
    // UC-12 MVP mới (thanh toán thường thay Escrow) — đơn chờ admin xử lý.
    supabase
      .from("c2c_orders")
      .select("id", { count: "exact", head: true })
      .eq("order_status", "pending_admin_review"),
    // UC-16 — yêu cầu tư vấn chưa được bác sĩ trả lời (forward chỉ ghi
    // forwarded_at/forwarded_by, không đổi status, nên status='pending' vẫn
    // đúng cho cả 2 trường hợp "mới gửi" lẫn "đã chuyển tiếp nhưng chưa trả lời").
    supabase.from("consult_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    // UC-18 — lead/booking đối tác khách gửi (cả "lead" liên hệ lẫn "booking"
    // đặt lịch thật) đang chờ admin xử lý.
    supabase.from("partner_bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return NextResponse.json({
    stats: {
      users_total: usersTotal.count ?? 0,
      users_new_7d: usersNew7d.count ?? 0,
      listings_total: listingsTotal.count ?? 0,
      listings_new_today: listingsNewToday.count ?? 0,
      listings_pending: listingsPending.count ?? 0,
      products_total: productsTotal.count ?? 0,
      products_new_7d: productsNew7d.count ?? 0,
      bs_nhi_total: bsNhiTotal.count ?? 0,
      bs_nhi_pending_verification: bsNhiPendingVerification.count ?? 0,
      orders_pending_review: ordersPendingReview.count ?? 0,
      consults_pending: consultsPending.count ?? 0,
      partner_bookings_pending: partnerBookingsPending.count ?? 0,
    },
  });
}
