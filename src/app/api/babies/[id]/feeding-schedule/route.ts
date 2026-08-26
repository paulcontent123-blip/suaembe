import { NextResponse } from "next/server";

import { cancelFeedingReminder, upsertFeedingReminder } from "@/lib/notifications/feeding-reminders";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SCHEDULE_COLUMNS =
  "id, baby_id, scheduled_date, scheduled_time, meal_type, title, description, amount_ml, status, completed_at, created_at";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// UC-06 - Quản Lý Lịch Ăn/Sữa/Ăn Dặm.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || todayDate();

  const { data, error } = await supabase
    .from("baby_feeding_schedule")
    .select(SCHEDULE_COLUMNS)
    .eq("baby_id", id)
    .eq("scheduled_date", date)
    .order("scheduled_time", { ascending: true, nullsFirst: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const scheduledDate = typeof body.scheduled_date === "string" && body.scheduled_date ? body.scheduled_date : todayDate();
  const scheduledTime = typeof body.scheduled_time === "string" && body.scheduled_time ? body.scheduled_time : null;
  const mealType = typeof body.meal_type === "string" ? body.meal_type.trim() || null : null;
  const description = typeof body.description === "string" ? body.description.trim() || null : null;
  const amountMl =
    typeof body.amount_ml === "number" && Number.isFinite(body.amount_ml) && body.amount_ml > 0 ? Math.round(body.amount_ml) : null;

  if (!title) {
    return NextResponse.json({ error: "title là bắt buộc." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("baby_feeding_schedule")
    .insert({
      baby_id: id,
      title,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      meal_type: mealType,
      description,
      amount_ml: amountMl,
    })
    .select(SCHEDULE_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Bước 4 UC-06: có giờ cụ thể thì tạo notification nhắc lịch (push), job
  // /api/cron/dispatch-notifications gửi khi đến hạn. Không chặn response
  // nếu bước này lỗi — lịch ăn vẫn phải lưu được dù notifications gặp sự cố.
  if (data.scheduled_time) {
    upsertFeedingReminder(data, user.id).catch((err) => {
      console.error(`[feeding-schedule] Tạo nhắc lịch thất bại cho ${data.id}:`, err);
    });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}

// UC-06 - Xoa tat ca lich an cua be theo ngay. Mac dinh xoa lich cua ngay hien tai;
// neu can xoa toan bo lich cua be, client co the truyen ?all=true.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { searchParams } = new URL(request.url);
  const deleteAll = searchParams.get("all") === "true";
  const date = searchParams.get("date") || todayDate();

  let query = supabase.from("baby_feeding_schedule").delete({ count: "exact" }).eq("baby_id", id);

  if (!deleteAll) {
    query = query.eq("scheduled_date", date);
  }

  const { data: deletedRows, error, count } = await query.select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const row of deletedRows ?? []) {
    cancelFeedingReminder(row.id).catch((err) => {
      console.error(`[feeding-schedule] Huỷ nhắc lịch thất bại cho ${row.id}:`, err);
    });
  }

  return NextResponse.json({ deleted_count: count ?? 0 });
}
