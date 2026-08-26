# USECASE SuaEmbe

Tài liệu này mô tả use case của SuaEmbe theo logic database hiện tại trong `document/database.md`.

**Cập nhật tiến độ:** 25/08/2026. Nhãn **Đã triển khai** nghĩa là đã có route/UI tương ứng trong source; nhãn **đã test** chỉ dùng khi `TESTCASE.md` ghi nhận đã chạy thành công. Các tích hợp bên thứ ba (Claude thật, FCM, SMS/email, cổng thanh toán thật) được ghi riêng, không mặc định là đã hoàn tất chỉ vì đã có cột hoặc endpoint.

**Tóm tắt tiến độ MVP:** 24 UC đã có luồng chính (`UC-06` nay đã đủ 6 bước kể cả nhắc lịch push); còn `UC-18`, `UC-25`, `UC-26` thiếu một phần tích hợp/quản trị; `UC-13` và `UC-30` là hướng tương lai, còn `UC-24` mới có dữ liệu seed qua migration chưa có Admin UI/API import. `UC-08` đã có route/UI và các guard/retrieval cần thiết, nhưng lời gọi Claude thật vẫn cần techlead/QA xác nhận key thật. `UC-25` (push FCM) đã có `FIREBASE_SERVICE_ACCOUNT` thật, xác thực thành công với Google (đã verify) — chỉ còn thiếu bước cuối là người dùng thật bấm "Bật thông báo" trên trình duyệt để có `device_tokens` thì mới thấy được push thật xuất hiện trên máy.

Nguyên tắc phân quyền hiện tại:

- Hệ thống chỉ có 2 role đăng nhập chính: `admin` và `user`.
- `user` là mẹ bỉm/người dùng cuối.
- `admin` là đội vận hành, có quyền quản trị dữ liệu và xử lý nghiệp vụ phía sau; escrow hiện chỉ là hướng tương lai.
- Bác sĩ nhi không phải role đăng nhập trong giai đoạn hiện tại. Bác sĩ được xem là đối tác/hồ sơ chuyên môn trong bảng `bs_nhi`, do admin quản lý. Khi mẹ bỉm bấm "Hỏi ngay", admin nhận yêu cầu và chuyển tiếp phía sau cho bác sĩ đối tác.

## 1. Actor

| Actor | Có đăng nhập không | Role trong database | Mô tả |
|---|---:|---|---|
| Khách truy cập | Không bắt buộc | Không có | Xem nội dung công khai, danh sách sản phẩm, bác sĩ đã xác minh, tin chợ đã duyệt, bài viết đã xuất bản. |
| Mẹ bỉm | Có | `user` | Người dùng chính: quản lý hồ sơ bé, theo dõi phát triển, lịch ăn, đăng tin C2C, gửi tư vấn, đặt lịch đối tác, nhận thông báo. |
| Admin | Có | `admin` | Đội vận hành: quản lý dữ liệu chuẩn, sản phẩm, nội dung, media, bác sĩ, đối tác, tư vấn, booking và notification data; escrow là hướng tương lai. |
| Bác sĩ nhi đối tác | Không phải role hệ thống | Không có role đăng nhập | Là hồ sơ chuyên môn trong `bs_nhi`. Admin chuyển tiếp yêu cầu tư vấn phía sau và cập nhật câu trả lời vào hệ thống. |

## 2. Phạm Vi Bảng Dữ Liệu Chính

| Bảng | Actor chính | Ý nghĩa trong use case |
|---|---|---|
| `users` | Mẹ bỉm, Admin | Hồ sơ người dùng và phân quyền `admin`/`user`. |
| `device_tokens` | Mẹ bỉm, Admin | Lưu thiết bị nhận push notification qua Firebase FCM. |
| `notifications` | Mẹ bỉm, Admin | Đã dùng để ghi notification khi tư vấn được trả lời; chưa có API/UI đọc tổng quát hoặc job gửi push/SMS/email. |
| `babies` | Mẹ bỉm, Admin | Hồ sơ bé thuộc về mẹ bỉm. |
| `baby_measurements` | Mẹ bỉm, Admin | Lịch sử đo cân nặng, chiều cao, vòng đầu và kết quả đánh giá theo WHO. |
| `who_growth_standards` | Khách, Mẹ bỉm, Admin | Dữ liệu chuẩn WHO lưu sẵn trong dự án, dùng để tính percentile/z-score. |
| `development_milestones` | Khách, Mẹ bỉm, Admin | Bộ mốc phát triển chuẩn theo tháng tuổi, được seed mặc định. |
| `baby_milestone_records` | Mẹ bỉm, Admin | Trạng thái từng mốc phát triển của từng bé. |
| `baby_feeding_schedule` | Mẹ bỉm, Admin | Lịch ăn, lịch sữa, ăn dặm và trạng thái hoàn thành của từng bé. |
| `brands` | Khách, Mẹ bỉm, Admin | Nhãn hàng/thương hiệu sản phẩm Bách Hóa. |
| `product_categories` | Khách, Mẹ bỉm, Admin | Danh mục Bách Hóa dạng cây cha/con. |
| `products` | Khách, Mẹ bỉm, Admin | Toàn bộ sản phẩm Bách Hóa: sữa, máy hút sữa, kem chống rạn, bình sữa, bỉm tã... |
| `milk_products` | Khách, Mẹ bỉm, Admin | Dữ liệu dinh dưỡng mở rộng cho sản phẩm sữa, dùng cho AI gợi ý. |
| `c2c_listings` | Khách, Mẹ bỉm, Admin | Tin pass đồ Chợ Mẹ & Bé C2C; MVP mới cho phép gửi form không cần đăng nhập, Admin duyệt rồi mới public. |
| `c2c_orders` | Khách, Mẹ bỉm, Admin | Đơn đặt mua C2C theo số lượng, thanh toán thường (MoMo/VNPay mock hoặc COD), thay cho Escrow trong luồng chính. |
| `escrow_transactions` | Mẹ bỉm, Admin | Giao dịch giữ tiền giữa người mua và người bán; hướng phát triển tương lai, chưa thuộc MVP hiện tại. |
| `bs_nhi` | Khách, Mẹ bỉm, Admin | Hồ sơ bác sĩ nhi đối tác; public chỉ xem bác sĩ đã xác minh. |
| `consult_requests` | Mẹ bỉm, Admin | Yêu cầu tư vấn bác sĩ; admin nhận và chuyển tiếp cho bác sĩ đối tác. |
| `partners` | Khách, Mẹ bỉm, Admin | Hồ sơ đối tác không phải bác sĩ nhi: bệnh viện, bảo hiểm, thiết bị, phục hồi, dịch vụ. |
| `partner_services` | Khách, Mẹ bỉm, Admin | Gói/dịch vụ thuộc từng đối tác. |
| `partner_bookings` | Khách, Mẹ bỉm, Admin | Lead/liên hệ/đặt lịch đối tác; MVP cho phép khách không đăng nhập, SữaEmbe/Admin xử lý trung gian. |
| `article_categories` | Khách, Mẹ bỉm, Admin | Chuyên mục tin tức/học viện. |
| `articles` | Khách, Mẹ bỉm, Admin | Tin tức, blog và học viện làm mẹ. |
| `media_assets` | Khách, Mẹ bỉm, Admin | Metadata ảnh/file upload. Upload và dọn ảnh khi thay/gỡ đã có; chưa có màn quản trị media độc lập. |

## 3. Use Case Tổng Quan

| Mã | Use case | Actor chính | Bảng liên quan |
|---|---|---|---|
| UC-01 | Đăng ký / đăng nhập | Mẹ bỉm, Admin | `auth.users`, `users`, `device_tokens` |
| UC-02 | Quản lý hồ sơ cá nhân | Mẹ bỉm | `users`, `media_assets` |
| UC-03 | Quản lý hồ sơ bé | Mẹ bỉm | `babies` |
| UC-04 | Cập nhật chỉ số và đánh giá tăng trưởng WHO | Mẹ bỉm | `babies`, `baby_measurements`, `who_growth_standards` |
| UC-05 | Theo dõi mốc phát triển của bé | Mẹ bỉm | `development_milestones`, `baby_milestone_records` |
| UC-06 | Quản lý lịch ăn/sữa/ăn dặm | Mẹ bỉm | `baby_feeding_schedule`, `notifications` |
| UC-07 | Xem Bách Hóa và sản phẩm | Khách, Mẹ bỉm | `brands`, `product_categories`, `products`, `milk_products`, `media_assets` |
| UC-08 | AI gợi ý sữa | Khách, Mẹ bỉm | `babies`, `baby_measurements`, `products`, `milk_products` |
| UC-09 | Xem tin chợ C2C | Khách, Mẹ bỉm | `c2c_listings`, `media_assets` |
| UC-10 | Gửi form pass đồ C2C | Khách, Mẹ bỉm | `c2c_listings`, `media_assets` |
| UC-11 | Admin xử lý và duyệt tin C2C | Admin | `c2c_listings`, `media_assets`, `notifications` |
| UC-12 | Đặt mua C2C thanh toán thường | Khách, Mẹ bỉm | `c2c_listings`, `c2c_orders`, `notifications` |
| UC-13 | Xử lý escrow / tranh chấp | Admin | `escrow_transactions`, `notifications` - hướng phát triển tương lai |
| UC-14 | Xem danh sách bác sĩ nhi | Khách, Mẹ bỉm | `bs_nhi`, `media_assets` |
| UC-15 | Gửi yêu cầu tư vấn bác sĩ | Mẹ bỉm | `consult_requests`, `bs_nhi`, `notifications` |
| UC-16 | Admin chuyển tiếp tư vấn và cập nhật câu trả lời | Admin | `consult_requests`, `bs_nhi`, `notifications` |
| UC-17 | Xem đối tác và gói/dịch vụ | Khách, Mẹ bỉm | `partners`, `partner_services`, `partner_bookings`, `media_assets` |
| UC-18 | Đặt lịch đối tác | Khách, Mẹ bỉm | `partners`, `partner_services`, `partner_bookings`, `notifications` |
| UC-19 | Quản lý đối tác, gói dịch vụ và booking | Admin | `partners`, `partner_services`, `partner_bookings`, `notifications` |
| UC-20 | Đọc tin tức / học viện | Khách, Mẹ bỉm | `article_categories`, `articles`, `media_assets` |
| UC-21 | Quản lý chuyên mục và bài viết | Admin | `article_categories`, `articles`, `media_assets` |
| UC-22 | Quản lý bác sĩ nhi đối tác | Admin | `bs_nhi`, `media_assets` |
| UC-23 | Quản lý nhãn hàng, danh mục và sản phẩm | Admin | `brands`, `product_categories`, `products`, `milk_products`, `media_assets` |
| UC-24 | Quản lý dữ liệu chuẩn WHO và mốc phát triển | Admin | `who_growth_standards`, `development_milestones` |
| UC-25 | Quản lý thông báo và thiết bị nhận push | Mẹ bỉm, Admin | `device_tokens`, `notifications` |
| UC-26 | Quản lý media upload | Mẹ bỉm, Admin | `media_assets` |
| UC-27 | Quản lý người dùng | Admin | `users` |
| UC-28 | Quản lý tin đăng của tôi (Chợ C2C) | Mẹ bỉm | `c2c_listings`, `c2c_orders`, `media_assets` |
| UC-29 | Quản lý đơn hàng của tôi (Chợ C2C) | Mẹ bỉm | `c2c_orders`, `c2c_listings` |
| UC-30 | Thông báo trạng thái đơn hàng cho khách vãng lai — *định hướng, chưa triển khai* | Khách | `c2c_orders` |

## 4. Use Case Chi Tiết

### UC-01 - Đăng Ký / Đăng Nhập

**Actor:** Mẹ bỉm, Admin

**Trạng thái:** Đã triển khai — modal đăng nhập/đăng ký trên trang chủ, bảo vệ `/admin` qua middleware.

**Bảng:** `auth.users`, `users`, `device_tokens`

**Luồng chính:**

1. Người dùng nhập email/số điện thoại và mật khẩu.
2. Hệ thống tạo tài khoản trong Supabase Auth.
3. Hệ thống tạo hồ sơ mở rộng trong `public.users`.
4. Mặc định role là `user`.
5. Khi app/mobile có token FCM, frontend gửi token lên server để lưu vào `device_tokens`.

**Quy tắc:**

