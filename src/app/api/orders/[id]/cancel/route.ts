import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// UC-29 - Quản Lý Đơn Hàng Của Tôi (Mẹ bỉm). Chỉ người mua có tài khoản tự
// huỷ được đơn CỦA CHÍNH MÌNH và chỉ khi còn 'pending_admin_review' (RLS
// "c2c_orders_update_buyer_cancel" đã ràng buộc đúng 1 chiều chuyển này).
// Route chỉ gửi đúng {order_status: 'cancelled'} — không forward field nào
// khác từ client, tránh phụ thuộc hoàn toàn vào RLS để chặn sửa cột khác.
export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Cần đăng nhập." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("c2c_orders")
    .update({ order_status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("buyer_id", user.id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Không tìm thấy đơn hoặc đơn không còn ở trạng thái chờ xử lý để huỷ." },
      { status: 404 },
    );
  }

  return NextResponse.json({ order: data });
}
