import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// UC-12 mở rộng - Đặt Mua C2C Thanh Toán Thường: bước thanh toán MoMo/VNPay
// dạng MOCK (giả lập luôn thành công), sẽ thay bằng sandbox test thật sau
// khi chốt tích hợp với cổng thanh toán.
//
// Dùng service-role client là ĐÚNG kiến trúc ở đây, không phải để né RLS
// cho tiện: cổng thanh toán thật gọi callback/IPN theo kiểu server-to-server,
// xác thực bằng chữ ký riêng của từng cổng (MoMo/VNPay), KHÔNG mang theo
// session của người mua — nên endpoint kiểu này vốn dĩ không thể dựa vào
// RLS theo auth.uid(). Khi tích hợp thật, thay khối "giả lập luôn thành
// công" bên dưới bằng xác minh chữ ký IPN thật trước khi set payment_status.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: order, error: fetchError } = await supabase
    .from("c2c_orders")
    .select("id, payment_status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });
  }

  if (order.payment_status === "paid") {
    return NextResponse.json({ order });
  }

  const { data, error } = await supabase
    .from("c2c_orders")
    .update({
      payment_status: "paid",
      payment_ref: `MOCK-${Date.now()}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ order: data });
}
