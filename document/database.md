# Database SuaEmbe

Tài liệu này liệt kê các bảng dữ liệu chính của dự án SuaEmbe theo TechSpec, kèm trạng thái sử dụng thực tế để đội backend và techlead có thể kiểm tra schema, API và phân quyền.

**Cập nhật tiến độ:** 25/08/2026.

- `Đã dùng`: bảng đang được route/UI hiện tại đọc hoặc ghi.
- `Đã seed`: dữ liệu có trong migration, chưa đồng nghĩa có màn Admin CRUD.
- `Một phần`: đã có schema/API nhưng còn thiếu provider, job nền hoặc UI quản trị.
- `Tương lai`: giữ schema để mở rộng, chưa dùng trong MVP hiện tại.

## 1. Bảng chính theo TechSpec

| Bảng | Mục đích | Ghi chú |
|---|---|---|
| `users` | Lưu hồ sơ người dùng, email, số điện thoại, vai trò và thông tin cá nhân. | Vai trò hiện tại gồm `admin` và `user` (mẹ bỉm). Khi dùng Supabase Auth, bảng này nên đóng vai trò profile mở rộng, liên kết với `auth.users`. |
| `device_tokens` | Lưu thiết bị nhận push notification. | Đã có API đăng ký/vô hiệu hóa token + job gửi FCM thật (`/api/cron/dispatch-notifications`); cần `FIREBASE_SERVICE_ACCOUNT` thật trong `.env` mới gửi được. |
| `notifications` | Lưu thông báo trong hệ thống. | Được tạo khi Admin trả lời tư vấn (UC-16) và khi tạo lịch ăn có giờ (UC-06), cả 2 đều `channel='push'` gửi qua Firebase FCM. Chưa có API/UI đọc tổng quát (hộp thư trong app) hoặc SMS/email thật. |
| `babies` | Lưu hồ sơ bé của từng người dùng. | Bao gồm tên bé, giới tính, ngày sinh, cân nặng, chiều cao, vòng đầu, giai đoạn sữa hiện tại. |
| `who_growth_standards` | Lưu dữ liệu chuẩn tăng trưởng WHO. | Dữ liệu chuẩn lưu sẵn trong dự án để tính percentile/z-score, ít thay đổi. |
| `baby_measurements` | Lưu lịch sử đo của từng bé. | Cân nặng, chiều cao, vòng đầu, percentile, z-score và nhận định theo thời gian. |
| `development_milestones` | Lưu bộ mốc phát triển chuẩn theo tháng tuổi. | Dữ liệu chuẩn mặc định của dự án để hiển thị checklist mốc phát triển. |
| `baby_milestone_records` | Lưu mốc phát triển bé đã đạt/chưa đạt. | Dữ liệu riêng của từng bé, đối chiếu với `development_milestones`. |
| `baby_feeding_schedule` | Lưu lịch ăn/sữa/ăn dặm của bé. | Phục vụ màn hình lịch ăn dặm hôm nay và nhắc lịch. |
| `brands` | Lưu nhãn hàng/thương hiệu. | Dùng chung cho sữa, máy hút sữa, mỹ phẩm mẹ bầu, bình sữa, bỉm tã và các sản phẩm Bách Hóa khác. |
| `product_categories` | Lưu danh mục Bách Hóa. | Hỗ trợ cây danh mục cha/con như Mẹ bầu & Sau sinh, Sữa cho bé, Bỉm tã, Bình sữa, Đồ chơi... |
| `products` | Lưu toàn bộ sản phẩm Bách Hóa. | Tất cả sản phẩm đều nằm ở đây: sữa, máy hút sữa, kem chống rạn, bình sữa, bỉm tã... Đã chốt mô hình affiliate — không bán trực tiếp, `outbound_url` trỏ sang trang bán của đối tác (VD: Shopee). |
| `milk_products` | Lưu dữ liệu dinh dưỡng riêng cho sản phẩm sữa. | Là bảng mở rộng 1-1 với `products`; chỉ sản phẩm sữa mới có bản ghi tại đây. |
| `c2c_listings` | Lưu tin pass đồ Chợ Mẹ & Bé C2C. | MVP hiện tại vận hành như form trung gian: người cần pass đồ gửi thông tin, Admin xử lý/chỉnh sửa/duyệt rồi mới public. |
| `c2c_orders` | Lưu đơn đặt mua C2C theo số lượng. | Người mua đặt số lượng, nhập thông tin nhận hàng, thanh toán thường (MoMo/VNPay mock hoặc COD), Admin xử lý đơn và hệ thống tự cập nhật số lượng còn lại của tin. |
| `escrow_transactions` | Lưu giao dịch escrow cho tin C2C. | Hướng phát triển tương lai; MVP hiện tại chưa dùng escrow, chỉ thanh toán thường theo số lượng mua. |
| `bs_nhi` | Lưu hồ sơ bác sĩ nhi đối tác. | Bác sĩ không phải role đăng nhập trong giai đoạn hiện tại. Admin quản lý hồ sơ bác sĩ, nhận yêu cầu tư vấn và chuyển tiếp phía sau. |
| `consult_requests` | Lưu yêu cầu tư vấn bác sĩ. | Bao gồm người hỏi, bác sĩ được chọn, câu hỏi, tuổi bé, thông tin chuyển tiếp nội bộ, câu trả lời, thời gian trả lời, trạng thái và rating. |
| `partners` | Lưu các đối tác không phải bác sĩ nhi. | Dùng chung cho bệnh viện, bảo hiểm, trang thiết bị, phục hồi sau sinh, dịch vụ mẹ & bé và các nhóm đối tác khác. |
| `partner_services` | Lưu gói/dịch vụ của từng đối tác. | Ví dụ: gói sinh, gói bảo hiểm thai sản, thuê máy hút sữa, massage/phục hồi sau sinh, chăm bé sơ sinh. |
| `partner_bookings` | Lưu lead liên hệ và lịch đặt dịch vụ trung gian. | **Đã dùng MVP:** guest booking/lead, Admin CRUD và cập nhật trạng thái; xác nhận SMS/email hiện chỉ là stub timestamp. Lead bác sĩ dùng `bs_id` + `request_type = 'doctor_lead'`; booking/lead đối tác dùng `partner_id` và có thể gắn `partner_service_id`. |
| `article_categories` | Lưu chuyên mục tin tức/học viện. | Quản lý danh mục cha/con cho 2 nhóm gốc "Tin tức & Cập nhật" và "Học viện Làm Mẹ" (UC-20/UC-21 đã triển khai). Không dùng cho "Nhật ký Dinh dưỡng Bé" — đó là UC-04 (`babies`/`baby_measurements`), không thuộc bảng này dù demo `suaembe.html` gộp chung 1 trang. |
| `articles` | Lưu bài viết, tin tức và nội dung học viện. | Bao gồm tác giả, tiêu đề, slug, danh mục, tóm tắt, nội dung, ảnh bìa, trạng thái, lượt xem và ngày xuất bản. UC-20 (đọc, public) và UC-21 (Admin CRUD) đã triển khai. |
| `media_assets` | Lưu metadata file/ảnh upload. | **Đã dùng một phần:** upload Cloudinary, lưu metadata và cleanup khi thay/gỡ ảnh; chưa có Admin Media Management độc lập. |