**Fallback khi không có ứng viên:** nếu bộ lọc tuổi và ngân sách không trả về sản phẩm, backend lấy tối đa 3 sản phẩm sữa `active` có rating cao để hiển thị tham khảo, trả `fallback: true` và không gọi Claude. Chỉ trả `results: []` khi danh mục không còn sản phẩm sữa `active`.

- Client không được tự gán role `admin`.
- `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng ở server.
- `device_tokens` gắn theo `user_id`, có thể tắt bằng `enabled = false` khi user logout hoặc thu hồi quyền nhận push.

### UC-02 - Quản Lý Hồ Sơ Cá Nhân

**Actor:** Mẹ bỉm

**Trạng thái:** Đã triển khai — trang `/tai-khoan`.

**Bảng:** `users`, `media_assets`

**Luồng chính:**

1. Mẹ bỉm đăng nhập và mở trang hồ sơ cá nhân.
2. Cập nhật họ tên, số điện thoại, ảnh đại diện.
3. Nếu có upload ảnh, hệ thống upload file lên Cloudinary và lưu metadata vào `media_assets`.
4. Hệ thống cập nhật `users.avatar_url` hoặc liên kết asset tương ứng.

**Phân quyền:**

- Mẹ bỉm chỉ xem/sửa hồ sơ của chính mình.
- Admin có thể hỗ trợ cập nhật khi cần vận hành.

### UC-03 - Quản Lý Hồ Sơ Bé

**Actor:** Mẹ bỉm

**Trạng thái:** Đã triển khai — trang `/tai-khoan`.

**Bảng:** `babies`

**Luồng chính:**

1. Mẹ bỉm tạo hồ sơ bé.
2. Nhập tên, giới tính, ngày sinh, cân nặng, chiều cao, vòng đầu và giai đoạn sữa hiện tại.
3. Hệ thống lưu `user_id = auth.uid()`.
4. Mẹ bỉm có thể cập nhật hồ sơ bé theo thời gian.

**Phân quyền:**

- Mẹ bỉm chỉ quản lý hồ sơ bé của mình.
- Admin có quyền hỗ trợ/xử lý khi cần.

### UC-04 - Cập Nhật Chỉ Số Và Đánh Giá Tăng Trưởng WHO

**Actor:** Mẹ bỉm

**Trạng thái:** Đã triển khai — tab thứ 3 "📊 Nhật ký Dinh dưỡng Bé" trong `/tin-tuc?tab=nhatky`, khớp đúng bố cục demo `suaembe.html` (3 tab trong cùng `#pg-tintuc`). Khác 2 tab còn lại (đọc công khai, UC-20), tab này yêu cầu đăng nhập — khách vãng lai thấy lời mời đăng nhập thay vì nội dung riêng tư của bé. Route cũ `/nhat-ky-be` giữ lại dạng redirect sang tab này.

**Bảng:** `babies`, `baby_measurements`, `who_growth_standards`

**Luồng chính:**

1. Mẹ bỉm bấm "Cập nhật thông số" trong hồ sơ bé.
2. Nhập cân nặng, chiều cao, vòng đầu và ngày đo.
3. Backend tính tuổi bé tại thời điểm đo dựa trên `babies.birth_date`.
4. Backend lấy chuẩn tương ứng trong `who_growth_standards` theo `gender`, `indicator`, `age_months`, `version`.
5. Backend tính percentile/z-score cho từng chỉ số.
6. Hệ thống lưu một dòng mới trong `baby_measurements`.
7. Frontend hiển thị biểu đồ phát triển và nhận định như: bình thường, cần theo dõi, thấp/cao hơn ngưỡng tham chiếu.

**Quy tắc:**

- `who_growth_standards` là dữ liệu chuẩn seed mặc định trong dự án vì ít thay đổi.
- `baby_measurements` là dữ liệu riêng của từng bé.
- Kết quả đánh giá dựa trên dữ liệu WHO, giới tính, tháng tuổi và chỉ số đo thực tế.
- Nội dung đánh giá chỉ mang tính tham khảo, không thay thế tư vấn y khoa.

**Ghi chú triển khai:**

- **Fallback Top 3:** nhánh không có ứng viên khớp tiêu chí không gọi Claude, lấy 3 sản phẩm sữa `active` có rating cao và hiển thị nhãn `Tham khảo`; `match_percent` được đặt 0 để không tạo điểm phù hợp giả, `model_version` là `fallback-top-rated`.

- `who_growth_standards` seed đủ 3 chỉ số (`weight_for_age`, `length_height_for_age`, `head_circumference_for_age`) × 2 giới tính × 25 mốc tháng tuổi (0–24 tháng) = 150 dòng, tham số L/M/S lấy nguyên văn từ WHO Child Growth Standards (2006) qua bản phân phối lại chính thức của CDC (`ftp.cdc.gov/pub/Health_Statistics/NCHS/growthcharts/WHO-*.csv`) — không tự ước lượng/bịa số liệu y tế.
- Percentile/z-score tính bằng đúng phương pháp LMS chính thức của WHO (`src/lib/growth/percentile.ts`: `lmsZScore` + xấp xỉ hàm phân phối chuẩn tắc Abramowitz–Stegun để ra percentile), tra `who_growth_standards` theo tháng tuổi **gần nhất** với tuổi đo thực tế (không nội suy tuyến tính giữa 2 mốc — đơn giản hơn, sai số không đáng kể ở quy mô tính năng tham khảo này).
- `gender = 'other'` chưa có bảng chuẩn WHO riêng — tạm dùng bảng `male` làm tham chiếu gần đúng, ghi rõ trong `assessment` đây chỉ là ước lượng.
- Cột `who_growth_standards.version` mặc định là `'WHO-2006'` (không phải `'default'`) — code tra cứu phải lọc đúng giá trị này.
- Ngưỡng diễn giải percentile: <3 hoặc >97 = "Thấp/Cao hơn ngưỡng tham chiếu"; 3–15 hoặc 85–97 = "Cần theo dõi thêm"; 15–85 = "Bình thường" — hiển thị kèm disclaimer không thay thế chẩn đoán bác sĩ.
- Mỗi lần lưu số đo mới, `babies.weight_g`/`height_cm`/`head_cm` cũng được đồng bộ theo số đo mới nhất (chỉ field nào có nhập).

### UC-05 - Theo Dõi Mốc Phát Triển Của Bé

**Actor:** Mẹ bỉm

**Trạng thái:** Đã triển khai — trong tab "📊 Nhật ký Dinh dưỡng Bé" của `/tin-tuc?tab=nhatky` (xem UC-04).

**Bảng:** `development_milestones`, `baby_milestone_records`

**Luồng chính:**

1. Hệ thống xác định tháng tuổi của bé từ `birth_date`.
2. Frontend lấy danh sách mốc phù hợp từ `development_milestones`.
3. Mẹ bỉm đánh dấu trạng thái từng mốc: đã đạt, đang phát triển, chưa quan sát, chậm.
4. Hệ thống lưu trạng thái vào `baby_milestone_records`.
5. Frontend hiển thị checklist mốc phát triển theo tháng tuổi.

**Quy tắc:**

- `development_milestones` là dữ liệu chuẩn seed mặc định.
- `baby_milestone_records` là dữ liệu riêng của từng bé.
- Khi một mốc quá `expected_to_month` nhưng vẫn chưa đạt, hệ thống có thể gợi ý mẹ bỉm theo dõi thêm hoặc hỏi bác sĩ.

**Ghi chú triển khai:**

- Seed 99 mốc phát triển, 8 mốc tháng tuổi (2, 4, 6, 9, 12, 15, 18, 24), dịch từ checklist chính thức CDC "Learn the Signs. Act Early." (bản sửa đổi 2022), nhóm theo 4 nhóm kỹ năng chuẩn: Xã hội & Cảm xúc, Ngôn ngữ & Giao tiếp, Nhận thức, Vận động & Thể chất.
- Trang chỉ hiển thị đúng 1 mốc tháng tuổi — mốc lớn nhất còn ≤ tuổi hiện tại của bé (làm tròn xuống tháng nguyên) — thay vì liệt kê hết mọi mốc từ sơ sinh tới hiện tại, khớp đúng cách demo `suaembe.html` chỉ hiện "Cột mốc phát triển N tháng".
- `PUT /api/babies/:id/milestones/:milestoneId` dùng upsert theo unique `(baby_id, milestone_id)` — đánh dấu lại 1 mốc chỉ cập nhật dòng cũ, không tạo trùng.

### UC-06 - Quản Lý Lịch Ăn/Sữa/Ăn Dặm

**Actor:** Mẹ bỉm

**Trạng thái:** Đã triển khai đầy đủ 6 bước — CRUD lịch ăn (bước 1-3, 6) trong tab "📊 Nhật ký Dinh dưỡng Bé" của `/tin-tuc?tab=nhatky` (xem UC-04), **cộng nhắc lịch qua Firebase FCM (bước 4-5)**. Xem "Ghi chú triển khai — Push Notification Firebase FCM" ở cuối UC-25 cho chi tiết cơ chế dùng chung với UC-16.

**Bảng:** `baby_feeding_schedule`, `notifications`, `device_tokens`

**Luồng chính:**

1. Mẹ bỉm tạo lịch ăn hoặc lịch sữa cho bé.
2. Nhập ngày, giờ, loại bữa, tên bữa, mô tả và lượng sữa nếu có.
3. Hệ thống lưu vào `baby_feeding_schedule` với `status = 'pending'`.
4. Nếu có giờ cụ thể (`scheduled_time`), backend tạo thông báo trong `notifications` (`type='feeding_reminder', channel='push', scheduled_at` = ngày+giờ đã nhập). Sửa giờ thì cập nhật lại `scheduled_at` của đúng thông báo đó (không tạo trùng); đánh dấu `done/skipped/cancelled` hoặc xoá lịch thì huỷ thông báo (nếu đang `pending`).
5. Khi đến giờ, job nền `POST/GET /api/cron/dispatch-notifications` gửi push qua Firebase FCM tới các `device_tokens` đang bật của mẹ bỉm.
6. Mẹ bỉm đánh dấu bữa ăn là `done`, `skipped` hoặc `cancelled`.

**Quy tắc:**

- Lịch ăn gắn theo `baby_id`, không gắn trực tiếp theo user.
- RLS kiểm tra quyền sở hữu thông qua bảng `babies`.
- Lịch không nhập giờ (`scheduled_time = null`) thì không có gì để nhắc — không tạo thông báo.
- Việc tạo/huỷ thông báo không chặn request tạo/sửa/xoá lịch ăn — nếu bước ghi `notifications` lỗi, lịch ăn vẫn được lưu bình thường, chỉ log lỗi phía server.

### UC-07 - Xem Bách Hóa Và Sản Phẩm

**Actor:** Khách truy cập, Mẹ bỉm

**Trạng thái:** Đã triển khai — trang `/bach-hoa`.

**Bảng:** `brands`, `product_categories`, `products`, `milk_products`, `media_assets`

**Mô hình kinh doanh (đã chốt với techlead):** Bách Hóa đi theo hướng **Affiliate** — SuaEmbe không bán trực tiếp, chỉ hiển thị sản phẩm. Bấm "Mua ngay" thì redirect ra trang bán thật của đối tác (VD: Shopee, Tiki) kèm link affiliate, đọc từ `products.outbound_url`. Không có giỏ hàng/thanh toán/đơn hàng nào xử lý trên SuaEmbe cho luồng Bách Hóa.

**Luồng chính:**

1. Người dùng mở khu Bách Hóa.
2. Hệ thống hiển thị danh mục từ `product_categories`.
3. Người dùng lọc theo danh mục, nhãn hàng, giá, tags hoặc thuộc tính sản phẩm.
4. Hệ thống hiển thị sản phẩm từ `products`.
5. Ảnh sản phẩm được quản lý bởi `media_assets` hoặc danh sách `products.image_urls`.
6. Nếu sản phẩm là sữa, hệ thống đọc thêm dữ liệu dinh dưỡng từ `milk_products`.
7. Người dùng mở chi tiết sản phẩm; nếu `products.outbound_url` có giá trị, hệ thống hiển thị nút "Mua ngay" mở link đó ở tab mới (`target="_blank"`) — dẫn thẳng sang trang bán của đối tác. Nếu `outbound_url` rỗng, sản phẩm chỉ hiển thị thông tin tham khảo, không có CTA mua hàng.

**Quy tắc mô hình dữ liệu:**

