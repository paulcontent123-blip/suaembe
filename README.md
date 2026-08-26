# SuaEmbe.com

Nền tảng Mẹ & Bé của VEA Group — Next.js 15 (App Router) + Supabase (Postgres, Auth, RLS). Gồm: hồ sơ bé & theo dõi tăng trưởng WHO, Bách Hóa (affiliate), Chợ Mẹ & Bé (C2C), tư vấn bác sĩ nhi, đối tác (bệnh viện/bảo hiểm/dịch vụ), tin tức, AI gợi ý sữa, và thông báo đẩy qua Firebase FCM.

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend/Backend | Next.js 15.5 (App Router, Turbopack), React 19, TypeScript strict |
| Styling | Tailwind CSS v4 |
| Database/Auth | Supabase (Postgres + Auth + Row Level Security) |
| Upload ảnh | Cloudinary |
| AI gợi ý sữa | Claude API (`@anthropic-ai/sdk`) |
| Push notification | Firebase Cloud Messaging (`firebase` + `firebase-admin`) |
| Rate limit | Upstash Redis (REST API) |
| Thanh toán | MoMo/VNPay — hiện là **MOCK**, chưa tích hợp cổng thật |
| Gửi email | Resend — đã có API key nhưng **chưa tích hợp vào code** vì chưa xác thực domain riêng (đang ở domain sandbox, chỉ gửi test được cho chính mình) |

## Bắt đầu