## 1.1. Mô hình đối tác

Theo hướng xử lý hiện tại:

- Bác sĩ nhi giữ bảng riêng `bs_nhi` vì có dữ liệu đặc thù như chuyên khoa, kinh nghiệm, rating tư vấn, trạng thái online và thời gian phản hồi.
- Các loại đối tác còn lại gom vào bảng `partners`.
- Dịch vụ/gói của đối tác đưa vào bảng `partner_services`.
- Booking dùng bảng `partner_bookings`.

Các loại `partner_type` gợi ý:

| Giá trị | Ý nghĩa |
|---|---|
| `hospital` | Bệnh viện/phòng khám, gói sinh, khám thai, chăm sóc mẹ bé. |
| `insurance` | Bảo hiểm thai sản, bảo hiểm cho bé, tích lũy giáo dục. |
| `equipment` | Trang thiết bị, đồ dùng mẹ bé, máy hút sữa, nôi, túi đi sinh. |
| `recovery` | Phục hồi sau sinh, massage, phục hồi sàn chậu, chăm sóc mẹ. |
| `service` | Dịch vụ mẹ & bé như tắm bé, chăm bé sơ sinh, chụp ảnh sơ sinh, lớp tiền sản. |
| `other` | Nhóm đối tác khác nếu phát sinh. |

## 2. Chi tiết thuộc tính gợi ý

### `users` - Người dùng

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính, nên liên kết với `auth.users(id)` khi dùng Supabase Auth. |
| `email` | `text` | Email đăng nhập, duy nhất. |
| `phone` | `text` | Số điện thoại. |
| `password_hash` | `text` | Cột dự phòng nếu tự xây auth; hiện dự án dùng Supabase Auth hoàn toàn nên cột này không được ghi/đọc ở tầng ứng dụng. |
| `role` | `text` | Vai trò người dùng: admin hoặc user (mẹ bỉm). |
| `full_name` | `text` | Họ tên đầy đủ. |
| `avatar_url` | `text` | Ảnh đại diện. |
| `is_verified` | `boolean` | Badge "Verified" hiển thị cho người bán ở Chợ Mẹ & Bé C2C. Đọc công khai qua RPC `get_c2c_seller_profile`, không mở policy select công khai trên toàn bảng `users` để tránh lộ `email`/`phone`. |
| `created_at` | `timestamptz` | Thời điểm tạo tài khoản. |

### `device_tokens` - Thiết bị nhận push

**Trạng thái hiện tại:** `POST /api/device-tokens` dùng để đăng ký/cập nhật token, `DELETE /api/device-tokens/:id` để vô hiệu hóa, và worker `GET/POST /api/cron/dispatch-notifications` gửi push FCM thật qua Firebase Admin SDK (`src/lib/firebase/admin.ts`) — cần `FIREBASE_SERVICE_ACCOUNT` thật trong `.env` (hiện đang rỗng) mới gửi được, nếu không route trả `503`.

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `user_id` | `uuid` | Người dùng sở hữu thiết bị. |
| `token` | `text` | Token FCM hoặc token push provider. |
| `provider` | `text` | Nhà cung cấp push, mặc định `fcm`. |
| `platform` | `text` | Nền tảng: web, ios, android. |
| `device_id` | `text` | Định danh thiết bị nếu có. |
| `enabled` | `boolean` | Thiết bị còn nhận thông báo hay không. |
| `last_seen_at` | `timestamptz` | Lần hoạt động gần nhất. |
| `created_at` | `timestamptz` | Thời điểm tạo. |
| `updated_at` | `timestamptz` | Thời điểm cập nhật gần nhất. |

### `notifications` - Thông báo

**Trạng thái hiện tại:** UC-16 (Admin trả lời tư vấn) và UC-06 (tạo lịch ăn có giờ cụ thể) tạo `notifications` với `channel='push'`, gửi thật qua Firebase FCM bởi job dispatch nói trên. UC-18/UC-19 chưa tạo notification provider; chỉ cập nhật `partner_bookings.notification_sent_at` và trả về `notification_stub`. Chưa có route đọc/đánh dấu đã đọc (hộp thư trong app), SMS hoặc email thật.

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `user_id` | `uuid` | Người nhận thông báo. |
| `type` | `text` | Loại thông báo: consult, booking, escrow, feeding... |
| `title` | `text` | Tiêu đề thông báo. |
| `body` | `text` | Nội dung thông báo. |
| `data` | `jsonb` | Payload liên kết tới booking, tư vấn, escrow, lịch ăn... |
| `channel` | `text` | Kênh gửi: in_app, push, email. |
| `status` | `text` (enum `notification_status`) | Trạng thái: `pending`, `sending` (đang claim để gửi, tránh 2 lần chạy cron chồng nhau — thêm qua migration `20260825000100_notification_status_sending.sql`), `sent`, `read`, `failed`, `cancelled`. |
| `scheduled_at` | `timestamptz` | Thời điểm dự kiến gửi. |
| `sent_at` | `timestamptz` | Thời điểm đã gửi. |
| `read_at` | `timestamptz` | Thời điểm người dùng đã đọc. |
| `created_at` | `timestamptz` | Thời điểm tạo. |