- Nhãn hàng đưa vào `brands`.
- Danh mục Bách Hóa đưa vào `product_categories`.
- Tất cả sản phẩm đưa vào `products`.
- Sản phẩm sữa có thêm bản ghi trong `milk_products`.
- Các sản phẩm như máy hút sữa, kem chống rạn, bình sữa, bỉm tã lưu thông số riêng trong `products.attributes`.
- `products.outbound_url` lưu link affiliate; admin nhập/sửa qua UC-23 (Quản Lý Nhãn Hàng, Danh Mục Và Sản Phẩm).

### UC-08 - AI Gợi Ý Sữa

**Actor:** Khách truy cập, Mẹ bỉm

**Trạng thái:** Đã triển khai — `POST /api/ai/suggest-milk` (public, có rate limit theo IP) + trang `/cong-cu-cho-me` (component `AiSuggestMilkPanel`). Xem "Ghi chú triển khai" cuối mục này.

**Quyết định sản phẩm:** Mở công cụ này cho **cả người chưa đăng nhập**, không giới hạn riêng Mẹ bỉm — mục tiêu là giảm rào cản dùng thử để kích thích mua sắm (dẫn traffic sang Bách Hóa). Vì vậy `POST /api/ai/suggest-milk` chuyển sang nhóm **Public API** (xem mục 6), không bắt buộc JWT.

**Bảng:** `babies`, `brands`, `products`, `milk_products` (và `milk_suggestions` nếu sau này triển khai lưu lịch sử gợi ý — hiện chưa có trong schema lõi, xem mục "Bảng đề xuất mở rộng" trong `database.md`). `baby_measurements` không được API hiện tại tự truy vấn cho UC-08.

**Luồng chính:**

1. Người dùng nhập tay: tuổi, cân nặng, tình trạng (bình thường/biếng ăn/táo bón/hay ốm/sinh non), ngân sách, ưu tiên (DHA/tiêu hoá/chiều cao/sức đề kháng/ít đường/hữu cơ). Riêng **Mẹ bỉm đã đăng nhập** có thêm lựa chọn "chọn bé đã có hồ sơ" thay vì nhập tay.
2. Nếu Mẹ bỉm chọn bé có sẵn, frontend điền sẵn tuổi từ `babies.birth_date` và cân nặng hiện tại từ `babies.weight_g`, có thể chỉnh lại. `baby_id` chỉ được backend kiểm tra quyền sở hữu và dùng để hiển thị tên bé; API AI hiện không tự lấy bản ghi đo gần nhất từ `baby_measurements`. Khách chưa đăng nhập không có bước này (không sở hữu `babies`), luôn nhập tay toàn bộ.
3. Frontend gửi `POST /api/ai/suggest-milk` kèm toàn bộ tiêu chí (và `baby_id` nếu có, chỉ hợp lệ khi đã đăng nhập và `babies.user_id = auth.uid()`).
4. **Backend lọc ứng viên thật bằng SQL trước khi gọi AI** (retrieval, chưa dùng AI ở bước này): join `products` với `milk_products` và `brands`, điều kiện `p.status = 'active'`, `mp.age_min_months <= tuổi <= mp.age_max_months`, giá nằm trong ngân sách — lấy khoảng 10–15 sản phẩm, sắp theo `mp.rating`.
5. Backend build prompt gồm tiêu chí của mẹ bỉm + danh sách ứng viên vừa lọc (chỉ gửi field liên quan: brand, tên, giá, stage, key_ingredients, nutrition_tags, rating), yêu cầu rõ AI **chỉ được chọn trong danh sách đã gửi**.
6. Backend gọi Claude API server-side, đọc model từ `CLAUDE_MODEL` và có fallback trong route; dùng tool use/structured schema để ép Claude trả về đúng định dạng JSON. Model ID thật phải được kiểm tra lại trong môi trường deploy trước khi test end-to-end.
7. Claude phân tích và trả về Top 3 gồm `product_id`, `match_percent`, `matched_priorities`, `reason` cho từng sản phẩm.
8. Backend **validate**: mọi `product_id` Claude trả về phải nằm trong tập ứng viên đã gửi ở bước 4 — nếu có id lạ (hallucination), loại bỏ dòng đó; route hiện không tự retry, không hiển thị sản phẩm không xác định được nguồn.
9. Backend **enrich lại dữ liệu hiển thị** (tên, ảnh, giá) bằng cách query lại `products`/`milk_products` theo `product_id`, không lấy theo nội dung Claude tự viết — đảm bảo giá/ảnh luôn đúng tại thời điểm trả kết quả.
10. Hệ thống trả về Top sản phẩm phù hợp, phần trăm phù hợp, lý do và `disclaimer` tham khảo.
11. Frontend hiển thị kết quả dạng card xếp hạng (rank, brand, tên, ảnh, giá, % match, lý do, tag ưu tiên đã khớp), kèm `disclaimer` cố định bên dưới. CTA hiện dẫn về `/bach-hoa`; trang này dùng modal phía client, chưa deep-link trực tiếp đến đúng sản phẩm.
12. Nếu người dùng chưa đăng nhập, có thể hiện thêm gợi ý "Đăng nhập để lưu kết quả / theo dõi hồ sơ bé" nhằm chuyển đổi Khách thành Mẹ bỉm có tài khoản (không bắt buộc, không chặn xem kết quả).

**Định dạng request/response (tham khảo):**

```json
// Request
POST /api/ai/suggest-milk
{
  "baby_id": "uuid | null",
  "age_months": 7,
  "weight_g": 8000,
  "condition": "tao_bon",
  "budget_min": 300000,
  "budget_max": 500000,
  "priorities": ["tieu_hoa"]
}

// Response
{
  "query_summary": "Bé 7 tháng · 8kg · Hay táo bón · Ngân sách 300–500K",
  "results": [
    {
      "rank": 1,
      "product_id": "uuid-nằm-trong-tập-ứng-viên-đã-lọc",
      "brand": "Aptamil",
      "name": "Pronutra Advance 2",
      "price_vnd": 480000,
      "image_url": "...",
      "match_percent": 96,
      "matched_priorities": ["Hỗ trợ tiêu hoá"],
      "reason": "..."
    }
  ],
  "disclaimer": "Gợi ý dựa trên dữ liệu thành phần công khai, không thay thế tư vấn của bác sĩ Nhi khoa.",
  "model_version": "configured Claude model",
  "generated_at": "2026-08-19T..."
}
```

**Quy tắc:**

- AI chỉ là gợi ý tham khảo, luôn hiển thị kèm `disclaimer` ở frontend.
- AI chỉ được chọn trong danh sách ứng viên đã lọc sẵn từ DB (bước 4), không được tự sinh sản phẩm ngoài danh sách — backend bắt buộc validate `product_id` trước khi trả về frontend (bước 8).
- API key AI không được đưa xuống client, mọi lời gọi AI chạy server-side.
- Dữ liệu hiển thị (tên/ảnh/giá) luôn lấy lại từ DB tại thời điểm trả response, không tin tưởng tuyệt đối nội dung do AI tự viết ra.
- `babies`/`baby_measurements` vẫn giữ nguyên RLS riêng tư theo `auth.uid()` — mở public cho UC-08 chỉ áp dụng cho chính API gợi ý sữa, không nới lỏng quyền đọc hồ sơ bé của người khác.

**Ghi chú triển khai:**

- **Model:** route đọc từ `process.env.CLAUDE_MODEL`, fallback cứng về `claude-opus-5` nếu biến môi trường trống. Giá trị model trong `.env` và môi trường deploy phải là model ID hợp lệ của tài khoản Anthropic; không ghi API key vào tài liệu hoặc repository.
- **Rate limit:** đã trả lời câu hỏi "cần techlead xác nhận thêm" ở bản nháp trước — dùng **Upstash Redis (REST API qua `fetch`, không thêm SDK mới)** với cửa sổ cố định **15 request/giờ/IP** (`src/lib/ai/rate-limit.ts`), vượt ngưỡng trả `429`. Nếu thiếu `REDIS_URL`/`REDIS_TOKEN` thì fail-open (cho qua) thay vì chặn cứng toàn bộ tính năng do lỗi hạ tầng phụ.
- **Retrieval trước khi gọi AI:** lọc SQL thật (`products` join `milk_products`, `status = 'active'`, tuổi trong khoảng, giá trong ngân sách, `order by milk_products.rating desc`, `limit 15`). Nếu 0 ứng viên, backend không gọi Claude mà lấy tối đa 3 sản phẩm sữa `active` có rating cao để hiển thị tham khảo (`fallback: true`); chỉ trả `results: []` khi catalog không còn sản phẩm sữa `active`.
- **Guard API key:** nếu thiếu `ANTHROPIC_API_KEY` hoặc gặp giá trị placeholder mà route nhận diện, API trả `503` thay vì gọi AI. Luồng validate input, retrieval, rate limit và guard đã có testcase; lời gọi Claude thật và chất lượng gợi ý vẫn cần techlead/QA xác nhận trong môi trường có key và model ID hợp lệ.
- CTA "Xem tại Bách Hoá" ở bước 11 hiện trỏ chung về `/bach-hoa` (chưa deep-link thẳng vào đúng sản phẩm) vì trang Bách Hoá dùng modal chi tiết sản phẩm phía client, chưa hỗ trợ mở theo query param — có thể bổ sung sau nếu cần.
- 2 công cụ còn lại trong `/cong-cu-cho-me` (Tính ngày dự sinh, Cẩm nang sinh con) giữ đúng quyết định đã chốt ở `database.md` §3.1: hoàn toàn client-side, không bảng/API riêng.

### UC-09 - Xem Tin Chợ C2C

**Actor:** Khách truy cập, Mẹ bỉm

**Trạng thái:** Đã triển khai — trang `/cho-me-be`.

**Bảng:** `c2c_listings`, `media_assets`

**Luồng chính:**

1. Người dùng mở Chợ Mẹ & Bé.
2. Hệ thống hiển thị các tin có `status = 'approved'`.
3. Người dùng lọc theo danh mục, tỉnh thành, giá.
4. Ảnh listing được lấy từ `c2c_listings.image_urls` hoặc `media_assets`.
5. Mẹ bỉm đăng nhập có thể xem thêm tin của chính mình.

### UC-10 - Gửi Form Pass Đồ C2C

**Actor:** Khách truy cập, Mẹ bỉm

**Trạng thái:** Đã triển khai — form đăng tin trên `/cho-me-be`, không cần đăng nhập.

**Mục tiêu MVP:** Làm luồng đơn giản nhất, giống Google Form. SữaEmbe/Admin đóng vai trò trung gian nhận thông tin, kiểm tra và đăng tin.

**Bảng:** `c2c_listings`, `media_assets`

**Luồng chính:**

1. Người cần pass đồ vào website.
2. Không bắt buộc đăng nhập.
3. Người bán điền form đăng tin:
   - tên sản phẩm
   - danh mục
   - tình trạng
   - giá bán
   - số lượng có thể bán/pass
   - tỉnh/thành
   - mô tả
   - ảnh sản phẩm
   - thông tin liên hệ người bán
4. Người bán bấm gửi thông tin.
5. Hệ thống tạo tin ở trạng thái chờ Admin xử lý.
6. Hệ thống gửi thông tin về admin panel hoặc email nội bộ cho Admin.

**Quy tắc MVP:**

- Người bán/pass đồ không cần có tài khoản.
- Tin chưa hiển thị công khai ngay sau khi gửi form.
- SữaEmbe/Admin là bên trung gian chuẩn hóa nội dung trước khi đăng.
- Không xử lý Escrow trong MVP hiện tại.
- Trường `delivery_method`, `escrow_enabled` nếu còn trong schema/UI hiện tại được xem là dư âm của hướng cũ hoặc future scope, chưa phải luồng chính MVP.

### UC-11 - Admin Xử Lý Và Duyệt Tin C2C

**Actor:** Admin

**Trạng thái:** Đã triển khai — mục admin "Tin chợ C2C" (danh sách, lọc theo status/danh mục/tỉnh thành, sửa nội dung, duyệt/ẩn).

**Bảng:** `c2c_listings`, `media_assets`, `notifications`

**Luồng chính:**

1. Admin mở danh sách tin do người bán/pass đồ gửi lên.
2. Admin xem nội dung, ảnh, giá, số lượng và thông tin liên hệ người bán.
3. Admin chỉnh sửa/chuẩn hóa tiêu đề, danh mục, mô tả, ảnh, giá hoặc số lượng nếu cần.
4. Nếu tin hợp lệ, Admin đổi `status` thành `approved`.
5. Tin được hiển thị công khai trên Chợ Mẹ & Bé.
6. Nếu tin không hợp lệ, Admin đổi `status` thành `hidden` hoặc giữ ở trạng thái chờ xử lý.
7. Nếu có thông tin liên hệ, Admin có thể thông báo lại cho người bán về kết quả xử lý.