**Yêu cầu:** Node.js 20+, tài khoản Supabase (đã có project), Supabase CLI (`scoop install supabase` / xem [hướng dẫn cài](https://supabase.com/docs/guides/local-development/cli/getting-started)).

```bash
npm install
```

**1. Biến môi trường** — copy `.env` mẫu (không commit vào git, đã có trong `.gitignore`) và điền các nhóm biến chính:
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Cloudinary: `CLOUDINARY_URL`
- Claude API: `ANTHROPIC_API_KEY`, `CLAUDE_MODEL`
- Firebase FCM: `NEXT_PUBLIC_FIREBASE_*` (7 biến, dùng cho client) + `FIREBASE_SERVICE_ACCOUNT` (JSON service account, server-side)
- Upstash Redis: `REDIS_URL`, `REDIS_TOKEN`
- Cron nội bộ: `CRON_SECRET` (bảo vệ `/api/cron/dispatch-notifications`)

**2. Áp dụng migration lên Supabase:**

```bash
cd src/supabase
supabase link --project-ref <project-ref>
supabase db push
```

Migration nằm ở `src/supabase/migrations/`, đặt tên theo timestamp — đọc tuần tự để hiểu lịch sử schema thay vì chỉ nhìn `database.md` (tài liệu có thể đi sau code ở vài chi tiết nhỏ).

**3. Chạy dev server:**

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

**Build production:**

```bash
npm run build && npm run start
```

## Tài liệu dự án

| File | Vai trò |
|---|---|
| [`document/USECASE.md`](document/USECASE.md) | **TÀI LIỆU USECASE** cho logic nghiệp vụ — 30 use case, trạng thái triển khai, luồng chính, quy tắc, ma trận phân quyền, danh sách API. Đọc file này trước khi sửa bất kỳ tính năng nào. |
| [`document/database.md`](document/database.md) | Schema đầy đủ: bảng, cột, RLS, các quyết định mô hình dữ liệu đã chốt với techlead. |
| [`document/TESTCASE.md`](document/TESTCASE.md) | Test case theo từng UC + trạng thái đã test thật (qua HTTP, không mock) hay chưa. |


## Trạng thái hiện tại

24/30 use case đã có luồng chính hoạt động thật (đã test qua HTTP thật, không mock, với dữ liệu thật trên Supabase). Chi tiết từng UC xem bảng ở `document/USECASE.md` §3-4; tóm tắt các mảng lớn:

- **Đã triển khai đầy đủ:** Auth, hồ sơ bé + tăng trưởng WHO + mốc phát triển + lịch ăn (kèm nhắc lịch push), Bách Hóa (affiliate), Chợ C2C (đăng tin, duyệt, đặt mua thanh toán thường, quản lý tin/đơn của tôi), tư vấn bác sĩ (gửi câu hỏi → admin trả lời → push FCM), đối tác (xem + gửi lead/đặt lịch + admin CRUD), tin tức/học viện, quản lý media (upload + tự dọn khi thay/gỡ ảnh), AI gợi ý sữa.
- **Còn thiếu một phần:** UC-18/19 (đối tác — SMS/email xác nhận booking thật chưa có), UC-25 (hộp thư thông báo trong app — hiện chỉ có push tới thiết bị, chưa có màn xem lại lịch sử), UC-26 (màn Admin Media Management độc lập).
- **Hướng phát triển tương lai, chưa làm:** UC-13 (Escrow/tranh chấp), UC-30 (khách vãng lai tự tra cứu đơn hàng).
- **UC-24:** dữ liệu chuẩn WHO/mốc phát triển đã seed đủ qua migration, nhưng chưa có Admin UI/API để tự import thêm.

## Mô hình doanh thu (định hướng)

Từ tài liệu kế hoạch ban đầu — **chưa triển khai**, nhiều nguồn phụ thuộc tính năng chưa có (Escrow, premium membership). Giữ lại để techlead nắm định hướng sản phẩm, không phải trạng thái hiện tại.

| Nguồn | Cơ chế | Đơn giá |
|---|---|---|
| Escrow C2C | Phí giao dịch thành công | 2% GMV — phụ thuộc UC-13 (chưa triển khai, hiện MVP dùng thanh toán thường MoMo/VNPay mock, không escrow) |
| Affiliate Bách Hóa | Hoa hồng từ nhãn hàng qua `products.outbound_url` | 5–15% |
| Quảng cáo nhãn sữa | Banner / Featured slot | 2–5 triệu/tháng/nhãn |
| Premium membership | Nhật ký nâng cao, ưu tiên bác sĩ | 99–199 nghìn/tháng — chưa có khái niệm gói trả phí trong schema hiện tại |
| Booking đối tác | Phí trên mỗi booking | 10% giá trị |
| Affiliate bệnh viện/bảo hiểm | Phí trên mỗi lead | 200–500 nghìn/lead |

## HƯỚNG TƯƠNG LAI

1. **Gửi email qua Resend chưa dùng được cho người dùng thật.** Đã có `RESEND_API_KEY`, nhưng `RESEND_FROM_EMAIL` đang để domain sandbox mặc định của Resend (`onboarding@resend.dev`). Domain sandbox này **chỉ gửi được tới đúng email đã đăng ký tài khoản Resend** (dùng để tự test), không gửi được cho người dùng thật bất kỳ — đây là giới hạn của Resend, không phải lỗi cấu hình. Muốn gửi email thật (xác nhận đơn hàng, thông báo tư vấn...) cần **xác thực  domain riêng của SuaEmbe** (VD `suaembe.com` hoặc subdomain `mail.suaembe.com`) bằng cách khai báo bản ghi DNS (SPF, DKIM, và khuyến nghị thêm DMARC) trong Resend Dashboard → Domains, đợi Resend xác minh xong mới đổi `RESEND_FROM_EMAIL` sang địa chỉ thuộc domain đó (VD `SuaEmbe <no-reply@suaembe.com>`). Đây là lý do Resend chưa được gọi ở bất kỳ đâu trong code dù đã có API key sẵn — cần domain thật + quyền chỉnh DNS mới làm tiếp được.
2. **UC-13 (Escrow/tranh chấp)** — xác nhận có đưa vào roadmap gần hay giữ nguyên mô hình thanh toán thường (MoMo/VNPay mock, COD) hiện tại cho MVP.
3. **Tần suất job push FCM khi deploy thật** — `vercel.json` cấu hình cron mỗi 5 phút, nhưng gói Vercel Hobby chỉ cho phép cron 1 lần/ngày; cần biết gói deploy thật để quyết định giữ Vercel Pro hay dùng scheduler ngoài (cron-job.org, GitHub Actions) gọi `POST /api/cron/dispatch-notifications`.

## Testing

Xem `document/TESTCASE.md` cho danh sách đầy đủ. Nguyên tắc: mọi testcase đánh dấu "đã test" đều chạy thật qua HTTP với dữ liệu thật trên Supabase (tạo user/dữ liệu thật, gọi API thật, xoá sạch sau khi test) — không dùng mock/giả lập trừ khi ghi rõ (VD thanh toán MoMo/VNPay là MOCK theo đúng quyết định MVP). Một số tích hợp bên thứ ba (lời gọi Claude thật, gửi push FCM thật tới thiết bị) đã xác thực được credential hoạt động nhưng cần QA thủ công trên trình duyệt thật để xác nhận trải nghiệm đầu-cuối.

```bash
npm run lint       # ESLint
npx tsc --noEmit   # Type-check
npm run build      # Production build (bắt buộc pass trước khi merge)
```
