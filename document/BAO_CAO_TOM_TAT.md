# Báo Cáo Tóm Tắt Dự Án — SuaEmbe.com

**Gửi:** Techlead
**Ngày:** 25/08/2026
**Phạm vi:** Tổng kết tiến độ implementation Next.js + Supabase hiện tại, tách bạch rõ phần đã test thật khỏi phần chỉ mới có code, và liệt kê các quyết định cần Techlead xác nhận trước khi merge/deploy.

---

## 1. Tổng quan

SuaEmbe.com là nền tảng Mẹ & Bé của VEA Group, xây dựng bằng **Next.js 15 (App Router) + Supabase (Postgres/Auth/RLS)** — thay thế hoàn toàn kiến trúc "HTML tĩnh + backend Express riêng" trong tài liệu kế hoạch ban đầu (`DEPLOY_suaembe.md`, nay đã lỗi thời). Toàn bộ logic nghiệp vụ chuẩn nằm trong `document/USECASE.md`; schema trong `document/database.md`; test case trong `document/TESTCASE.md`. Chi tiết setup/deploy xem `README.md`.

**Nguyên tắc xuyên suốt:** mọi tính năng đều dùng dữ liệu Supabase thật, không hardcode/bịa dữ liệu như bản demo `suaembe.html`. Mọi testcase đánh dấu "đã test" đều đã chạy qua HTTP thật (tạo user/dữ liệu thật, gọi API thật, dọn sạch sau khi test) — không dùng mock trừ khi ghi rõ (thanh toán MoMo/VNPay là MOCK theo đúng quyết định MVP).

---

## 2. Tiến độ tổng thể

**24/30 use case đã có luồng chính hoạt động thật.**

| Nhóm | Số lượng | Ghi chú |
|---|---|---|
| Đã triển khai đầy đủ, đã test thật | 24 UC | Auth, hồ sơ bé + tăng trưởng WHO + mốc phát triển + lịch ăn (kèm nhắc lịch push), Bách Hóa (affiliate), Chợ C2C (đăng tin → duyệt → đặt mua → quản lý tin/đơn của tôi), tư vấn bác sĩ (hỏi → admin trả lời → push FCM), đối tác (xem + gửi lead/đặt lịch + admin CRUD), tin tức/học viện, media (upload + tự dọn khi thay/gỡ ảnh), AI gợi ý sữa + 2 công cụ mẹ bầu |
| Triển khai một phần | 3 UC | UC-18/19 (đối tác — chưa có SMS/email xác nhận booking thật), UC-25 (chưa có hộp thư thông báo trong app, mới có push tới thiết bị), UC-26 (chưa có màn Admin Media Management độc lập) |
| Hướng tương lai, chưa làm | 2 UC | UC-13 (Escrow/tranh chấp), UC-30 (khách vãng lai tự tra cứu đơn hàng) |
| Chỉ có dữ liệu seed | 1 UC | UC-24 (WHO/mốc phát triển đã seed qua migration, chưa có Admin UI/API tự import) |

---

## 3. Công việc hoàn thành trong đợt review gần nhất

### 3.1. UC-28 — Tự quản lý tin đăng của tôi (Chợ C2C)
Hoàn thiện nốt phần còn thiếu: mẹ bỉm tự đánh dấu tin đã bán/gỡ tin (chỉ khi tin đang `approved`), tự xoá tin của mình. Phát hiện RLS gốc đã cho phép rộng hơn cần thiết (không giới hạn chuyển trạng thái) — thu hẹp đúng ở tầng ứng dụng thay vì sửa RLS, tận dụng ràng buộc khoá ngoại có sẵn (`c2c_orders.listing_id ... on delete restrict`) để tự động chặn xoá tin đã có đơn tham chiếu.

