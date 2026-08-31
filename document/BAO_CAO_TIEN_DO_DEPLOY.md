# Báo Cáo Tiến Độ Deploy — SuaEmbe.com trên Vietnix

**Gửi:** Techlead
**Ngày:** 29/08/2026
**Phạm vi:** Tiến độ đưa SuaEmbe.com lên môi trường production tại Vietnix (cPanel Shared Hosting), sự cố gặp phải trong quá trình build/chạy, và ghi nhận từ bộ phận kỹ thuật Vietnix.

---

## 1. Tổng quan

Hạ tầng thực tế đang có tại Vietnix là **cPanel Shared Hosting** (gói "Hosting WordPress 2"), không phải VPS như giả định ban đầu. Đã triển khai SuaEmbe.com lên qua tính năng **Node.js Selector (Passenger)** của cPanel — hiện **website đã chạy được tại `suaembe.com`**.

---

## 2. Diễn biến triển khai

1. **Build trực tiếp trên Vietnix thất bại** — `npm run build` trên Terminal cPanel liên tục báo lỗi `spawn EAGAIN`. Xác nhận qua `ulimit -a`/`ps`/`free -h` là các giới hạn tài nguyên (CloudLinux LVE) không hiển thị được ở tầng shell thông thường.
2. **Vietnix xác nhận qua ticket hỗ trợ:** gói Shared Hosting hiện tại **không hỗ trợ chạy quá trình build Node.js**, khuyến nghị dùng VPS nếu cần tự build trên server.
3. **Giải pháp áp dụng:** build ứng dụng ở môi trường WSL (Windows Subsystem for Linux) trên máy local — không bị giới hạn LVE — sau đó đóng gói kết quả build (`.next/`) và upload thủ công qua cPanel File Manager vào đúng thư mục ứng dụng trên Vietnix. Source code và `node_modules` vẫn lấy qua `git clone` + `npm install` chạy thẳng trên Vietnix (2 bước này không bị chặn, chỉ riêng bước `build` là không chạy được).
4. **Kết quả:** website chạy thành công, kiểm tra thực tế `suaembe.com/doi-tac` trả về đúng dữ liệu.

---

## 3. Sự cố phát sinh: Number of Processes (NPROC) đạt 100/100

Sau khi bật Node.js App ở chế độ Production, bảng "Tài nguyên sử dụng" trên Vietnix Portal liên tục báo **Number of Processes: 100/100 (100%)**, kèm cảnh báo: *"Hosting đã sử dụng 100% Number Of Processes, điều này có thể khiến website hoạt động không ổn định."*

**Đã thử các bước giảm tải:**
- Thêm biến môi trường `UV_THREADPOOL_SIZE=1` (giảm số luồng nội bộ Node.js tạo ra) — không cải thiện.
- Tạm dừng app Node.js thứ hai cùng tài khoản (`vieclamcongnhan.com`) để cô lập nguyên nhân — chỉ giảm được 1% (99/100), không đáng kể.

→ Không tự khắc phục được từ phía ứng dụng/cấu hình cPanel, nên đã liên hệ trực tiếp bộ phận kỹ thuật Vietnix.

### Phản hồi chính thức từ kỹ thuật Vietnix (kiểm tra lúc ~22:45 cùng ngày)

> - Sau khi thực hiện reload Hosting, Node.js App của website suaembe.com đang ở trạng thái tắt và Number of Processes không còn tăng cao dẫn đến mức full 100/100 nữa.
> - Kiểm tra Resource Usage ghi nhận có phát sinh số lượng lớn tiến trình liên quan đến Node.js App của website suaembe.com, dạng tiến trình `lsnode:/home/suaembec/suaembe`.
> - Sau khi bật lại Node.js App suaembe.com, Number of Processes tăng nhanh và đạt giới hạn 100/100.
> - **Kết luận của Vietnix: khả năng NPROC tăng cao có mối liên hệ trực tiếp với thời điểm Node.js App suaembe.com được khởi động.**
> - Đề nghị kiểm tra lại source và tối ưu thêm nếu được.
> - Trường hợp cần chủ động cài đặt/tuỳ chỉnh môi trường để build Node.js, khuyến nghị dùng gói VPS (cho phép tuỳ chỉnh cấu hình môi trường theo nhu cầu).

Vietnix xác nhận độc lập, từ phía server, đúng như nghi vấn ban đầu: **tiến trình `lsnode` do chính Node.js App của SuaEmbe sinh ra là nguyên nhân trực tiếp**, không phải do ứng dụng khác dùng chung tài khoản hay do baseline hệ thống.

---

## 4. Trạng thái hiện tại

- **Cả 2 website (`suaembe.com` và `vieclamcongnhan.com`) vẫn hoạt động bình thường** dù Number of Processes đang ở mức 100%.
- Chưa ghi nhận lỗi 502/timeout trong quá trình kiểm tra thủ công, nhưng đây là mức đã chạm trần giới hạn của gói hosting — rủi ro mất ổn định sẽ tăng khi có traffic thật/nhiều người dùng đồng thời.
- **Sẽ tiếp tục tìm hướng tối ưu source để giảm số tiến trình (`lsnode`) mà Node.js App sinh ra** (khả năng liên quan tới cấu hình Passenger process pool, hoặc cách custom server hiện tại khởi tạo Next.js) trước khi cân nhắc phương án nâng cấp hạ tầng.

---

## 5. Đề xuất bước tiếp theo

1. Tối ưu phía ứng dụng: xem xét dùng chế độ Next.js `output: "standalone"` để giảm phụ thuộc lúc khởi động, kiểm tra cấu hình Passenger (`PassengerMinInstances`/pool size) nếu cPanel cho phép chỉnh.
2. Theo dõi thêm 1-2 ngày xem hệ thống có tự ổn định về đúng baseline sau khi Node App chạy ổn định (không phải lúc mới khởi động) hay không.
3. Nếu vẫn giữ nguyên ở mức tới hạn khi có traffic thật, cần quyết định: chấp nhận rủi ro ở giai đoạn demo/soft-launch, hay nâng cấp lên VPS như Vietnix đã khuyến nghị (tham khảo: https://vietnix.vn/vps/).
