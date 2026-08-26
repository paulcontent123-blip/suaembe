import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const USER_COLUMNS = "id, email, phone, role, full_name, is_verified, created_at";

interface UserPatchInput {
  full_name?: unknown;
  phone?: unknown;
  role?: unknown;
  is_verified?: unknown;
}

// UC-27 - Quản Lý Người Dùng. Bước 3 (hỗ trợ cập nhật hồ sơ, gồm cả bật/tắt
// is_verified — badge người bán đã xác minh ở Chợ C2C) + bước 4 (gán role
// admin cho tài khoản đáng tin cậy). "Không cho client thường tự nâng quyền"
// đã đảm bảo ở tầng route (chỉ admin gọi được qua requireAdminProfile) —
// thêm 1 chốt nữa: admin không được tự đổi role của chính mình qua API này,
// để tránh tự khoá quyền admin của chính phiên đang dùng.
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  let body: UserPatchInput;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const fields: Record<string, string | boolean | null> = {};

  if (body.full_name !== undefined) {
    fields.full_name = typeof body.full_name === "string" && body.full_name.trim() ? body.full_name.trim() : null;
  }

  if (body.phone !== undefined) {
    fields.phone = typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null;
  }

  if (body.role !== undefined) {
    if (body.role !== "admin" && body.role !== "user") {
      return NextResponse.json({ error: "role phải là admin hoặc user." }, { status: 400 });
    }

    if (id === admin.id) {
      return NextResponse.json(
        { error: "Không thể tự đổi vai trò của chính mình. Nhờ admin khác thao tác." },
        { status: 400 },
      );
    }

    fields.role = body.role;
  }

  if (body.is_verified !== undefined) {
    if (typeof body.is_verified !== "boolean") {
      return NextResponse.json({ error: "is_verified phải là boolean." }, { status: 400 });
    }

    fields.is_verified = body.is_verified;
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "Không có thay đổi nào để lưu." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("users")
    .update(fields)
    .eq("id", id)
    .select(USER_COLUMNS)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
  }

  return NextResponse.json({ user: data });
}
