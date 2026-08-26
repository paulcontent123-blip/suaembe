-- Fix: migration seed-admin trước (20260819020000) insert vào auth.users nhưng bỏ
-- trống (NULL) vài cột text mà GoTrue map vào kiểu string không nullable trong Go.
-- NULL ở các cột này khiến GoTrue lỗi khi scan hàng của admin@demo.vn, gây ra:
--   - auth.admin.listUsers() => 500 "Database error finding users"
--   - Đăng nhập admin@demo.vn => 401 sai thay vì đăng nhập được
-- Fix: set các cột này thành chuỗi rỗng '' thay vì NULL, chỉ áp dụng cho dòng
-- admin@demo.vn (không đụng tới user thật khác).

update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  reauthentication_token = coalesce(reauthentication_token, '')
where email = 'admin@demo.vn';
