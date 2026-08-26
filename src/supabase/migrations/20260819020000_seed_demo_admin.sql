-- Seed tài khoản Admin demo: admin@demo.vn / 123456
--
-- CẢNH BÁO:
-- - Chỉ dùng cho môi trường dev/staging để test đăng nhập admin panel.
-- - KHÔNG chạy migration này trên project production.
-- - Phải xoá tài khoản này trước khi go-live thật (đã ghi trong DEPLOY_suaembe.md,
--   mục "Xóa trước khi Go Live").
-- - Ghi thẳng vào schema auth (auth.users, auth.identities) là kỹ thuật không chính thức
--   của Supabase (chỉ dùng để seed nhanh) — nếu Supabase nâng cấp cấu trúc auth schema,
--   migration này có thể cần chỉnh lại. Nên test trên project dev trước khi áp dụng
--   nơi khác. Cách an toàn hơn về lâu dài: dùng Supabase Admin API
--   (supabase.auth.admin.createUser) từ 1 script/seed riêng thay vì insert SQL trực tiếp.
--
-- Không dùng khối "do $$ ... end $$" để tránh rủi ro với các tool chạy SQL cắt file
-- theo dấu ";" mà không hiểu cú pháp dollar-quote của PL/pgSQL (dễ làm gãy khối do-block
-- giữa chừng). Toàn bộ migration chỉ gồm các câu lệnh SQL thuần, có thể chạy tuần tự.

-- Đảm bảo crypt()/gen_salt() (pgcrypto) resolve được dù extension được cài ở schema nào.
-- Dùng SET (không phải SET LOCAL) vì không chắc tool chạy file này có gói toàn bộ
-- trong 1 transaction hay chạy tách từng statement — SET LOCAL sẽ mất tác dụng
-- ngay khi statement đó kết thúc nếu chạy tách rời.
set search_path to public, extensions, pg_catalog;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'authenticated',
  'authenticated',
  'admin@demo.vn',
  crypt('123456', gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
where not exists (
  select 1 from auth.users where email = 'admin@demo.vn'
);

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111'::uuid,
  jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111', 'email', 'admin@demo.vn'),
  'email',
  now(),
  now(),
  now()
where not exists (
  select 1 from auth.identities
  where user_id = '11111111-1111-1111-1111-111111111111'::uuid
    and provider = 'email'
);

-- Đồng bộ hồ sơ profile trong public.users, lấy id thật từ auth.users
-- (phòng trường hợp tài khoản đã tồn tại từ trước với id khác).
insert into public.users (id, email, role, full_name, is_verified)
select id, email, 'admin', 'Admin Demo', true
from auth.users
where email = 'admin@demo.vn'
on conflict (id) do update set role = 'admin';