### `babies` - Hồ sơ bé

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `user_id` | `uuid` | Người dùng sở hữu hồ sơ bé. |
| `name` | `text` | Tên bé. |
| `gender` | `text` | Giới tính. |
| `birth_date` | `date` | Ngày sinh. |
| `weight_g` | `integer` | Cân nặng tính bằng gram. |
| `height_cm` | `numeric` | Chiều cao tính bằng cm. |
| `head_cm` | `numeric` | Vòng đầu tính bằng cm. |
| `current_milk_stage` | `text` | Giai đoạn sữa hiện tại. |
| `updated_at` | `timestamptz` | Thời điểm cập nhật gần nhất. |

### `who_growth_standards` - Chuẩn tăng trưởng WHO

Đã triển khai (UC-04): seed sẵn 150 dòng — 3 chỉ số (`weight_for_age`, `length_height_for_age`, `head_circumference_for_age`) × 2 giới tính × 25 mốc tháng tuổi (0–24 tháng). Nguồn: WHO Child Growth Standards (2006), lấy qua bản phân phối lại chính thức không chỉnh sửa của CDC. `version` mặc định cột là `'WHO-2006'` (không phải `'default'` như 1 số bảng khác trong dự án) — code tra cứu (`src/app/api/babies/[id]/measurements/route.ts`, `src/app/api/who-growth-standards/route.ts`) lọc đúng giá trị này.

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `standard_code` | `text` | Mã bộ chuẩn nếu cần. |
| `gender` | `text` | Giới tính: male hoặc female. |
| `indicator` | `text` | Chỉ số: `weight_for_age`, `length_height_for_age`, `head_circumference_for_age`. |
| `age_months` | `integer` | Tháng tuổi. |
| `l` | `numeric` | Tham số LMS L. |
| `m` | `numeric` | Tham số LMS M (trung vị). |
| `s` | `numeric` | Tham số LMS S. Backend dùng đúng 3 cột L/M/S này để tính z-score/percentile qua phương pháp LMS chính thức của WHO (`src/lib/growth/percentile.ts`), không dùng các cột percentile bên dưới để tính toán. |
| `p3, p5, p10, p25, p50, p75, p90, p95, p97` | `numeric` | Percentile dùng hiển thị/đối chiếu nhanh, lấy nguyên văn từ nguồn CDC. |
| `p15, p85` | `numeric` | Không có trong nguồn dữ liệu đang seed (CDC chỉ công bố 9 mốc percentile) nên luôn `null`. |
| `source` | `text` | Nguồn dữ liệu, mặc định WHO Child Growth Standards. |
| `version` | `text` | Phiên bản dữ liệu chuẩn, mặc định cột là `'WHO-2006'`. |
| `created_at` | `timestamptz` | Thời điểm tạo. |

### `baby_measurements` - Lịch sử đo của bé

Đã triển khai (UC-04) qua `POST /api/babies/:id/measurements` — backend tự tính `age_months` từ `babies.birth_date`, tra `who_growth_standards` theo tháng tuổi gần nhất, tính percentile/z-score, ghi `assessment` dạng câu tóm tắt cho từng chỉ số đã nhập.

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `baby_id` | `uuid` | Bé được đo. |
| `measured_at` | `timestamptz` | Thời điểm đo. |
| `age_months` | `numeric` | Tuổi bé tại thời điểm đo. |
| `weight_g` | `integer` | Cân nặng tính bằng gram. |
| `height_cm` | `numeric` | Chiều cao tính bằng cm. |
| `head_cm` | `numeric` | Vòng đầu tính bằng cm. |
| `weight_percentile` | `numeric` | Percentile cân nặng theo WHO. |
| `height_percentile` | `numeric` | Percentile chiều cao theo WHO. |
| `head_percentile` | `numeric` | Percentile vòng đầu theo WHO. |
| `weight_z_score` | `numeric` | Z-score cân nặng. |
| `height_z_score` | `numeric` | Z-score chiều cao. |
| `head_z_score` | `numeric` | Z-score vòng đầu. |
| `assessment` | `text` | Nhận định tổng quan tại lần đo. |
| `created_at` | `timestamptz` | Thời điểm tạo. |

### `development_milestones` - Mốc phát triển chuẩn

Đã triển khai (UC-05): seed sẵn 99 mốc, 8 mốc tháng tuổi (2, 4, 6, 9, 12, 15, 18, 24 tháng), dịch từ checklist chính thức CDC "Learn the Signs. Act Early." (bản sửa đổi 2022). `version` mặc định cột là `'default'` (khác `who_growth_standards`).

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `age_months` | `integer` | Tháng tuổi gợi ý hiển thị. |
| `category` | `text` | Nhóm mốc: vận động thô, vận động tinh, ngôn ngữ, xã hội... |
| `title` | `text` | Tên mốc phát triển. |
| `description` | `text` | Mô tả chi tiết. |
| `expected_from_month` | `integer` | Tháng bắt đầu kỳ vọng. |
| `expected_to_month` | `integer` | Tháng cuối kỳ vọng. |
| `source` | `text` | Nguồn tham khảo. |
| `version` | `text` | Phiên bản bộ mốc. |
| `active` | `boolean` | Mốc có đang sử dụng hay không. |
| `sort_order` | `integer` | Thứ tự hiển thị. |
| `created_at` | `timestamptz` | Thời điểm tạo. |
| `updated_at` | `timestamptz` | Thời điểm cập nhật gần nhất. |

### `baby_milestone_records` - Mốc phát triển của từng bé

