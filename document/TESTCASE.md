# TESTCASE SuaEmbe

Phạm vi: kiểm thử các API route và UI đã hiện thực thật trong `src/app`, `src/components`, `src/lib`.
Không kiểm thử các màn demo tĩnh trong `document/suaembe.html`.

Ngày cập nhật: 2026-08-25.

Actor:

- Khách: chưa đăng nhập.
- Mẹ bỉm: tài khoản `users.role = 'user'`.
- Admin: tài khoản `users.role = 'admin'`.

Quy ước:

- Kết quả thành công: HTTP `2xx`, payload đúng cấu trúc, dữ liệu được lưu đúng DB.
- Kết quả lỗi: HTTP `4xx/5xx` phù hợp, không rò rỉ dữ liệu người khác.
- Các testcase phân quyền phải chạy ít nhất với 2 tài khoản mẹ bỉm khác nhau: User A và User B.
- Dữ liệu test nên đặt tiền tố `__TEST_` để dễ dọn.

## 0. Điều Kiện Và Thứ Tự Smoke Test Cho Techlead

1. Đồng bộ migration với Supabase Cloud trước khi test: chạy `supabase migration list`, kiểm tra các migration `20260824000400_partner_bookings_guest_leads.sql` và `20260824000500_doctor_contact_leads.sql` đã có trên remote. Đặc biệt kiểm tra `partner_bookings.bs_id` và constraint `request_type` đã tồn tại để tránh lỗi schema cache.
2. Cấu hình server-side: Supabase URL/key, Cloudinary và các biến AI nếu test UC-08. Không đưa `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` hoặc Cloudinary secret vào client/repository.
3. Chạy kiểm tra build: `npm run lint`, `npm run build`; sau đó chạy app bằng `npm run dev`.
4. Tạo dữ liệu test có tiền tố `__TEST_`: một Admin, User A, User B, một bác sĩ đã xác minh, một đối tác `service`, một gói dịch vụ, một sản phẩm sữa và một listing C2C.
5. Smoke Auth/RLS: AUTH-05, AUTH-11 đến AUTH-15; sau đó kiểm tra User A không đọc/sửa dữ liệu User B.
6. Smoke dữ liệu bé: GROWTH-01, MILE-01, FEED-01 và FEED-08; xác nhận CRUD lịch ăn chạy nhưng không kỳ vọng push reminder.
7. Smoke kinh doanh: SHOP-03, C2C-FORM-08, C2C-ADMIN-01, ORDER-03, PARTNER-LEAD-01, BOOKING-01, BOOKING-ADMIN-04 và MEDIA-11.
8. Smoke AI: TOOLS-01, TOOLS-02, TOOLS-04, TOOLS-05; chỉ chạy TOOLS-11 sau khi techlead xác nhận model ID và credential Claude hợp lệ.

---

## 1. Tổng Quan Chức Năng Và Trạng Thái Test

`Đã có code` không đồng nghĩa với `đã test E2E`. Các tích hợp thật như Claude, FCM, SMS/email và cổng thanh toán vẫn phải được kiểm tra bằng credential/provider tương ứng.

| UC | Chức năng | Trạng thái test |
|---|---|---|
| UC-01 | Đăng ký / đăng nhập / đăng xuất / modal auth / bảo vệ admin | Đã có code; cần regression đầy đủ |
| UC-02 | Hồ sơ cá nhân + avatar upload | Đã có code; cần regression đầy đủ |
| UC-03 | Hồ sơ bé cơ bản | Đã có code; cần regression đầy đủ |
| UC-04 | Cập nhật chỉ số + đánh giá tăng trưởng WHO (percentile/z-score LMS) | Đã có code và testcase; cần chạy regression |
| UC-05 | Theo dõi mốc phát triển của bé | Đã có code và testcase; cần chạy regression |
| UC-06 | Quản lý lịch ăn/sữa/ăn dặm | CRUD + nhắc lịch qua push FCM đã test đầy đủ, kể cả xác thực Firebase thật; còn thiếu QA nhận push trên thiết bị thật |
| UC-07 | Xem Bách Hóa và sản phẩm (kể cả link affiliate `outbound_url`) | Đã có code; cần regression đầy đủ |
| UC-08 | AI gợi ý sữa + Tính ngày dự sinh + Cẩm nang sinh con | Validate/retrieval/rate limit/guard đã test; lời gọi Claude thật cần techlead test |
| UC-09 | Xem tin chợ C2C | Đã có code; cần regression đầy đủ |
| UC-10 | Gửi form pass đồ C2C — MVP mới, không cần đăng nhập | Đã có code; cần regression đầy đủ |
| UC-11 | Admin xử lý/duyệt tin chợ C2C | Đã có code; cần regression đầy đủ |
| UC-12 | Đặt mua C2C thanh toán thường (MoMo/VNPay MOCK, COD) + admin xử lý đơn | Đã có code; thanh toán thật chưa tích hợp |
| UC-13 | Escrow / tranh chấp | Chưa triển khai, future scope |
| UC-14 | Xem chi tiết, liên hệ và danh sách bác sĩ nhi (`/doi-tac`) | Đã có code; cần regression đầy đủ |
| UC-15 | Gửi yêu cầu tư vấn bác sĩ | Đã có code; cần regression đầy đủ |
| UC-16 | Admin chuyển tiếp tư vấn và cập nhật câu trả lời | Đã có code; cần regression đầy đủ |
| UC-17 | Xem đối tác và gói/dịch vụ (`/doi-tac`) | Đã có code; cần regression đầy đủ |
| UC-18 | Guest gửi lead/đặt lịch đối tác | Đã có public UI + API; SMS/email xác nhận chưa tích hợp |
| UC-19 | Admin CRUD đối tác, gói dịch vụ và booking | Đã có API + UI; cần techlead test đầy đủ |
| UC-20 | Đọc tin tức / học viện (public) | Đã có code; cần regression đầy đủ |
| UC-21 | Admin quản lý chuyên mục và bài viết | Đã có code; cần regression đầy đủ |
| UC-22 | Admin quản lý bác sĩ nhi | Đã có code; cần regression đầy đủ |
| UC-23 | Admin quản lý brand/category/product/milk profile | Đã có code; cần regression đầy đủ |
| UC-24 | Quản lý dữ liệu WHO/mốc phát triển qua Admin | Dữ liệu đã seed; Admin UI/API import chưa có |
| UC-25 | Device token / push FCM (tư vấn + nhắc lịch ăn) | Token + job dispatch + guard + xác thực Firebase thật đã test; SMS/email/hộp thư trong app chưa có |
| UC-26 | Media upload và cleanup | Upload + cleanup khi thay/gỡ đã test; media dashboard Admin chưa có |
| UC-27 | Admin quản lý người dùng | Đã có code; cần regression đầy đủ |
| UC-28 | Quản lý tin đăng của tôi (Chợ C2C) | Đã có code; cần regression đầy đủ |
| UC-29 | Quản lý đơn hàng của tôi (Chợ C2C) | Đã có code; cần regression đầy đủ |
| UC-30 | Khách vãng lai tra cứu trạng thái đơn | Chưa triển khai, chưa chốt phương án |

Các UC có code nhưng cần techlead/QA chạy lại trên Supabase Cloud: UC-01 đến UC-12, UC-14 đến UC-23 và UC-25 đến UC-29. Không chạy UC-13 và UC-30 như bug hiện tại vì đây là phạm vi tương lai; UC-24 chỉ kiểm tra seed/migration, chưa có Admin UI/API import.

---

## 2. UC-01 - Đăng Ký / Đăng Nhập

API: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| AUTH-01 | Đăng ký tài khoản mẹ bỉm thành công | `POST /api/auth/register` với email mới, password >= 8 ký tự | `201`; có user trong Supabase Auth và `public.users`; role mặc định là `user` |
| AUTH-02 | Đăng ký email sai định dạng | Gửi `email = "abc"` | `400`; không tạo user |
| AUTH-03 | Đăng ký password quá ngắn | Gửi password dưới 8 ký tự | `400`; không tạo user |
| AUTH-04 | Đăng ký email đã tồn tại | Gửi lại email đã đăng ký | `4xx`; không tạo user trùng |
| AUTH-05 | Client cố tự gán role admin khi đăng ký | Body có `{ role: "admin" }` | Server bỏ qua; DB vẫn lưu `role = 'user'` |
| AUTH-06 | Đăng nhập đúng | `POST /api/auth/login` với email/password hợp lệ | `200`; trả profile đúng role |
| AUTH-07 | Đăng nhập sai password | Password sai | `401`; không trả profile |
| AUTH-08 | `GET /api/auth/me` khi chưa login | Không có cookie session | `401`; không trả dữ liệu user |
| AUTH-09 | `GET /api/auth/me` khi đã login | Có cookie session hợp lệ | `200`; trả đúng profile của user hiện tại |
| AUTH-10 | Đăng xuất | `POST /api/auth/logout` | `200`; gọi lại `/api/auth/me` trả `401` |
| AUTH-11 | Khách truy cập `/admin` | Mở `/admin` khi chưa login | Middleware redirect về `/?login=1&redirect=%2Fadmin`, modal đăng nhập mở |
| AUTH-12 | Mẹ bỉm truy cập `/admin` | Login role `user`, mở `/admin` | Bị redirect về `/` |
| AUTH-13 | Admin truy cập `/admin` | Login role `admin`, mở `/admin` | Vào được admin shell, thấy sidebar/topbar |
| AUTH-14 | Chọn sai role trong modal login | Chọn "Mẹ bỉm" nhưng nhập tài khoản admin | Frontend logout session vừa tạo, hiển thị lỗi role không khớp |
| AUTH-15 | Chọn đúng role trong modal login | Chọn "Admin", nhập tài khoản admin | Đóng modal, điều hướng vào `/admin` |
| AUTH-16 | Route `/dang-nhap` và `/dang-ky` cũ | Mở trực tiếp 2 URL này | `404`; auth dùng modal trên trang chủ |

---

## 3. UC-25 - Device Token & Push Notification (Firebase FCM)

API: `POST /api/device-tokens`, `DELETE /api/device-tokens/:id`, `GET/POST /api/cron/dispatch-notifications`. UI: nút "🔔 Bật thông báo" ở `/tai-khoan`.

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| DT-01 | Đăng ký FCM token | Login, `POST /api/device-tokens` với `token`, `platform`, `device_id` | `200/201`; tạo hoặc cập nhật `device_tokens`; `enabled = true` |
| DT-02 | Gửi trùng token | Gửi lại cùng token | Không tạo dòng trùng; cập nhật `last_seen_at`, `platform`, `device_id` nếu có |
| DT-03 | Thiếu token | Body không có `token` | `400` |
| DT-04 | Chưa login gửi token | Không session | `401` |
| DT-05 | Vô hiệu hóa token | `DELETE /api/device-tokens/:id` với token của mình | `200`; `enabled = false`, không xóa cứng |
| DT-06 | User B vô hiệu hóa token của User A | User B gọi DELETE id token của User A | Không được cập nhật dữ liệu User A; trả lỗi phù hợp theo RLS/route |
| CRON-01 | Gọi cron thiếu secret | `POST /api/cron/dispatch-notifications` không kèm `Authorization` | `401` |
| CRON-02 | Gọi cron sai secret | `Authorization: Bearer <sai>` | `401` |
| CRON-03 | Gọi cron đúng secret, chưa cấu hình Firebase Admin | `Authorization: Bearer <CRON_SECRET đúng>`, `.env` chưa có `FIREBASE_SERVICE_ACCOUNT` | `503`, message "chưa được cấu hình"; không đụng tới bất kỳ row `notifications` nào |
| CRON-04 | Gọi bằng GET (kiểu Vercel Cron) | `GET /api/cron/dispatch-notifications` kèm đúng secret | Hành vi giống hệt `POST` (cùng handler dùng chung) |
| CRON-05 | Xác thực service account thật với Google | Gọi trực tiếp `messaging.send({token: "<fake>"}, dryRun=true)` với `FIREBASE_SERVICE_ACCOUNT` thật | Trả lỗi `messaging/invalid-argument` (lỗi TOKEN) chứ không phải lỗi AUTH (`app/invalid-credential`...) — chứng minh credential xác thực thành công thật với Google |
| CRON-06 | Dispatch notification thật khi chưa có device token | Có 1 row `notifications` thật (`channel='push', status='pending'`) của user chưa bấm "Bật thông báo"; gọi cron | Claim thành công (`pending -> sending`), tra `device_tokens` ra 0 kết quả, trả lại `status='pending'` để job sau thử lại — không đánh dấu `failed` |

