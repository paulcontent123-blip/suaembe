import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BS_NHI_COLUMNS =
  "id, full_name, specialty, hospital, experience_years, bio, avatar_url, rating, consult_count, is_online, response_hours, verified";

// UC-22 - Quản Lý Bác Sĩ Nhi Đối Tác, bước 4 ("Admin xác minh hồ sơ bằng
// verified = true"). Endpoint xác minh nhanh 1 chạm riêng theo đúng
// `PUT /api/admin/bs-nhi/:id/verify` trong USECASE.md §6 — tách khỏi PUT
// sửa hồ sơ chung để admin không phải vào chế độ sửa chỉ để bật xác minh,
// giống mẫu đã làm cho UC-27 (xác minh nhanh người dùng). Body rỗng mặc định
// verified=true (đúng luồng chính); vẫn nhận {verified:false} nếu admin cần
// gỡ xác minh.
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  let verified = true;

  try {
    const body = await request.json();

    if (body && typeof body.verified === "boolean") verified = body.verified;
  } catch {
    // Body rỗng hợp lệ — mặc định xác minh (verified = true).
  }

  const { data, error } = await supabase
    .from("bs_nhi")
    .update({ verified })
    .eq("id", id)
    .select(BS_NHI_COLUMNS)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy bác sĩ." }, { status: 404 });
  }

  return NextResponse.json({ doctor: data });
}