Đã triển khai (UC-05) qua `PUT /api/babies/:id/milestones/:milestoneId` — upsert theo unique `(baby_id, milestone_id)`.

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `baby_id` | `uuid` | Bé được theo dõi. |
| `milestone_id` | `uuid` | Mốc phát triển chuẩn. |
| `status` | `text` | Trạng thái: achieved, in_progress, not_observed, delayed. |
| `achieved_at` | `date` | Ngày bé đạt mốc. |
| `note` | `text` | Ghi chú của mẹ bỉm/admin. |
| `created_at` | `timestamptz` | Thời điểm tạo. |
| `updated_at` | `timestamptz` | Thời điểm cập nhật gần nhất. |

### `baby_feeding_schedule` - Lịch ăn/sữa của bé

Đã triển khai đầy đủ (UC-06): CRUD lịch ăn (`GET/POST /api/babies/:id/feeding-schedule`, `PUT/DELETE /api/babies/:id/feeding-schedule/:scheduleId`, `DELETE /api/babies/:id/feeding-schedule`) cộng nhắc lịch qua `notifications`/push FCM qua `device_tokens` khi lịch có `scheduled_time` (xem `src/lib/notifications/feeding-reminders.ts`).

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `baby_id` | `uuid` | Bé có lịch ăn. |
| `scheduled_date` | `date` | Ngày ăn/uống. |
| `scheduled_time` | `time` | Giờ dự kiến. |
| `meal_type` | `text` | Loại bữa: milk, solid_food, snack... |
| `title` | `text` | Tên bữa/lịch. |
| `description` | `text` | Mô tả chi tiết. |
| `amount_ml` | `integer` | Lượng sữa/nước tính ml nếu có. |
| `status` | `text` | Trạng thái: pending, upcoming, done, skipped, cancelled. |
| `completed_at` | `timestamptz` | Thời điểm hoàn thành. |
| `created_at` | `timestamptz` | Thời điểm tạo. |
| `updated_at` | `timestamptz` | Thời điểm cập nhật gần nhất. |

## 1.2. Mô hình Bách Hóa và sản phẩm

Theo hướng xử lý hiện tại:

- Nhãn hàng đưa vào `brands`.
- Danh mục Bách Hóa đưa vào `product_categories`.
- Tất cả sản phẩm đưa vào `products`.
- Sản phẩm sữa có thêm dữ liệu dinh dưỡng trong `milk_products`.
- Các sản phẩm như máy hút sữa, kem chống rạn, bình sữa, bỉm tã chỉ cần `products.attributes` để lưu thông số riêng.

Mô hình quan hệ:

```text
brands 1 - n products
product_categories 1 - n products
products 1 - 0/1 milk_products
```

Ví dụ:

| Sản phẩm | Bảng chính | Dữ liệu riêng |
|---|---|---|
| Aptamil Pronutra Advance 2 | `products` | Có thêm `milk_products` để lưu stage, độ tuổi, thành phần dinh dưỡng. |
| Máy hút sữa điện đôi S1+ | `products` | Thông số như chế độ hút, bảo hành, chất liệu lưu trong `products.attributes`. |
| Kem chống rạn da Mustela 250ml | `products` | Thông số như dung tích, loại da, xuất xứ, an toàn cho mẹ bầu lưu trong `products.attributes`. |
| Bình sữa, bỉm tã, đồ chơi | `products` | Thông số riêng từng loại lưu trong `products.attributes`. |

### `brands` - Nhãn hàng

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `name` | `text` | Tên nhãn hàng. |
| `slug` | `text` | Đường dẫn thân thiện SEO. |
| `logo_url` | `text` | Logo nhãn hàng. |
| `country` | `text` | Quốc gia/xuất xứ thương hiệu. |
| `description` | `text` | Mô tả nhãn hàng. |
| `website_url` | `text` | Website chính thức hoặc landing page. |
| `verified` | `boolean` | Nhãn hàng đã được xác minh hay chưa. |
| `created_at` | `timestamptz` | Thời điểm tạo. |
| `updated_at` | `timestamptz` | Thời điểm cập nhật gần nhất. |

### `product_categories` - Danh mục Bách Hóa

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `parent_id` | `uuid` | Danh mục cha, dùng để tạo cây danh mục. |
| `name` | `text` | Tên danh mục. |
| `slug` | `text` | Đường dẫn thân thiện SEO. |
| `description` | `text` | Mô tả danh mục. |
| `sort_order` | `integer` | Thứ tự hiển thị. |
| `active` | `boolean` | Danh mục có đang hiển thị hay không. |
| `created_at` | `timestamptz` | Thời điểm tạo. |
| `updated_at` | `timestamptz` | Thời điểm cập nhật gần nhất. |

### `products` - Sản phẩm Bách Hóa

Đã chốt với techlead: Bách Hóa đi theo hướng **Affiliate** — SuaEmbe không bán trực tiếp, chỉ hiển thị sản phẩm; bấm "Mua ngay" thì redirect sang trang bán thật của đối tác (VD: Shopee, Tiki) kèm link affiliate. Không cần bảng `orders` cho Bách Hóa vì không xử lý thanh toán/đơn hàng nào trên SuaEmbe cho luồng này.

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `brand_id` | `uuid` | Nhãn hàng, tham chiếu `brands(id)`. |
| `category_id` | `uuid` | Danh mục, tham chiếu `product_categories(id)`. |
| `name` | `text` | Tên sản phẩm. |
| `slug` | `text` | Đường dẫn thân thiện SEO. |
| `description` | `text` | Mô tả chi tiết. |
| `short_description` | `text` | Mô tả ngắn. |
| `image_urls` | `text[]` | Danh sách ảnh sản phẩm. |
| `price_vnd` | `integer` | Giá bán tham khảo. |
| `original_price_vnd` | `integer` | Giá gốc. |
| `unit` | `text` | Đơn vị: hộp, chai, tuýp, chiếc, bộ... |
| `sku` | `text` | Mã sản phẩm. |
| `attributes` | `jsonb` | Thông số linh hoạt theo từng loại sản phẩm. |
| `tags` | `text[]` | Tags phục vụ filter/search. |
| `status` | `text` | Trạng thái: draft, active, archived. |
| `outbound_url` | `text` | Link affiliate trỏ sang trang bán thật của đối tác (VD: Shopee). Khi có giá trị, trang chi tiết sản phẩm hiển thị nút "Mua ngay" mở link này ở tab mới. `null` nghĩa là sản phẩm chỉ để tham khảo, chưa gắn đối tác bán. |
| `created_at` | `timestamptz` | Thời điểm tạo. |
| `updated_at` | `timestamptz` | Thời điểm cập nhật gần nhất. |