Ghi chú: DT-01 đến DT-06 và CRON-01 đến CRON-06 đã test thật qua HTTP/trực tiếp (không mock, dùng `.env` thật do người vận hành cung cấp) — toàn bộ pass. **CRON-03 phản ánh trạng thái TRƯỚC khi có `FIREBASE_SERVICE_ACCOUNT` thật** (đã test cả hai trạng thái: thiếu key → `503`; có key thật → không còn `503`, xem CRON-05/06). Trong lúc verify CRON-06 phát hiện 1 bug thật: bước claim nguyên tử dùng `status: "sending"` nhưng enum `notification_status` gốc không có giá trị này (chỉ có `pending/sent/read/failed/cancelled`) — mọi UPDATE claim đều lỗi Postgres 22P02 nhưng code cũ chỉ kiểm tra `count` (luôn `null`/falsy) mà không log `error`, khiến job "âm thầm" không bao giờ gửi được gì dù có notification `pending` thật. Đã sửa bằng migration `20260825000100_notification_status_sending.sql` (bổ sung giá trị `sending` vào enum) và xác nhận lại — claim hoạt động đúng sau khi migrate. **Vẫn chưa test được việc thực sự nhận push trên thiết bị thật** vì cần 1 trình duyệt thật hoàn tất luồng xin quyền + đăng ký `device_tokens` — xem mục 8 cho phần đã test được của luồng tạo/huỷ notification.

---

## 4. UC-02 - Quản Lý Hồ Sơ Cá Nhân

API: `GET/PUT /api/auth/me`, `POST /api/uploads`. UI: `/tai-khoan`.

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| PROFILE-01 | Xem trang tài khoản | Login mẹ bỉm, mở `/tai-khoan` | Hiển thị email, họ tên, phone, avatar hiện tại |
| PROFILE-02 | Cập nhật họ tên và SĐT | Sửa `full_name`, `phone`, bấm lưu | `200`; DB `users` cập nhật đúng |
| PROFILE-03 | Body rỗng khi cập nhật | `PUT /api/auth/me` với `{}` | `400`; không cập nhật DB |
| PROFILE-04 | Trim chuỗi trắng | Gửi `full_name = "   "` | Lưu `full_name = null`, không lưu chuỗi trắng |
| PROFILE-05 | Client cố đổi role qua profile | Body có `{ role: "admin", full_name: "X" }` | Chỉ cập nhật field cho phép; role không đổi |
| PROFILE-06 | Upload avatar hợp lệ | Upload ảnh JPEG/PNG/WEBP/GIF dưới 5MB | `201`; tạo `media_assets`; cập nhật avatar trên UI |
| PROFILE-07 | Upload file sai định dạng | Upload PDF/EXE | `400`; không tạo media |
| PROFILE-08 | Upload ảnh quá 5MB | Upload ảnh > 5MB | `400`; không tạo media |
| PROFILE-09 | Khách upload media | Không login, gọi `/api/uploads` | `401` |
| PROFILE-10 | Mẹ bỉm gắn media vào user khác | `owner_table = users`, `owner_id` của User B | `403` |
| PROFILE-11 | Mẹ bỉm gắn media vào bảng chưa cho phép | `owner_table = products` | `403`; chỉ admin mới được |
| PROFILE-12 | Cấu hình Cloudinary sai | Tạm thời sai `CLOUDINARY_URL`, upload ảnh | `502`; có thông báo lỗi rõ ràng |

---

## 5. UC-03 - Quản Lý Hồ Sơ Bé

API: `GET/POST /api/babies`, `PUT /api/babies/:id`. UI: `/tai-khoan`.

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| BABY-01 | Tạo hồ sơ bé hợp lệ | Login, nhập tên, giới tính, ngày sinh, cân nặng, chiều cao, vòng đầu | `201`; `user_id = auth.uid()` |
| BABY-02 | Tạo bé thiếu tên | `name` rỗng hoặc không gửi | `400` |
| BABY-03 | Tạo bé chỉ có tên | Chỉ gửi `{ name: "__TEST_Bé Bin" }` | `201`; field optional lưu `null` |
| BABY-04 | Giới tính sai enum | `gender = "unknown"` | `400` |
| BABY-05 | Ngày sinh ở tương lai | `birth_date` > ngày hiện tại | `400` |
| BABY-06 | Ngày sinh sai định dạng | `birth_date = "20/08/2026"` | `400` |
| BABY-07 | Cân nặng/chiều cao/vòng đầu không hợp lệ | Giá trị âm, 0 hoặc không phải số | `400` |
| BABY-08 | Lấy danh sách bé của mình | User A có 2 bé, gọi `GET /api/babies` | `200`; chỉ trả 2 bé của User A, sort `updated_at desc` |
| BABY-09 | Cách ly dữ liệu giữa user | User B gọi `GET /api/babies` | Không thấy bé của User A |
| BABY-10 | Sửa bé của mình | `PUT /api/babies/:id` với bé của User A | `200`; field thay đổi, `updated_at` đổi |
| BABY-11 | User B sửa bé của User A | User B gọi `PUT` với id bé User A | `404`; không lộ bé có tồn tại |
| BABY-12 | Sửa với body rỗng | `PUT /api/babies/:id` `{}` | `400` |
| BABY-13 | Partial update | Chỉ gửi `{ current_milk_stage: "Số 2" }` | Chỉ field này đổi, field khác giữ nguyên |
| BABY-14 | User mới chưa có bé | Mở `/tai-khoan` với user chưa tạo bé | Hiển thị trạng thái rỗng, không lỗi trắng trang |

---

## 6. UC-04 - Cập Nhật Chỉ Số Và Đánh Giá Tăng Trưởng WHO

API: `GET/POST /api/babies/:id/measurements`. UI: card "📈 Biểu đồ phát triển" trong `/nhat-ky-be`.

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| GROWTH-01 | Nhập chỉ số đúng bằng median WHO | Bé trai 1 tháng tuổi, nhập `height_cm = 54.7244` (đúng giá trị M của WHO tháng 1) | `201`; `height_percentile` ≈ 50, `height_z_score` ≈ 0 |
| GROWTH-02 | Nhập chỉ số thấp hơn nhiều so với chuẩn | `height_cm = 46.0` (thấp hơn hẳn p3 = 50.8 của tháng 1) | `201`; `height_percentile < 3`; `assessment` chứa "Thấp hơn ngưỡng tham chiếu" |
| GROWTH-03 | Nhập chỉ số cao hơn nhiều so với chuẩn | `height_cm` cao hơn hẳn p97 của tháng tuổi tương ứng | `201`; `height_percentile > 97`; `assessment` chứa "Cao hơn ngưỡng tham chiếu" |
| GROWTH-04 | Tính đủ cả 3 chỉ số cùng lúc | Gửi cả `weight_g`, `height_cm`, `head_cm` | `201`; cả 3 percentile/z-score đều tính, `assessment` gộp cả 3 câu tóm tắt |
| GROWTH-05 | Chỉ nhập 1 chỉ số | Chỉ gửi `weight_g`, không gửi `height_cm`/`head_cm` | `201`; chỉ `weight_percentile`/`weight_z_score` có giá trị, 2 chỉ số kia `null` |
| GROWTH-06 | Không nhập chỉ số nào | Body rỗng hoặc cả 3 field đều thiếu | `400` |
| GROWTH-07 | Bé chưa có ngày sinh | `babies.birth_date = null`, gọi POST measurement | `400`; báo cần nhập ngày sinh trước |
| GROWTH-08 | Xem lịch sử đo | `GET /api/babies/:id/measurements` sau khi đã có nhiều lần đo | `200`; trả đủ, sắp xếp theo `measured_at` tăng dần |
| GROWTH-09 | User B xem/tạo số đo cho bé User A | User B gọi GET/POST với `baby_id` của User A | GET trả rỗng (RLS lọc theo `babies.user_id`); POST `404` |
| GROWTH-10 | Đồng bộ chỉ số mới nhất lên hồ sơ bé | Sau khi POST measurement thành công | `babies.weight_g`/`height_cm`/`head_cm` cập nhật theo giá trị vừa đo (chỉ field có nhập) |
| GROWTH-11 | Tra đúng `who_growth_standards.version` | Bất kỳ lần tính percentile nào | Query lọc đúng `version = 'WHO-2006'` (không phải `'default'`) — khớp giá trị mặc định thật của cột |

---

## 7. UC-05 - Theo Dõi Mốc Phát Triển Của Bé

API: `GET /api/babies/:id/milestones`, `PUT /api/babies/:id/milestones/:milestoneId`, `GET /api/development-milestones`. UI: card "🎯 Cột mốc phát triển" trong `/nhat-ky-be`.

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| MILE-01 | Xem toàn bộ mốc chuẩn | `GET /api/babies/:id/milestones` | `200`; trả đủ 99 mốc active + toàn bộ `records` hiện có của bé |
| MILE-02 | UI chỉ hiện đúng 1 mốc tháng tuổi | Bé hiện 7 tháng tuổi, mở card mốc phát triển | Hiển thị đúng mốc "6 tháng" (mốc lớn nhất ≤ tuổi hiện tại), không liệt kê mốc 2/4 tháng cũ |
| MILE-03 | Đánh dấu 1 mốc đã đạt | `PUT .../milestones/:milestoneId` `{ status: "achieved" }` | `200`; `achieved_at` tự gán ngày hôm nay nếu không gửi kèm |
| MILE-04 | Đánh dấu lại không tạo trùng | Gọi PUT lần 2 với status khác cho cùng milestone | Upsert theo unique `(baby_id, milestone_id)` — vẫn đúng 1 dòng record, không nhân đôi |
| MILE-05 | Status không hợp lệ | `{ status: "xong" }` (không thuộc 4 giá trị enum) | `400` |
| MILE-06 | User B thao tác mốc của bé User A | User B gọi PUT với `baby_id` của User A | `404` |
| MILE-07 | Mốc chuẩn công khai | `GET /api/development-milestones` không session | `200`; chỉ trả mốc `active = true` |
| MILE-08 | Lọc mốc theo tháng tuổi | `GET /api/development-milestones?age_months=12` | Chỉ trả đúng 10 mốc của tháng 12 |

---

## 8. UC-06 - Quản Lý Lịch Ăn/Sữa/Ăn Dặm

