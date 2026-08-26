import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createPagination, parsePagination } from "@/lib/pagination";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Join thêm thông tin người bán (seller_name/phone_hidden/zalo cho khách
// vãng lai, users(...) cho người bán có tài khoản) để admin liên hệ được
// ngay từ màn Đơn hàng C2C, không phải nhảy qua tìm lại ở Tin Chợ C2C.
const ORDER_COLUMNS =
  "id, listing_id, buyer_id, buyer_name, buyer_phone, buyer_email, shipping_address, quantity, unit_price, total_amount, payment_method, payment_ref, payment_status, order_status, admin_note, created_at, updated_at, c2c_listings(id, title, quantity_available, status, seller_name, phone_hidden, zalo, users(full_name, email, is_verified))";

const ORDER_STATUSES = [
  "pending_admin_review",
  "confirmed",
  "processing",
  "completed",
  "cancelled",
  "partially_available",
] as const;

// UC-12 - Đặt Mua C2C Thanh Toán Thường, bước 8 ("Admin thấy đơn mới trong
// màn Đơn hàng"). Thay hẳn cho màn "Đơn hàng & Escrow" cũ (escrow không còn
// thuộc MVP hiện tại, xem UC-13 — hướng phát triển tương lai).
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const { page, pageSize, from, to } = parsePagination(searchParams);

  let query = supabase
    .from("c2c_orders")
    .select(ORDER_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) {
    query = query.eq("order_status", status);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = data ?? [];

  return NextResponse.json({
    items: orders,
    orders,
    pagination: createPagination(page, pageSize, count ?? 0),
  });
}
