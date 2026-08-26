import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MILESTONE_COLUMNS = "id, age_months, category, title, description, expected_from_month, expected_to_month, sort_order";

// UC-05 - Theo Dõi Mốc Phát Triển Của Bé. Public API. RLS
// "development_milestones_public_read_active" tự lọc active=true cho khách.
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const ageMonths = searchParams.get("age_months");

  let query = supabase.from("development_milestones").select(MILESTONE_COLUMNS).order("age_months").order("sort_order");

  if (ageMonths) query = query.eq("age_months", Number(ageMonths));

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ milestones: data });
}
