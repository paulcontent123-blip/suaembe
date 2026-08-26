import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MILESTONE_COLUMNS = "id, age_months, category, title, description, expected_from_month, expected_to_month, sort_order";
const RECORD_COLUMNS = "id, baby_id, milestone_id, status, achieved_at, note";

// UC-05 - Theo Dõi Mốc Phát Triển Của Bé. Trả riêng danh sách mốc chuẩn +
// bản ghi của bé (thay vì join sẵn) — mốc nào bé chưa có bản ghi thì frontend
// tự hiểu là "chưa quan sát" (giá trị mặc định của cột status), không cần
// backend tạo trước 1 dòng not_observed cho từng mốc.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Cần đăng nhập." }, { status: 401 });
  }

  const { data: baby } = await supabase.from("babies").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();

  if (!baby) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ bé." }, { status: 404 });
  }

  const [{ data: milestones, error: milestonesError }, { data: records, error: recordsError }] = await Promise.all([
    supabase.from("development_milestones").select(MILESTONE_COLUMNS).eq("active", true).order("age_months").order("sort_order"),
    supabase.from("baby_milestone_records").select(RECORD_COLUMNS).eq("baby_id", id),
  ]);

  if (milestonesError) return NextResponse.json({ error: milestonesError.message }, { status: 500 });
  if (recordsError) return NextResponse.json({ error: recordsError.message }, { status: 500 });

  return NextResponse.json({ milestones, records });
}
