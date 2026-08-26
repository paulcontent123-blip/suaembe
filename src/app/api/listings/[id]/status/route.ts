import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SELF_ALLOWED_STATUSES = new Set(["sold", "hidden"]);

// UC-28 - chủ tin tự đánh dấu đã bán / gỡ tin. RLS "c2c_listings_update_owner_or_admin"
// vốn cho phép owner đổi mọi cột (kể cả status) không giới hạn chiều chuyển
// — endpoint riêng này mới là nơi thật sự thu hẹp lại: chỉ nhận đúng
// `sold`/`hidden` (không cho tự đặt lại `pending`/`approved`), và chỉ áp
// dụng khi tin đang `approved` (lọc `.eq("status", "approved")`), khớp đúng
// tinh thần UC-28 "tự đánh dấu đã bán/gỡ tin" — không phải sửa nội dung nên
// tách khỏi PUT /api/listings/:id (dùng parseListingFields, cố tình không
// nhận field status).
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Cần đăng nhập." }, { status: 401 });
  }

  let body: { status?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  if (typeof body.status !== "string" || !SELF_ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "status phải là sold hoặc hidden." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("c2c_listings")
    .update({ status: body.status })
    .eq("id", id)
    .eq("seller_id", user.id)
    .eq("status", "approved")
    .select("id, status")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Không tìm thấy tin đăng đang ở trạng thái đã duyệt." },
      { status: 404 },
    );
  }

  return NextResponse.json({ listing: data });
}