**Quy tắc MVP:**

- Admin là người chịu trách nhiệm đưa tin lên public (duyệt/ẩn, sửa nội dung để chuẩn hoá).
- Người bán có tài khoản cũng tự xem/sửa được tin của chính mình qua UC-28 (Quản Lý Tin Đăng Của Tôi) — không mâu thuẫn với vai trò trung gian của Admin, chỉ là thêm 1 kênh tự quản lý cho người bán đã đăng nhập; người bán khách vãng lai (không tài khoản) vẫn hoàn toàn phụ thuộc Admin.
- Khi có người mua một phần số lượng trong tin, Admin cập nhật lại số lượng còn lại hoặc ẩn tin nếu hết hàng.

### UC-12 - Đặt Mua C2C Thanh Toán Thường

**Actor:** Khách truy cập, Mẹ bỉm

**Trạng thái:** Đã triển khai — đặt mua từ popup chi tiết tin trên `/cho-me-be`, xử lý đơn ở mục admin "Đơn hàng C2C". Thanh toán MoMo/VNPay là MOCK (xem "Quy tắc MVP" bên dưới).

**Bảng:** `c2c_listings`, `c2c_orders`, `notifications`

**Luồng chính MVP:**

1. Người mua xem tin đã `approved`.
2. Người mua bấm "Đặt mua".
3. Người mua chọn số lượng muốn mua.
4. Người mua nhập thông tin nhận hàng.
5. Hệ thống tính tổng tiền:
   - `total_amount = unit_price * quantity`
6. Người mua chọn phương thức thanh toán: MoMo, VNPay hoặc thanh toán khi nhận hàng (COD) — không dùng Escrow.
7. Hệ thống tạo đơn hàng ở trạng thái `pending_admin_review`, `payment_status = pending`.
8. Nếu chọn MoMo/VNPay: hệ thống chuyển sang bước xác nhận thanh toán (**hiện là MOCK — giả lập luôn thành công**, đóng vai trò placeholder cho sandbox test thật sẽ tích hợp sau). Xác nhận xong thì `payment_status = paid`. Nếu chọn COD thì bỏ qua bước này, giữ nguyên `payment_status = pending` tới khi giao hàng.
9. Admin thấy đơn mới trong màn Đơn hàng C2C.
10. Admin xác nhận lại với người bán xem còn đủ số lượng không.
11. Nếu còn đủ hàng:
    - Admin xử lý đơn (chuyển `order_status = confirmed`).
    - Hệ thống tự trừ `quantity_available` của tin; về 0 thì tự chuyển tin sang `sold`.
12. Nếu hết hàng:
    - Admin huỷ đơn (`order_status = cancelled`) hoặc ẩn tin.
13. Nếu chỉ còn một phần:
    - Admin liên hệ người mua để xác nhận lại, cập nhật `admin_note` và số lượng còn lại của tin.

**Quy tắc MVP:**

- Bỏ Escrow khỏi luồng hiện tại (giữ `escrow_transactions` trong schema cho UC-13 — hướng phát triển tương lai, không dùng trong luồng chính).
- Thanh toán thường chỉ dựa trên số lượng mua.
- Đã có schema `c2c_orders` (người mua, thông tin nhận hàng, số lượng, tổng tiền, trạng thái thanh toán, trạng thái xử lý đơn) — **đã triển khai**.
- Bước thanh toán MoMo/VNPay hiện là **MOCK** (`POST /api/orders/:id/mock-pay`, giả lập luôn thành công) — sandbox test thật với cổng thanh toán sẽ tích hợp sau, khi đó endpoint này đổi thành xác minh chữ ký IPN thật từ MoMo/VNPay thay vì tự set `paid`.
- Phí ship/tự động tính vận chuyển chưa chốt, không đưa vào MVP.
- Người mua có tài khoản (Mẹ bỉm) tự tra cứu/quản lý đơn qua UC-29 — xem thêm.
- Khách vãng lai đặt mua xong **không có cách nào tự tra cứu lại** đơn của mình (không có tài khoản để đối chiếu) — xem UC-30 (định hướng, chưa triển khai).

### UC-13 - Xử Lý Escrow / Tranh Chấp

**Actor:** Admin

**Bảng:** `escrow_transactions`, `notifications`

**Trạng thái:** Hướng phát triển tương lai, không thuộc MVP hiện tại.

**Luồng chính:**

1. Admin xem danh sách giao dịch escrow.
2. Kiểm tra trạng thái thanh toán, mã tham chiếu và phản ánh của người mua/người bán.
3. Admin cập nhật trạng thái `released`, `refunded` hoặc `disputed`.
4. Hệ thống tạo thông báo cho các bên liên quan.

### UC-14 - Xem Danh Sách Bác Sĩ Nhi

**Actor:** Khách truy cập, Mẹ bỉm

**Trạng thái:** Đã triển khai — trang public `/doi-tac` có tab Tư vấn bác sĩ, chỉ hiển thị hồ sơ `verified = true`; API đọc công khai là `GET /api/bs-nhi`. UC-22 (Admin quản lý bác sĩ) cung cấp dữ liệu nguồn.

**Bảng:** `bs_nhi`, `media_assets`, `partner_bookings`

**Luồng chính:**

1. Người dùng mở tab Tư vấn bác sĩ.
2. Hệ thống hiển thị bác sĩ có `verified = true`.
3. Người dùng xem chuyên khoa, bệnh viện, kinh nghiệm, rating, thời gian phản hồi và avatar.
4. Người dùng có thể bấm "Xem chi tiết & Liên hệ", xem hồ sơ chi tiết và gửi họ tên, số điện thoại, email, ghi chú cho SữaEmbe.
5. Hệ thống lưu lead vào `partner_bookings` với `bs_id`, `request_type = 'doctor_lead'`, `status = 'pending'` để Admin tiếp nhận.

**Lưu ý phân quyền:**

- Bác sĩ nhi không đăng nhập vào hệ thống ở giai đoạn hiện tại.
- Admin là người quản lý hồ sơ bác sĩ.
- Khách và mẹ bỉm đều xem được danh sách bác sĩ đã xác minh; chỉ mẹ bỉm đã đăng nhập mới gửi được yêu cầu tư vấn.
- Form liên hệ bác sĩ là lead trung gian, khách chưa đăng nhập vẫn có thể gửi; Admin xử lý tại tab Lead & Booking.

### UC-15 - Gửi Yêu Cầu Tư Vấn Bác Sĩ

**Actor:** Mẹ bỉm

**Trạng thái:** Đã triển khai — form "Hỏi ngay" trên `/doi-tac` gọi `POST /api/consult`; mẹ bỉm xem lại yêu cầu và câu trả lời trong `/tai-khoan`.

**Bảng:** `consult_requests`, `bs_nhi`, `notifications`

**Luồng chính:**

1. Mẹ bỉm bấm "Hỏi ngay" trên một thẻ bác sĩ cụ thể.
2. Hệ thống mở form nhập `question` và `baby_age_months`.
3. Mẹ bỉm gửi form.
4. Hệ thống tạo dòng `consult_requests` gồm `user_id`, `bs_id`, `question`, `baby_age_months`, `status = 'pending'`.
5. Yêu cầu xuất hiện trong admin panel để Admin tiếp nhận và chuyển tiếp phía sau.

**Phân quyền:**

- Mẹ bỉm chỉ tạo và xem yêu cầu tư vấn của mình.
- Mẹ bỉm không được tự cập nhật `answer`, `forwarded_at`, `forwarded_by`, `internal_note`.

### UC-16 - Admin Chuyển Tiếp Tư Vấn Và Cập Nhật Câu Trả Lời

**Actor:** Admin

**Trạng thái:** Đã triển khai — Admin xử lý tại `/admin`, mục "Tư vấn BS", qua các API forward/answer.

**Bảng:** `consult_requests`, `bs_nhi`, `notifications`

**Luồng chính:**

1. Admin mở danh sách yêu cầu tư vấn `pending` tại mục "Tư vấn BS".
2. Admin xem câu hỏi, tuổi bé và bác sĩ được chọn.
3. Admin chuyển tiếp yêu cầu phía sau cho bác sĩ đối tác.
4. Admin cập nhật `forwarded_at`, `forwarded_by`, `internal_note`.
5. Khi nhận câu trả lời từ bác sĩ đối tác, admin cập nhật `answer`, `answered_at`, `status = 'answered'`.
6. Hệ thống tạo thông báo `notifications` trong app cho mẹ bỉm (đẩy qua Firebase FCM — xem UC-25).

**Quy tắc:**

- Không có endpoint cho bác sĩ đăng nhập trả lời trực tiếp trong giai đoạn hiện tại.
- Nếu sau này thêm portal bác sĩ, cần thay đổi role, RLS và API riêng.

**Thông báo cho Admin (số lượng chờ xử lý):** `GET /api/admin/stats` trả thêm field `consults_pending` (đếm `consult_requests.status = 'pending'` — bao gồm cả yêu cầu mới lẫn đã forward nhưng chưa trả lời, vì forward không đổi `status`). Hiển thị ở 2 nơi trong `AdminShell.tsx`: (1) badge số dạng chấm tròn hồng cạnh mục "Tư vấn BS" trên sidebar, chỉ hiện khi > 0; (2) dòng "Yêu cầu tư vấn BS chờ xử lý" trong panel "⏳ Cần xử lý" ở Dashboard (thay cho dòng "BS Nhi chờ xác minh" trước đây — dữ liệu `bs_nhi_pending_verification` vẫn được tính trong API, chỉ không còn hiển thị ở panel này). Stats được fetch 1 lần ở `AdminShell` (không phải trong `DashboardSection`) để sidebar và Dashboard dùng chung, tránh gọi API 2 lần.

### UC-17 - Xem Đối Tác Và Gói/Dịch Vụ

**Actor:** Khách truy cập, Mẹ bỉm

**Trạng thái:** Đã triển khai trang public `/doi-tac`: lọc nhóm/tỉnh/thành, tìm kiếm, xem chi tiết đối tác và gói/dịch vụ; form liên hệ/đặt lịch được nối sang UC-18.

**Bảng:** `partners`, `partner_services`, `partner_bookings`, `media_assets`

**Luồng chính:**

1. Người dùng mở trang Đối tác.
2. Hệ thống hiển thị các nhóm đối tác: bệnh viện, bảo hiểm, trang thiết bị, phục hồi sau sinh, dịch vụ mẹ & bé.
3. Người dùng lọc theo `partner_type`, tỉnh/thành hoặc danh mục nhỏ.
4. Hệ thống chỉ hiển thị đối tác đã xác minh/đang hoạt động.
5. Người dùng bấm "Xem chi tiết & Liên hệ".
6. Màn chi tiết hiển thị thông tin đối tác, mô tả, gói/dịch vụ nổi bật trong `partner_services`, giá tham khảo nếu có và thông tin tư vấn/liên hệ của SữaEmbe.
7. Với nhóm bệnh viện, bảo hiểm, trang thiết bị và các đối tác không đặt lịch trực tiếp: người dùng điền form liên hệ.
8. Hệ thống lưu form vào hệ thống nội bộ để Admin/SữaEmbe tư vấn trước, sau đó chuyển tiếp thông tin phù hợp cho đối tác.

**Quy tắc theo xác nhận techlead:**

- Nhóm bệnh viện, bảo hiểm, trang thiết bị không redirect thẳng hoàn toàn như Bách Hóa Affiliate.
- SữaEmbe hiển thị thông tin của mình để tư vấn, nhận form liên hệ và đóng vai trò trung gian chuyển tiếp cho đối tác.
- Người dùng không bắt buộc đăng nhập để gửi form liên hệ.
- MVP chưa cần dashboard riêng cho đối tác, chưa cần thanh toán trong app.

**Quy tắc mô hình dữ liệu:**

- Bác sĩ nhi không nằm trong `partners`; bác sĩ nhi dùng bảng riêng `bs_nhi`.
- Các nhóm bảo hiểm, trang thiết bị, phục hồi, bệnh viện, dịch vụ mẹ & bé dùng chung bảng `partners`.
- Một đối tác có nhiều gói/dịch vụ trong `partner_services`.

### UC-18 - Đặt Lịch Đối Tác

**Actor:** Khách truy cập, Mẹ bỉm

