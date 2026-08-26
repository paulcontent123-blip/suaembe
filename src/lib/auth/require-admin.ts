import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getUserProfile } from "./profile";
import type { UserProfile } from "./types";

/**
 * Dùng ở đầu mọi API /api/admin/*: trả về profile nếu caller là admin, hoặc
 * một NextResponse lỗi (401/403) để route handler return ngay. Không thay
 * thế RLS — chỉ là chặn sớm để trả lỗi rõ ràng thay vì để RLS âm thầm trả
 * mảng rỗng cho người không có quyền.
 */
export async function requireAdminProfile(
  supabase: SupabaseClient,
): Promise<UserProfile | NextResponse> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Cần đăng nhập." }, { status: 401 });
  }

  const profile = await getUserProfile(supabase, user.id);

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Chỉ admin mới có quyền truy cập." }, { status: 403 });
  }

  return profile;
}
