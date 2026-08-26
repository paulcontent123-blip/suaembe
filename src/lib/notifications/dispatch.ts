import { getFirebaseMessaging } from "@/lib/firebase/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface PushableNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
}

// URL mở khi bấm vào push, theo type — trỏ đúng trang xem lại nội dung liên
// quan (tư vấn trả lời -> tài khoản, nhắc lịch ăn -> tab Nhật ký Dinh dưỡng Bé).
function clickUrlFor(notification: PushableNotification): string {
  if (notification.type === "consult") return "/tai-khoan";
  if (notification.type === "feeding_reminder") return "/tin-tuc?tab=nhatky";

  return "/";
}

const INVALID_TOKEN_ERROR_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

// Gửi push cho toàn bộ device_tokens đang bật (enabled=true) của 1 user.
// Payload data-only (không kèm field "notification" cấp cao nhất) để tránh
// trình duyệt tự hiển thị trùng lặp với xử lý thủ công trong service worker
// — xem public/firebase-messaging-sw.js. Token nào FCM báo không còn hợp lệ
// (app gỡ, quyền bị thu hồi...) sẽ tự disable trong device_tokens.
export async function sendPushForNotification(
  notification: PushableNotification,
): Promise<{ delivered: boolean; hadTokens: boolean }> {
  const admin = createSupabaseAdminClient();
  const { data: tokens } = await admin
    .from("device_tokens")
    .select("id, token")
    .eq("user_id", notification.user_id)
    .eq("enabled", true);

  if (!tokens || tokens.length === 0) {
    return { delivered: false, hadTokens: false };
  }

  const dataPayload: Record<string, string> = {
    type: notification.type,
    notification_id: notification.id,
    title: notification.title,
    body: notification.body ?? "",
    url: clickUrlFor(notification),
  };

  for (const [key, value] of Object.entries(notification.data ?? {})) {
    if (value != null && !(key in dataPayload)) dataPayload[key] = String(value);
  }

  const messaging = getFirebaseMessaging();
  const response = await messaging.sendEachForMulticast({
    tokens: tokens.map((t) => t.token),
    data: dataPayload,
    webpush: { fcmOptions: { link: dataPayload.url } },
  });

  const tokensToDisable: string[] = [];

  response.responses.forEach((r, i) => {
    if (!r.success && r.error && INVALID_TOKEN_ERROR_CODES.has(r.error.code)) {
      tokensToDisable.push(tokens[i].id);
    }
  });

  if (tokensToDisable.length > 0) {
    await admin.from("device_tokens").update({ enabled: false }).in("id", tokensToDisable);
  }

  return { delivered: response.successCount > 0, hadTokens: true };
}