**Trạng thái:** Đã triển khai MVP ở public UI, backend và màn Admin. Khách vãng lai gửi được booking qua `POST /api/partner-bookings`; Admin xem/sửa trạng thái trong UC-19. SMS/email xác nhận hiện chưa gửi thật.

**Bảng:** `partners`, `partner_services`, `partner_bookings`, `notifications`

**Luồng chính:**

1. Người dùng mở tab "Dịch vụ Mẹ & Bé".
2. Hệ thống hiển thị danh sách dịch vụ/gói dịch vụ, giá tham khảo và thông tin cơ bản.
3. Người dùng bấm "Đặt lịch tại nhà", "Xem lịch học" hoặc "Xem chi tiết & Đặt lịch".
4. Người dùng không cần đăng nhập, chỉ nhập form đặt lịch:
   - họ tên
   - số điện thoại
   - email nếu có
   - địa chỉ nếu là dịch vụ tại nhà
   - dịch vụ/gói muốn đặt
   - ngày/giờ mong muốn
   - ghi chú thêm
5. Hệ thống tạo booking trong `partner_bookings` với `status = 'pending'`.
6. Admin/SữaEmbe thấy booking trong admin panel.
7. Admin/SữaEmbe liên hệ lại người dùng và/hoặc đối tác để xác nhận lịch.
8. Khi xác nhận thành công, Admin cập nhật `status = 'confirmed'`.
9. Khi booking chuyển sang `confirmed`, backend ghi `confirmed_at` và `notification_sent_at`, trả về `notification_stub` để báo rằng cần nối provider. SMS/email thật chưa được gọi.
10. Sau đó Admin có thể cập nhật tiếp `status = 'completed'` hoặc `status = 'cancelled'`.

**Quy tắc theo xác nhận techlead:**

- User không cần tài khoản/log in để đặt lịch.
- User chỉ nhập form và chờ SữaEmbe liên hệ.
- Theo yêu cầu techlead, trạng thái `confirmed` sẽ phải gửi thông báo qua SMS hoặc email khi provider được tích hợp; hiện code mới ghi stub, chưa gửi thật.
- MVP chưa xử lý thanh toán trong app và chưa cần tài khoản riêng cho đối tác.
- Schema đã được chỉnh ở migration `20260824000400_partner_bookings_guest_leads.sql`: `partner_bookings.user_id` nullable và có các trường liên hệ `customer_name`, `customer_phone`, `customer_email`, `address`, `note`. Migration `20260824000500_doctor_contact_leads.sql` bổ sung `bs_id` và `request_type = 'doctor_lead'` cho lead bác sĩ.

### UC-19 - Quản Lý Đối Tác, Gói Dịch Vụ Và Booking

**Actor:** Admin

**Trạng thái:** Đã triển khai MVP — có API admin CRUD và màn quản trị `/admin` tab "Đối tác".

**Bảng:** `partners`, `partner_services`, `partner_bookings`, `notifications`

**Luồng chính:**

1. Admin tạo/cập nhật hồ sơ đối tác trong `partners`.
2. Admin phân loại đối tác bằng `partner_type`.
3. Admin tạo/cập nhật gói/dịch vụ trong `partner_services`.
4. Admin xác minh đối tác bằng `verified = true` và bật trạng thái hiển thị.
5. Admin xem danh sách lead/form liên hệ và booking trong `partner_bookings`.
6. Admin tư vấn/liên hệ người dùng trước khi chuyển tiếp cho đối tác.
7. Admin cập nhật trạng thái booking thành `pending`, `confirmed`, `completed` hoặc `cancelled`.
8. Khi trạng thái chuyển sang `confirmed`, backend ghi `confirmed_at`, `notification_sent_at` và trả `notification_stub`; chưa gửi SMS/email thật.
9. Admin theo dõi ghi chú nội bộ và lịch sử xử lý để biết lead/booking đã được chuyển tiếp cho đối tác hay chưa.

**Quy tắc vận hành:**

- SữaEmbe/Admin là bên trung gian xử lý lead/booking.
- Đối tác chưa có tài khoản đăng nhập hoặc dashboard riêng trong MVP.
- Thông báo xác nhận được để ở dạng stub trong MVP; cần tích hợp Resend/SendGrid và/hoặc SMS provider sau khi techlead chốt nhà cung cấp. Khách vãng lai chưa có UI notification trong app.

**Thông báo cho Admin (số lượng chờ xử lý):** `GET /api/admin/stats` trả thêm field `partner_bookings_pending` (đếm `partner_bookings.status = 'pending'`, gồm cả `request_type = 'lead'` lẫn `'booking'`). Hiển thị ở panel "⏳ Cần xử lý" và nút quick-link "🤝 Xử lý Lead & Booking" trong Dashboard (`DashboardSection.tsx`) — bấm vào mở thẳng `/admin` tab "Đối tác" → tab con "Lead & Booking" (đã thêm `initialTab` cho `PartnersSection` để deep-link đúng tab con, không chỉ mở tab "Đối tác" mặc định). Đã test thật qua HTTP: tạo lead thật qua `POST /api/partner-leads` → số tăng đúng 1; admin chuyển `status='confirmed'` → số giảm lại đúng.

### UC-20 - Đọc Tin Tức / Học Viện

**Actor:** Khách truy cập, Mẹ bỉm

**Trạng thái:** Đã triển khai — trang public `/tin-tuc` (2 tab: "Tin tức & Cập nhật", "Học viện Làm Mẹ") và trang đọc bài `/tin-tuc/:slug`.

**Bảng:** `article_categories`, `articles`, `media_assets`

**Luồng chính:**

1. Người dùng mở Tin tức hoặc Học viện Làm Mẹ.
2. Hệ thống hiển thị chuyên mục đang hoạt động từ `article_categories`.
3. Hệ thống hiển thị bài viết `published`.
4. Người dùng đọc bài theo chuyên mục, slug hoặc nội dung liên quan.
5. Ảnh bìa bài viết được quản lý qua `articles.cover_url` hoặc `media_assets`.

**Ghi chú triển khai:**

- "Tin tức & Cập nhật" và "Học viện Làm Mẹ" là 2 chuyên mục gốc cố định trong `article_categories` (`tin-tuc-cap-nhat`, `hoc-vien-lam-me`); mỗi tab lọc bài viết theo các chuyên mục con của chuyên mục gốc tương ứng.
- Bộ chuyên mục + bài viết mẫu ban đầu được seed qua migration (`20260821000600_seed_article_categories_and_articles.sql`), tương tự cách `who_growth_standards` được seed; từ khi UC-21 xong, admin tạo/sửa bài viết thật qua `/admin` mục "Bài viết / Blog".
- Sidebar "Đọc nhiều nhất" lấy 4 bài `view_count` cao nhất trong toàn bộ bài `published` (không giới hạn theo tab/chuyên mục đang chọn).
- Đọc bài (kể cả khách vãng lai) tăng `articles.view_count` qua `POST /api/articles/:slug/view`, gọi 1 lần khi trang chi tiết mount trong trình duyệt (không tính view khi chỉ SSR/bot fetch HTML thô). RLS "articles_update_admin" không cho khách UPDATE trực tiếp, nên route này gọi function Postgres `increment_article_view(p_slug)` chạy `security definer` — phạm vi cố tình thu hẹp: chỉ +1 `view_count` của đúng 1 bài đang `published` theo slug, không mở quyền ghi cột nào khác hay bài draft/archived. Không dedupe theo phiên/trình duyệt — số liệu mang tính tham khảo như phần lớn bộ đếm lượt xem đơn giản khác.
- Tab "Nhật ký Dinh dưỡng Bé" trong `/tin-tuc` bản thân nó **không** thuộc UC-20 — đó là UC-04/05/06 (dùng `babies`/`baby_measurements`/`development_milestones`/`baby_feeding_schedule`), chỉ được đặt cùng trang cho khớp bố cục demo. Trang `/tin-tuc` (server component) fetch `babies` của user hiện tại (nếu đã đăng nhập) và truyền xuống cho tab này — không ảnh hưởng RLS/quyền riêng tư, `babies` vẫn lọc đúng `user_id = auth.uid()`.
- **Mục lục nội dung (Table of Contents):** dòng nội dung bắt đầu bằng `## ` (heading cấp 2) hoặc `### ` (heading cấp 3) được `src/lib/articles/content.ts` (`parseArticleContent`) tách thành heading có `id` neo (slug tự sinh từ tiêu đề, bỏ dấu tiếng Việt). Nếu bài có ít nhất 1 heading, trang `/tin-tuc/:slug` tự chuyển sang layout 2 cột: nội dung + sidebar "Mục lục nội dung" sticky bên phải (ẩn trên mobile), mỗi mục trỏ neo `#id` tương ứng, heading cấp 3 thụt lề dưới heading cấp 2 gần nhất. Bài không có heading nào vẫn hiển thị 1 cột như trước — không phá layout dữ liệu cũ.

### UC-21 - Quản Lý Chuyên Mục Và Bài Viết

**Actor:** Admin

**Trạng thái:** Đã triển khai — mục admin "Bài viết / Blog" có 2 tab: "Bài viết" và "Chuyên mục".

**Bảng:** `article_categories`, `articles`, `media_assets`

**Luồng chính:**

1. Admin tạo/cập nhật chuyên mục tin tức/học viện trong `article_categories` (tên, slug, chuyên mục cha, mô tả, thứ tự hiển thị, ẩn/hiện).
2. Admin tạo bài viết và chọn `category_id`.
3. Admin nhập tiêu đề, slug, tóm tắt, nội dung và ảnh bìa.
4. Nếu upload ảnh, hệ thống lưu metadata vào `media_assets`, đồng thời cập nhật `articles.cover_url`.
5. Admin lưu nháp với `status = 'draft'`.
6. Admin xuất bản bằng `status = 'published'` hoặc ẩn bằng `status = 'archived'`.

**Ghi chú triển khai:**

- Lần đầu chuyển 1 bài sang `published`, backend tự gán `published_at = now()` nếu chưa có; các lần sửa/đổi trạng thái sau đó giữ nguyên mốc xuất bản gốc (không bị ghi đè mỗi lần lưu).
- `author_id` gán tự động theo admin đang đăng nhập lúc tạo bài, không cho chọn tuỳ ý.
- Chưa có API xoá bài viết/chuyên mục (`DELETE`) — chỉ tạo, sửa nội dung và đổi trạng thái draft/published/archived, giống cách UC-23 (Sản phẩm) cũng không có xoá.

### UC-22 - Quản Lý Bác Sĩ Nhi Đối Tác

**Actor:** Admin

**Trạng thái:** Đã triển khai — mục admin "BS Nhi" (list/search, tạo, sửa, upload avatar, toggle xác minh nhanh).

**Bảng:** `bs_nhi`, `media_assets`

**Luồng chính:**

1. Admin tạo hồ sơ bác sĩ.
2. Nhập họ tên, chuyên khoa, bệnh viện, kinh nghiệm, tiểu sử, rating và thời gian phản hồi.
3. Upload avatar/chứng chỉ nếu cần và lưu metadata vào `media_assets`.
4. Admin xác minh hồ sơ bằng `verified = true`.
5. Hệ thống hiển thị bác sĩ đã xác minh cho khách và mẹ bỉm.

### UC-23 - Quản Lý Nhãn Hàng, Danh Mục Và Sản Phẩm

**Actor:** Admin

**Trạng thái:** Đã triển khai — mục admin "Sản phẩm & Danh mục" (3 tab: Sản phẩm, Danh mục, Nhãn hàng).

**Bảng:** `brands`, `product_categories`, `products`, `milk_products`, `media_assets`

**Luồng chính:**

1. Admin tạo/cập nhật nhãn hàng trong `brands`.
2. Admin tạo/cập nhật danh mục Bách Hóa trong `product_categories`.
3. Admin tạo/cập nhật sản phẩm trong `products`, bao gồm `outbound_url` (link affiliate ra trang bán của đối tác — xem UC-07).
4. Upload ảnh sản phẩm/logo nhãn hàng và lưu metadata vào `media_assets`.
5. Với sản phẩm thường, admin lưu thông số riêng trong `products.attributes`.
6. Với sản phẩm sữa, admin tạo thêm bản ghi trong `milk_products`.
7. Sản phẩm được dùng trong Bách Hóa; riêng sản phẩm sữa còn dùng cho AI gợi ý.

### UC-24 - Quản Lý Dữ Liệu Chuẩn WHO Và Mốc Phát Triển

**Actor:** Admin