### 3.2. Công cụ cho Mẹ — AI gợi ý sữa (Claude API) + Tính ngày dự sinh + Cẩm nang sinh con
- **AI gợi ý sữa**: retrieval-trước-generation (lọc ứng viên thật bằng SQL trước, AI chỉ được chọn trong danh sách đã lọc — chống bịa sản phẩm), dùng Claude tool-use bắt buộc (`strict: true`) để ép định dạng JSON, enrich lại tên/ảnh/giá từ DB thay vì tin nội dung AI tự viết. Có rate limit 15 req/giờ/IP (Upstash Redis) và guard khi thiếu API key.
- **2 công cụ còn lại** (tính ngày dự sinh, cẩm nang sinh con): hoàn toàn client-side theo đúng quyết định đã chốt trước đó với techlead, không cần bảng/API riêng.
- **Trạng thái hiện tại:** `ANTHROPIC_API_KEY` đã có thật, `CLAUDE_MODEL` đã đúng (`claude-opus-5`) — sẵn sàng test đầu-cuối.

### 3.3. Sửa rò rỉ xoá media (Cloudinary + `media_assets`)
Phát hiện: khi thay/gỡ ảnh (avatar, ảnh sản phẩm, ảnh bìa bài viết, ảnh tin C2C...), hệ thống cũ chỉ cập nhật field hiển thị, **không xoá file trên Cloudinary lẫn row `media_assets` cũ** — rò rỉ dung lượng lưu trữ + tích rác metadata theo thời gian. Đã xây 1 helper dùng chung, wire vào toàn bộ route ghi ảnh liên quan (avatar, sản phẩm, bài viết, bác sĩ, tin C2C), cộng 1 endpoint mới cho phép gỡ ảnh nháp trước khi submit form (ràng buộc an toàn ở tầng query, không chỉ app). Đã test thật 48 assertion qua HTTP.

### 3.4. Push Notification qua Firebase FCM (nhắc lịch ăn + tư vấn bác sĩ trả lời)
- Xây dựng đầy đủ: đăng ký token trên trình duyệt (`/tai-khoan`), job dispatch định kỳ (`/api/cron/dispatch-notifications`, bảo vệ bằng `CRON_SECRET`), gửi qua Firebase Admin SDK, tự vô hiệu hoá token hết hạn.
- **`FIREBASE_SERVICE_ACCOUNT` đã được cấp thật** — đã xác thực thành công với Google (gọi `messaging.send()` dry-run, nhận đúng lỗi TOKEN thay vì lỗi AUTH).
- **Phát hiện và sửa 1 bug thật trong lúc verify:** cơ chế claim nguyên tử (tránh gửi trùng khi cron chạy chồng nhau) dùng giá trị `status: "sending"`, nhưng enum `notification_status` gốc trong DB thiếu giá trị này — mọi lần claim đều lỗi Postgres ngầm mà code không log ra, khiến job trông như chạy được nhưng chưa từng gửi được gì. Đã tạo migration bổ sung, chạy `supabase db push` lên project thật, xác nhận lại hoạt động đúng.
- Còn thiếu: QA thật trên thiết bị (đăng ký token qua trình duyệt → xác nhận nhận được push), tần suất cron phụ thuộc gói Vercel (xem mục 5).

### 3.5. Badge thông báo cho Admin khi có tư vấn bác sĩ mới
`GET /api/admin/stats` trả thêm `consults_pending`. Hiển thị badge số cạnh mục "Tư vấn BS" trên sidebar admin (chỉ hiện khi > 0) và thay dòng "BS Nhi chờ xác minh" trong panel "Cần xử lý" thành "Yêu cầu tư vấn BS chờ xử lý". Đã test thật: thêm yêu cầu → tăng đúng; forward (không đổi status) → giữ nguyên đúng thiết kế; trả lời → giảm đúng.

### 3.6. Sửa UX thanh điều hướng
- Menu chính trước đây tô hồng cứng "Trang chủ" bất kể đang ở trang nào, các mục khác không bao giờ tự sáng khi đang đúng trang đó (chỉ có hover). Đã sửa dùng `usePathname()` để chỉ highlight đúng 1 mục khớp màn hình hiện tại.
- Bỏ cặp nút "Đăng nhập / Đăng ký" dạng toggle trong modal xác thực, thay bằng link ngữ cảnh ("Bạn chưa có tài khoản? Đăng ký ngay" / "Đã có tài khoản? Đăng nhập").
- Sắp xếp lại "Đối tác" xuống cuối cùng trong nav chính.

