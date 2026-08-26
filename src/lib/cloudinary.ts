import { v2 as cloudinary } from "cloudinary";

let configured = false;

/**
 * Cloudinary SDK tự đọc biến môi trường CLOUDINARY_URL khi gọi config()
 * không tham số, nên chỉ cần đảm bảo biến này tồn tại trước khi dùng.
 */
export function getCloudinary() {
  if (!configured) {
    if (!process.env.CLOUDINARY_URL) {
      throw new Error("Missing required environment variable: CLOUDINARY_URL");
    }

    cloudinary.config({ secure: true });
    configured = true;
  }

  return cloudinary;
}
