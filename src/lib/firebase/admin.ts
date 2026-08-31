import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// Khởi tạo Firebase Admin 1 lần (tránh lỗi "app already exists" khi Next.js
// hot-reload dev). Ưu tiên đọc FIREBASE_SERVICE_ACCOUNT_BASE64 (JSON service
// account mã hóa base64 thành 1 chuỗi phẳng, không dấu/không xuống dòng) —
// an toàn với mọi parser .env đơn giản (VD CloudLinux Node.js Selector trên
// shared hosting từng bị vỡ cú pháp khi export thẳng JSON nhiều dòng chứa
// dấu ":", "\n" của FIREBASE_SERVICE_ACCOUNT gốc, khiến app không khởi động
// được — không phải bug ở code, mà ở cách hosting đọc .env). Vẫn hỗ trợ
// FIREBASE_SERVICE_ACCOUNT (JSON thô, dán 1 dòng) để tương thích ngược cho
// local dev. Thiếu cả 2 thì throw để caller (route dispatch) trả 503 rõ ràng
// thay vì lỗi Firebase khó hiểu.
function getFirebaseApp() {
  const existing = getApps();

  if (existing.length > 0) return existing[0];

  const rawBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const raw = rawBase64
    ? Buffer.from(rawBase64, "base64").toString("utf-8")
    : process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    throw new Error(
      "Thiếu FIREBASE_SERVICE_ACCOUNT_BASE64 (hoặc FIREBASE_SERVICE_ACCOUNT) trong .env — chưa cấu hình Firebase Admin.",
    );
  }

  let serviceAccount: ServiceAccount;

  try {
    serviceAccount = JSON.parse(raw) as ServiceAccount;
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT(_BASE64) không phải JSON hợp lệ.");
  }

  return initializeApp({ credential: cert(serviceAccount) });
}

export function getFirebaseMessaging() {
  return getMessaging(getFirebaseApp());
}
