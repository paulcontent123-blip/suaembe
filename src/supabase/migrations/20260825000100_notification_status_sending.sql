-- Job dispatch push (/api/cron/dispatch-notifications) claim nguyên tử theo
-- từng dòng bằng cách chuyển status pending -> sending trước khi gửi FCM
-- (tránh 2 lần chạy cron chồng nhau gửi trùng). Enum notification_status ban
-- đầu chỉ có pending/sent/read/failed/cancelled, thiếu 'sending' khiến bước
-- claim luôn lỗi 22P02 (silently nuốt lỗi, coi như "đã bị claim trước" nên
-- không bao giờ gửi được gì) — bổ sung giá trị còn thiếu.
alter type public.notification_status add value if not exists 'sending';