**Trạng thái:** Chưa triển khai qua Admin UI/API — cả `who_growth_standards` (150 dòng: 3 chỉ số × 2 giới tính × 25 mốc tháng tuổi 0–24, nguồn WHO/CDC) và `development_milestones` (99 mốc, 8 mốc tháng tuổi, nguồn CDC) đều seed thủ công qua migration để phục vụ UC-04/UC-05, chưa có `POST /api/admin/who-growth-standards/import` hay UI quản lý riêng cho admin — nếu cần mở rộng phạm vi tuổi hoặc thêm phiên bản chuẩn mới thì vẫn phải qua migration.

**Bảng:** `who_growth_standards`, `development_milestones`

**Luồng chính:**

1. Admin hoặc script seed nạp dữ liệu chuẩn WHO vào `who_growth_standards`.
2. Admin hoặc script seed nạp bộ mốc phát triển vào `development_milestones`.
3. Khi cần cập nhật phiên bản chuẩn, hệ thống thêm `version` mới thay vì ghi đè dữ liệu cũ.
4. Frontend/backend sử dụng phiên bản đang active/default để đánh giá hồ sơ bé.

**Quy tắc:**

- Đây là dữ liệu chuẩn của dự án, không phải dữ liệu riêng của user.
- Dữ liệu thay đổi ít, nên có thể lưu mặc định trong migration seed hoặc file seed riêng.
- Chỉ Admin/service role được ghi dữ liệu chuẩn.

### UC-25 - Quản Lý Thông Báo Và Thiết Bị Nhận Push

**Actor:** Mẹ bỉm, Admin

**Trạng thái:** Đã triển khai push thật qua Firebase FCM cho 2 sự kiện: **tư vấn bác sĩ trả lời (UC-16)** và **nhắc lịch ăn/sữa (UC-06)**. Có `POST /api/device-tokens`, `DELETE /api/device-tokens/:id`, job `GET/POST /api/cron/dispatch-notifications` gửi push thật, và UI "🔔 Bật thông báo" ở `/tai-khoan` để đăng ký token trên trình duyệt. **Còn thiếu**: API/UI đọc notification tổng quát (đánh dấu `read_at`), SMS/email thật, push cho các sự kiện còn lại (booking, escrow, tin C2C duyệt/ẩn — UC-18/19 mới ghi `notification_sent_at` dạng stub).

**Bảng:** `device_tokens`, `notifications`

**Luồng chính:**

1. Khi người dùng đăng nhập, vào `/tai-khoan` bấm "🔔 Bật thông báo" → trình duyệt xin quyền, lấy FCM token, gửi lên server.
2. Server tạo/cập nhật `device_tokens` (`POST /api/device-tokens`, upsert theo `token`).
3. Sự kiện phát sinh thông báo: UC-16 (Admin trả lời tư vấn) và UC-06 (lịch ăn có giờ cụ thể) tạo row `notifications` với `channel='push', status='pending'` (`scheduled_at=null` = gửi ngay, hoặc = giờ hẹn cho nhắc lịch ăn).
4. Job `/api/cron/dispatch-notifications` (bảo vệ bằng `Authorization: Bearer <CRON_SECRET>`) lấy các `notifications` `channel='push', status='pending'` đã tới hạn `scheduled_at` (hoặc `scheduled_at is null`).
5. Job gửi push qua Firebase Admin SDK (`sendEachForMulticast`) tới toàn bộ `device_tokens` đang `enabled=true` của user đó; token nào FCM báo hết hạn/không hợp lệ thì tự `enabled=false`.
6. Cập nhật `status='sent', sent_at=now()` sau khi gửi được ít nhất 1 token; nếu user chưa có token nào thì giữ `pending` để job lần sau thử lại (quá 24h vẫn không có token thì `status='cancelled'`, tránh dội thông báo cũ).
7. API/UI đọc thông báo và cập nhật `read_at` — **chưa triển khai** (chưa có màn "hộp thư thông báo" trong app, mới chỉ có push tới thiết bị).

**Sự kiện đã dùng thông báo:**

- Tư vấn bác sĩ có câu trả lời (UC-16).
- Lịch ăn/sữa/ăn dặm đến giờ (UC-06).

**Sự kiện dự kiến (chưa làm):**

- Booking được xác nhận/hủy/hoàn thành.
- Escrow thay đổi trạng thái.
- Tin C2C được duyệt hoặc bị ẩn.

**Ghi chú triển khai — Push Notification Firebase FCM:**

- **Client:** `src/lib/firebase/client.ts` (khởi tạo Firebase Web SDK từ các biến `NEXT_PUBLIC_FIREBASE_*` đã có sẵn trong `.env`, xin quyền + lấy token qua `getToken()` với `NEXT_PUBLIC_FIREBASE_VAPID_KEY`) + `public/firebase-messaging-sw.js` (service worker nhận push khi tab đóng/ở nền — hardcode config Firebase public vì service worker load bằng URL tĩnh, không qua Next.js bundler, và các giá trị `NEXT_PUBLIC_*` vốn không phải secret). UI đăng ký ở `src/app/tai-khoan/NotificationSettings.tsx`, người dùng chủ động bấm (không tự xin quyền khi vào trang).
- **Server:** `src/lib/firebase/admin.ts` khởi tạo Firebase Admin từ `FIREBASE_SERVICE_ACCOUNT` (JSON service account dán nguyên dòng trong `.env`) — route cron trả `503` rõ ràng nếu thiếu biến này thay vì lỗi khó hiểu. **`.env` hiện đã có service account thật** (project `suaembe-a39ce`) do người vận hành cung cấp; đã xác thực thật với Google (xem "Đã test thật" bên dưới).
- **Payload data-only:** `src/lib/notifications/dispatch.ts` gửi FCM message chỉ có field `data` (không có `notification` cấp cao nhất) để tránh trình duyệt tự hiển thị trùng lặp với xử lý thủ công trong service worker — service worker tự dựng `showNotification()` từ `data.title`/`data.body`, click vào thì mở đúng `data.url` (trang xem lại nội dung, khác nhau theo `type`).
- **Job dispatch:** không có scheduler nội bộ (Next.js không có cron riêng) — `vercel.json` khai báo cron gọi `/api/cron/dispatch-notifications` mỗi 5 phút (lưu ý: gói Vercel Hobby giới hạn cron tối đa 1 lần/ngày, cần Pro hoặc scheduler ngoài như cron-job.org/GitHub Actions để chạy đúng tần suất này). Route hỗ trợ cả `GET` (Vercel Cron gọi bằng GET) lẫn `POST` (gọi tay/scheduler khác), cùng xác thực qua `CRON_SECRET`.
- **Claim nguyên tử theo dòng:** trước khi gửi, job UPDATE `status: pending -> sending` cho từng row rồi kiểm tra `count`; nếu 0 nghĩa là lần chạy khác đã lấy trước, bỏ qua — tránh gửi trùng nếu 2 lần chạy cron chồng nhau. Cần enum `notification_status` có giá trị `sending` — bổ sung qua migration `20260825000100_notification_status_sending.sql` (enum gốc chỉ có `pending/sent/read/failed/cancelled`, thiếu `sending` khiến bước claim luôn lỗi Postgres 22P02 im lặng — xem mục lỗi đã sửa bên dưới).
- **Đã test thật qua HTTP** (không mock, dữ liệu test đã dọn sạch): tạo lịch ăn có giờ → tạo đúng notification `pending`; đổi giờ → cập nhật đúng `scheduled_at`, không tạo trùng; đánh dấu done/xoá lịch → huỷ notification; lịch không có giờ → không tạo gì; UC-16 trả lời tư vấn → notification `channel=push`; route cron: thiếu/sai `CRON_SECRET` → `401`, đúng secret nhưng chưa cấu hình Firebase Admin → `503` (cả GET và POST) — 18/18 assertion pass. **Sau khi có `FIREBASE_SERVICE_ACCOUNT` thật:** route cron không còn `503`; gọi `messaging.send({token: <fake>}, dryRun=true)` trực tiếp trả lỗi `messaging/invalid-argument` (lỗi TOKEN, không phải lỗi AUTH như `app/invalid-credential`) — xác nhận service account xác thực thành công thật với Google; dispatch 1 notification thật (nhắc lịch ăn do người dùng tự tạo qua UI) đúng theo thiết kế: claim → tra `device_tokens` → 0 token đang bật (chưa ai bấm "Bật thông báo" trên trình duyệt thật) → trả lại `pending` để job sau thử lại, không đánh dấu `failed` sai.
- **Lỗi đã phát hiện và sửa trong lúc verify:** bước claim nguyên tử dùng giá trị `status: "sending"` nhưng enum DB gốc không có giá trị này — mọi lần chạy cron trước đó đều claim thất bại (Postgres báo lỗi 22P02) nhưng code chỉ kiểm tra `count` mà không log `error` của bước UPDATE này, nên lỗi bị nuốt im lặng và job luôn trông như "không có gì để gửi" dù `notifications` đang có dòng `pending` thật. Đã thêm migration bổ sung `sending` vào enum và xác nhận lại bằng test trực tiếp — claim hoạt động đúng sau khi migrate.

### UC-26 - Quản Lý Media Upload

**Actor:** Mẹ bỉm, Admin

**Trạng thái:** Đã triển khai cơ chế upload dùng chung (`POST /api/uploads`, Cloudinary) cho avatar, ảnh sản phẩm, ảnh listing C2C, avatar bác sĩ và ảnh bìa bài viết — **đã có cleanup khi thay/gỡ ảnh** (xem ghi chú bên dưới). **Còn thiếu**: chưa có API + màn Admin Media Management (`GET/DELETE /api/admin/media-assets`, xem/tìm/xoá `media_assets` độc lập); logo/cover đối tác hiện chưa có uploader riêng; ảnh C2C bị bỏ quên khi khách đóng form vẫn cần job dọn định kỳ.

**Bảng:** `media_assets`

**Luồng chính:**

1. Người dùng hoặc Admin upload ảnh/file từ frontend.
2. Backend kiểm tra quyền upload theo ngữ cảnh.
3. File được upload lên Cloudinary hoặc storage provider.
4. Backend lưu metadata vào `media_assets`, gồm URL, MIME type, kích thước, `owner_table`, `owner_id`, `asset_type`.
5. Các bảng nghiệp vụ hiện thường lưu URL nhanh (`avatar_url`, `cover_url`, `image_urls`) và `media_assets` lưu metadata tương ứng; chưa có màn hình quản lý tập trung để join/lookup toàn bộ asset.

**Các loại media chính:**

- Ảnh listing C2C.
- Avatar bác sĩ nhi.
- Ảnh sản phẩm, logo nhãn hàng.
- Logo/cover đối tác.
- Ảnh bìa bài viết.
- Avatar người dùng.

**Ghi chú triển khai — dọn media khi thay/xoá ảnh:**

Trước đây khi thay ảnh (re-upload avatar/cover/ảnh sản phẩm) hoặc gỡ ảnh khỏi mảng (`image_urls`, `images`), code chỉ cập nhật field hiển thị, không gọi Cloudinary `destroy()` và không xoá row `media_assets` cũ — rò rỉ file + tích rác metadata. Đã sửa bằng 1 helper dùng chung `cleanupRemovedMediaUrls(oldUrls, newUrls)` (`src/lib/media/cleanup.ts`): so URL cũ vs URL còn giữ lại sau update, khớp theo `secure_url` trong `media_assets` (không cần `owner_table`/`owner_id` vì Cloudinary URL gần như luôn duy nhất theo lần upload), gọi Cloudinary destroy rồi xoá row — dùng admin client (service role) vì ảnh khách vãng lai upload có `uploader_id = null`, RLS delete thường (`auth.uid() = uploader_id`) không bao giờ khớp `null = null` nên không tự xoá được. Đã wire vào tất cả các route cập nhật field ảnh: `PUT /api/auth/me` (avatar), `PUT /api/admin/products/:id` (`image_urls`), `PUT /api/admin/articles/:id` (`cover_url`), `PUT /api/admin/bs-nhi/:id` (`avatar_url`), `PUT /api/listings/:id` và `PUT /api/admin/listings/:id` (`images`), cùng `DELETE /api/listings/:id` (dọn hết ảnh khi xoá cả tin). Riêng nút "✕" gỡ ảnh trước khi submit form đăng tin C2C (`SellListingForm.tsx`, ảnh đã upload nhưng chưa gắn vào tin nào) gọi endpoint mới `DELETE /api/uploads {secure_url}` — chỉ cho xoá khi `owner_table`/`owner_id` đều null, `asset_type = 'listing_image'` và upload trong vòng 6 giờ gần nhất (biên an toàn thật ở tầng query, không chỉ kiểm tra app, vì endpoint này khách vãng lai cũng gọi được); ảnh có `uploader_id` thì chỉ đúng người upload mới gỡ được. Đã test thật qua HTTP (không mock): tạo user/admin/product/listing thật, upload ảnh thật lên Cloudinary, xác nhận đúng ảnh bị gỡ mất trên cả Cloudinary lẫn `media_assets` còn ảnh giữ lại thì nguyên vẹn, và PUT không đụng tới field ảnh thì không dọn gì cả — 36/36 assertion pass, dọn sạch dữ liệu test sau khi chạy.