API: `GET/POST /api/babies/:id/feeding-schedule`, `PUT/DELETE /api/babies/:id/feeding-schedule/:scheduleId`, `DELETE /api/babies/:id/feeding-schedule`. UI: tab "📊 Nhật ký Dinh dưỡng Bé" trong `/tin-tuc?tab=nhatky` (xem UC-04).

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| FEED-01 | Tạo lịch ăn hợp lệ | `POST .../feeding-schedule` với `title`, `scheduled_time`, `amount_ml` | `201`; `status = pending` mặc định |
| FEED-02 | Thiếu tên bữa | Không gửi `title` | `400` |
| FEED-03 | Không gửi ngày | Không gửi `scheduled_date` | Mặc định là hôm nay (server tự điền) |
| FEED-04 | Xem lịch theo ngày | `GET .../feeding-schedule?date=YYYY-MM-DD` | Chỉ trả đúng các mục của ngày đó, sắp theo `scheduled_time` |
| FEED-05 | Đánh dấu hoàn thành | `PUT .../feeding-schedule/:id` `{ status: "done" }` | `200`; `completed_at` tự gán thời điểm hiện tại |
| FEED-06 | Đánh dấu bỏ qua | `PUT` `{ status: "skipped" }` | `200`; `completed_at = null` |
| FEED-07 | Status không hợp lệ | `{ status: "xong" }` | `400` |
| FEED-08 | User B thao tác lịch ăn của bé User A | User B gọi POST/PUT với `baby_id` của User A | `404` |
| FEED-09 | Sửa nội dung lịch (không đổi status) | `PUT` chỉ gửi `{ title: "..." }` | `200`; chỉ field gửi lên thay đổi |
| FEED-10 | Tạo lịch có giờ tự tạo nhắc lịch | `POST` với `scheduled_time: "14:30"` | Sau khi tạo, có 1 row `notifications` mới: `type='feeding_reminder', channel='push', status='pending'`, `scheduled_at` = đúng `scheduled_date`+`scheduled_time` (UTC, quy đổi từ giờ local server) |
| FEED-11 | Tạo lịch không có giờ | `POST` không gửi `scheduled_time` | Không tạo `notifications` nào (không có gì để nhắc) |
| FEED-12 | Đổi giờ lịch đang chờ nhắc | `PUT` `{ scheduled_time: "09:15" }` cho lịch đã có nhắc `pending` | `scheduled_at` của đúng notification đó được cập nhật; không tạo thêm dòng `notifications` mới (không trùng) |
| FEED-13 | Đánh dấu done huỷ luôn nhắc lịch | `PUT` `{ status: "done" }` cho lịch đang có nhắc `pending` | Notification tương ứng chuyển `status = 'cancelled'` |
| FEED-14 | Xoá 1 lịch huỷ nhắc lịch | `DELETE .../feeding-schedule/:scheduleId` cho lịch đang có nhắc `pending` | Notification tương ứng chuyển `status = 'cancelled'` |
| FEED-15 | Xoá theo ngày/toàn bộ huỷ hết nhắc lịch liên quan | `DELETE .../feeding-schedule?date=...` hoặc `?all=true` | Mọi notification `pending` gắn với các lịch bị xoá đều chuyển `cancelled` |

Ghi chú: FEED-10 đến FEED-15 đã test thật qua HTTP (tạo user/bé/lịch ăn thật, không mock) trong phiên triển khai push FCM — pass toàn bộ (2 "fail" ban đầu chỉ là do assertion so sánh chuỗi ISO khác định dạng `+00:00` so với `.000Z`, cùng 1 thời điểm — đã xác nhận lại bằng `Date.getTime()`, không phải lỗi thật). Dữ liệu test đã dọn sạch.

---

## 9. UC-07 - Xem Bách Hóa Và Sản Phẩm

API: `GET /api/brands`, `GET /api/product-categories`, `GET /api/products`, `GET /api/milk-products`. UI: `/bach-hoa`.

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| SHOP-01 | Khách xem brand public | `GET /api/brands` không session | `200`; chỉ trả brand `verified = true` |
| SHOP-02 | Khách xem category public | `GET /api/product-categories` | `200`; chỉ trả category `active = true` |
| SHOP-03 | Khách xem sản phẩm active | `GET /api/products` | `200`; chỉ trả sản phẩm `status = active` theo RLS |
| SHOP-04 | Lọc sản phẩm theo nhiều category | `GET /api/products?category_id=id1,id2` | Chỉ trả sản phẩm có `category_id` thuộc danh sách |
| SHOP-05 | Lọc sản phẩm theo brand | `GET /api/products?brand_id=<id>` | Chỉ trả sản phẩm thuộc brand đó |
| SHOP-06 | Tìm sản phẩm theo tên | `GET /api/products?q=Aptamil` | Trả sản phẩm có tên chứa từ khóa, không phân biệt hoa thường |
| SHOP-07 | Lọc theo tags | `GET /api/products?tags=dha,organic` | Trả sản phẩm có ít nhất một tag trùng (`overlaps`) |
| SHOP-08 | Lọc theo giá | `GET /api/products?min_price=300000&max_price=500000` | Chỉ trả sản phẩm trong khoảng giá |
| SHOP-09 | Giới hạn phân trang | `GET /api/products?limit=1000` | Limit bị chặn tối đa `60`, không trả quá nhiều dữ liệu |
| SHOP-10 | Xem milk product theo tuổi | `GET /api/milk-products?age_months=7` | Trả milk profile có khoảng tuổi chứa 7 tháng |
| SHOP-11 | Trang `/bach-hoa` khi DB rỗng | Không có category/brand/product active | UI hiển thị trạng thái rỗng rõ ràng |
| SHOP-12 | Chọn category trên UI | Click category ở sidebar | Lưới sản phẩm gọi `/api/products` với `category_id` phù hợp |
| SHOP-13 | Chọn brand trên UI | Click brand ở panel lọc | Lưới sản phẩm chỉ còn sản phẩm của brand đó |
| SHOP-14 | Mở chi tiết sản phẩm | Click một card sản phẩm | Modal chi tiết hiển thị tên, ảnh, giá, mô tả, brand, dữ liệu sữa nếu có |
| SHOP-15 | Sản phẩm draft/archived không public | Admin tạo sản phẩm `status = draft` hoặc `archived`, khách gọi `GET /api/products` | Sản phẩm không xuất hiện với khách/mẹ bỉm public; chỉ admin thấy trong `/api/admin/products` |
| SHOP-16 | Sản phẩm có `outbound_url` hiển thị nút Mua ngay | Admin gán `outbound_url` cho sản phẩm active, khách mở chi tiết sản phẩm | Modal hiển thị nút "Mua ngay trên [domain]" mở `outbound_url` ở tab mới (`target="_blank"`) |
| SHOP-17 | Sản phẩm không có `outbound_url` | `outbound_url = null` | Không hiển thị nút Mua ngay, chỉ hiện thông tin tham khảo |

---

## 10. UC-09 - Xem Tin Chợ C2C

API: `GET /api/listings`. UI: `/cho-me-be`.

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| C2C-VIEW-01 | Khách xem tin chợ | `GET /api/listings` không session | Chỉ trả tin `status = approved` |
| C2C-VIEW-02 | Mẹ bỉm xem tin chợ | User A login, User A có tin `pending` | Trả tin public approved + tin của User A mọi status; không thấy pending của User B |
| C2C-VIEW-03 | Lọc theo danh mục | `GET /api/listings?category=Sữa dư / Sữa mẹ` | Chỉ trả đúng category |
| C2C-VIEW-04 | Lọc theo tỉnh/thành | `GET /api/listings?province=TP. Hồ Chí Minh` | Chỉ trả đúng tỉnh/thành |
| C2C-VIEW-05 | Lọc theo khoảng giá | `GET /api/listings?min_price=100000&max_price=500000` | Chỉ trả tin trong khoảng giá |
| C2C-VIEW-06 | Phân trang danh sách | `GET /api/listings?limit=24&offset=24` | Trả trang tiếp theo, không trùng trang đầu |
| C2C-VIEW-07 | Thông tin người bán public (có tài khoản) | Tin có `seller_id` khác null | `seller` chỉ gồm `id`, `full_name`, `avatar_url`, `is_verified`; không lộ email/phone thật |
| C2C-VIEW-07b | Thông tin người bán public (khách vãng lai) | Tin có `seller_id = null` (đăng qua UC-10 không tài khoản) | `seller = { id: null, full_name: seller_name, avatar_url: null, is_verified: false }`; UI hiện badge "Khách" |
| C2C-VIEW-08 | Hiển thị số lượng còn lại | Tin có `quantity_available > 0` | Card/chi tiết tin hiển thị "Còn N"; `quantity_available = 0` hiển thị "Hết hàng" |
| C2C-VIEW-09 | Mở chi tiết tin | Click card listing | Modal hiển thị ảnh, giá, tỉnh/thành, tình trạng, người bán, hình thức giao dịch |

---

## 11. UC-10 - Gửi Form Pass Đồ C2C

MVP hiện tại: người cần pass đồ gửi form như Google Form, không cần đăng nhập. Admin là trung gian xử lý/chỉnh sửa/duyệt trước khi tin public. `c2c_listings.seller_id` nullable — khách vãng lai điền `seller_name`/`phone_hidden`/`zalo` thay vì có tài khoản.

API: `POST /api/listings`, `PUT /api/listings/:id`, `POST /api/uploads` (không có `owner_table` — ảnh upload trước khi tạo tin).

UI: `/cho-me-be`.

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| C2C-FORM-01 | Khách gửi form pass đồ hợp lệ | Không login, nhập tên sản phẩm, danh mục, tình trạng, giá, số lượng, tỉnh/thành, mô tả, tên/SĐT người bán | `201`; tạo tin `status = pending`, `seller_id = null`, `seller_name`/`phone_hidden` lưu đúng; không yêu cầu session |
| C2C-FORM-02 | Form thiếu tên sản phẩm | `title` rỗng | `400`; không tạo tin |
| C2C-FORM-03 | Form thiếu giá | Không gửi `price` | `400`; không tạo tin |
| C2C-FORM-04 | Giá sai kiểu hoặc âm | `price = -1` hoặc `"abc"` | `400`; không tạo tin |
| C2C-FORM-05 | Thiếu số lượng | Không gửi `quantity_available` | `400`; không tạo tin |
| C2C-FORM-06 | Số lượng không hợp lệ | `quantity_available <= 0` hoặc không phải số nguyên | `400`; không tạo tin |
| C2C-FORM-07 | Thiếu tên/SĐT người bán | Không gửi `seller_name` hoặc `phone_hidden` | `400`; không tạo tin (bắt buộc nhập ngay trong form, không cần tài khoản) |
| C2C-FORM-08 | Upload ảnh khi chưa đăng nhập | Khách upload ảnh qua `POST /api/uploads` không kèm `owner_table` (upload trước khi tạo tin) | `201`; tạo `media_assets` với `uploader_id = null`, `owner_table = null`; trả `secure_url` để gắn vào `images` lúc `POST /api/listings` |
| C2C-FORM-09 | Form gửi xong không public ngay | Khách gọi `GET /api/listings` ngay sau khi gửi form | Không thấy tin mới vì `status = pending`, chưa `approved` |
| C2C-FORM-10 | Admin nhận được tin mới | Admin mở màn Tin chợ C2C | Thấy tin mới ở trạng thái `pending`, gồm nội dung, ảnh, giá, số lượng, `seller_name`/`phone_hidden`/`zalo` |
| C2C-FORM-11 | Không còn Escrow trong form MVP | Mở form đăng tin | Không hiển thị toggle Escrow; `escrow_enabled` không còn trong schema `c2c_listings` |
| C2C-FORM-12 | Không yêu cầu tài khoản cho người bán ẩn danh | Khách gửi form | Tin tạo thành công với `seller_id = null`; không có JWT/cookie session nào được gửi kèm |
| C2C-FORM-13 | Mẹ bỉm đã đăng nhập gửi form | User A login, gửi form pass đồ | `201`; tin tạo với `seller_id = auth.uid()` (không bắt buộc, nhưng nếu có session thì gán); tin xuất hiện trong `GET /api/listings/me` của User A |
| C2C-FORM-14 | Insert-then-select RLS guest | Khách gửi form (không session) | API không gọi `.select()` sau `.insert()` — trả `201` với response tự dựng từ payload đã gửi, không lỗi "new row violates row-level security policy" |

