import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const LISTING_COLUMNS =
  "id, seller_id, seller_name, title, category, condition, price, original_price, province, delivery_method, description, images, zalo, phone_hidden, escrow_enabled, quantity_available, status, created_at";

// UC-28 - Quản Lý Tin Đăng Của Tôi (Chợ C2C). RLS
// "c2c_listings_read_public_approved_or_owner" đã cho phép auth.uid() =
// seller_id đọc tin của chính mình ở MỌI trạng thái, không chỉ 'approved'
// như GET /api/listings công khai — route này chỉ cần require đăng nhập.
// Không enrich `seller` (RPC get_c2c_seller_profile) vì đây là tin của
// chính người đang xem, không cần hiển thị lại tên/badge của họ.
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Cần đăng nhập." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("c2c_listings")
    .select(LISTING_COLUMNS)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const listings = (data ?? []).map((l) => ({ ...l, seller: null }));

  return NextResponse.json({ listings });
}
