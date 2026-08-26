import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface FeedingScheduleRow {
  id: string;
  baby_id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  title: string;
}

// Tạo/cập nhật notification nhắc lịch ăn (channel='push') gắn với 1 dòng
// baby_feeding_schedule — tra lại qua data->>feeding_schedule_id (jsonb)
// thay vì thêm cột FK mới. Dùng admin client (service role) vì RLS
// "notifications_insert_admin" chỉ cho insert khi is_admin(), Mẹ bỉm không
// tự insert được cho chính mình. Không có scheduled_time thì huỷ nhắc (nếu
// có) vì không còn gì để nhắc.
export async function upsertFeedingReminder(schedule: FeedingScheduleRow, userId: string): Promise<void> {
  if (!schedule.scheduled_time) {
    await cancelFeedingReminder(schedule.id);

    return;
  }

  const scheduledAt = new Date(`${schedule.scheduled_date}T${schedule.scheduled_time}`).toISOString();
  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from("notifications")
    .select("id")
    .eq("type", "feeding_reminder")
    .eq("status", "pending")
    .contains("data", { feeding_schedule_id: schedule.id })
    .maybeSingle();

  if (existing) {
    await admin
      .from("notifications")
      .update({ scheduled_at: scheduledAt, title: `Đến giờ: ${schedule.title}` })
      .eq("id", existing.id);

    return;
  }

  await admin.from("notifications").insert({
    user_id: userId,
    type: "feeding_reminder",
    title: `Đến giờ: ${schedule.title}`,
    body: "Đã đến giờ trong lịch ăn/sữa của bé, mở app để xem chi tiết.",
    data: { feeding_schedule_id: schedule.id, baby_id: schedule.baby_id },
    channel: "push",
    status: "pending",
    scheduled_at: scheduledAt,
  });
}

// Huỷ notification nhắc lịch (nếu còn pending) của 1 dòng lịch ăn — gọi khi
// lịch bị xoá, đánh dấu done/skipped/cancelled, hoặc gỡ scheduled_time.
export async function cancelFeedingReminder(scheduleId: string): Promise<void> {
  const admin = createSupabaseAdminClient();

  await admin
    .from("notifications")
    .update({ status: "cancelled" })
    .eq("type", "feeding_reminder")
    .eq("status", "pending")
    .contains("data", { feeding_schedule_id: scheduleId });
}
