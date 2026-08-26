"use client";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function getFirebaseApp(): FirebaseApp {
  return getApps()[0] ?? initializeApp(firebaseConfig);
}

// Xin quyền thông báo trình duyệt + lấy FCM token, đăng ký lên server qua
// POST /api/device-tokens. Trả về lỗi rõ ràng thay vì throw, vì đây là 1
// hành động người dùng chủ động bấm (nút "Bật thông báo"), không phải luồng
// bắt buộc phải thành công.
export async function registerPushToken(): Promise<{ ok: boolean; error?: string }> {
  if (typeof window === "undefined") return { ok: false, error: "Chỉ chạy được trên trình duyệt." };

  const supported = await isSupported().catch(() => false);

  if (!supported) return { ok: false, error: "Trình duyệt này không hỗ trợ thông báo đẩy." };

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  if (!vapidKey) return { ok: false, error: "Thiếu cấu hình VAPID key." };

  const permission = await Notification.requestPermission();

  if (permission !== "granted") return { ok: false, error: "Bạn đã từ chối quyền nhận thông báo." };

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const messaging = getMessaging(getFirebaseApp());
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });

  if (!token) return { ok: false, error: "Không lấy được token thiết bị." };

  const res = await fetch("/api/device-tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, provider: "fcm", platform: "web" }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));

    return { ok: false, error: data.error ?? "Đăng ký token thất bại." };
  }

  return { ok: true };
}

// Lắng nghe push khi tab đang mở (foreground) — service worker chỉ tự hiện
// thông báo hệ điều hành lúc tab ở nền/đóng, còn khi đang mở thì phải tự xử
// lý qua onMessage. Payload data-only (xem dispatch.ts) nên đọc từ
// payload.data, không phải payload.notification.
export function listenForegroundMessages(onReceive: (title: string, body: string) => void): () => void {
  if (typeof window === "undefined") return () => {};

  let unsubscribe = () => {};

  isSupported()
    .then((supported) => {
      if (!supported) return;

      const messaging = getMessaging(getFirebaseApp());

      unsubscribe = onMessage(messaging, (payload) => {
        const title = payload.data?.title ?? "Thông báo mới";
        const body = payload.data?.body ?? "";

        onReceive(title, body);
      });
    })
    .catch(() => {});

  return () => unsubscribe();
}