---

## 12. UC-11 - Admin Duyệt Tin Chợ C2C

API: `GET /api/admin/listings`, `GET /api/admin/listings/pending`, `PUT /api/admin/listings/:id` (sửa nội dung), `PUT /api/admin/listings/:id/approve`, `PUT /api/admin/listings/:id/hide`. UI: `/admin` mục Tin chợ C2C.

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| C2C-ADMIN-01 | Khách gọi API admin listings | Không session | `401` |
| C2C-ADMIN-02 | Mẹ bỉm gọi API admin listings | Role `user` | `403` |
| C2C-ADMIN-03 | Admin xem toàn bộ listing | `GET /api/admin/listings` | `200`; thấy mọi status, kể cả tin của khách vãng lai (`seller_id = null`) |
| C2C-ADMIN-04 | Admin lọc listing theo status | `GET /api/admin/listings?status=pending` | Chỉ trả tin pending |
| C2C-ADMIN-05 | Admin lọc listing theo category/province | Gọi query tương ứng | Trả đúng bộ lọc |
| C2C-ADMIN-06 | Admin duyệt tin pending | `PUT /api/admin/listings/:id/approve` | `200`; `status = approved`; tin public nhìn thấy |
| C2C-ADMIN-07 | Admin ẩn/từ chối tin | `PUT /api/admin/listings/:id/hide` | `200`; `status = hidden`; tin public không thấy |
| C2C-ADMIN-08 | Duyệt tin không tồn tại | UUID rỗng/không tồn tại | `404` |
| C2C-ADMIN-09 | UI admin duyệt tin | Vào `/admin` -> Tin chợ C2C -> bấm Duyệt | Row cập nhật trạng thái, không cần reload trang thủ công |
| C2C-ADMIN-10 | Admin sửa/chuẩn hoá nội dung tin | `PUT /api/admin/listings/:id` đổi `title`, `category`, `price`, `quantity_available`, `description` | `200`; DB cập nhật đúng field; tin sửa xong hiển thị công khai ngay với nội dung mới (không tự chuyển lại `pending`) |
| C2C-ADMIN-11 | Người bán tự sửa tin bị admin thấy nội dung mới | User A sửa tin của mình qua UC-28, sau đó Admin `GET /api/admin/listings` | Admin thấy nội dung mới nhất, không có kênh chặn/duyệt lại lần 2 |
| C2C-ADMIN-12 | Notification sau duyệt | Duyệt/ẩn tin | Chưa tạo dòng `notifications`; ghi nhận là phần chưa triển khai, không tính fail |

---

## 13. UC-12 - Đặt Mua C2C Thanh Toán Thường

API: `POST /api/listings/:id/orders`, `POST /api/orders/:id/mock-pay`, `GET /api/admin/c2c-orders`, `PUT /api/admin/c2c-orders/:id`. UI: popup chi tiết tin trên `/cho-me-be`, mục admin "Đơn hàng C2C".

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| ORDER-01 | Đặt mua hợp lệ (khách vãng lai) | Không login, mở tin `approved`, chọn số lượng ≤ `quantity_available`, nhập tên/SĐT/địa chỉ nhận, chọn COD | `201`; tạo `c2c_orders` với `buyer_id = null`, `order_status = pending_admin_review`, `payment_status = pending`, `total_amount = unit_price * quantity` |
| ORDER-02 | Đặt mua hợp lệ (mẹ bỉm đã đăng nhập) | User A login, đặt mua cùng tin | `201`; `buyer_id = auth.uid()`; đơn xuất hiện trong `GET /api/orders/me` của User A |
| ORDER-03 | Đặt mua vượt số lượng còn lại | `quantity > listing.quantity_available` | `400`; không tạo đơn |
| ORDER-04 | Đặt mua tin chưa duyệt | Tin `status = pending`, gọi `POST /api/listings/:id/orders` | `400`/`404`; không tạo đơn cho tin chưa `approved` |
| ORDER-05 | Đặt mua thiếu thông tin nhận hàng | Không gửi `buyer_name`/`buyer_phone` | `400`; không tạo đơn |
| ORDER-06 | Chọn MoMo/VNPay | Đặt mua, `payment_method = momo` hoặc `vnpay` | `201`; `payment_status = pending`; frontend hiện bước xác nhận thanh toán MOCK |
| ORDER-07 | Xác nhận thanh toán MOCK | `POST /api/orders/:id/mock-pay` | `200`; `payment_status = paid`, `payment_ref` có giá trị dạng `MOCK-...`; **không yêu cầu đăng nhập** (mô phỏng callback server-to-server từ cổng thanh toán) |
| ORDER-08 | Mock-pay gọi lại lần 2 (idempotent) | Gọi `POST /api/orders/:id/mock-pay` lần thứ 2 với đơn đã `paid` | `200`; không tạo `payment_ref` mới, không lỗi |
| ORDER-09 | Insert-then-select RLS guest khi đặt mua | Khách vãng lai đặt mua (không session) | API không gọi `.select()` sau `.insert()` — trả `201` với `id` đơn được sinh sẵn qua `randomUUID()` phía server, không lỗi RLS |
| ORDER-10 | Admin xem đơn mới | Admin mở mục "Đơn hàng C2C" | Thấy đơn `pending_admin_review`, kèm thông tin người mua và **thông tin liên hệ người bán** (`seller_name`/`phone_hidden`/`zalo` hoặc `users.full_name`/`email` nếu người bán có tài khoản) |
| ORDER-11 | Admin xác nhận đơn còn đủ hàng | `PUT /api/admin/c2c-orders/:id` `{ order_status: "confirmed" }` khi `quantity_available` đủ | `200`; `order_status = confirmed`; `c2c_listings.quantity_available` tự trừ đúng `quantity` của đơn |
| ORDER-12 | Tự động chuyển tin sang `sold` khi hết hàng | Xác nhận đơn khiến `quantity_available` về 0 | `c2c_listings.status` tự chuyển `sold`; tin không còn hiển thị "Đặt mua" ở trang công khai |
| ORDER-13 | Không trừ số lượng 2 lần | Admin đổi `order_status` qua lại `confirmed -> pending_admin_review -> confirmed` | Chỉ trừ `quantity_available` đúng 1 lần, ở đúng lần chuyển `pending_admin_review -> confirmed` đầu tiên |
| ORDER-14 | Admin huỷ đơn vì hết hàng | `PUT /api/admin/c2c-orders/:id` `{ order_status: "cancelled" }` | `200`; không trừ `quantity_available` |
| ORDER-15 | Non-admin gọi API admin orders | Role `user` hoặc không session | `401`/`403` |

---

## 14. UC-28 - Quản Lý Tin Đăng Của Tôi (Chợ C2C)

API: `GET /api/listings/me`, `PUT /api/listings/:id`, `PUT /api/listings/:id/status`, `DELETE /api/listings/:id`. UI: nút "📋 Tin của tôi" trên `/cho-me-be`.

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| MYLIST-01 | Xem tin của tôi | User A login, có tin `pending`/`approved`/`sold`, bấm "📋 Tin của tôi" | `GET /api/listings/me` trả toàn bộ tin của User A mọi status, không lẫn tin của User B |
| MYLIST-02 | Chưa đăng nhập không thấy nút | Khách mở `/cho-me-be` | Không hiển thị nút "📋 Tin của tôi" |
| MYLIST-03 | Gọi API chưa đăng nhập | `GET /api/listings/me` không session | `401` |
| MYLIST-04 | Sửa tin của mình | User A mở tin của mình, bấm "✏️ Sửa tin", đổi giá/mô tả/số lượng, lưu | `200` qua `PUT /api/listings/:id`; nội dung cập nhật ngay, không cần Admin duyệt lại |
| MYLIST-05 | User B sửa tin của User A | User B gọi `PUT /api/listings/:id` với id tin của User A | `403`/`404`; không cho sửa tin người khác (RLS `seller_id = auth.uid()`) |
| MYLIST-06 | Lọc danh mục/tỉnh thành trong chế độ "Tin của tôi" | Đang ở "Tin của tôi", chọn 1 danh mục | Lọc áp dụng phía client trên danh sách đã tải, không gọi lại API |
| MYLIST-07 | Tự đánh dấu đã bán | Tin đang `approved`, `PUT /api/listings/:id/status` `{ status: "sold" }` | `200`; `status = sold`; nút "✅ Đánh dấu đã bán"/"🙈 Gỡ tin" biến mất khỏi popup (chỉ hiện khi `approved`), chỉ còn "🗑 Xoá tin" |
| MYLIST-08 | Tự gỡ tin | Tin đang `approved`, `PUT /api/listings/:id/status` `{ status: "hidden" }` | `200`; `status = hidden`; tin biến mất khỏi trang Chợ công khai |
| MYLIST-09 | Không tự đổi lại trạng thái đã chốt | Tin đang `sold`/`hidden`, gọi lại `PUT /api/listings/:id/status` | `404`; endpoint chỉ áp dụng khi tin đang `approved`, không cho đổi tiếp |
| MYLIST-10 | Không tự đặt lại `pending`/`approved` qua endpoint tự quản lý | `PUT /api/listings/:id/status` `{ status: "approved" }` hoặc `"pending"` | `400`; endpoint chỉ nhận đúng `sold`/`hidden` |
| MYLIST-11 | Tin `pending` (chưa duyệt) chưa tự đánh dấu được | Tin đang `pending`, gọi `PUT /api/listings/:id/status` `{ status: "sold" }` | `404`; chỉ áp dụng cho tin đã `approved` |
| MYLIST-12 | User B đổi status tin của User A | User B gọi `PUT /api/listings/:id/status` với id tin User A | `404`; không lộ tin có tồn tại hay không |
| MYLIST-13 | Tự xoá tin chưa có đơn nào | Tin của mình, chưa có `c2c_orders` nào tham chiếu, `DELETE /api/listings/:id` | `200 { ok: true }`; tin biến mất khỏi DB và khỏi danh sách "Tin của tôi" |
| MYLIST-14 | Không xoá được tin đã có đơn | Tin đã có `c2c_orders` tham chiếu (kể cả đơn `cancelled`), `DELETE /api/listings/:id` | `409`; thông báo rõ "đã có người đặt mua"; tin vẫn còn nguyên trong DB (chặn bởi FK `on delete restrict`, không phải chỉ ở tầng API) |
| MYLIST-15 | User B xoá tin của User A | User B gọi `DELETE /api/listings/:id` với id tin User A | `404`; không xoá được tin người khác |
| MYLIST-16 | Xác nhận trước khi xoá trên UI | Bấm "🗑 Xoá tin" | Hiện hộp thoại xác nhận (`window.confirm`) trước khi gọi API, tránh bấm nhầm |

---

## 15. UC-29 - Quản Lý Đơn Hàng Của Tôi (Chợ C2C)

