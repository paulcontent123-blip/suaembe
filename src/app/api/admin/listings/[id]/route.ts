import { NextResponse } from "next/server";

import { parseListingFields } from "@/lib/listings/validation";
import { requireAdminProfile } from "@/lib/auth/require-admin";
import { cleanupRemovedMediaUrls } from "@/lib/media/cleanup";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const LISTING_COLUMNS =
  "id, seller_id, seller_name, title, category, condition, price, original_price, province, delivery_method, description, images, zalo, phone_hidden, escrow_enabled, quantity_available, status, created_at, users(email, full_name, is_verified)";

// UC-11 - Admin Xử Lý Và Duyệt Tin C2C, bước 3 ("Admin chỉnh sửa/chuẩn hóa
// tiêu đề, danh mục, mô tả, ảnh, giá hoặc số lượng nếu cần") — trước đây
// admin chỉ approve/hide được, không sửa được nội dung tin trước khi duyệt.
// Dùng chung parseListingFields với route công khai nên admin sửa được mọi
// field kể cả seller_name (chuẩn hoá tên người bán khách vãng lai nhập).
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

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
    const { data: before } = await supabase.from("c2c_listings").select("images").eq("id", id).maybeSingle();

    previousImages = before?.images ?? [];
  }

  const { data, error } = await supabase
    .from("c2c_listings")
    .update(fields)
    .eq("id", id)
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
