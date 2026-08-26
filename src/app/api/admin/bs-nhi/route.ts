import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/lib/auth/require-admin";
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

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  let query = supabase.from("bs_nhi").select(BS_NHI_COLUMNS).order("full_name");

  if (q) query = query.or(`full_name.ilike.%${q}%,specialty.ilike.%${q}%,hospital.ilike.%${q}%`);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ doctors: data });
}

export async function POST(request: Request) {
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

  if (!fields.full_name) {
    return NextResponse.json({ error: "full_name là bắt buộc." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("bs_nhi")
    .insert(fields)
    .select(BS_NHI_COLUMNS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ doctor: data }, { status: 201 });
}
