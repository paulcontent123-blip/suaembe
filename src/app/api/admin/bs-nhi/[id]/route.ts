import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/lib/auth/require-admin";
import { cleanupRemovedMediaUrls } from "@/lib/media/cleanup";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BS_NHI_COLUMNS =
  "id, full_name, specialty, hospital, experience_years, bio, avatar_url, rating, consult_count, is_online, response_hours, verified";

interface BsNhiInput {
  full_name?: unknown;
  specialty?: unknown;
  hospital?: unknown;
  experience_years?: unknown;
  bio?: unknown;
  avatar_url?: unknown;
  rating?: unknown;
  is_online?: unknown;
  response_hours?: unknown;
  verified?: unknown;
}

// UC-22 - Quản Lý Bác Sĩ Nhi Đối Tác. `consult_count` không nhận từ client —
// đây là số liệu hệ thống tự đếm qua luồng tư vấn thật (UC-15/16), admin chỉ
// nhập hồ sơ chuyên môn theo đúng bước 2 của use case.
function parseBsNhiFields(body: BsNhiInput) {
  const fields: Record<string, string | number | boolean | null> = {};

  for (const key of ["full_name", "specialty", "hospital", "bio", "avatar_url"] as const) {
    const value = body[key];

    if (value === undefined) continue;

    if (value === null) {
      fields[key] = null;
    } else if (typeof value === "string") {
      fields[key] = value.trim() || null;
    }
  }

  if (body.experience_years !== undefined) {
    if (body.experience_years === null) {
      fields.experience_years = null;
    } else if (typeof body.experience_years === "number" && Number.isFinite(body.experience_years) && body.experience_years >= 0) {
      fields.experience_years = Math.trunc(body.experience_years);
    } else {
      return { fields, error: "experience_years phải là số không âm." };
    }
  }

  if (body.rating !== undefined) {
    if (body.rating === null) {
      fields.rating = null;
    } else if (typeof body.rating === "number" && Number.isFinite(body.rating) && body.rating >= 0 && body.rating <= 5) {
      fields.rating = body.rating;
    } else {
      return { fields, error: "rating phải là số từ 0 đến 5." };
    }
  }

  if (body.response_hours !== undefined) {
    if (typeof body.response_hours === "number" && Number.isFinite(body.response_hours) && body.response_hours > 0) {
      fields.response_hours = Math.trunc(body.response_hours);
    } else {
      return { fields, error: "response_hours phải là số dương." };
    }
  }

  if (body.is_online !== undefined) {
    if (typeof body.is_online === "boolean") {
      fields.is_online = body.is_online;
    } else {
      return { fields, error: "is_online phải là boolean." };
    }
  }

  if (body.verified !== undefined) {
    if (typeof body.verified === "boolean") {
      fields.verified = body.verified;
    } else {
      return { fields, error: "verified phải là boolean." };
    }
  }

  return { fields, error: null as string | null };
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  let body: BsNhiInput;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const { fields, error: parseError } = parseBsNhiFields(body);

  if (parseError) {
    return NextResponse.json({ error: parseError }, { status: 400 });
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "Không có thay đổi nào để lưu." }, { status: 400 });
  }

  // Ghi lại avatar cũ trước khi update để dọn Cloudinary/media_assets nếu bị
  // thay thế hoặc gỡ bỏ — tránh rò rỉ file khi đổi/xoá avatar bác sĩ.
  let previousAvatarUrl: string | null = null;

  if ("avatar_url" in fields) {
    const { data: before } = await supabase.from("bs_nhi").select("avatar_url").eq("id", id).maybeSingle();

    previousAvatarUrl = before?.avatar_url ?? null;
  }

  const { data, error } = await supabase
    .from("bs_nhi")
    .update(fields)
    .eq("id", id)
    .select(BS_NHI_COLUMNS)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy bác sĩ." }, { status: 404 });
  }

  if ("avatar_url" in fields && previousAvatarUrl) {
    await cleanupRemovedMediaUrls([previousAvatarUrl], [fields.avatar_url as string | null]);
  }

  return NextResponse.json({ doctor: data });
}
