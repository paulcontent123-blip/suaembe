// UC-08 - AI Gợi Ý Sữa. Endpoint public không yêu cầu đăng nhập nên cần giới
// hạn theo IP để tránh bị gọi liên tục (mỗi lần gọi tốn phí Claude API
// thật). Dùng Upstash Redis REST API (đã có sẵn REDIS_URL/REDIS_TOKEN trong
// .env) qua fetch trực tiếp — không cần thêm SDK riêng cho 1 lệnh INCR đơn
// giản. Cửa sổ cố định (fixed window) theo giờ, không phải sliding window
// chính xác tuyệt đối, nhưng đủ dùng để chặn lạm dụng ở quy mô tính năng này.
const WINDOW_SECONDS = 60 * 60;
const MAX_REQUESTS_PER_WINDOW = 15;

export async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const url = process.env.REDIS_URL;
  const token = process.env.REDIS_TOKEN;

  // Không có Redis cấu hình thì bỏ qua rate limit thay vì chặn cứng toàn bộ
  // tính năng — ưu tiên tính năng vẫn chạy được ở môi trường dev/thiếu cấu hình.
  if (!url || !token) return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW };

  const key = `ai-suggest-milk:${ip}`;

  try {
    const incrRes = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const incrData = await incrRes.json();
    const count = typeof incrData.result === "number" ? incrData.result : Number(incrData.result);

    if (count === 1) {
      await fetch(`${url}/expire/${encodeURIComponent(key)}/${WINDOW_SECONDS}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    return { allowed: count <= MAX_REQUESTS_PER_WINDOW, remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - count) };
  } catch {
    // Redis lỗi tạm thời — không chặn người dùng thật vì 1 sự cố hạ tầng phụ.
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW };
  }
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}