### UC-27 - Quản Lý Người Dùng

**Actor:** Admin

**Trạng thái:** Đã triển khai — mục admin "Mẹ bỉm" (list/search theo email/SĐT, lọc theo role, sửa hồ sơ, gán/hạ role, chặn admin tự đổi role chính mình).

**Bảng:** `users`

**Luồng chính:**

1. Admin xem danh sách người dùng.
2. Tìm theo email, số điện thoại hoặc vai trò.
3. Hỗ trợ cập nhật hồ sơ khi cần.
4. Gán role `admin` cho tài khoản vận hành đáng tin cậy.

**Quy tắc:**

- Không cho client thường tự nâng quyền.
- Thao tác đổi role nên được audit ở giai đoạn production.

### UC-28 - Quản Lý Tin Đăng Của Tôi (Chợ C2C)

**Trạng thái:** Đã triển khai — xem/sửa nội dung, tự đánh dấu đã bán/gỡ tin, tự xoá tin (xem "Còn thiếu" bên dưới cho phần nhỏ còn lại).

**Actor:** Mẹ bỉm

**Bảng:** `c2c_listings`, `c2c_orders`, `media_assets`

**Luồng chính (đã triển khai):**

1. Mẹ bỉm (đã đăng nhập) vào `/cho-me-be`, bấm nút lọc "📋 Tin của tôi".
2. Hệ thống gọi `GET /api/listings/me`, hiển thị toàn bộ tin của người này theo mọi `status` (`pending`, `approved`, `sold`, `hidden`) — dùng lại đúng layout lưới/card của trang Chợ công khai, khác trang công khai chỉ ở nguồn dữ liệu (RLS `auth.uid() = seller_id` cho đọc mọi trạng thái, không chỉ `approved`).
3. Mẹ bỉm bấm vào 1 tin của mình → popup chi tiết hiện thêm nút "✏️ Sửa tin".
4. Bấm "Sửa tin" mở form sửa ngay trong popup (tiêu đề, danh mục, tình trạng, giá, giá gốc, số lượng còn, tỉnh/thành, hình thức giao dịch, mô tả, SĐT/Zalo liên hệ) → lưu qua `PUT /api/listings/:id` (đã có sẵn từ UC-10, giới hạn `seller_id = auth.uid()`).
5. Lọc danh mục/tỉnh thành ở trang Chợ vẫn dùng được trong chế độ "Tin của tôi" (áp dụng phía client trên danh sách đã tải).
6. Với tin đang `approved`, popup hiện thêm 2 nút "✅ Đánh dấu đã bán" và "🙈 Gỡ tin" → gọi `PUT /api/listings/:id/status` với đúng `{ status: "sold" }` hoặc `{ status: "hidden" }`.
7. Mọi tin của mình (bất kỳ status) đều có nút "🗑 Xoá tin" (kèm xác nhận trước khi xoá) → gọi `DELETE /api/listings/:id`.

**Ghi chú triển khai (bước 6–7):**

- `PUT /api/listings/:id/status` là endpoint riêng, tách khỏi `PUT /api/listings/:id` (route sửa nội dung dùng `parseListingFields`, cố tình không nhận field `status`) — endpoint này chỉ nhận đúng `sold`/`hidden`, và chỉ áp dụng khi tin đang `approved` (không cho tự đặt lại `pending`/`approved`, không cho đổi tiếp 1 tin đã `sold`/`hidden`).
- RLS `c2c_listings_update_owner_or_admin` (đã có sẵn từ đầu) vốn không giới hạn owner đổi field nào — việc thu hẹp "chỉ `sold`/`hidden`, chỉ từ `approved`" nằm ở tầng API, theo đúng cách `parseListingFields` cũng đang chặn `status` ở route sửa nội dung.
- `DELETE /api/listings/:id` dùng RLS `c2c_listings_delete_owner_or_admin` đã có sẵn từ migration đầu tiên (không cần thêm RLS mới). An toàn dữ liệu dựa vào ràng buộc khoá ngoại có sẵn `c2c_orders.listing_id ... on delete restrict` — Postgres tự chặn xoá nếu tin đã có bất kỳ đơn nào tham chiếu (kể cả đơn đã `cancelled`), API bắt lỗi `23503` và trả thông báo rõ ràng thay vì lỗi DB thô.

**Còn thiếu (chưa triển khai):**

- Sửa 1 tin đã `approved` không tự chuyển lại `pending` để Admin duyệt lại nội dung mới — tin sửa xong vẫn hiển thị công khai ngay với nội dung mới mà không qua kiểm duyệt lần 2.

### UC-29 - Quản Lý Đơn Hàng Của Tôi (Chợ C2C)

**Actor:** Mẹ bỉm

**Trạng thái:** Đã triển khai — khối "Đơn hàng của tôi" trong `/tai-khoan`.

**Bảng:** `c2c_orders`, `c2c_listings`

**Luồng chính:**

1. Mẹ bỉm (đã đăng nhập) vào `/tai-khoan`, xem khối "Đơn hàng của tôi".
2. Hệ thống hiển thị toàn bộ đơn có `buyer_id = auth.uid()` (RLS `c2c_orders_select_admin_or_buyer` đã cho phép sẵn), kèm trạng thái đơn (`order_status`) và trạng thái thanh toán (`payment_status`).
3. Nếu đơn còn `payment_status = pending` và chọn MoMo/VNPay lúc đặt mua: mẹ bỉm bấm "Thanh toán ngay (demo)" → gọi bước thanh toán MOCK của UC-12 (`POST /api/orders/:id/mock-pay`).
4. Nếu đơn còn `order_status = pending_admin_review` (admin chưa xử lý): mẹ bỉm có thể tự **Huỷ đơn** (`PUT /api/orders/:id/cancel`) — chỉ huỷ được đúng ở trạng thái này, không huỷ được đơn đã được admin xác nhận/xử lý.

**Quy tắc:**

- Không cho tự chuyển đơn sang `confirmed`/`completed` — chỉ Admin làm được (UC-12 bước 11-13).
- RLS `c2c_orders_update_buyer_cancel` chỉ cho phép đúng 1 chiều `pending_admin_review → cancelled`, và API chỉ gửi đúng field `order_status: 'cancelled'`, không forward field khác từ client.
- Chỉ áp dụng cho người mua có tài khoản — khách vãng lai xem UC-30.

### UC-30 - Thông Báo Trạng Thái Đơn Hàng Cho Khách Vãng Lai

**Trạng thái:** Định hướng phát triển sau này — chưa triển khai, chưa chốt phương án với techlead.

**Actor:** Khách

**Bảng:** `c2c_orders`

**Vấn đề cần giải quyết:** Khách vãng lai (không có tài khoản) sau khi đặt mua qua UC-12 **không có cách nào tự tra cứu lại** đơn của mình — RLS `c2c_orders_select_admin_or_buyer` chỉ cho phép admin hoặc `auth.uid() = buyer_id`, mà khách thì không có `auth.uid()`. Khác với UC-29 (Mẹ bỉm tự tra cứu qua `/tai-khoan`), khách vãng lai hiện chỉ biết trạng thái đơn nếu Admin **chủ động liên hệ tay** qua `buyer_phone`/`buyer_email` đã để lại.

**2 hướng đang cân nhắc (chưa chốt):**

1. **Gửi email xác nhận trạng thái đơn hàng** — hệ thống tự gửi email tới `buyer_email` mỗi khi `order_status`/`payment_status` đổi (cần tích hợp dịch vụ gửi email, và `buyer_email` hiện đang là field không bắt buộc khi đặt mua — nếu chọn hướng này thì phải bắt buộc nhập email).
2. **Giao tiếp qua kênh liên lạc ngoài** — Admin chủ động gọi điện/nhắn Zalo theo `buyer_phone` đã có sẵn, không cần thêm hạ tầng kỹ thuật nhưng hoàn toàn thủ công, không scale khi lượng đơn tăng.

Cả 2 hướng đều chưa triển khai — cần chốt với techlead trước khi chọn, vì ảnh hưởng tới việc có bắt buộc email lúc đặt mua hay không và có cần tích hợp dịch vụ gửi email (Resend, SendGrid...) hay không.

## 5. Ma Trận Phân Quyền

Cột "Có"/"Không" mô tả phân quyền theo thiết kế (mục tiêu cuối). Dòng nào chưa có API/UI thật được đánh dấu rõ *chưa triển khai* — không suy luận trạng thái triển khai từ riêng bảng này.

| Chức năng | Khách | Mẹ bỉm (`user`) | Admin (`admin`) |
|---|---:|---:|---:|
| Xem trang chủ | Có | Có | Có |
| Đăng ký / đăng nhập | Có | Có | Có |
| Quản lý hồ sơ cá nhân | Không | Có | Có |
| Quản lý hồ sơ bé | Không | Có | Có |
| Cập nhật chỉ số bé | Không | Có | Có |
| Xem đánh giá tăng trưởng WHO | Không | Có | Có |
| Đánh dấu mốc phát triển của bé | Không | Có | Có |
| Quản lý lịch ăn/sữa/ăn dặm (kể cả nhắc lịch qua push FCM) | Không | Có | Có |
| Xem Bách Hóa và sản phẩm | Có | Có | Có |
| AI gợi ý sữa (public, có rate limit theo IP) | Có | Có | Có |
| Quản lý nhãn hàng, danh mục và sản phẩm | Không | Không | Có |
| Xem tin C2C đã duyệt | Có | Có | Có |
| Gửi form pass đồ C2C | Có | Có | Có |
| Quản lý tin đăng của tôi (xem mọi trạng thái + sửa nội dung) | Không | Có | Có (qua UC-11) |
| Tự đánh dấu đã bán / gỡ tin / xoá tin của tôi | Không | Có | Có (qua UC-11) |
| Duyệt/ẩn tin C2C | Không | Không | Có |
| Đặt mua C2C thanh toán thường (MoMo/VNPay mock, COD) | Có | Có | Có |
| Quản lý đơn hàng của tôi (tự tra cứu, huỷ đơn chờ xử lý) | Không | Có | Có (qua màn Đơn hàng C2C) |
| Nhận thông báo trạng thái đơn hàng | Không - *định hướng, chưa triển khai (UC-30)* | Không (chưa có UI) | — |
| Tạo giao dịch escrow | Không | Không | Không - hướng phát triển tương lai |
| Xử lý escrow/tranh chấp | Không | Không | Không - hướng phát triển tương lai |
| Xem bác sĩ đã xác minh (UC-14) | Có | Có | Có (qua UC-22) |
| Gửi câu hỏi tư vấn (UC-15) | Không | Có | — |
| Chuyển tiếp tư vấn cho bác sĩ đối tác (UC-16) | Không | Không | Có |
| Cập nhật câu trả lời tư vấn (UC-16) | Không | Không | Có |
| Xem đối tác và gói/dịch vụ (`/doi-tac`) | Có | Có | Có |
| Quản lý đối tác và gói/dịch vụ (UC-19 MVP) | Không | Không | Có |
| Đặt lịch/lead đối tác (guest, UC-18 MVP) | Có | Có | — |
| Quản lý booking/lead đối tác (UC-19 MVP) | Không | Không | Có |
| Đọc bài viết đã xuất bản | Có | Có | Có |
| Quản lý chuyên mục/bài viết | Không | Không | Có |
| Đăng ký thiết bị nhận push (device token) | Không | Có | Có |
| Nhận push FCM (tư vấn trả lời + nhắc lịch ăn) | Không | Có | Có |
| Đọc lại thông báo trong app (hộp thư, đánh dấu đã đọc) — *chưa có UI/API tổng quát (UC-25)* | Không | Chưa có | Chưa có |
| Quản lý dữ liệu chuẩn WHO/mốc phát triển qua Admin UI — *chưa triển khai (UC-24)* | Không | Không | Chưa có |
| Upload media và tự dọn khi thay/gỡ | Có giới hạn (C2C draft) | Có giới hạn | Có |
| Quản lý media tập trung — *chưa có Admin UI/API* | Không | Không | Chưa có |
| Quản lý người dùng | Không | Không | Có |

