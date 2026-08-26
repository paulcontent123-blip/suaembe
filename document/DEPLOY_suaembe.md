# SuaEmbe.com — Deploy & Handoff Guide

## File cần upload
```
suaembe_v2.html  →  public_html/index.html
```
Chỉ 1 file duy nhất. Frontend chạy hoàn toàn không cần backend.

---

## Deploy Frontend

### Vercel (khuyên dùng — nhanh nhất, free)
```bash
# Cách 1: Drag & drop
1. Vào app.vercel.com
2. Kéo file index.html vào ô deploy
3. Custom domain: suaembe.com
4. SSL tự động bật

# Cách 2: CLI
npm i -g vercel
vercel deploy --prod index.html
```

### Shared Hosting (cPanel)
```
1. cPanel → File Manager → public_html/
2. Upload suaembe_v2.html, rename → index.html
3. Trỏ domain suaembe.com → public_html/
4. cPanel → SSL/TLS → Let's Encrypt → bật HTTPS
```

### VPS + Nginx
```nginx
server {
    listen 80;
    server_name suaembe.com www.suaembe.com;
    root /var/www/suaembe;
    index index.html;
    location / { try_files $uri /index.html; }
}
```
```bash
scp suaembe_v2.html user@server:/var/www/suaembe/index.html
nginx -t && systemctl reload nginx
certbot --nginx -d suaembe.com -d www.suaembe.com
```

---

## Backend Stack (dev team tích hợp)

| Component | Stack | Ghi chú |
|-----------|-------|---------|
| Database | PostgreSQL / Supabase | Schema trong TechSpec §7 |
| API | Node.js Express + TypeScript | REST + JWT |
| AI Gợi ý sữa | Claude API (`claude-sonnet-4-6`) | Prompt phân tích dinh dưỡng |
| File upload | Cloudinary (free 25GB) | Ảnh listing C2C, avatar BS |
| Payment Escrow | VNPay + MoMo Business | 2% phí giao dịch |
| Push notification | Firebase FCM | Nhắc lịch ăn, tư vấn BS |
| Email | Resend.com | Đăng ký, xác nhận booking |
| Search | Meilisearch | Tìm kiếm sản phẩm, listing |
| Hosting backend | Railway / Fly.io | Free tier ổn, scale tốt |

---

## API Endpoints cần build

### Auth
```
POST /api/auth/register     — Đăng ký (email + phone + password)
POST /api/auth/login        — Đăng nhập → JWT
POST /api/auth/logout       — Logout
GET  /api/auth/me           — Profile hiện tại
```

### AI Gợi ý sữa
```
POST /api/ai/suggest-milk   — Input: {age, weight, condition, budget, priorities}
                              Output: [{product, match_percent, reason}]
```

### Chợ C2C
```
GET  /api/listings          — Danh sách (filter: cat, province, price)
POST /api/listings          — Đăng bán (auth required)
GET  /api/listings/:id      — Chi tiết
PUT  /api/listings/:id      — Sửa (seller only)
DELETE /api/listings/:id    — Ẩn (seller/admin)
POST /api/listings/:id/buy  — Mua → tạo Escrow transaction
POST /api/escrow/:id/confirm — Xác nhận nhận hàng → release tiền
```

### Bác sĩ Nhi
```
GET  /api/bs-nhi            — Danh sách BS (filter: specialty)
POST /api/consult           — Gửi câu hỏi (auth required)
PUT  /api/consult/:id/answer — BS trả lời (bs_nhi role)
```

### Đối tác / Booking
```
GET  /api/partners          — Danh sách đối tác (filter: type)
POST /api/bookings          — Đặt dịch vụ (auth required)
GET  /api/bookings/me       — Lịch sử booking của user
```

### Admin
```
GET  /api/admin/listings/pending   — Tin C2C chờ duyệt
PUT  /api/admin/listings/:id/approve
GET  /api/admin/stats              — Dashboard stats
GET  /api/admin/users
PUT  /api/admin/bs-nhi/:id/verify  — Xác minh BS Nhi
```

---

## Test Checklist sau deploy

- [ ] Trang chủ load OK, marquee nhãn sữa + đối tác chạy 2 hàng
- [ ] Click từng mục nav → chuyển trang đúng, không trắng trang
- [ ] Bách Hóa: click sidebar danh mục → panel giữa + brands cập nhật
- [ ] Chợ Mẹ & Bé: click "Đăng bán" → form mở đầy đủ fields
- [ ] Filter tin chợ theo danh mục (Sữa dư, Quần áo, Xe đẩy...)
- [ ] Công cụ Mẹ → AI gợi ý sữa → kết quả Top 3 hiện ra
- [ ] Công cụ Mẹ → Tính ngày dự sinh → kết quả tính đúng
- [ ] Đối tác → 5 tab hoạt động (Bệnh viện / Bảo hiểm / BS / TB / Dịch vụ)
- [ ] Tin tức → 3 tab (Tin tức / Nhật ký bé / Học viện Làm Mẹ)
- [ ] Login: `admin@demo.vn / 123456` → vào admin panel đúng
- [ ] Admin: click sidebar items → switch section đúng
- [ ] Đăng xuất → về trang chủ, admin panel ẩn hoàn toàn
- [ ] Chrome DevTools Console → **ZERO JS errors**
- [ ] Mobile responsive (Chrome DevTools → Toggle device toolbar)

---

## Xóa trước khi Go Live
```
Demo credentials trong HTML:
- admin@demo.vn / 123456  (dòng ~login modal)
Thay bằng xác thực thật từ backend API.
```

---

## Revenue Model

| Nguồn | Cơ chế | Đơn giá |
|-------|--------|---------|
| Escrow C2C | 2% phí giao dịch thành công | 2% GMV |
| Affiliate Bách hóa | Hoa hồng từ nhãn hàng | 5–15% |
| Quảng cáo nhãn sữa | Banner / Featured slot | 2–5M/tháng/nhãn |
| Premium membership | Nhật ký nâng cao, ưu tiên BS | 99–199K/tháng |
| Booking đối tác | 10% booking fee | 10% value |
| Affiliate BV/BH | Lead fee | 200–500K/lead |

**Dự kiến: 40–100 triệu VNĐ/tháng** (tháng 6 sau vận hành)

---
SuaEmbe.com · VEA Group · 2026
