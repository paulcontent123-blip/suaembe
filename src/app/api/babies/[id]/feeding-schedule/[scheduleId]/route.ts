import { NextResponse } from "next/server";

import { cancelFeedingReminder, upsertFeedingReminder } from "@/lib/notifications/feeding-reminders";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SCHEDULE_COLUMNS =
  "id, baby_id, scheduled_date, scheduled_time, meal_type, title, description, amount_ml, status, completed_at, created_at";
const STATUSES = new Set(["pending", "upcoming", "done", "skipped", "cancelled"]);

// UC-06 - đánh dấu bữa ăn done/skipped/cancelled, hoặc sửa lại nội dung lịch.
export async function PUT(request: Request, { params }: { params: Promise<{ id: string; scheduleId: string }> }) {
  const { id, scheduleId } = await params;
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

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const fields: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !STATUSES.has(body.status)) {
      return NextResponse.json({ error: "status không hợp lệ." }, { status: 400 });
    }

    fields.status = body.status;
    fields.completed_at = body.status === "done" ? new Date().toISOString() : null;
  }

  if (typeof body.title === "string" && body.title.trim()) fields.title = body.title.trim();
  if (body.description !== undefined) fields.description = typeof body.description === "string" ? body.description.trim() || null : null;
  if (body.scheduled_time !== undefined) fields.scheduled_time = typeof body.scheduled_time === "string" ? body.scheduled_time || null : null;
  if (body.amount_ml !== undefined) {
    fields.amount_ml = typeof body.amount_ml === "number" && body.amount_ml > 0 ? Math.round(body.amount_ml) : null;
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "Không có thay đổi nào để lưu." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("baby_feeding_schedule")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", scheduleId)
    .eq("baby_id", id)
    .select(SCHEDULE_COLUMNS)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy lịch ăn." }, { status: 404 });
  }

  // Đồng bộ notification nhắc lịch theo trạng thái/giờ mới nhất: còn
  // pending/upcoming và có giờ thì tạo/cập nhật giờ nhắc; ngược lại (đã
  // done/skipped/cancelled, hoặc gỡ hết giờ) thì huỷ nhắc nếu đang chờ gửi.
  const stillNeedsReminder = (data.status === "pending" || data.status === "upcoming") && data.scheduled_time;

  const reminderUpdate = stillNeedsReminder
    ? upsertFeedingReminder(data, user.id)
    : cancelFeedingReminder(data.id);

  reminderUpdate.catch((err) => {
    console.error(`[feeding-schedule] Đồng bộ nhắc lịch thất bại cho ${data.id}:`, err);
  });

  return NextResponse.json({ item: data });
}

// UC-06 - Xoa tung lich an cua be.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; scheduleId: string }> }) {
  const { id, scheduleId } = await params;
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

  const { error, count } = await supabase
    .from("baby_feeding_schedule")
    .delete({ count: "exact" })
    .eq("id", scheduleId)
    .eq("baby_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!count) {
    return NextResponse.json({ error: "Không tìm thấy lịch ăn." }, { status: 404 });
  }

  cancelFeedingReminder(scheduleId).catch((err) => {
    console.error(`[feeding-schedule] Huỷ nhắc lịch thất bại cho ${scheduleId}:`, err);
  });

  return NextResponse.json({ deleted: true, id: scheduleId });
}