Ví dụ `attributes` cho máy hút sữa:

```json
{
  "type": "electric_double_breast_pump",
  "warranty": "24 tháng",
  "power_modes": 5,
  "material": "BPA free"
}
```

Ví dụ `attributes` cho kem chống rạn:

```json
{
  "volume": "250ml",
  "skin_type": "da nhạy cảm",
  "origin": "Pháp",
  "safe_for_pregnancy": true
}
```

### `milk_products` - Dữ liệu dinh dưỡng của sản phẩm sữa

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `product_id` | `uuid` | Khóa chính, tham chiếu `products(id)`. |
| `stage` | `text` | Giai đoạn sản phẩm. |
| `age_min_months` | `integer` | Tuổi tối thiểu tính theo tháng. |
| `age_max_months` | `integer` | Tuổi tối đa tính theo tháng. |
| `weight_g` | `integer` | Trọng lượng hộp/túi. |
| `key_ingredients` | `jsonb` | Thành phần nổi bật. |
| `nutrition_tags` | `text[]` | Nhãn dinh dưỡng: DHA, tiêu hóa, miễn dịch, ít đường... |
| `rating` | `numeric` | Điểm đánh giá trung bình. |
| `review_count` | `integer` | Số lượt đánh giá. |

### `c2c_listings` - Tin chợ C2C

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `seller_id` | `uuid` | Người bán. |
| `title` | `text` | Tiêu đề tin đăng. |
| `category` | `text` | Danh mục: sữa dư, quần áo, xe đẩy, đồ chơi... |
| `condition` | `text` | Tình trạng sản phẩm. |
| `price` | `integer` | Giá bán. |
| `original_price` | `integer` | Giá gốc. |
| `province` | `text` | Tỉnh/thành. |
| `delivery_method` | `text` | Hình thức giao hàng. |
| `description` | `text` | Mô tả chi tiết. |
| `images` | `text[]` | Danh sách URL ảnh. |
| `phone_hidden` | `text` | Số điện thoại được ẩn/mask. |
| `zalo` | `text` | Số Zalo liên hệ. |
| `escrow_enabled` | `boolean` | Có bật bảo vệ escrow hay không. |
| `status` | `text` | Trạng thái: pending, approved, sold, hidden. |
| `expires_at` | `timestamptz` | Ngày hết hạn tin. |
| `created_at` | `timestamptz` | Ngày tạo tin. |

**Ghi chú MVP mới cho Chợ C2C (đã triển khai):**

- Luồng đăng tin là form pass đồ do SữaEmbe/Admin làm trung gian, không bắt buộc người bán đăng nhập.
- `seller_id` đã cho phép `null` (người bán ẩn danh/khách vãng lai); đã thêm cột `seller_name` để lưu snapshot tên người bán nhập từ form (không phụ thuộc join `users`, vì `seller_id` có thể null). Liên hệ dùng chung 2 cột có sẵn `phone_hidden`/`zalo`.
- Đã thêm cột `quantity_available` (số lượng còn lại của tin) để hỗ trợ người mua mua một phần trong bản tin.
- `escrow_enabled` là hướng phát triển sau (UC-13), không dùng trong luồng thanh toán thường hiện tại — cột vẫn còn trong schema nhưng UI không còn hiển thị/set nữa.

### `c2c_orders` - Đơn đặt mua C2C (đã triển khai, thay Escrow trong luồng chính)

MVP mới bỏ escrow và chuyển sang đặt mua/thanh toán thường theo số lượng — bảng đơn hàng C2C này thay cho `escrow_transactions` ở luồng hiện tại (`escrow_transactions` vẫn còn trong schema, dành cho UC-13 — hướng phát triển tương lai).

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `listing_id` | `uuid` | Tin C2C được đặt mua. |
| `buyer_id` | `uuid` | Người mua nếu có tài khoản; `null` nếu là khách vãng lai. |
| `buyer_name` | `text` | Tên người mua/nhận hàng. |
| `buyer_phone` | `text` | Số điện thoại người mua. |
| `buyer_email` | `text` | Email người mua nếu có. |
| `shipping_address` | `text` | Địa chỉ nhận hàng. |
| `quantity` | `integer` | Số lượng người mua đặt. |
| `unit_price` | `integer` | Giá tại thời điểm đặt mua. |
| `total_amount` | `integer` | Tổng tiền: `unit_price * quantity`. |
| `payment_method` | `text` | Phương thức thanh toán: `momo`, `vnpay` (hiện là **MOCK**, giả lập luôn thành công — sandbox test thật tích hợp sau) hoặc `cod` (thanh toán khi nhận hàng). |
| `payment_ref` | `text` | Mã tham chiếu thanh toán (mock: `MOCK-<timestamp>`). |
| `payment_status` | `text` | Trạng thái thanh toán: pending, paid, failed, refunded. |
| `order_status` | `text` | Trạng thái xử lý: pending_admin_review, confirmed, processing, completed, cancelled, partially_available. |
| `admin_note` | `text` | Ghi chú xử lý nội bộ của Admin. |
| `created_at` | `timestamptz` | Ngày tạo đơn. |
| `updated_at` | `timestamptz` | Ngày cập nhật gần nhất. |

**Quy tắc xử lý đơn (đã triển khai):**

