import { NextResponse } from "next/server";

import { parseListingFields } from "@/lib/listings/validation";
import { cleanupRemovedMediaUrls } from "@/lib/media/cleanup";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const LISTING_COLUMNS =
  "id, seller_id, seller_name, title, category, condition, price, original_price, province, delivery_method, description, images, zalo, phone_hidden, escrow_enabled, quantity_available, status, created_at";

// UC-10 - Đăng Tin Chợ C2C (sửa tin). RLS "c2c_listings_update_owner_or_admin"
// đã giới hạn owner/admin, nhưng vẫn lọc thêm seller_id = auth.uid() ở query
// để user thường không thể sửa tin người khác dù có đoán được id (trả 404
// thay vì 403, không lộ tin đó có tồn tại hay không).
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Cần đăng nhập." }, { status: 401 });
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const { fields, errors } = parseListingFields(body);

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "Không có thay đổi nào để lưu." }, { status: 400 });
  }

  // Ghi lại images cũ trước khi update để dọn Cloudinary/media_assets cho
  // những ảnh bị thay thế/gỡ bớt khỏi mảng — tránh rò rỉ file.
  let previousImages: string[] = [];

  if ("images" in fields) {
    const { data: before } = await supabase
      .from("c2c_listings")
      .select("images")
      .eq("id", id)
      .eq("seller_id", user.id)
      .maybeSingle();

    previousImages = before?.images ?? [];
  }

  const { data, error } = await supabase
    .from("c2c_listings")
    .update(fields)
    .eq("id", id)
    .eq("seller_id", user.id)
    .select(LISTING_COLUMNS)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy tin đăng." }, { status: 404 });
  }

  if ("images" in fields) {
    await cleanupRemovedMediaUrls(previousImages, (fields.images as string[] | null) ?? []);
  }

  return NextResponse.json({ listing: data });
}

// UC-28 - chủ tin tự xoá tin của mình. RLS "c2c_listings_delete_owner_or_admin"
// đã cho phép; FK `c2c_orders.listing_id ... on delete restrict` tự chặn xoá
// nếu tin đã có đơn tham chiếu (kể cả đơn đã huỷ) — bắt lỗi 23503 để trả
// thông báo rõ ràng thay vì lỗi DB thô.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Cần đăng nhập." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("c2c_listings")
    .delete()
    .eq("id", id)
    .eq("seller_id", user.id)
    .select("id, images")
    .maybeSingle();

  if (error) {
    if (error.code === "23503") {
      return NextResponse.json(
        { error: "Không thể xoá tin đã có người đặt mua. Bạn có thể đánh dấu đã bán hoặc gỡ tin thay vì xoá." },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy tin đăng." }, { status: 404 });
  }

  await cleanupRemovedMediaUrls(data.images ?? [], []);

  return NextResponse.json({ ok: true });
}