API: `GET /api/orders/me`, `PUT /api/orders/:id/cancel`. UI: khối "Đơn hàng của tôi" trong `/tai-khoan`.

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| MYORDER-01 | Xem đơn của tôi | User A login, có đơn đã đặt, mở `/tai-khoan` | Thấy toàn bộ đơn có `buyer_id = auth.uid()`, kèm `order_status`/`payment_status` |
| MYORDER-02 | Không thấy đơn của người khác | User B mở `/tai-khoan` | Không thấy đơn của User A |
| MYORDER-03 | Khách vãng lai không tra cứu được | Đơn đặt mua khi chưa đăng nhập (`buyer_id = null`) | Không có cách nào trong UI hiện tại để tra cứu lại — đây là giới hạn đã biết, xem UC-30 |
| MYORDER-04 | Thanh toán MOCK từ trang của tôi | Đơn `payment_status = pending`, `payment_method = momo/vnpay` | Bấm "Thanh toán ngay (demo)" gọi đúng `POST /api/orders/:id/mock-pay`, cập nhật UI ngay |
| MYORDER-05 | Tự huỷ đơn chờ xử lý | Đơn `order_status = pending_admin_review`, gọi `PUT /api/orders/:id/cancel` | `200`; `order_status = cancelled` |
| MYORDER-06 | Không huỷ được đơn đã xác nhận | Đơn `order_status = confirmed`, gọi `PUT /api/orders/:id/cancel` | `4xx`; RLS `c2c_orders_update_buyer_cancel` chỉ cho phép đúng chiều `pending_admin_review -> cancelled` |
| MYORDER-07 | User B huỷ đơn của User A | User B gọi `PUT /api/orders/:id/cancel` với id đơn User A | `403`/`404`; không huỷ được đơn người khác |

---

## 16. UC-20 - Đọc Tin Tức / Học Viện

API: `GET /api/article-categories`, `GET /api/articles`, `GET /api/articles/:slug`, `POST /api/articles/:slug/view`. UI: `/tin-tuc`, `/tin-tuc/:slug`.

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| NEWS-01 | Khách xem danh mục | `GET /api/article-categories` không session | `200`; chỉ trả `active = true` |
| NEWS-02 | Khách xem danh sách bài published | `GET /api/articles` | `200`; chỉ trả `status = published` |
| NEWS-03 | Lọc theo chuyên mục | `GET /api/articles?category_id=<id>` | Chỉ trả bài thuộc chuyên mục đó |
| NEWS-04 | Sắp xếp theo lượt xem | `GET /api/articles?sort=views&limit=4` | Trả 4 bài `view_count` cao nhất, giảm dần |
| NEWS-05 | Đọc chi tiết bài theo slug | `GET /api/articles/:slug` | `200`; trả đầy đủ `content` |
| NEWS-06 | Đọc bài không tồn tại | Slug không tồn tại | `404` |
| NEWS-07 | Bài draft/archived không public | Admin tạo bài `draft`, khách gọi `GET /api/articles` hoặc `GET /api/articles/:slug` | Không xuất hiện/`404` với khách; chỉ admin thấy qua `/api/admin/articles` |
| NEWS-08 | Tab "Tin tức & Cập nhật" trên UI | Mở `/tin-tuc`, tab mặc định | Hiển thị pill lọc chuyên mục con của "Tin tức & Cập nhật" + sidebar "Đọc nhiều nhất" |
| NEWS-09 | Tab "Học viện Làm Mẹ" trên UI | Bấm tab "Học viện Làm Mẹ" | Hiển thị grid card theo từng chuyên mục con của "Học viện Làm Mẹ" |
| NEWS-10 | Tăng lượt xem khi đọc bài | Mở `/tin-tuc/:slug` trong trình duyệt thật (không phải fetch API trực tiếp) | `view_count` tăng đúng +1 sau khi trang mount (gọi `POST /api/articles/:slug/view` từ client) |
| NEWS-11 | Không tăng view_count cho bài draft | Gọi `POST /api/articles/:slug/view` với slug của bài `draft` | `200` (không lỗi) nhưng `view_count` giữ nguyên — function `increment_article_view` tự chặn theo `status = 'published'` |
| NEWS-12 | Tăng view_count với slug không tồn tại | `POST /api/articles/khong-ton-tai/view` | `200`, không lỗi, không có gì xảy ra (no-op) |
| NEWS-13 | Mục lục tự động khi content có heading | Bài viết có `## Tiêu đề` / `### Tiêu đề con` trong `content`, mở `/tin-tuc/:slug` | Trang chuyển layout 2 cột; sidebar "Mục lục nội dung" liệt kê đúng heading, heading cấp 3 thụt lề dưới heading cấp 2 gần nhất |
| NEWS-14 | Bấm mục lục nhảy đúng vị trí | Bấm 1 mục trong "Mục lục nội dung" | URL thêm `#id` tương ứng; heading đó cuộn lên đúng vị trí, không bị thanh nav che (nhờ `scroll-mt`) |
| NEWS-15 | Bài không có heading vẫn hiển thị 1 cột | Bài `content` không có dòng `## `/`### ` nào | Không hiện sidebar mục lục, layout 1 cột như cũ — không phá bài viết cũ chưa dùng heading |
| NEWS-16 | API trả bài viết liên quan | `GET /api/articles/:slug` với bài có quan hệ | Response có `related_articles` đúng thứ tự; chỉ gồm bài `published` có slug |
| NEWS-17 | Hiển thị bài viết liên quan | Mở `/tin-tuc/:slug` của bài đã thiết lập quan hệ | Cuối bài có khu vực "Bài viết liên quan"; mỗi card dẫn đúng `/tin-tuc/{slug}`; bài draft/archived không hiển thị |

---

## 17. UC-21 - Admin Quản Lý Chuyên Mục Và Bài Viết

API: `GET/POST /api/admin/article-categories`, `PUT /api/admin/article-categories/:id`, `GET/POST /api/admin/articles`, `PUT /api/admin/articles/:id`. UI: `/admin` mục "Bài viết / Blog".

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| ARTICLE-ADMIN-01 | Non-admin gọi API | Role `user` hoặc không session | `401`/`403` |
| ARTICLE-ADMIN-02 | Tạo chuyên mục hợp lệ | Gửi `name`, `slug`, `parent_id` (tuỳ chọn) | `201` |
| ARTICLE-ADMIN-03 | Tạo chuyên mục thiếu name/slug | Thiếu 1 trong 2 field | `400` |
| ARTICLE-ADMIN-04 | Sửa chuyên mục, đổi `active = false` | `PUT /api/admin/article-categories/:id` | `200`; chuyên mục biến mất khỏi `GET /api/article-categories` công khai |
| ARTICLE-ADMIN-05 | Tạo bài viết nháp | `POST /api/admin/articles` với `status = draft` | `201`; `author_id` tự gán theo admin đang đăng nhập; `published_at = null` |
| ARTICLE-ADMIN-06 | Tạo bài viết thiếu title | `title` rỗng | `400` |
| ARTICLE-ADMIN-07 | Xuất bản bài lần đầu | `PUT /api/admin/articles/:id` `{ status: "published" }` khi `published_at` đang `null` | `200`; `published_at` tự gán `now()` |
| ARTICLE-ADMIN-08 | Sửa lại bài đã published | `PUT` đổi `title` nhưng vẫn giữ `status: "published"` | `200`; `published_at` **giữ nguyên** mốc gốc, không bị ghi đè |
| ARTICLE-ADMIN-09 | Ẩn bài | `PUT` `{ status: "archived" }` | `200`; bài biến mất khỏi `GET /api/articles` công khai |
| ARTICLE-ADMIN-10 | Upload ảnh bìa | Upload ảnh cho bài đã tạo, `owner_table = articles` | `201` media; PUT lại `cover_url` vào bài viết |
| ARTICLE-ADMIN-11 | UI tab Bài viết/Chuyên mục | Vào `/admin` -> "Bài viết / Blog" | 2 tab hoạt động, danh sách cập nhật không cần reload |
| ARTICLE-ADMIN-12 | Lưu meta description | Tạo/sửa bài với `meta_description` <= 160 ký tự | `201/200`; giá trị lưu đúng vào `articles.meta_description` |
| ARTICLE-ADMIN-13 | Chặn meta description quá dài | Gửi `meta_description` dài hơn 160 ký tự | `400`; không lưu bài |
| ARTICLE-ADMIN-14 | Chèn H2/H3 từ thanh công cụ | Trong form bài viết, chọn vùng văn bản rồi bấm H2 hoặc H3 | Nội dung được chèn đúng cú pháp `##`/`###`; không tạo H1 trong thân bài |
| ARTICLE-ADMIN-15 | Chèn bảng | Bấm "Bảng" trong trình soạn nội dung | Chèn đúng block bảng Markdown gồm header, dòng phân cách và dòng dữ liệu |
| ARTICLE-ADMIN-16 | Upload ảnh bìa khi tạo bài mới | Bấm "Viết bài mới", chọn ảnh bìa trước khi bài có `id` | Upload thành công; ảnh xem trước xuất hiện; khi lưu bài, `cover_url` và `media_assets.owner_id` trỏ đúng bài |
| ARTICLE-ADMIN-17 | Upload nhiều ảnh inline | Trong form tạo/sửa bài, bấm "Ảnh", chọn nhiều JPEG/PNG/WEBP/GIF | Mỗi ảnh được upload; nội dung chèn nhiều block `![alt](secure_url)`; không ghi đè ảnh trước |
| ARTICLE-ADMIN-18 | Hủy form dọn ảnh nháp | Upload ảnh bìa/inline rồi bấm "Hủy" | `DELETE /api/uploads {draft_token}` dọn ảnh nháp trên Cloudinary và các row `media_assets` tương ứng |
| ARTICLE-ADMIN-19 | Gắn media sau khi lưu | Upload ảnh inline, lưu bài, kiểm tra DB | `owner_table = 'articles'`, `owner_id` là bài viết; ảnh vẫn hiển thị sau reload |
| ARTICLE-ADMIN-20 | Chọn bài viết liên quan | Mở form sửa bài, chọn 2–6 bài `published`, bấm Lưu | `PUT /api/admin/articles/:id` thành công; `article_relations` lưu đúng ID và thứ tự chọn; response có `related_article_ids` |
| ARTICLE-ADMIN-21 | Xóa toàn bộ bài liên quan | Mở bài đã có quan hệ, bỏ chọn toàn bộ, bấm Lưu | Các dòng `article_relations` của bài bị xóa; response trả `related_article_ids: []`; trang public không hiện khu vực liên quan |
| ARTICLE-ADMIN-22 | Giới hạn số bài liên quan | Chọn bài thứ 7 hoặc gửi hơn 6 UUID qua API | Checkbox thứ 7 bị khóa hoặc API trả `400`; không lưu quá 6 quan hệ |
| ARTICLE-ADMIN-23 | Không tự liên kết chính bài đang sửa | Trong payload gửi chính `article.id` | Hệ thống bỏ qua ID trùng bài nguồn; không tạo dòng tự tham chiếu |
| ARTICLE-ADMIN-24 | Phân trang danh sách bài viết | `GET /api/admin/articles?page=2&page_size=8` | Response có tối đa 8 `items`, `pagination.page = 2`, `page_size = 8`, `total` và `has_more` đúng |
| ARTICLE-ADMIN-25 | Lọc trạng thái trước khi phân trang | `GET /api/admin/articles?status=published&page=1&page_size=8` | Chỉ trả bài `published`; tổng số và `has_more` tính trên tập đã lọc |

| ARTICLE-PUBLIC-05 | Bố cục bài viết | Mở bài đã xuất bản có `title`, `excerpt`, H2/H3 và bảng | Render đúng một H1, sapo, mục lục, H2/H3 và bảng |
| ARTICLE-PUBLIC-06 | SEO meta description | Mở bài có `meta_description` | HTML metadata dùng `meta_description`; nếu null thì fallback về `excerpt` |
| ARTICLE-PUBLIC-07 | Hiển thị ảnh inline Markdown | Bài published có một hoặc nhiều block `![alt](https://...)` | Ảnh hiển thị đúng thứ tự, có `alt`, không render HTML tùy ý |

---

## 18. UC-22 - Admin Quản Lý Bác Sĩ Nhi Đối Tác