- Sau khi tạo đơn (`pending_admin_review`), nếu chọn MoMo/VNPay thì xác nhận thanh toán qua bước MOCK (`POST /api/orders/:id/mock-pay`); chọn COD thì bỏ qua bước này.
- Admin thấy đơn mới ở màn "Đơn hàng C2C", xác nhận lại còn đủ số lượng không.
- Chuyển đơn sang `confirmed` (lần đầu từ `pending_admin_review`) → hệ thống **tự động trừ** `quantity_available` của tin; về 0 thì **tự động** chuyển tin sang `sold`.
- Hết hàng: Admin huỷ đơn (`cancelled`). Chỉ còn một phần: Admin liên hệ người mua, cập nhật `admin_note` và số lượng còn lại của tin thủ công.
- Người mua có tài khoản (`buyer_id` khác null) tự tra cứu đơn của mình qua `/tai-khoan` và tự huỷ được đơn khi còn `pending_admin_review` (UC-29).
- Khách vãng lai (`buyer_id = null`) không tự tra cứu lại được đơn — xem UC-30 (định hướng, chưa triển khai: gửi email hoặc Admin liên hệ tay qua `buyer_phone`).

### `escrow_transactions` - Giao dịch escrow

**Trạng thái:** Hướng phát triển tương lai, không thuộc MVP hiện tại.

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `listing_id` | `uuid` | Tin C2C liên quan. |
| `buyer_id` | `uuid` | Người mua. |
| `seller_id` | `uuid` | Người bán. |
| `amount` | `integer` | Số tiền giao dịch. |
| `fee_amount` | `integer` | Phí nền tảng. |
| `payment_method` | `text` | Phương thức thanh toán: VNPay, MoMo... |
| `payment_ref` | `text` | Mã tham chiếu thanh toán. |
| `status` | `text` | Trạng thái: holding, released, refunded, disputed. |
| `held_at` | `timestamptz` | Thời điểm giữ tiền. |
| `released_at` | `timestamptz` | Thời điểm nhả tiền. |

### `bs_nhi` - Bác sĩ nhi

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `full_name` | `text` | Họ tên bác sĩ. |
| `specialty` | `text` | Chuyên khoa. |
| `hospital` | `text` | Bệnh viện/phòng khám. |
| `experience_years` | `integer` | Số năm kinh nghiệm. |
| `bio` | `text` | Giới thiệu chuyên môn. |
| `avatar_url` | `text` | Ảnh đại diện. |
| `rating` | `numeric` | Điểm đánh giá. |
| `consult_count` | `integer` | Số lượt tư vấn. |
| `is_online` | `boolean` | Trạng thái online. |
| `response_hours` | `integer` | Thời gian phản hồi dự kiến. |
| `verified` | `boolean` | Đã xác minh hay chưa. |

### `consult_requests` - Yêu cầu tư vấn

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `user_id` | `uuid` | Người gửi câu hỏi. |
| `bs_id` | `uuid` | Bác sĩ được chỉ định. |
| `question` | `text` | Nội dung câu hỏi. |
| `baby_age_months` | `integer` | Tuổi bé tính theo tháng. |
| `answer` | `text` | Câu trả lời của bác sĩ. |
| `answered_at` | `timestamptz` | Thời điểm trả lời. |
| `forwarded_at` | `timestamptz` | Thời điểm admin chuyển tiếp yêu cầu cho bác sĩ đối tác. |
| `forwarded_by` | `uuid` | Admin hoặc người vận hành đã chuyển tiếp yêu cầu. |
| `internal_note` | `text` | Ghi chú nội bộ khi xử lý/chuyển tiếp tư vấn. |
| `status` | `text` | Trạng thái yêu cầu. |
| `rating` | `smallint` | Đánh giá sau tư vấn. |
| `created_at` | `timestamptz` | Thời điểm tạo yêu cầu. |

### `partners` - Đối tác

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `name` | `text` | Tên đối tác. |
| `partner_type` | `enum public.partner_type` | Loại đối tác, ràng buộc ở tầng DB: `hospital`, `insurance`, `equipment`, `recovery`, `service`, `other`. |
| `category` | `text` | Nhóm nhỏ bên trong loại đối tác. |
| `description` | `text` | Mô tả đối tác. |
| `logo_url` | `text` | Logo đối tác. |
| `cover_url` | `text` | Ảnh bìa hoặc ảnh đại diện lớn. |
| `phone` | `text` | Số điện thoại liên hệ. |
| `email` | `text` | Email liên hệ. |
| `website_url` | `text` | Website hoặc landing page đối tác. |
| `province` | `text` | Tỉnh/thành hoạt động. |
| `address` | `text` | Địa chỉ. |
| `rating` | `numeric` | Điểm đánh giá. |
| `verified` | `boolean` | Đối tác đã được xác minh hay chưa. |
| `status` | `text` | Trạng thái: pending, active, inactive, hidden. |
| `created_at` | `timestamptz` | Thời điểm tạo. |
| `updated_at` | `timestamptz` | Thời điểm cập nhật gần nhất. |

### `partner_services` - Gói/dịch vụ đối tác

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `partner_id` | `uuid` | Đối tác sở hữu dịch vụ/gói. |
| `name` | `text` | Tên gói/dịch vụ. |
| `service_type` | `text` | Loại dịch vụ: gói sinh, bảo hiểm, thuê thiết bị, phục hồi, chăm bé... |
| `description` | `text` | Mô tả dịch vụ. |
| `price_from` | `integer` | Giá thấp nhất. |
| `price_to` | `integer` | Giá cao nhất. |
| `duration_minutes` | `integer` | Thời lượng dịch vụ nếu có. |
| `active` | `boolean` | Dịch vụ có đang hiển thị hay không. |
| `created_at` | `timestamptz` | Thời điểm tạo. |
| `updated_at` | `timestamptz` | Thời điểm cập nhật gần nhất. |

### `partner_bookings` - Đặt lịch đối tác

