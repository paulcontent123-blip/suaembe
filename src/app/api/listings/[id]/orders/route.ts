import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface OrderInput {
  buyer_name?: unknown;
  buyer_phone?: unknown;
  buyer_email?: unknown;
  shipping_address?: unknown;
  quantity?: unknown;
  payment_method?: unknown;
}

// UC-12 - Đặt Mua C2C Thanh Toán Thường. Không bắt buộc đăng nhập (actor:
// Khách, Mẹ bỉm) — không dùng Escrow, tạo thẳng đơn ở `pending_admin_review`
// để Admin xác nhận còn hàng rồi xử lý tiếp (UC-11 bước tiếp theo). Chưa
// tích hợp cổng thanh toán thật trong MVP này nên `payment_status` luôn khởi
// tạo 'pending'.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let body: OrderInput;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const buyerName = typeof body.buyer_name === "string" ? body.buyer_name.trim() : "";
  const buyerPhone = typeof body.buyer_phone === "string" ? body.buyer_phone.trim() : "";
  const buyerEmail = typeof body.buyer_email === "string" ? body.buyer_email.trim() || null : null;
  const shippingAddress =
    typeof body.shipping_address === "string" ? body.shipping_address.trim() || null : null;
  const paymentMethod = typeof body.payment_method === "string" ? body.payment_method.trim() || null : null;
  const quantity =
    typeof body.quantity === "number" && Number.isFinite(body.quantity) ? Math.trunc(body.quantity) : NaN;

  const errors: string[] = [];

  if (!buyerName) errors.push("buyer_name là bắt buộc.");
  if (!buyerPhone) errors.push("buyer_phone là bắt buộc.");
  if (!Number.isFinite(quantity) || quantity <= 0) errors.push("quantity phải là số nguyên dương.");

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  const { data: listing, error: listingError } = await supabase
    .from("c2c_listings")
    .select("id, price, status, quantity_available")
    .eq("id", id)
    .maybeSingle();

  if (listingError) {
    return NextResponse.json({ error: listingError.message }, { status: 500 });
  }

  if (!listing) {
    return NextResponse.json({ error: "Không tìm thấy tin đăng." }, { status: 404 });
  }

  if (listing.status !== "approved") {
    return NextResponse.json({ error: "Tin đăng chưa được duyệt hoặc không còn khả dụng." }, { status: 400 });
  }

  if (quantity > listing.quantity_available) {
    return NextResponse.json(
      { error: `Chỉ còn ${listing.quantity_available} sản phẩm, không đủ số lượng bạn đặt.` },
      { status: 400 },
    );
  }

  const unitPrice = listing.price;
  const totalAmount = unitPrice * quantity;

  // Tự sinh id thay vì để DB default — khách vãng lai (buyer_id null) không
  // đọc lại được chính dòng vừa insert qua RLS select (không có auth.uid()
  // để đối chiếu "đơn của chính mình"), nên nếu để DB tự sinh id thì sẽ
  // không có cách nào biết id đó là gì. Biết trước id cũng là điều kiện để
  // bước thanh toán mock (MoMo/VNPay giả lập) gọi tiếp được
  // POST /api/orders/:id/mock-pay ngay sau khi tạo đơn, kể cả với khách.
  const orderId = randomUUID();
  const orderPayload = {
    id: orderId,
    listing_id: id,
    buyer_id: user?.id ?? null,
    buyer_name: buyerName,
    buyer_phone: buyerPhone,
    buyer_email: buyerEmail,
    shipping_address: shippingAddress,
    quantity,
    unit_price: unitPrice,
    total_amount: totalAmount,
    payment_method: paymentMethod,
  };

  // Bỏ .select() (Prefer: return=minimal) để insert không cần quyền SELECT
  // đọc lại — tự dựng lại payload phản hồi từ dữ liệu đã có, dùng chung cho
  // cả khách lẫn người mua có tài khoản (đơn giản hơn so với nhánh riêng
  // trước đây, và đằng nào cũng đã biết đủ dữ liệu để trả về).
  const { error } = await supabase.from("c2c_orders").insert(orderPayload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      order: {
        ...orderPayload,
        order_status: "pending_admin_review",
        payment_status: "pending",
        created_at: new Date().toISOString(),
      },
    },
    { status: 201 },
  );
}
