import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/lib/auth/require-admin";
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
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;

interface OrderPatchInput {
  order_status?: unknown;
  payment_status?: unknown;
  admin_note?: unknown;
}

// UC-12 - Đặt Mua C2C Thanh Toán Thường, bước 9-12: Admin xác nhận còn đủ
// số lượng thì xử lý đơn và trừ quantity_available; hết hàng thì Admin tự
// đổi order_status='cancelled' và tự ẩn/đổi trạng thái tin ở màn Tin Chợ C2C
// (không tự động ẩn thay admin, vì "hết hàng" so với "chỉ còn 1 phần" cần
// admin nhìn thực tế rồi quyết định — không suy luận hộ). Chỉ tự động trừ
// quantity_available đúng 1 lần khi đơn CHUYỂN sang 'confirmed' lần đầu
// (từ 'pending_admin_review') — tránh trừ lặp nếu admin đổi qua lại trạng
// thái nhiều lần. Nếu số còn lại về 0 thì tự chuyển tin sang status='sold'.
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  let body: OrderPatchInput;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const fields: Record<string, string | null> = {};

  if (body.order_status !== undefined) {
    if (typeof body.order_status !== "string" || !(ORDER_STATUSES as readonly string[]).includes(body.order_status)) {
      return NextResponse.json({ error: "order_status không hợp lệ." }, { status: 400 });
    }

    fields.order_status = body.order_status;
  }

  if (body.payment_status !== undefined) {
    if (
      typeof body.payment_status !== "string" ||
      !(PAYMENT_STATUSES as readonly string[]).includes(body.payment_status)
    ) {
      return NextResponse.json({ error: "payment_status không hợp lệ." }, { status: 400 });
    }

    fields.payment_status = body.payment_status;
  }

  if (body.admin_note !== undefined) {
    fields.admin_note = typeof body.admin_note === "string" ? body.admin_note.trim() || null : null;
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "Không có thay đổi nào để lưu." }, { status: 400 });
  }

  const { data: current, error: currentError } = await supabase
    .from("c2c_orders")
    .select("id, listing_id, quantity, order_status")
    .eq("id", id)
    .maybeSingle();

  if (currentError) {
    return NextResponse.json({ error: currentError.message }, { status: 500 });
  }

  if (!current) {
    return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });
  }

  const shouldDeductStock = fields.order_status === "confirmed" && current.order_status === "pending_admin_review";

  const { data, error } = await supabase
    .from("c2c_orders")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(ORDER_COLUMNS)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });
  }

  if (shouldDeductStock) {
    const { data: listing } = await supabase
      .from("c2c_listings")
      .select("quantity_available")
      .eq("id", current.listing_id)
      .maybeSingle();

    if (listing) {
      const nextQuantity = Math.max(0, listing.quantity_available - current.quantity);

      await supabase
        .from("c2c_listings")
        .update({
          quantity_available: nextQuantity,
          ...(nextQuantity === 0 ? { status: "sold" } : {}),
        })
        .eq("id", current.listing_id);
    }
  }

  return NextResponse.json({ order: data });
}
