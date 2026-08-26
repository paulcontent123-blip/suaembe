// Service worker nhận push FCM khi tab đang đóng/ở nền. Không dùng module
// bundler ở đây (service worker load trực tiếp bằng URL tĩnh, ngoài phạm vi
// build Next.js) nên dùng bản "compat" qua CDN + config public (an toàn để
// hardcode vì đây là NEXT_PUBLIC_* — vốn đã lộ ra client, không phải secret).
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBfJSPvk9hkQXeNS4GbI9tjqvRmJ-Somgk",
  authDomain: "suaembe-a39ce.firebaseapp.com",
  projectId: "suaembe-a39ce",
  storageBucket: "suaembe-a39ce.firebasestorage.app",
  messagingSenderId: "369981034415",
  appId: "1:369981034415:web:7be6539a9dc964a2a3a95a",
});

const messaging = firebase.messaging();

// Backend gửi payload data-only (không có field "notification" cấp cao
// nhất, xem src/lib/notifications/dispatch.ts) để tránh trình duyệt tự hiện
// trùng lặp — tự dựng notification từ data ở đây.
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};

  self.registration.showNotification(data.title || "SữaEmbe", {
    body: data.body || "",
    icon: "/file.svg",
    data: { url: data.url || "/" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(clients.openWindow(url));
});