API: `GET/POST /api/admin/bs-nhi`, `PUT /api/admin/bs-nhi/:id`, `PUT /api/admin/bs-nhi/:id/verify`. UI: `/admin` mục "BS Nhi".

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| BSNHI-ADMIN-01 | Non-admin gọi API | Role `user` hoặc không session | `401`/`403` |
| BSNHI-ADMIN-02 | Tạo hồ sơ bác sĩ hợp lệ | Gửi họ tên, chuyên khoa, bệnh viện, kinh nghiệm, tiểu sử | `201` |
| BSNHI-ADMIN-03 | Tạo hồ sơ thiếu họ tên | `full_name` rỗng | `400` |
| BSNHI-ADMIN-04 | Sửa hồ sơ bác sĩ | `PUT /api/admin/bs-nhi/:id` | `200`; cập nhật đúng field |
| BSNHI-ADMIN-05 | Toggle xác minh nhanh | `PUT /api/admin/bs-nhi/:id/verify` | `200`; `verified` đảo trạng thái |
| BSNHI-ADMIN-06 | Upload avatar bác sĩ | Upload ảnh, `owner_table = bs_nhi` | `201`; gắn đúng `avatar_url` |
| BSNHI-ADMIN-07 | Tìm kiếm bác sĩ | `GET /api/admin/bs-nhi?q=...` | Trả bác sĩ khớp tên/chuyên khoa |
| BSNHI-PUBLIC-01 | Khách xem danh sách bác sĩ đã xác minh | `GET /api/bs-nhi` hoặc mở `/doi-tac`, tab Tư vấn bác sĩ | `200`; chỉ trả hồ sơ `verified = true` và hiển thị đúng thẻ bác sĩ |
| BSNHI-PUBLIC-02 | Tìm kiếm bác sĩ công khai | `GET /api/bs-nhi?q=...` hoặc nhập ô tìm kiếm trong tab Tư vấn bác sĩ | Chỉ trả/hiển thị bác sĩ khớp họ tên, chuyên môn, bệnh viện hoặc tiểu sử |

---

## 19. UC-14/UC-15/UC-16 - Tư Vấn Bác Sĩ

API: `GET /api/bs-nhi`, `POST /api/consult`, `GET /api/consult/me`, `GET /api/admin/consults`, `PUT /api/admin/consults/:id/forward`, `PUT /api/admin/consults/:id/answer`. UI: `/doi-tac`, `/tai-khoan`, `/admin` mục "Tư vấn BS".

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| CONSULT-01 | Khách xem tab bác sĩ | Mở `/doi-tac`, chọn "Tư vấn Bác sĩ" | Hiển thị banner và các bác sĩ đã xác minh; không hiển thị hồ sơ `verified = false` |
| CONSULT-02 | Khách gửi câu hỏi | Không đăng nhập, bấm "Hỏi ngay" và gửi form | Form yêu cầu đăng nhập; `POST /api/consult` trả `401`; không tạo row |
| CONSULT-03 | Mẹ bỉm gửi câu hỏi hợp lệ | Đăng nhập User A, chọn bác sĩ đã xác minh, nhập câu hỏi >= 10 ký tự và tuổi bé hợp lệ | `201`; tạo `consult_requests.status = 'pending'`, đúng `user_id`, `bs_id`, `question`, `baby_age_months` |
| CONSULT-04 | Gửi câu hỏi thiếu nội dung | User A gửi câu hỏi dưới 10 ký tự | `400`; không tạo row |
| CONSULT-05 | Chọn bác sĩ chưa xác minh | User A gửi `bs_id` của hồ sơ `verified = false` | `404`; không tạo row |
| CONSULT-06 | Cô lập lịch sử tư vấn | User A gọi `GET /api/consult/me` khi User B có yêu cầu | Chỉ trả yêu cầu có `user_id = auth.uid()` của User A |
| CONSULT-07 | Non-admin xem danh sách Admin | User A gọi `GET /api/admin/consults` | `403`; không trả danh sách yêu cầu |
| CONSULT-08 | Admin xem và lọc yêu cầu | Admin gọi `GET /api/admin/consults?status=pending&q=...` | `200`; lọc đúng trạng thái/nội dung, có thông tin mẹ và bác sĩ |
| CONSULT-09 | Admin ghi nhận chuyển tiếp | Admin bấm "Đã chuyển tiếp cho BS", nhập ghi chú nội bộ | `200`; cập nhật `forwarded_at`, `forwarded_by`, `internal_note` đúng Admin |
| CONSULT-10 | Admin cập nhật câu trả lời | Admin nhập câu trả lời hợp lệ và bấm lưu | `200`; cập nhật `answer`, `answered_at`, `status = 'answered'`; tạo một `notifications` cho đúng mẹ bỉm với `channel = 'push'`, `status = 'pending'` (chờ job `/api/cron/dispatch-notifications` gửi FCM — đã test thật, xem mục 3) |
| CONSULT-11 | Mẹ bỉm xem câu trả lời | User A mở `/tai-khoan` hoặc bấm "Cập nhật" ở khối tư vấn | Hiển thị câu hỏi, trạng thái, bác sĩ và câu trả lời; không hiển thị `internal_note` |
| CONSULT-12 | Tránh notification trùng | Admin lưu lại cùng câu trả lời đã ở trạng thái `answered` | Không tạo notification trùng cho cùng nội dung |
| CONSULT-13 | Xem chi tiết bác sĩ | Khách bấm "Xem chi tiết & Liên hệ" trên thẻ bác sĩ | Modal hiển thị hồ sơ, chuyên môn, bệnh viện, kinh nghiệm, rating và thời gian phản hồi |
| CONSULT-14 | Khách gửi form liên hệ bác sĩ | Không đăng nhập, nhập họ tên + số điện thoại và gửi form | `201`; tạo `partner_bookings.request_type = 'doctor_lead'`, đúng `bs_id`, `status = 'pending'` |
| CONSULT-15 | Thiếu thông tin liên hệ | Bỏ trống họ tên hoặc số điện thoại | `400`; không tạo lead |
| CONSULT-16 | Admin xem lead bác sĩ | Admin mở `/admin` → Đối tác → Lead & Booking | Lead hiển thị nhãn "Liên hệ bác sĩ", đúng tên bác sĩ và thông tin khách |

## 20. UC-17/UC-18/UC-19 - Đối Tác, Gói Dịch Vụ Và Booking

API public: `GET /api/partners`, `GET /api/partners/:id/services`, `POST /api/partner-leads`, `POST /api/partner-bookings`, `POST /api/doctor-leads`.

API Admin: `GET/POST /api/admin/partners`, `PUT/DELETE /api/admin/partners/:id`, `GET/POST /api/admin/partners/:id/services`, `PUT/DELETE /api/admin/partner-services/:id`, `GET/POST /api/admin/bookings`, `PUT/DELETE /api/admin/bookings/:id`.

UI: `/doi-tac`, `/admin` mục "Đối tác". Các testcase dưới đây **cần techlead/QA chạy trên Supabase Cloud**.

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| PARTNER-PUBLIC-01 | Khách xem danh sách đối tác | Mở `/doi-tac` hoặc gọi `GET /api/partners` | `200`; chỉ hiển thị đối tác `status = active`, `verified = true` ở public |
| PARTNER-PUBLIC-02 | Lọc và tìm đối tác | Chọn tab bệnh viện/bảo hiểm/dịch vụ hoặc nhập từ khóa/tỉnh thành | Danh sách lọc đúng `partner_type`, tên, danh mục, mô tả hoặc tỉnh/thành |
| PARTNER-PUBLIC-03 | Xem gói dịch vụ | Gọi `GET /api/partners/:id/services` với đối tác public | `200`; chỉ trả gói `active = true` |
| PARTNER-LEAD-01 | Khách gửi liên hệ đối tác | Không đăng nhập, gửi `POST /api/partner-leads` với `partner_id`, họ tên, số điện thoại | `201`; tạo `partner_bookings.request_type = 'lead'`, `status = 'pending'`, `user_id = null` |
| PARTNER-LEAD-02 | Thiếu thông tin liên hệ | Bỏ trống họ tên hoặc số điện thoại | `400`; không tạo lead |
| BOOKING-01 | Khách đặt lịch dịch vụ | Không đăng nhập, chọn đối tác `partner_type = service`, gói dịch vụ, thời gian và gửi form | `201`; tạo `request_type = 'booking'`, `status = 'pending'`, lưu snapshot dịch vụ/giá và thông tin khách |
| BOOKING-02 | Đặt lịch sai loại đối tác | Gửi `partner_id` thuộc bệnh viện/bảo hiểm/trang thiết bị vào API booking | `404` hoặc lỗi nghiệp vụ phù hợp; không tạo booking dịch vụ |
| BOOKING-03 | Booking thiếu trường bắt buộc | Bỏ `customer_name`, `customer_phone` hoặc `scheduled_at` | `400`; không tạo row |
| BOOKING-04 | Non-admin xem booking | User hoặc khách gọi `GET /api/admin/bookings` | `401`/`403`; không trả dữ liệu booking |
| PARTNER-ADMIN-01 | Non-admin gọi API CRUD đối tác | Role `user` gọi `POST /api/admin/partners` | `403` |
| PARTNER-ADMIN-02 | Admin tạo đối tác | Gửi tên, `partner_type`, mô tả, tỉnh/thành, liên hệ, `verified`, `status` | `201`; row `partners` được tạo đúng |
| PARTNER-ADMIN-03 | Admin sửa đối tác | `PUT /api/admin/partners/:id` đổi mô tả/trạng thái/xác minh | `200`; public chỉ thấy khi `active` và `verified` |
| PARTNER-ADMIN-04 | Xóa đối tác chưa có tham chiếu | `DELETE /api/admin/partners/:id` khi chưa có service/booking | `200`; xóa row thật |
| PARTNER-ADMIN-05 | Xóa đối tác đã có tham chiếu | `DELETE /api/admin/partners/:id` khi đã có service/booking | `200`; không xóa vật lý, chuyển `status = 'hidden'`, trả `soft_deleted = true` |
| SERVICE-ADMIN-01 | Admin tạo gói dịch vụ | `POST /api/admin/partners/:id/services` với tên và thông tin giá | `201`; tạo `partner_services.partner_id` đúng |
| SERVICE-ADMIN-02 | Admin sửa gói dịch vụ | `PUT /api/admin/partner-services/:id` | `200`; cập nhật đúng |
| SERVICE-ADMIN-03 | Xóa gói chưa có booking | `DELETE /api/admin/partner-services/:id` khi chưa được đặt | `200`; xóa row thật |
| SERVICE-ADMIN-04 | Xóa gói đã có booking | `DELETE /api/admin/partner-services/:id` khi đã có booking | `200`; chuyển `active = false`, trả `soft_deleted = true` |
| BOOKING-ADMIN-01 | Admin xem/lọc lead và booking | Gọi `GET /api/admin/bookings?status=pending&request_type=booking` | `200`; lọc đúng và join được đối tác/gói/bác sĩ |
| BOOKING-ADMIN-02 | Admin tạo lead thủ công | `POST /api/admin/bookings` với thông tin khách và `request_type` | `201`; lưu lead/booking với `user_id = null` |
| BOOKING-ADMIN-03 | Admin đánh dấu đã chuyển tiếp | `PUT /api/admin/bookings/:id` với `{ "forwarded": true }` | `200`; ghi `forwarded_at`, `forwarded_by` đúng Admin |
| BOOKING-ADMIN-04 | Xác nhận booking | Cập nhật `status = confirmed` | `200`; ghi `confirmed_at`, `notification_sent_at`, trả `notification_stub`; **không kỳ vọng SMS/email thật** |
| BOOKING-ADMIN-05 | Hoàn tất/hủy booking | Cập nhật `status = completed` rồi test lại với `cancelled` trên dữ liệu khác | Ghi đúng `completed_at` hoặc `cancelled_at` |
| BOOKING-ADMIN-06 | Admin xóa booking | `DELETE /api/admin/bookings/:id` | `200`; booking không còn trong danh sách |

