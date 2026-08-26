import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createPagination, parsePagination } from "@/lib/pagination";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const LISTING_COLUMNS =
  "id, seller_id, seller_name, title, category, condition, price, original_price, province, delivery_method, description, images, zalo, phone_hidden, escrow_enabled, quantity_available, status, created_at, users(email, full_name, is_verified)";

const STATUSES = ["pending", "approved", "sold", "hidden"] as const;

// UC-11 mở rộng - Quản Lý Tin Chợ C2C. Bên cạnh hàng đợi chờ duyệt (GET
// /api/admin/listings/pending, giữ nguyên cho tương thích ngược), admin cần
// xem/tìm toàn bộ tin theo mọi trạng thái để có thể ẩn lại 1 tin đã duyệt
// nếu phát hiện vi phạm sau này — trang chỉ liệt kê tin pending sẽ "mất
// dấu" tin đó ngay khi duyệt xong.
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();
  const { page, pageSize, from, to } = parsePagination(searchParams);

  let query = supabase
    .from("c2c_listings")
    .select(LISTING_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status && (STATUSES as readonly string[]).includes(status)) {
    query = query.eq("status", status);
  }

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const listings = data ?? [];

  return NextResponse.json({
    items: listings,
    listings,
    pagination: createPagination(page, pageSize, count ?? 0),
  });
}
