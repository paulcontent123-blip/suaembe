# SuaEmbe.com — Hướng Dẫn Deploy Thật

> File này trước đây mô tả kiến trúc cũ (1 file HTML tĩnh + backend Express riêng trên Railway/Fly.io) — **không còn đúng**. Ứng dụng thật là **Next.js 15 (App Router) + Supabase**, cần chạy Node.js server thật liên tục, không phải web tĩnh. Hướng dẫn dưới đây phản ánh đúng kiến trúc hiện tại.

## Yêu cầu bắt buộc của server đích

Ứng dụng có hàng chục API route động (`src/app/api/**`), trang SSR, và 1 cron job nội bộ (`/api/cron/dispatch-notifications`). Vì vậy server đích **bắt buộc phải là VPS** (có quyền SSH cài đặt Node.js) — **Shared Hosting/cPanel không chạy được**, vì loại hosting đó chỉ phục vụ file tĩnh/PHP, không chạy được tiến trình Node.js sống.

Cấu hình tối thiểu khuyến nghị: **1-2GB RAM, 1 vCPU** cho traffic nhỏ-vừa giai đoạn đầu.

---

## Bước 1 — Cài đặt môi trường trên VPS

SSH vào VPS, chạy lần lượt (giả định Ubuntu/Debian — đa số VPS Vietnix dùng hệ này):

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài Node.js 20 LTS (khuyến nghị — ổn định cho production)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Kiểm tra
node --version   # nên ra v20.x
npm --version

# Cài Git
sudo apt install -y git

# Cài PM2 (giữ Next.js server chạy nền, tự khởi động lại khi crash/reboot)
sudo npm install -g pm2

# Cài Nginx (reverse proxy + SSL)
sudo apt install -y nginx

# Cài Certbot (SSL miễn phí Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
```

---

## Bước 2 — Lấy code về VPS

Repo đã có sẵn trên GitHub (`https://github.com/paulcontent123-blip/suaembe.git`):

```bash
cd /var/www
sudo git clone https://github.com/paulcontent123-blip/suaembe.git
sudo chown -R $USER:$USER suaembe
cd suaembe
npm install
```

---

## Bước 3 — Tạo file `.env` thật trên server

File `.env` **không nằm trong git** (bị `.gitignore` chặn theo đúng thiết kế bảo mật) — phải tự tạo mới trên VPS:

```bash
nano .env
```

Dán đầy đủ nội dung `.env` thật (lấy từ máy dev, hoặc từ nơi lưu trữ credential an toàn của team) — **nhớ đổi 2 giá trị sau cho khớp domain thật**, khác với bản local:

```
NEXT_PUBLIC_SITE_URL=https://suaembe.com
```

(và tương tự nếu có domain callback riêng cho VNPay/MoMo sau này). Lưu file (Ctrl+O, Enter, Ctrl+X trong `nano`).

---

## Bước 4 — Build và chạy bằng PM2

```bash
npm run build
pm2 start npm --name "suaembe" -- start
pm2 save
pm2 startup   # chạy lệnh nó in ra để PM2 tự khởi động cùng VPS sau khi reboot
```

Kiểm tra đang chạy:

```bash
pm2 status
pm2 logs suaembe   # xem log thời gian thực, Ctrl+C để thoát xem log (không dừng app)
curl http://localhost:3000   # phải trả về HTML trang chủ
```

---

## Bước 5 — Cấu hình Nginx reverse proxy + SSL

Tạo file cấu hình:

```bash
sudo nano /etc/nginx/sites-available/suaembe
```

Nội dung:

```nginx
server {
    listen 80;
    server_name suaembe.com www.suaembe.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Kích hoạt + bật SSL miễn phí:

```bash
sudo ln -s /etc/nginx/sites-available/suaembe /etc/nginx/sites-enabled/
sudo nginx -t   # kiểm tra cú pháp trước khi reload
sudo systemctl reload nginx

sudo certbot --nginx -d suaembe.com -d www.suaembe.com
# Certbot tự sửa file Nginx để redirect HTTP -> HTTPS và tự gia hạn SSL định kỳ
```

---

## Bước 6 — Áp dụng migration database (chạy 1 lần, từ máy local hoặc VPS đều được)

Không bắt buộc chạy trên VPS — migration chỉ cần chạy 1 lần nhắm thẳng vào Supabase project, không phụ thuộc server nào:

```bash
cd src/supabase
supabase link --project-ref <project-ref>
supabase db push
```

---

## Bước 7 — Cron job (ưu điểm của VPS: không giới hạn tần suất như Vercel Hobby)

```bash
crontab -e
```

Thêm dòng (chạy mỗi 5 phút, gọi đúng route dispatch push notification):

```
*/5 * * * * curl -s -X POST https://suaembe.com/api/cron/dispatch-notifications -H "Authorization: Bearer <CRON_SECRET_thật>" >> /var/log/suaembe-cron.log 2>&1
```

Thay `<CRON_SECRET_thật>` bằng giá trị thật trong `.env`.

---

## Cập nhật code sau này (redeploy thủ công)

```bash
cd /var/www/suaembe
git pull
npm install
npm run build
pm2 restart suaembe
```

Muốn tự động hoá bước này khi có commit mới (CI/CD), có thể dựng thêm GitHub Actions gọi SSH deploy script — chưa cấu hình sẵn trong dự án, làm sau nếu cần.

---

## Danh sách biến môi trường cần có trong `.env` trên VPS

Giống hệt danh sách đã dùng cho Vercel — xem `README.md` mục "Bắt đầu" để biết đầy đủ nhóm biến (Supabase, Cloudinary, Claude, Firebase, Redis, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`).

---

## Bảo mật cơ bản nên làm thêm

```bash
# Chỉ mở port cần thiết
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Không để .env lộ ra ngoài qua Nginx (Next.js đã tự loại trừ, nhưng kiểm tra thêm)
curl https://suaembe.com/.env   # phải trả 404, không phải nội dung file
```
