"use client";

import { useEffect, useState } from "react";

import { listenForegroundMessages, registerPushToken } from "@/lib/firebase/client";

type Status = "checking" | "idle" | "loading" | "enabled" | "denied" | "error";

// UC-06 (nhắc lịch ăn) + UC-16 (bác sĩ trả lời tư vấn) đẩy qua Firebase FCM —
// đặt nút bật ở đây vì đây là cài đặt chung cho cả tài khoản, không riêng 1
// bé/1 tính năng. Người dùng chủ động bấm lần đầu; những lần vào lại sau tự
// đồng bộ ngầm nếu quyền trình duyệt đã "granted" — không bắt bấm lại mỗi
// lần load trang (trạng thái nút trước đây chỉ lưu ở React state, mất ngay
// khi reload dù quyền/token thật vẫn còn nguyên).
export function NotificationSettings() {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    return listenForegroundMessages((title, body) => {
      setToast({ title, body });
      window.setTimeout(() => setToast(null), 6000);
    });
  }, []);

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setStatus("idle");

      return;
    }

    if (Notification.permission === "denied") {
      setStatus("denied");

      return;
    }

    if (Notification.permission !== "granted") {
      setStatus("idle");

      return;
    }

    // Quyền đã "granted" từ trước — requestPermission() bên trong
    // registerPushToken() sẽ tự resolve ngay, không hiện lại popup xin
    // quyền. Gọi lại để đảm bảo device_tokens luôn có token mới nhất (token
    // FCM có thể đổi theo thời gian).
    registerPushToken().then((result) => {
      setStatus(result.ok ? "enabled" : "idle");
    });
  }, []);

  async function handleEnable() {
    setStatus("loading");
    setError(null);

    const result = await registerPushToken();

    if (result.ok) {
      setStatus("enabled");
    } else {
      setStatus("error");
      setError(result.error ?? "Có lỗi xảy ra.");
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
      <h2 className="text-lg font-bold text-[#0F172A]">🔔 Thông báo</h2>
      <p className="mt-1 text-xs text-[#94A3B8]">
        Bật thông báo đẩy để nhận nhắc lịch ăn/sữa của bé và khi bác sĩ trả lời câu hỏi tư vấn.
      </p>

      {status === "checking" ? (
        <p className="mt-4 text-[12.5px] text-[#94A3B8]">Đang kiểm tra...</p>
      ) : status === "enabled" ? (
        <p className="mt-4 rounded-lg bg-[#16A34A]/10 p-3 text-[12.5px] font-semibold text-[#16A34A]">
          ✅ Đã bật thông báo đẩy trên trình duyệt này.
        </p>
      ) : status === "denied" ? (
        <p className="mt-4 rounded-lg bg-red-600/10 p-3 text-[12.5px] font-semibold text-red-600">
          🔕 Trình duyệt đang chặn thông báo. Vào cài đặt trang (biểu tượng khoá cạnh URL) để cho phép lại, rồi tải
          lại trang này.
        </p>
      ) : (
        <button
          type="button"
          onClick={handleEnable}
          disabled={status === "loading"}
          className="mt-4 rounded-lg bg-gradient-to-r from-[#E8547A] to-[#C43A62] px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-60"
        >
          {status === "loading" ? "Đang bật..." : "🔔 Bật thông báo"}
        </button>
      )}

      {error && <p className="mt-3 text-[12.5px] font-semibold text-red-600">{error}</p>}

      {toast && (
        <div className="fixed bottom-7 right-7 z-[300] max-w-xs rounded-lg bg-[#0F172A] px-5 py-3 text-white shadow-2xl">
          <div className="text-sm font-bold">{toast.title}</div>
          {toast.body && <div className="mt-0.5 text-[12.5px] text-white/80">{toast.body}</div>}
        </div>
      )}
    </div>
  );
}