**Giới hạn hiện tại:** xác nhận booking chưa gọi SMS/email provider; `notification_sent_at` chỉ là timestamp stub. Đối tác chưa có tài khoản hoặc dashboard riêng.

## 21. UC-23 - Admin Quản Lý Nhãn Hàng, Danh Mục, Sản Phẩm

API: `GET/POST /api/admin/brands`, `PUT /api/admin/brands/:id`, `GET/POST /api/admin/product-categories`, `PUT /api/admin/product-categories/:id`, `GET/POST /api/admin/products`, `PUT /api/admin/products/:id`. UI: `/admin`.

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| CATALOG-01 | Non-admin gọi API catalog admin | Role `user`, gọi `POST /api/admin/brands` | `403` |
| CATALOG-02 | Admin xem brand | `GET /api/admin/brands` | `200`; thấy cả verified/unverified |
| CATALOG-03 | Tạo brand thiếu tên | `POST /api/admin/brands` `{}` | `400` |
| CATALOG-04 | Tạo brand hợp lệ | Gửi `name`, `slug`, `country`, `verified` | `201`; DB có brand |
| CATALOG-05 | Sửa brand | `PUT /api/admin/brands/:id` đổi `verified`, `logo_url` | `200`; cập nhật đúng |
| CATALOG-06 | Tạo category thiếu name/slug | Gửi thiếu một trong hai field | `400` |
| CATALOG-07 | Tạo category cha | Gửi `name`, `slug`, `active`, `sort_order` | `201`; public API thấy nếu `active = true` |
| CATALOG-08 | Tạo category con | Gửi `parent_id` là category cha | `201`; UI `/bach-hoa` hiển thị dưới cha |
| CATALOG-09 | Sửa category | `PUT /api/admin/product-categories/:id` | `200`; `updated_at` đổi |
| CATALOG-10 | Tạo sản phẩm thường | Gửi `name`, `brand_id`, `category_id`, `price_vnd`, `attributes`, `tags`, `status` | `201`; tạo row `products`, không tạo `milk_products` nếu không gửi milk |
| CATALOG-11 | Tạo sản phẩm sữa | Gửi product kèm object `milk` | `201`; tạo row `products` và row `milk_products` cùng `product_id` |
| CATALOG-12 | Sửa sản phẩm sữa | `PUT /api/admin/products/:id` với `milk` mới | `200`; `milk_products` upsert đúng |
| CATALOG-13 | Gỡ milk profile | `PUT /api/admin/products/:id` với `milk = null` | `200`; xóa row `milk_products` tương ứng |
| CATALOG-14 | Active sản phẩm | Đổi `status = active` | Public `GET /api/products` thấy sản phẩm |
| CATALOG-15 | Archive/draft sản phẩm | Đổi `status = draft/archived` | Public `GET /api/products` không thấy sản phẩm |
| CATALOG-16 | Upload ảnh sản phẩm bằng admin | `/api/uploads` với `owner_table = products` | `201`; tạo media, admin được phép gắn vào products |
| CATALOG-17 | UI Products tab | Tạo/sửa sản phẩm từ tab Sản phẩm | Danh sách cập nhật, form reset/hide đúng trạng thái |
| CATALOG-18 | UI Brands/Categories tab | Tạo/sửa từ các tab tương ứng | Danh sách cập nhật, không reload full page |
| CATALOG-19 | Gán link affiliate cho sản phẩm | `PUT /api/admin/products/:id` với `outbound_url = "https://shopee.vn/..."` | `200`; `products.outbound_url` cập nhật; xem thêm SHOP-16/SHOP-17 (mục 6) cho phần hiển thị public |
| CATALOG-20 | Xoá link affiliate | `PUT` với `outbound_url = ""` | `200`; `outbound_url = null` |

---

## 22. UC-26 - Media Upload

API: `POST /api/uploads`, `DELETE /api/uploads`.

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| MEDIA-01 | Upload không có file | FormData thiếu `file` | `400` |
| MEDIA-02 | Upload ảnh hợp lệ | File JPEG/PNG/WEBP/GIF < 5MB | `201`; có `url`, `secure_url`, `public_id`, `mime_type`, size |
| MEDIA-03 | Upload sai MIME | File PDF/ZIP | `400` |
| MEDIA-04 | Upload quá dung lượng | File > 5MB | `400` |
| MEDIA-05 | User thường upload avatar của mình | `owner_table = users`, `owner_id = auth.uid()` | `201` |
| MEDIA-06 | Khách vãng lai upload ảnh trước khi tạo tin (UC-10) | Không login, `POST /api/uploads` không kèm `owner_table` | `201`; `uploader_id = null`, `owner_table = null`, `owner_id = null`; trả `secure_url` để gắn vào `images` khi `POST /api/listings` |
| MEDIA-07 | User thường upload vào listing người khác | `owner_table = c2c_listings`, `owner_id` là tin của User B (không phải người upload) | `403`; `verifyOwnership` kiểm tra `seller_id = auth.uid()` không khớp |
| MEDIA-08 | User thường upload vào bảng admin-only | `owner_table = products/partners/bs_nhi/articles` | `403` |
| MEDIA-09 | Admin upload vào bảng admin-only | Admin upload `owner_table = products` | `201` |
| MEDIA-10 | Cloudinary lỗi | Sai cấu hình Cloudinary | `502`; không tạo row media orphan |
| MEDIA-11 | Gỡ ảnh listing chưa gắn tin (nút "✕" trước khi submit) | `DELETE /api/uploads {secure_url}` cho ảnh vừa upload, `owner_table/owner_id` null, `asset_type=listing_image` | `200`; Cloudinary resource + row `media_assets` bị xoá thật (đã test qua HTTP thật, không mock) |
| MEDIA-12 | Xoá lại URL đã gỡ | `DELETE /api/uploads` lần 2 cùng `secure_url` vừa xoá ở MEDIA-11 | `404` |
| MEDIA-13 | Không cho xoá ảnh đã gắn owner qua endpoint gỡ nháp | `DELETE /api/uploads` với `secure_url` của ảnh đã có `owner_table` (vd avatar vừa gắn `users`) | `404`; Cloudinary + `media_assets` giữ nguyên |
| MEDIA-14 | Thay avatar tự dọn ảnh cũ | User upload avatar A → `PUT /api/auth/me {avatar_url: A}` → upload avatar B → `PUT /api/auth/me {avatar_url: B}` | Ảnh A bị xoá khỏi Cloudinary + `media_assets`; ảnh B còn nguyên |
| MEDIA-15 | Gỡ 1 ảnh khỏi mảng `image_urls` (sản phẩm) | Admin `PUT /api/admin/products/:id {image_urls: [ảnh2]}` sau khi đã có `[ảnh1, ảnh2]` | Ảnh1 (đã gỡ) bị xoá khỏi Cloudinary + `media_assets`; ảnh2 (còn giữ) nguyên vẹn |
| MEDIA-16 | Thêm ảnh vào mảng không xoá nhầm ảnh cũ | `PUT` `image_urls` từ `[ảnh1]` thành `[ảnh1, ảnh2]` (chỉ thêm, không gỡ) | Cả 2 ảnh vẫn còn nguyên, không gọi Cloudinary destroy |
| MEDIA-17 | PUT không đụng field ảnh thì không dọn gì | `PUT /api/admin/products/:id` chỉ đổi `name`, không gửi `image_urls` | Ảnh hiện có của sản phẩm không bị đụng tới |
| MEDIA-18 | Gỡ ảnh khỏi tin C2C qua `PUT /api/listings/:id` | Tin có `images: [ảnh1, ảnh2]`, `PUT {images: [ảnh2]}` | Ảnh1 bị xoá khỏi Cloudinary + `media_assets`; ảnh2 còn nguyên |
| MEDIA-19 | Xoá cả tin C2C dọn hết ảnh còn lại | `DELETE /api/listings/:id` cho tin còn `images: [ảnh2]` | Ảnh2 cũng bị xoá khỏi Cloudinary + `media_assets`, không còn sót ảnh mồ côi |
| MEDIA-20 | Upload ảnh bài viết dạng nháp | Admin gửi `draft_token`, `asset_type = cover/article_inline` tới `POST /api/uploads` | `201`; row có `owner_table/owner_id = null`, `metadata.draft_token` đúng phiên, folder Cloudinary thuộc articles |
| MEDIA-21 | Chặn user thường upload ảnh bài viết nháp | User thường gửi `draft_token` tới `POST /api/uploads` | `403`; không tạo file hoặc row media |

Ghi chú: MEDIA-11 đến MEDIA-19 đã chạy thật (upload ảnh thật lên Cloudinary, không mock) trong phiên triển khai bước 1 "sửa rò rỉ xoá media" — 36/36 assertion pass. Cover bài viết (`cover_url`) và avatar bác sĩ (`bs_nhi.avatar_url`) dùng chung code path với MEDIA-14 (field ảnh dạng string đơn) — đã chạy test thật riêng cho 2 field này (thêm 12/12 assertion pass): thay `cover_url`/`avatar_url` tự xoá đúng ảnh cũ trên cả Cloudinary lẫn `media_assets`, ảnh mới giữ nguyên. Toàn bộ dữ liệu test đã dọn sạch.

---

## 23. UC-27 - Admin Quản Lý Người Dùng

API: `GET /api/admin/users`, `PUT /api/admin/users/:id`. UI: `/admin` mục Mẹ bỉm.

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| USER-ADMIN-01 | Khách gọi API users admin | Không session | `401` |
| USER-ADMIN-02 | Mẹ bỉm gọi API users admin | Role `user` | `403` |
| USER-ADMIN-03 | Admin xem danh sách user | `GET /api/admin/users` | `200`; thấy id, email, phone, role, full_name, is_verified, created_at |
| USER-ADMIN-04 | Tìm user theo email/SĐT | `GET /api/admin/users?q=...` | Trả user khớp email hoặc phone |
| USER-ADMIN-05 | Lọc theo role | `GET /api/admin/users?role=admin` | Chỉ trả role admin |
| USER-ADMIN-06 | Admin sửa hồ sơ user | `PUT /api/admin/users/:id` đổi `full_name`, `phone`, `is_verified` | `200`; DB cập nhật đúng |
| USER-ADMIN-07 | Gán role admin cho user | `PUT` `{ role: "admin" }` | `200`; user đó login lại có thể vào `/admin` |
| USER-ADMIN-08 | Hạ role admin về user | `PUT` `{ role: "user" }` | `200`; tài khoản đó bị chặn khỏi `/admin` |
| USER-ADMIN-09 | Admin tự đổi role chính mình | Admin gọi PUT id của chính mình với role khác | `400`; tránh tự khóa quyền |
| USER-ADMIN-10 | Role không hợp lệ | `{ role: "superadmin" }` | `400` |
| USER-ADMIN-11 | Body rỗng | `{}` | `400` |
| USER-ADMIN-12 | User không tồn tại | UUID không tồn tại | `404` |

---

## 24. Admin Dashboard / Health Check

