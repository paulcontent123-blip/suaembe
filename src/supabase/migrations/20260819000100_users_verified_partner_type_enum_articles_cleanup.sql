-- 1. Seller verification badge cho Chợ Mẹ & Bé C2C
alter table public.users
  add column if not exists is_verified boolean not null default false;

create index if not exists users_is_verified_idx on public.users(is_verified);

-- RLS hiện tại chỉ cho user xem/sửa hồ sơ của chính mình (users_select_own_or_admin),
-- nên buyer không thể đọc trực tiếp is_verified/full_name của seller khác qua bảng users.
-- Dùng RPC security definer để chỉ lộ đúng các cột an toàn (không có email/phone/password_hash),
-- thay vì mở policy select công khai trên toàn bộ bảng users.
create or replace function public.get_c2c_seller_profile(p_seller_id uuid)
returns table (id uuid, full_name text, avatar_url text, is_verified boolean)
language sql
stable
security definer
set search_path = public
as $$
  select id, full_name, avatar_url, is_verified
  from public.users
  where id = p_seller_id
$$;

grant execute on function public.get_c2c_seller_profile(uuid) to anon, authenticated;

-- 2. Enum hoá partners.partner_type theo 6 giá trị gợi ý trong database.md
do $$
begin
  create type public.partner_type as enum ('hospital', 'insurance', 'equipment', 'recovery', 'service', 'other');
exception
  when duplicate_object then null;
end $$;

alter table public.partners
  alter column partner_type drop default,
  alter column partner_type type public.partner_type using partner_type::public.partner_type,
  alter column partner_type set default 'other';

-- partner_bookings.partner_type là snapshot tại thời điểm booking, cùng domain giá trị nên enum hoá theo
alter table public.partner_bookings
  alter column partner_type type public.partner_type using
    case when partner_type is null then null else partner_type::public.partner_type end;

-- 3. Dọn cột articles.category (text tự do) trùng chức năng với articles.category_id (FK article_categories)
drop index if exists public.articles_status_category_idx;

alter table public.articles
  drop column if exists category;

create index if not exists articles_status_category_id_idx on public.articles(status, category_id);