### 3.7. Tài liệu hoá cho GitHub review
Viết lại hoàn toàn `README.md` (trước đó vẫn là boilerplate `create-next-app` mặc định) — mô tả đúng tech stack thật, hướng dẫn setup, dẫn tới `USECASE.md`/`database.md`/`TESTCASE.md`, cảnh báo rõ `suaembe.html` và `DEPLOY_suaembe.md` không phải nguồn chuẩn logic, cộng danh sách quyết định cần Techlead (xem mục 5).

---

## 4. Kỷ luật kiểm thử đã áp dụng

- Mọi test đều tạo dữ liệu thật trên Supabase (user/admin/sản phẩm/tin đăng/tư vấn... với tiền tố `__TEST_`), gọi API thật qua HTTP, xác nhận kết quả bằng truy vấn DB trực tiếp, và **dọn sạch dữ liệu test sau mỗi lần chạy** — không để lại rác trong DB thật.
- Không dùng mock cho logic nghiệp vụ cốt lõi; chỉ MOCK ở đúng nơi đã được xác nhận chủ đích (thanh toán MoMo/VNPay).
- Với tích hợp bên thứ ba cần credential thật (Claude, Firebase), luôn xây transformation đầy đủ trước, guard rõ ràng khi thiếu credential (trả lỗi rõ nghĩa thay vì crash), và khi có credential thật thì verify lại bằng lời gọi thật tới nhà cung cấp (không chỉ tin code compile là đủ) — cách này đã giúp phát hiện bug enum `notification_status` ở mục 3.4.

---

## 5. Vấn đề / quyết định cần Techlead xác nhận

1. **Gửi email qua Resend chưa dùng được cho người dùng thật.** Đã có `RESEND_API_KEY`, nhưng domain gửi vẫn là sandbox mặc định (`onboarding@resend.dev`) — chỉ gửi test được cho chính chủ tài khoản Resend. Cần xác thực 1 domain riêng (VD `suaembe.com`) qua bản ghi DNS (SPF/DKIM/DMARC) mới gửi được cho người dùng thật.
2. **UC-30** — khách vãng lai tra cứu trạng thái đơn hàng: chọn gửi email tự động (phụ thuộc mục 1) hay Admin liên hệ tay qua điện thoại/Zalo.
3. **Dọn ảnh C2C mồ côi** khi khách vãng lai upload ảnh nhưng bỏ dở form (đóng tab, mất mạng): cần job dọn định kỳ hay đổi luồng ghi `media_assets` trễ hơn.
4. **UC-13 (Escrow/tranh chấp)** — đưa vào roadmap gần hay giữ nguyên mô hình thanh toán thường (MoMo/VNPay mock, COD) cho MVP.
5. **Tần suất job push FCM khi deploy thật** — `vercel.json` cấu hình cron mỗi 5 phút, nhưng gói Vercel Hobby chỉ cho phép 1 lần/ngày. Cần biết gói deploy thật để quyết định giữ Vercel Pro hay dùng scheduler ngoài (cron-job.org, GitHub Actions).

---

## 6. Đề xuất bước tiếp theo

1. Techlead xác nhận 5 điểm ở mục 5, ưu tiên mục 5 (tần suất cron) vì ảnh hưởng trực tiếp tới việc push có kịp thời hay không ngay khi deploy.
2. QA thủ công trên trình duyệt thật cho 2 luồng chưa tự động test được: nhận push FCM thật trên thiết bị, và giao diện AI gợi ý sữa với Claude API thật.
3. Review lại `README.md` trước khi push lên GitHub — đã viết lại hoàn toàn, cần Techlead xác nhận nội dung phản ánh đúng kỳ vọng trước khi công khai cho team.
