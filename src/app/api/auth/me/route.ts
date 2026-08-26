import { NextResponse } from "next/server";

import { getUserProfile } from "@/lib/auth/profile";
import { cleanupRemovedMediaUrls } from "@/lib/media/cleanup";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const profile = await getUserProfile(supabase, user.id);

  return NextResponse.json({ user: profile });
}

interface UpdateProfileBody {
  full_name?: unknown;
  phone?: unknown;
  avatar_url?: unknown;
}

// UC-02 - Quản Lý Hồ Sơ Cá Nhân. Chỉ cập nhật hồ sơ của chính người gọi:
// dùng server client (không phải admin client) nên luôn đi qua RLS
// "users_update_own_or_admin" (auth.uid() = id), không nhận id từ client.
export async function PUT(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Cần đăng nhập." }, { status: 401 });
  }

  let body: UpdateProfileBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const updates: Record<string, string | null> = {};

  if (body.full_name !== undefined) {
    updates.full_name =
      typeof body.full_name === "string" && body.full_name.trim() ? body.full_name.trim() : null;
  }

  if (body.phone !== undefined) {
    updates.phone = typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null;
  }

  if (body.avatar_url !== undefined) {
    updates.avatar_url =
      typeof body.avatar_url === "string" && body.avatar_url.trim() ? body.avatar_url.trim() : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Không có thay đổi nào để lưu." }, { status: 400 });
  }

  // Ghi lại avatar cũ trước khi update để dọn Cloudinary/media_assets nếu bị
  // thay thế hoặc gỡ bỏ — tránh rò rỉ file khi đổi/xoá avatar.
  let previousAvatarUrl: string | null = null;

  if ("avatar_url" in updates) {
    const { data: before } = await supabase.from("users").select("avatar_url").eq("id", user.id).maybeSingle();

    previousAvatarUrl = before?.avatar_url ?? null;
  }

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id)
    .select("id, email, phone, role, full_name, avatar_url, is_verified")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if ("avatar_url" in updates && previousAvatarUrl) {
    await cleanupRemovedMediaUrls([previousAvatarUrl], [updates.avatar_url]);
  }

  return NextResponse.json({ user: data });
}