## 6. API Định Hướng Theo 2 Role

Danh sách dưới đây phản ánh API hiện có và phần còn thiếu của MVP. Với các tích hợp chưa làm thật, tài liệu ghi rõ `stub`, `mock` hoặc `future`; không coi việc có cột database là đã có API/UI. Xem `TESTCASE.md` mục 1 để biết testcase nào đã chạy và testcase nào cần techlead xác nhận.

### Public APIs

- `GET /api/brands`
- `GET /api/product-categories`
- `GET /api/products`
- `GET /api/milk-products`
- `GET /api/listings`
- `POST /api/listings` — gửi form pass đồ, không bắt buộc đăng nhập trong MVP mới
- `POST /api/listings/:id/orders` — đặt mua thanh toán thường theo số lượng (bảng `c2c_orders`)
- `POST /api/orders/:id/mock-pay` — xác nhận thanh toán MoMo/VNPay dạng MOCK (giả lập luôn thành công), không yêu cầu đăng nhập vì đóng vai trò placeholder cho callback/IPN thật từ cổng thanh toán (vốn dĩ gọi server-to-server, không mang session người mua)
- `GET /api/bs-nhi`
- `POST /api/doctor-leads` — gửi form liên hệ bác sĩ nhi, không yêu cầu đăng nhập; tạo `partner_bookings.request_type = 'doctor_lead'`.
- `GET /api/partners`
- `GET /api/partners/:id/services`
- `POST /api/partner-leads` — gửi form liên hệ cho nhóm bệnh viện/bảo hiểm/trang thiết bị, không yêu cầu đăng nhập; Admin/SữaEmbe nhận và chuyển tiếp cho đối tác.
- `POST /api/partner-bookings` — đặt lịch dịch vụ mẹ & bé, không yêu cầu đăng nhập; tạo `partner_bookings.status = 'pending'`.
- `GET /api/article-categories`
- `GET /api/articles`
- `GET /api/articles/:slug`
- `POST /api/articles/:slug/view` — tăng `view_count`, không yêu cầu đăng nhập, chỉ tác dụng với bài `published`.
- `GET /api/development-milestones`
- `GET /api/who-growth-standards`
- `POST /api/ai/suggest-milk` — **đã triển khai**, không yêu cầu đăng nhập; nếu có JWT hợp lệ kèm theo, backend cho phép dùng thêm `baby_id` để lấy chỉ số từ hồ sơ bé. Rate limit 15 request/giờ/IP qua Upstash Redis (xem "Ghi chú triển khai" ở UC-08).
- `DELETE /api/uploads` — gỡ ảnh listing draft chưa gắn owner, trong giới hạn URL hợp lệ và thời gian 6 giờ; dùng cho nút bỏ ảnh trước khi submit form C2C.

### User APIs

- `GET /api/auth/me`
- `POST /api/device-tokens`
- `DELETE /api/device-tokens/:id`
- `GET /api/babies`
- `POST /api/babies`
- `PUT /api/babies/:id`
- `GET /api/babies/:id/measurements`
- `POST /api/babies/:id/measurements`
- `GET /api/babies/:id/milestones`
- `PUT /api/babies/:id/milestones/:milestoneId`
- `GET /api/babies/:id/feeding-schedule`
- `POST /api/babies/:id/feeding-schedule` — có `scheduled_time` thì tự tạo notification nhắc lịch (`channel='push'`, xem UC-06/UC-25)
- `PUT /api/babies/:id/feeding-schedule/:scheduleId` — tự đồng bộ notification nhắc lịch theo status/giờ mới nhất
- `DELETE /api/babies/:id/feeding-schedule/:scheduleId` — tự huỷ notification nhắc lịch đang chờ (nếu có)
- `DELETE /api/babies/:id/feeding-schedule` — xoá theo ngày hoặc `?all=true`, tự huỷ notification nhắc lịch cho từng dòng bị xoá
- `POST /api/uploads`
- `GET /api/listings/me` — UC-28, danh sách tin C2C của chính mình (mọi status)
- `PUT /api/listings/:id/status` — UC-28, tự đánh dấu đã bán (`sold`) hoặc gỡ tin (`hidden`), chỉ áp dụng khi tin đang `approved`
- `DELETE /api/listings/:id` — UC-28, tự xoá tin của mình; `409` nếu tin đã có đơn tham chiếu
- `GET /api/orders/me` — UC-29, danh sách đơn C2C của chính mình
- `PUT /api/orders/:id/cancel` — UC-29, tự huỷ đơn khi còn `pending_admin_review`
- `POST /api/consult`
- `GET /api/consult/me`
- `GET /api/bookings/me` — **chưa triển khai**, chỉ là hướng sau nếu người dùng đăng nhập và muốn xem lịch đã đặt; MVP hiện tại không bắt buộc đăng nhập.

### Admin APIs

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PUT /api/admin/users/:id`
- `GET /api/admin/listings`
- `GET /api/admin/listings/pending`
- `PUT /api/admin/listings/:id` — sửa/chuẩn hoá nội dung tin trước khi duyệt (UC-11 bước 3)
- `PUT /api/admin/listings/:id/approve`
- `PUT /api/admin/listings/:id/hide`
- `GET /api/admin/c2c-orders`
- `PUT /api/admin/c2c-orders/:id`
- `GET /api/admin/consults`
- `PUT /api/admin/consults/:id/forward`
- `PUT /api/admin/consults/:id/answer`
- `GET /api/admin/bs-nhi`
- `POST /api/admin/bs-nhi`
- `PUT /api/admin/bs-nhi/:id`
- `PUT /api/admin/bs-nhi/:id/verify`
- `GET /api/admin/partners`
- `POST /api/admin/partners`
- `PUT /api/admin/partners/:id`
- `DELETE /api/admin/partners/:id` — xoá thật nếu chưa có dịch vụ/booking; nếu đã có tham chiếu thì chuyển `status = 'hidden'`.
- `GET /api/admin/partners/:id/services`
- `POST /api/admin/partners/:id/services`
- `PUT /api/admin/partner-services/:id`
- `DELETE /api/admin/partner-services/:id` — xoá thật nếu chưa có booking; nếu đã có tham chiếu thì chuyển `active = false`.
- `GET /api/admin/bookings`
- `POST /api/admin/bookings` — Admin nhập lead/booking thủ công nếu cần.
- `PUT /api/admin/bookings/:id` — cập nhật trạng thái/ghi chú/chuyển tiếp; `confirmed` chỉ ghi timestamp và trả `notification_stub`, chưa gửi SMS/email thật.
- `DELETE /api/admin/bookings/:id`
- `GET /api/admin/article-categories`
- `POST /api/admin/article-categories`
- `PUT /api/admin/article-categories/:id`
- `GET /api/admin/articles`
- `POST /api/admin/articles`
- `PUT /api/admin/articles/:id`
- `GET /api/admin/brands`
- `POST /api/admin/brands`
- `PUT /api/admin/brands/:id`
- `GET /api/admin/product-categories`
- `POST /api/admin/product-categories`
- `PUT /api/admin/product-categories/:id`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id` — dữ liệu sữa (`milk_products`) gửi lồng trong field `milk` của cùng request thay vì route riêng (tạo/sửa/xoá `milk_products` tuỳ `milk` là object/`null`/không gửi).

### Cron / Service APIs

Không xác thực qua session người dùng — bảo vệ bằng bearer secret riêng, gọi từ scheduler ngoài (Vercel Cron hoặc tương đương).

- `GET /api/cron/dispatch-notifications` / `POST /api/cron/dispatch-notifications` — **đã triển khai**, gửi push FCM cho `notifications` đang chờ (UC-06, UC-16); yêu cầu header `Authorization: Bearer <CRON_SECRET>`, `401` nếu sai/thiếu, `503` nếu chưa cấu hình `FIREBASE_SERVICE_ACCOUNT`. Xem `vercel.json` cho lịch chạy mặc định (5 phút/lần).

### Future APIs

- `POST /api/listings/:id/buy` — mua bằng Escrow, chưa thuộc MVP hiện tại.
- `POST /api/escrow/:id/confirm` — xác nhận nhận hàng để release tiền, future scope.
- `PUT /api/admin/escrow/:id/release`
- `PUT /api/admin/escrow/:id/refund`
- `PUT /api/admin/escrow/:id/dispute`
- `POST /api/admin/who-growth-standards/import`
- `POST /api/admin/development-milestones/import`
- `GET /api/admin/media-assets`
- `DELETE /api/admin/media-assets/:id`
- `GET /api/notifications` — hộp thư thông báo trong app (khác với push FCM đã có).
- `PUT /api/notifications/:id/read`
- Job gửi SMS/email thật và job dọn media C2C draft quá hạn.

## 7. Luồng "Hỏi Ngay" Theo Xác Nhận Techlead

Luồng này thay thế ý tưởng bác sĩ có role đăng nhập riêng.

1. Mẹ bỉm đăng nhập.
2. Mẹ bỉm vào Đối tác hoặc Tư vấn bác sĩ.
3. Mẹ bỉm bấm "Hỏi ngay" trên một bác sĩ cụ thể.
4. Frontend mở form nhập `question` và `baby_age_months`.
5. Frontend gửi `POST /api/consult` kèm `bs_id`.
6. Backend tạo `consult_requests` với `status = 'pending'`.
7. Admin thấy yêu cầu mới trong admin panel.
8. Admin chuyển tiếp yêu cầu phía sau cho bác sĩ đối tác.
9. Admin cập nhật `forwarded_at`, `forwarded_by`, `internal_note` nếu cần.
10. Khi có câu trả lời, admin cập nhật `answer`, `answered_at`, `status = 'answered'`.
11. Backend tạo `notifications` để báo mẹ bỉm có câu trả lời.
12. Mẹ bỉm xem câu trả lời trong tài khoản của mình.

## 8. Logic Đánh Giá Phát Triển Bé

### Tăng trưởng theo WHO

Hệ thống lưu dữ liệu chuẩn trong `who_growth_standards` và dữ liệu từng bé trong `baby_measurements`.

Khi mẹ bỉm nhập chỉ số:

1. Tính tuổi bé theo tháng từ `babies.birth_date`.
2. Xác định giới tính từ `babies.gender`.
3. Lấy dòng chuẩn theo `gender`, `indicator`, `age_months`, `version`.
4. So sánh cân nặng/chiều cao/vòng đầu với percentile hoặc dùng LMS để tính z-score.
5. Lưu kết quả vào `baby_measurements`.
6. Trả về nhận định để frontend hiển thị biểu đồ và trạng thái.

### Mốc phát triển

Hệ thống lưu bộ chuẩn trong `development_milestones` và trạng thái từng bé trong `baby_milestone_records`.

Khi hiển thị checklist:

1. Tính tháng tuổi hiện tại của bé.
2. Lấy các mốc trong khoảng tuổi phù hợp.
3. Ghép với `baby_milestone_records` để biết bé đã đạt/chưa đạt mốc nào.
4. Nếu quá tháng kỳ vọng nhưng chưa đạt, hiển thị trạng thái cần theo dõi.

## 9. Ghi Chú Triển Khai

- Bác sĩ nhi là dữ liệu đối tác trong `bs_nhi`, không phải actor đăng nhập.
- Không tạo role `bs_nhi` trong `users.role`.
- Không tạo role `editor` trong giai đoạn hiện tại.
- Các chức năng quản lý nội dung tạm thời do Admin phụ trách.
- `who_growth_standards` và `development_milestones` nên được seed mặc định trong dự án vì ít thay đổi.
- `baby_measurements`, `baby_milestone_records`, `baby_feeding_schedule`, `notifications`, `device_tokens` là dữ liệu cá nhân, phải giới hạn theo `auth.uid()` hoặc quyền Admin. `notifications` được ghi ở 2 luồng: trả lời tư vấn (UC-16) và nhắc lịch ăn có giờ (UC-06) — cả 2 đều `channel='push'`, gửi thật qua Firebase FCM bởi job `/api/cron/dispatch-notifications` (xem "Ghi chú triển khai — Push Notification Firebase FCM" ở UC-25). SMS/email thật và API đọc thông báo trong app vẫn chưa có.
- `media_assets` chỉ lưu metadata file; file gốc nằm ở Cloudinary hoặc storage provider tương ứng.
- Nếu sau này cần portal riêng cho bác sĩ, phải mở rộng lại database, role, RLS policy và API.