**Trạng thái hiện tại:** Đã dùng trong MVP. Public form tạo booking/lead không cần đăng nhập; Admin có thể xem, lọc, tạo, cập nhật, đánh dấu chuyển tiếp, xác nhận, hoàn thành, hủy hoặc xóa. Khi chuyển `confirmed`, backend chỉ ghi timestamp xác nhận và timestamp stub thông báo; chưa gọi nhà cung cấp SMS/email.

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `user_id` | `uuid` | Người đặt lịch nếu có tài khoản; nullable để hỗ trợ khách vãng lai gửi lead/booking. |
| `bs_id` | `uuid` | Bác sĩ nhi được liên hệ khi `request_type = 'doctor_lead'`, tham chiếu `bs_nhi(id)`. |
| `partner_id` | `uuid` | Đối tác được đặt lịch, tham chiếu `partners(id)`. |
| `partner_service_id` | `uuid` | Gói/dịch vụ được chọn, tham chiếu `partner_services(id)`. |
| `partner_type` | `enum public.partner_type` | Loại đối tác tại thời điểm booking (snapshot), dùng chung enum với `partners.partner_type`. |
| `service` | `text` | Tên dịch vụ snapshot tại thời điểm booking. |
| `amount` | `integer` | Giá trị booking. |
| `fee_amount` | `integer` | Phí nền tảng. |
| `status` | `text` | Trạng thái booking: `pending`, `confirmed`, `completed`, `cancelled`. |
| `scheduled_at` | `timestamptz` | Thời gian hẹn. |
| `request_type` | `text` | Loại yêu cầu: `lead` cho form liên hệ đối tác, `booking` cho đặt lịch dịch vụ, `doctor_lead` cho form liên hệ bác sĩ nhi. |
| `customer_name` | `text` | Họ tên khách gửi form. |
| `customer_phone` | `text` | Số điện thoại khách gửi form. |
| `customer_email` | `text` | Email khách gửi form nếu có. |
| `address` | `text` | Địa chỉ nhận tư vấn/dịch vụ nếu có. |
| `note` | `text` | Ghi chú của khách. |
| `internal_note` | `text` | Ghi chú xử lý nội bộ của Admin/SữaEmbe. |
| `confirmed_at` | `timestamptz` | Thời điểm Admin xác nhận lịch/lead. |
| `completed_at` | `timestamptz` | Thời điểm hoàn tất. |
| `cancelled_at` | `timestamptz` | Thời điểm hủy. |
| `forwarded_at` | `timestamptz` | Thời điểm Admin đánh dấu đã chuyển thông tin cho đối tác. |
| `forwarded_by` | `uuid` | Admin đã chuyển tiếp thông tin, tham chiếu `users(id)`. |
| `notification_sent_at` | `timestamptz` | Thời điểm backend đánh dấu notification stub khi booking chuyển `confirmed`; chưa chứng minh SMS/email đã gửi thành công. |
| `created_at` | `timestamptz` | Thời điểm tạo booking. |
| `updated_at` | `timestamptz` | Thời điểm cập nhật gần nhất. |

### `articles` - Bài viết / Blog

Đã triển khai: UC-20 (khách/mẹ bỉm đọc bài, public) và UC-21 (Admin CRUD chuyên mục + bài viết).

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `author_id` | `uuid` | Tác giả bài viết, tự gán theo admin đang đăng nhập lúc tạo (UC-21), không cho chọn tuỳ ý. |
| `category_id` | `uuid` | Chuyên mục bài viết, tham chiếu `article_categories(id)`. Là nguồn dữ liệu duy nhất cho danh mục bài viết. |
| `title` | `text` | Tiêu đề. |
| `slug` | `text` | Đường dẫn thân thiện SEO. |
| `excerpt` | `text` | Tóm tắt. |
| `content` | `text` | Nội dung bài viết (plain text, đoạn cách nhau bằng dòng trống, `**chữ**` để in đậm — frontend tự parse, không dùng thư viện markdown). |
| `cover_url` | `text` | Ảnh bìa. |
| `status` | `text` | Trạng thái: draft, published, archived. Lần đầu chuyển sang published, backend tự gán `published_at = now()` nếu chưa có; các lần sửa sau giữ nguyên mốc gốc. |
| `view_count` | `integer` | Lượt xem. Khách không UPDATE trực tiếp được (RLS `articles_update_admin` chỉ cho admin) — tăng qua function `increment_article_view(p_slug)` chạy `security definer`, phạm vi cố tình thu hẹp: chỉ +1 đúng 1 bài đang published theo slug. Gọi từ `POST /api/articles/:slug/view`, không dedupe theo phiên/trình duyệt. |
| `published_at` | `timestamptz` | Ngày xuất bản. |
| `created_at` | `timestamptz` | Ngày tạo. |

### `article_categories` - Chuyên mục tin tức/học viện

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `parent_id` | `uuid` | Chuyên mục cha nếu có. |
| `name` | `text` | Tên chuyên mục. |
| `slug` | `text` | Đường dẫn thân thiện SEO. |
| `description` | `text` | Mô tả chuyên mục. |
| `sort_order` | `integer` | Thứ tự hiển thị. |
| `active` | `boolean` | Chuyên mục có đang hiển thị hay không. |
| `created_at` | `timestamptz` | Thời điểm tạo. |
| `updated_at` | `timestamptz` | Thời điểm cập nhật gần nhất. |

### `media_assets` - File/ảnh upload

**Trạng thái hiện tại:** Đã dùng một phần. `POST /api/uploads` upload ảnh lên Cloudinary rồi lưu metadata; `DELETE /api/uploads` chỉ cho gỡ ảnh listing draft chưa gắn owner trong giới hạn an toàn. Khi avatar/cover/ảnh sản phẩm/listing bị thay hoặc gỡ, backend đã gọi cleanup Cloudinary và xóa row metadata tương ứng. Chưa có `GET/DELETE /api/admin/media-assets` hoặc màn hình Admin xem/tìm/xóa media tập trung. Logo/cover của `partners` hiện mới có cột schema, chưa có uploader riêng trong UI Admin.

