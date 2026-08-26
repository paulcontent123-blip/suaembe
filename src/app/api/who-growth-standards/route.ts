import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const STANDARD_COLUMNS = "age_months, gender, indicator, l, m, s, p3, p5, p10, p15, p25, p50, p75, p85, p90, p95, p97, source, version";

// UC-04 - Cập Nhật Chỉ Số Và Đánh Giá Tăng Trưởng WHO. Public API — dùng để
// vẽ đường cong tham chiếu WHO trên biểu đồ (VD đường p50 làm baseline).
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const gender = searchParams.get("gender");
  const indicator = searchParams.get("indicator");

  let query = supabase.from("who_growth_standards").select(STANDARD_COLUMNS).eq("version", "WHO-2006").order("age_months");

  if (gender) query = query.eq("gender", gender);
  if (indicator) query = query.eq("indicator", indicator);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ standards: data });
}
