-- UC-09/10/11/12 MVP mới: "Gửi form pass đồ C2C" không bắt buộc đăng nhập,
-- Admin là trung gian duyệt tin, và "Đặt mua C2C thanh toán thường" thay cho
-- Escrow (xem document/USECASE.md, document/database.md). escrow_transactions
-- không bị xoá — giữ lại làm hướng phát triển tương lai (UC-13), chỉ không
-- còn nằm trong luồng chính.

-- 1. c2c_listings: cho phép người bán ẩn danh (không có tài khoản).
alter table public.c2c_listings
  alter column seller_id drop not null,
  add column if not exists seller_name text,
  add column if not exists quantity_available integer not null default 1
    check (quantity_available >= 0);

-- Người bán có tài khoản: seller_id bắt buộc khớp auth.uid(). Người bán ẩn
-- danh (chưa đăng nhập): seller_id null, bắt buộc có seller_name để admin
-- còn biết liên hệ với ai khi duyệt tin (UC-11 bước 2).
drop policy if exists "c2c_listings_insert_own" on public.c2c_listings;
create policy "c2c_listings_insert_own_or_guest"
  on public.c2c_listings for insert
  with check (
    (seller_id is null and auth.uid() is null and seller_name is not null)
    or auth.uid() = seller_id
  );

-- 2. c2c_orders — đơn đặt mua C2C thanh toán thường (thay cho escrow_transactions
-- trong luồng chính). Người mua cũng có thể là khách vãng lai (buyer_id null).
do $$
begin
  create type public.c2c_order_payment_status as enum ('pending', 'paid', 'failed', 'refunded');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.c2c_order_status as enum (
    'pending_admin_review', 'confirmed', 'processing', 'completed', 'cancelled', 'partially_available'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.c2c_orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.c2c_listings(id) on delete restrict,
  buyer_id uuid references public.users(id) on delete set null,
  buyer_name text not null,
  buyer_phone text not null,
  buyer_email text,
  shipping_address text,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  total_amount integer not null check (total_amount >= 0),
  payment_method text,
  payment_ref text,
  payment_status public.c2c_order_payment_status not null default 'pending',
  order_status public.c2c_order_status not null default 'pending_admin_review',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists c2c_orders_listing_id_idx on public.c2c_orders(listing_id);
create index if not exists c2c_orders_buyer_id_idx on public.c2c_orders(buyer_id);
create index if not exists c2c_orders_order_status_idx on public.c2c_orders(order_status);

alter table public.c2c_orders enable row level security;

-- Ai cũng đặt mua được (kể cả khách vãng lai); nếu đã đăng nhập thì buyer_id
-- phải khớp chính mình, không được gán hộ người khác.
create policy "c2c_orders_insert_any"
  on public.c2c_orders for insert
  with check (buyer_id is null or auth.uid() = buyer_id);

-- Admin xử lý đơn (UC-11/UC-12); người mua có tài khoản xem lại đơn của
-- chính mình nếu sau này có màn "đơn hàng của tôi".
create policy "c2c_orders_select_admin_or_buyer"
  on public.c2c_orders for select
  using (public.is_admin() or (buyer_id is not null and auth.uid() = buyer_id));

create policy "c2c_orders_update_admin"
  on public.c2c_orders for update
  using (public.is_admin())
  with check (public.is_admin());