| Cột | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `id` | `uuid` | Khóa chính. |
| `uploader_id` | `uuid` | Người upload. |
| `owner_table` | `text` | Bảng sở hữu file: users, products, c2c_listings, bs_nhi, articles...; `null` cho ảnh C2C upload trước khi tạo tin. |
| `owner_id` | `uuid` | ID bản ghi sở hữu file. |
| `asset_type` | `text` | Loại asset: image, avatar, logo, cover, document... |
| `provider` | `text` | Nhà cung cấp lưu trữ: cloudinary, supabase_storage... |
| `bucket` | `text` | Bucket nếu dùng Supabase Storage. |
| `public_id` | `text` | Public ID/path của provider. |
| `url` | `text` | URL file. |
| `secure_url` | `text` | URL HTTPS nếu provider trả riêng. |
| `mime_type` | `text` | MIME type. |
| `size_bytes` | `integer` | Dung lượng file. |
| `width` | `integer` | Chiều rộng ảnh. |
| `height` | `integer` | Chiều cao ảnh. |
| `alt_text` | `text` | Mô tả ảnh. |
| `metadata` | `jsonb` | Metadata bổ sung từ provider. |
| `is_public` | `boolean` | File có public metadata hay không. |
| `created_at` | `timestamptz` | Thời điểm tạo. |

**Luồng media hiện tại:**

1. Frontend gửi file đến `POST /api/uploads`.
2. Backend kiểm tra MIME (`jpeg/png/webp/gif`) và giới hạn 5MB.
3. Nếu có `owner_table`, user thường chỉ được gắn vào dữ liệu của chính mình; bảng admin-only chỉ Admin được gắn. Nếu không có `owner_table`, khách vãng lai được upload ảnh nháp cho form C2C.
4. File được lưu tại Cloudinary; URL được trả về frontend và thường đồng thời được lưu vào `avatar_url`, `cover_url` hoặc `image_urls` của bảng nghiệp vụ.
5. Khi URL bị thay/gỡ, helper cleanup tìm row theo `secure_url`, gọi Cloudinary `destroy(public_id)` rồi xóa row `media_assets`.
6. Ảnh C2C nháp bị bỏ quên khi khách đóng form chưa có job định kỳ dọn tự động; đây là phần còn thiếu.

## 3. Bảng đề xuất mở rộng

Các bảng dưới đây chưa phải lõi bắt buộc trong TechSpec, nhưng nên có khi triển khai production.

| Bảng | Mục đích |
|---|---|
| `orders` | Không cần cho Bách Hóa (đã chốt hướng affiliate — xem `products.outbound_url` ở §mục "products" phía trên). Chỉ cân nhắc thêm nếu sau này techlead đổi hướng sang bán trực tiếp. |
| `milk_suggestions` | Lưu lịch sử AI gợi ý sữa, input của người dùng và kết quả trả về. |
| `reviews` | Lưu đánh giá cho bác sĩ, sản phẩm sữa, listing C2C hoặc đối tác. |
| `product_clicks` | Đo click/conversion cho affiliate (chưa cần ở MVP — hiện chỉ lưu `outbound_url` tĩnh, chưa tracking; thêm bảng này khi cần báo cáo hoa hồng chi tiết theo click). |

## 3.1. Quyết định: Tính ngày dự sinh & Cẩm nang sinh con — giữ client-side

Đã xác nhận với techlead: 2 tính năng này **không cần bảng dữ liệu, không cần API riêng** ở giai đoạn hiện tại — tính toán/nội dung xử lý hoàn toàn phía frontend, không lưu trữ.

Hướng mở rộng nếu sau này techlead yêu cầu lưu trữ/cá nhân hoá (VD: nhắc lịch khám thai qua FCM, cho mẹ bỉm xem lại tiến độ đã tính):

| Nhu cầu phát sinh | Bảng cần thêm |
|---|---|
| Lưu LMP/ngày dự sinh theo tài khoản, nhắc lịch qua `notifications`/`device_tokens` (đã có sẵn) | `pregnancy_tracking` (user_id, lmp_date, cycle_length_days, edd, created_at, updated_at) |
| Timeline mốc khám thai tính theo tuần thai thay vì hardcode | `prenatal_milestones` (age_week_from, age_week_to, title, description) — cùng mô hình với `development_milestones`, có thể ghép chung nếu muốn 1 bảng mốc dùng chung cho cả thai kỳ lẫn sau sinh |
| Cẩm nang sinh con dạng checklist có lưu tick | Tái dùng mô hình `development_milestones` + `baby_milestone_records`, đổi tên miền chung thành checklist theo mốc thời gian (tuần thai/tháng tuổi) thay vì chỉ theo bé |

Không tạo các bảng này trước khi có yêu cầu cụ thể, tránh schema thừa không dùng đến.

## 4. Ghi chú triển khai Supabase

- Nên dùng Supabase Auth cho đăng ký, đăng nhập và quản lý phiên.
- Bảng `public.users` nên là bảng profile, khóa `id` tham chiếu `auth.users(id)`.
- Giai đoạn hiện tại chỉ có 2 role chính: `admin` và `user` (mẹ bỉm). Bác sĩ nhi là đối tác do admin quản lý, không đăng nhập với role riêng.
- Bác sĩ nhi giữ bảng riêng `bs_nhi`; các đối tác còn lại dùng `partners`; gói/dịch vụ của đối tác dùng `partner_services`; booking dùng `partner_bookings`.
- Dữ liệu chuẩn như `who_growth_standards` và `development_milestones` nên được seed mặc định trong dự án, vì ít thay đổi và cần dùng để đánh giá tăng trưởng/phát triển.
- Cần bật Row Level Security cho các bảng chứa dữ liệu người dùng.
- Các API server-side dùng `SUPABASE_SERVICE_ROLE_KEY` chỉ được chạy ở backend, không đưa key này xuống client.
- Các bảng công khai như `brands`, `product_categories`, `products`, `milk_products`, `articles` đã xuất bản, bác sĩ đã xác minh, đối tác/dịch vụ đã xác minh có thể cho phép đọc công khai.
- Các bảng cá nhân như `babies`, `baby_measurements`, `baby_milestone_records`, `baby_feeding_schedule`, `consult_requests`, `escrow_transactions`, `notifications`, `device_tokens` phải giới hạn theo `auth.uid()` hoặc quyền Admin. Riêng `partner_bookings` cho phép guest insert qua form trung gian; guest không được đọc/sửa, Admin là bên xem và xử lý.
