import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PUBLIC_DOCTOR_COLUMNS =
  "id, full_name, specialty, hospital, experience_years, bio, avatar_url, rating, consult_count, is_online, response_hours, verified";

// UC-14 - Public chỉ đọc hồ sơ bác sĩ đã xác minh. RLS trên bs_nhi vẫn là lớp
// bảo vệ chính; điều kiện ở đây giúp API trả đúng phạm vi và dễ tối ưu query.
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  let query = supabase.from("bs_nhi").select(PUBLIC_DOCTOR_COLUMNS).eq("verified", true).order("full_name");

  if (q) query = query.or(`full_name.ilike.%${q}%,specialty.ilike.%${q}%,hospital.ilike.%${q}%,bio.ilike.%${q}%`);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ doctors: data ?? [] });
}
