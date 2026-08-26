import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ORDER_COLUMNS =
  "id, listing_id, buyer_name, buyer_phone, buyer_email, shipping_address, quantity, unit_price, total_amount, payment_method, payment_ref, payment_status, order_status, admin_note, created_at, updated_at, c2c_listings(id, title, images, status)";

// UC-29 - Quản Lý Đơn Hàng Của Tôi (Mẹ bỉm). RLS
// "c2c_orders_select_admin_or_buyer" đã giới hạn đúng auth.uid() = buyer_id
// nên route chỉ cần require đăng nhập, không cần lọc buyer_id thủ công.
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Cần đăng nhập." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("c2c_orders")
    .select(ORDER_COLUMNS)
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: data });
}
