import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// Khởi tạo Firebase Admin 1 lần (tránh lỗi "app already exists" khi Next.js
// hot-reload dev). FIREBASE_SERVICE_ACCOUNT chứa nguyên JSON service account
// tải từ Firebase Console (Project settings > Service accounts > Generate
// new private key), dán thành 1 dòng trong .env — thiếu biến này thì throw
// để caller (route dispatch) trả 503 rõ ràng thay vì lỗi Firebase khó hiểu.
function getFirebaseApp() {
  const existing = getApps();

  if (existing.length > 0) return existing[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    throw new Error("Thiếu FIREBASE_SERVICE_ACCOUNT trong .env — chưa cấu hình Firebase Admin.");
  }

  let serviceAccount: ServiceAccount;

  try {
    serviceAccount = JSON.parse(raw) as ServiceAccount;
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT không phải JSON hợp lệ.");
  }

  return initializeApp({ credential: cert(serviceAccount) });
}

export function getFirebaseMessaging() {
  return getMessaging(getFirebaseApp());
}
