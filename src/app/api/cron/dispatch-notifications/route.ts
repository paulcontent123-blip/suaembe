import { NextResponse } from "next/server";

import { getFirebaseMessaging } from "@/lib/firebase/admin";
import { sendPushForNotification } from "@/lib/notifications/dispatch";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BATCH_LIMIT = 50;
const STALE_AFTER_MS = 24 * 60 * 60 * 1000; // quá 24h chưa gửi được (không có device_tokens) thì huỷ, tránh dội thông báo cũ khi có token mới

// Job nền gửi push FCM cho notifications đang chờ (channel='push',
// status='pending', đến hạn scheduled_at hoặc gửi ngay nếu scheduled_at
// null — dùng cho UC-16 trả lời tư vấn) và UC-06 (nhắc lịch ăn, có
// scheduled_at). Không có scheduler nội bộ (Next.js không có cron riêng) —
// route này cần được gọi định kỳ từ bên ngoài kèm header
// `Authorization: Bearer <CRON_SECRET>`. Hỗ trợ cả GET lẫn POST vì Vercel
// Cron (xem vercel.json) gọi bằng GET, còn scheduler khác/gọi tay thường
// dùng POST.
export async function GET(request: Request) {
  return handleDispatch(request);
}

export async function POST(request: Request) {
  return handleDispatch(request);
}

async function handleDispatch(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Không có quyền." }, { status: 401 });
  }

  try {
    getFirebaseMessaging();
  } catch {
    return NextResponse.json(
      { error: "Firebase Admin chưa được cấu hình (thiếu FIREBASE_SERVICE_ACCOUNT trong .env)." },
      { status: 503 },
    );
  }

  const admin = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  const { data: candidates, error } = await admin
    .from("notifications")
    .select("id, user_id, type, title, body, data, created_at, scheduled_at")
    .eq("channel", "push")
    .eq("status", "pending")
    .or(`scheduled_at.is.null,scheduled_at.lte.${nowIso}`)
    .order("created_at", { ascending: true })
    .limit(BATCH_LIMIT);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let skippedNoToken = 0;
  let cancelledStale = 0;
  let failed = 0;

  for (const row of candidates ?? []) {
    // Claim nguyên tử theo từng dòng (pending -> sending) — nếu lần chạy
    // cron khác đã lấy dòng này trước thì count = 0, bỏ qua để tránh gửi trùng.
    const { count } = await admin
      .from("notifications")
      .update({ status: "sending" }, { count: "exact" })
      .eq("id", row.id)
      .eq("status", "pending");

    if (!count) continue;

    try {
      const result = await sendPushForNotification({
        id: row.id,
        user_id: row.user_id,
        type: row.type,
        title: row.title,
        body: row.body,
        data: row.data as Record<string, unknown> | null,
      });

      if (result.delivered) {
        await admin
          .from("notifications")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", row.id);
        sent++;
      } else if (!result.hadTokens) {
        const referenceTime = new Date(row.scheduled_at ?? row.created_at).getTime();

        if (Date.now() - referenceTime > STALE_AFTER_MS) {
          await admin.from("notifications").update({ status: "cancelled" }).eq("id", row.id);
          cancelledStale++;
        } else {
          // Chưa có device_tokens nào bật — trả lại pending để lần chạy sau thử lại.
          await admin.from("notifications").update({ status: "pending" }).eq("id", row.id);
          skippedNoToken++;
        }
      } else {
        await admin.from("notifications").update({ status: "failed" }).eq("id", row.id);
        failed++;
      }
    } catch (err) {
      await admin.from("notifications").update({ status: "failed" }).eq("id", row.id);
      failed++;
      console.error(`[cron] Gửi push thất bại cho notification ${row.id}:`, err);
    }
  }

  return NextResponse.json({
    processed: candidates?.length ?? 0,
    sent,
    skipped_no_token: skippedNoToken,
    cancelled_stale: cancelledStale,
    failed,
  });
}
