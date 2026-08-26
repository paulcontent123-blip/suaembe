import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const RECORD_COLUMNS = "id, baby_id, milestone_id, status, achieved_at, note";
const STATUSES = new Set(["achieved", "in_progress", "not_observed", "delayed"]);

// UC-05 - Theo Dõi Mốc Phát Triển Của Bé. Upsert vì mỗi (baby_id, milestone_id)
// là duy nhất (unique constraint) — mẹ bỉm đánh dấu mốc lần đầu thì tạo mới,
// đánh dấu lại thì cập nhật, không cần phân biệt POST/PUT ở phía client.
export async function PUT(request: Request, { params }: { params: Promise<{ id: string; milestoneId: string }> }) {
  const { id, milestoneId } = await params;
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

  let body: { status?: unknown; note?: unknown; achieved_at?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  if (typeof body.status !== "string" || !STATUSES.has(body.status)) {
    return NextResponse.json(
      { error: "status phải là achieved, in_progress, not_observed hoặc delayed." },
      { status: 400 },
    );
  }

  const note = typeof body.note === "string" ? body.note.trim() || null : null;
  const achievedAt =
    body.status === "achieved"
      ? typeof body.achieved_at === "string" && body.achieved_at
        ? body.achieved_at
        : new Date().toISOString().slice(0, 10)
      : null;

  const { data, error } = await supabase
    .from("baby_milestone_records")
    .upsert(
      { baby_id: id, milestone_id: milestoneId, status: body.status, note, achieved_at: achievedAt, updated_at: new Date().toISOString() },
      { onConflict: "baby_id,milestone_id" },
    )
    .select(RECORD_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ record: data });
}