API: `GET /api/admin/stats`, `GET /api/health/supabase`.

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|
| SYS-01 | Health Supabase | `GET /api/health/supabase` | `200` nếu env và kết nối Supabase hợp lệ; lỗi rõ nếu chưa cấu hình |
| SYS-02 | Khách gọi admin stats | Không session | `401` |
| SYS-03 | Mẹ bỉm gọi admin stats | Role `user` | `403` |
| SYS-04 | Admin xem dashboard stats | `GET /api/admin/stats` | `200`; trả `users_total`, `listings_pending`, `products_total`, `bs_nhi_total`, `orders_pending_review`, `consults_pending`, `partner_bookings_pending` (yêu cầu tư vấn BS và lead/booking đối tác `status='pending'`, đơn C2C chờ xử lý thay cho thống kê escrow cũ) |
| SYS-05 | UI dashboard | Admin mở `/admin` tab Dashboard | Các card thống kê hiển thị, lỗi API có message rõ; nút "💳 Xử lý đơn hàng C2C", "💬 Xử lý tư vấn BS", "🤝 Xử lý Lead & Booking" điều hướng đúng sang mục tương ứng |
| SYS-06 | Badge số ở sidebar "Tư vấn BS" | Có ≥1 `consult_requests.status='pending'`, admin mở `/admin` | Sidebar hiện chấm tròn hồng có số cạnh mục "Tư vấn BS" đúng bằng `consults_pending`; 0 thì không hiện badge |
| SYS-07 | Forward không làm giảm badge | Admin bấm "Đã chuyển tiếp cho BS" cho 1 yêu cầu đang `pending` | `consults_pending`/badge giữ nguyên (forward chỉ ghi `forwarded_at`/`forwarded_by`, không đổi `status`) |
| SYS-08 | Trả lời làm giảm badge | Admin lưu câu trả lời cho yêu cầu đang `pending` | `status` chuyển `answered`; `consults_pending`/badge giảm đúng 1 |
| SYS-09 | Khách gửi lead/booking đối tác thật -> tăng đúng | `POST /api/partner-leads` với `partner_id` thật | `201`; `partner_bookings_pending` tăng đúng +1 |
| SYS-10 | Admin xác nhận -> giảm đúng | `PUT /api/admin/bookings/:id` `{status: "confirmed"}` cho lead vừa tạo | `200`; `partner_bookings_pending` giảm về đúng trước đó |
| SYS-11 | Nút "Xử lý Lead & Booking" mở đúng tab con | Admin bấm nút quick-link | Chuyển sang `/admin` tab "Đối tác", tự mở đúng tab con "Lead & Booking" (không phải tab "Đối tác" mặc định) |

Ghi chú: SYS-04, SYS-06 đến SYS-10 đã test thật qua HTTP (không mock) — tạo user/admin/consult/lead thật, kiểm tra số đếm tăng/giảm đúng qua từng bước (thêm mới, forward/confirm, answer) — 9/9 assertion pass riêng phần Lead & Booking (SYS-04/09/10), 8/8 assertion phần tư vấn BS (SYS-04/06/07/08), dữ liệu test đã dọn sạch (2 lead/booking pending thật đang có trong DB là dữ liệu thật của người dùng, không phải rác test — giữ nguyên). SYS-05, SYS-11 (nút quick-link mới, deep-link đúng tab con) và hiển thị badge trên UI thật (màu sắc/vị trí) chưa QA qua trình duyệt.

---

## 25. Test Chưa Áp Dụng Vì Chưa Hiện Thực

Không chạy các testcase sau như bug hiện tại, vì đây là phần chưa có hoặc chưa thuộc MVP:

- UC-13: escrow, VNPay/MoMo escrow callback, confirm nhận hàng, release/refund/dispute - hướng phát triển tương lai.
- UC-24: import/seed đầy đủ dữ liệu chuẩn WHO/mốc phát triển qua Admin UI/API (dữ liệu thật đã seed đủ 0-24 tháng qua migration cho UC-04/UC-05, chỉ riêng đường Admin UI/API để tự import thì chưa có).
- UC-30: thông báo trạng thái đơn hàng cho khách vãng lai (chưa chốt phương án với techlead).
- UC-06/UC-25: đã có `FIREBASE_SERVICE_ACCOUNT` thật, xác thực thành công với Google (CRON-05/06, mục 3) — chỉ còn thiếu QA "nhận push thật trên thiết bị" (cần trình duyệt thật hoàn tất luồng xin quyền + đăng ký `device_tokens`, không thể tự động hoá bằng script).
- Màn quản lý media riêng cho admin (UC-26 đã có upload + tự dọn Cloudinary/`media_assets` khi thay/gỡ ảnh, nhưng chưa có `GET/DELETE /api/admin/media-assets` và UI xem/tìm/xoá `media_assets` độc lập).
- Job dọn định kỳ ảnh C2C mồ côi do khách vãng lai upload nhưng không submit tin (owner_table/owner_id null, quá 6 giờ) — hiện chỉ tự dọn được khi người dùng chủ động bấm "✕" trước khi submit, chưa có cơ chế dọn ảnh bị bỏ quên (đóng tab, mất mạng...).
- Hộp thư thông báo trong app (`GET /api/notifications`, đánh dấu `read_at`) — hiện chỉ có push tới thiết bị, chưa có nơi xem lại lịch sử thông báo trong app.
- UC-08 bước gọi Claude thật và chất lượng gợi ý: cần chạy với `ANTHROPIC_API_KEY` và `CLAUDE_MODEL` hợp lệ; không ghi credential vào tài liệu. **Lưu ý:** `.env` hiện có `CLAUDE_MODEL=claude-opus-5m` (thừa ký tự `m`) — không phải model id hợp lệ, cần sửa lại thành `claude-opus-5` trước khi test, nếu không lời gọi Claude sẽ lỗi do sai model.

Đã hiện thực và **có testcase có thể chạy**: UC-04 (chỉ số tăng trưởng WHO — mục 6), UC-05 (mốc phát triển — mục 7), UC-06 (lịch ăn + nhắc lịch push — mục 8), UC-08 (luồng phi-AI + guard/rate limit/retrieval — mục 27), UC-12 (đặt mua + mock pay + admin xử lý đơn — mục 13), UC-18/UC-19 (đối tác, lead/booking và CRUD Admin — mục 20), UC-20 (đọc tin tức/học viện — mục 16), UC-21 (admin CRUD bài viết — mục 17), UC-22 (admin quản lý bác sĩ nhi — mục 18), UC-25 (device token + job dispatch — mục 3), UC-26 (upload/cleanup — mục 22), UC-28 (tin đăng của tôi — mục 14), UC-29 (đơn hàng của tôi — mục 15). Các luồng cần provider thật hoặc QA trình duyệt vẫn được đánh dấu riêng trong từng mục.

---

## 26. Ưu Tiên Chạy Regression

Các testcase nên chạy trước mỗi lần push/deploy:

| Nhóm | Test ưu tiên |
|---|---|
| Auth/Admin security | AUTH-05, AUTH-11, AUTH-12, AUTH-13, AUTH-14 |
| Data isolation | BABY-09, BABY-11, C2C-VIEW-02, MEDIA-07, MYLIST-05, MYLIST-12, MYLIST-15, MYORDER-02, MYORDER-07, GROWTH-09, MILE-06, FEED-08 |
| Public visibility | SHOP-03, SHOP-15, C2C-VIEW-01, C2C-FORM-09, NEWS-02, NEWS-07, MILE-07 |
| Admin permissions | C2C-ADMIN-01, C2C-ADMIN-02, CATALOG-01, USER-ADMIN-01, USER-ADMIN-02, ORDER-15, ARTICLE-ADMIN-01, BSNHI-ADMIN-01 |
| Upload security | MEDIA-03, MEDIA-04, MEDIA-07, MEDIA-08 |
| Nghiệp vụ đơn hàng | ORDER-03, ORDER-11, ORDER-12, ORDER-13, MYORDER-06, MYLIST-14 |
| Guest RLS insert (`.select()` sau `.insert()`) | C2C-FORM-14, ORDER-09 |
| Độ chính xác tính toán WHO (LMS) | GROWTH-01, GROWTH-02, GROWTH-03, GROWTH-11 |
| Build check | `npm run build` phải pass |

---

## 27. UC-08 - AI Gợi Ý Sữa + Công Cụ Cho Mẹ

API: `POST /api/ai/suggest-milk` (public, rate limit theo IP). UI: `/cong-cu-cho-me` (`CongCuChoMeBrowser` — 3 công cụ: `AiSuggestMilkPanel`, `DueDateCalculatorPanel`, `PregnancyChecklistPanel`).

Đã test qua HTTP thật (curl, không phải mock) các bước validate, retrieval, rate limit và guard — xem "Ghi chú triển khai" ở UC-08 trong `USECASE.md`. **Chưa xác nhận bước gọi Claude thật** (bước 6-10) và chất lượng gợi ý; techlead/QA cần chạy với credential/model hợp lệ. 2 công cụ client-side (TOOLS-08, TOOLS-09) mới kiểm tra bằng đọc code + xác nhận trang render đúng nhãn qua `curl`, **chưa thao tác thật trên trình duyệt** — cần QA thủ công trước khi coi là hoàn tất.

| Mã | Test case | Bước thực hiện / Dữ liệu vào | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| TOOLS-01 | Guard khi thiếu key AI | Tạm thời bỏ `ANTHROPIC_API_KEY` hoặc dùng giá trị placeholder, gọi API với tiêu chí hợp lệ | `503`, message "chưa được cấu hình" | Có testcase; cần chạy khi kiểm tra cấu hình |
| TOOLS-02 | `condition` không hợp lệ | `condition: "not_a_real_condition"` | `400`, message "condition không hợp lệ." | Đã test — đúng |
| TOOLS-03 | Thiếu `age_months` | Body không có `age_months` | `400`, message "age_months phải là số từ 0 đến 60." | Đã test — đúng |
| TOOLS-04 | 0 ứng viên khớp tiêu chí | `age_months: 55`, `budget_min: 1, budget_max: 2` | `200` ngay (không gọi Claude), nếu còn sản phẩm sữa active thì trả tối đa 3 sản phẩm `fallback: true` và `fallback_message`; nếu catalog sữa rỗng thì `results: []` | Cần test lại sau khi bật fallback |
| TOOLS-05 | Rate limit theo IP | Gọi liên tục > 15 request/giờ từ cùng IP | Từ request thứ 16 trở đi: `429` | Đã test — đúng (chặn đúng ngưỡng qua Upstash Redis thật) |
| TOOLS-06 | Trang `/cong-cu-cho-me` render | `GET /cong-cu-cho-me` | `200`; HTML chứa đủ nhãn 3 công cụ và tiêu đề trang | Đã test qua curl — đúng |
| TOOLS-07 | Mẹ bỉm đã đăng nhập, có hồ sơ bé | Vào `/cong-cu-cho-me`, chọn bé ở dropdown công cụ AI | Tuổi/cân nặng tự điền theo `baby_measurements`/`babies` gần nhất | Chưa test qua trình duyệt |
| TOOLS-08 | Tính ngày dự sinh | Nhập LMP + chu kỳ kinh, bấm Tính | Hiển thị ngày dự sinh, tuần thai hiện tại, số ngày còn lại, danh sách mốc khám thai theo trạng thái | Chưa test qua trình duyệt |
| TOOLS-09 | Cẩm nang sinh con — lưu trạng thái | Tick vài checkbox, reload trang | Các checkbox đã tick vẫn giữ nguyên (đọc lại từ `localStorage`) | Chưa test qua trình duyệt |
| TOOLS-10 | Khách chưa đăng nhập dùng công cụ AI | Vào `/cong-cu-cho-me` không đăng nhập, nhập tay tiêu chí, gửi | Vẫn gọi được API (không bị chặn đăng nhập), không có dropdown chọn bé | Chưa test qua trình duyệt |
| TOOLS-11 | Gọi Claude thật với model hợp lệ | Cấu hình secret ngoài repository, đặt `CLAUDE_MODEL` hợp lệ, có ít nhất 1 sản phẩm sữa phù hợp rồi gửi request | `200`; tối đa 3 kết quả, `product_id` đều thuộc tập ứng viên, có `reason`, `match_percent`, `disclaimer` | Cần techlead/QA test |

---
