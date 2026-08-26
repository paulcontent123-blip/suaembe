create extension if not exists "pgcrypto";

do $$
begin
  create type public.app_role as enum ('admin', 'user');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.baby_gender as enum ('male', 'female', 'other');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.listing_status as enum ('pending', 'approved', 'sold', 'hidden');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.escrow_status as enum ('holding', 'released', 'refunded', 'disputed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.consult_status as enum ('pending', 'answered', 'closed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.article_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.product_status as enum ('draft', 'active', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.partner_status as enum ('pending', 'active', 'inactive', 'hidden');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.notification_status as enum ('pending', 'sent', 'read', 'failed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.milestone_record_status as enum ('achieved', 'in_progress', 'not_observed', 'delayed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.feeding_status as enum ('pending', 'upcoming', 'done', 'skipped', 'cancelled');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  phone text,
  password_hash text,
  role public.app_role not null default 'user',
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null unique,
  provider text not null default 'fcm',
  platform text,
  device_id text,
  enabled boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  channel text not null default 'in_app',
  status public.notification_status not null default 'pending',
  scheduled_at timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.babies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text,
  gender public.baby_gender,
  birth_date date,
  weight_g integer check (weight_g is null or weight_g > 0),
  height_cm numeric(5,1) check (height_cm is null or height_cm > 0),
  head_cm numeric(5,1) check (head_cm is null or head_cm > 0),
  current_milk_stage text,
  updated_at timestamptz not null default now()
);

create table if not exists public.who_growth_standards (
  id uuid primary key default gen_random_uuid(),
  standard_code text,
  gender text not null check (gender in ('male', 'female')),
  indicator text not null,
  age_months integer not null check (age_months >= 0),
  l numeric,
  m numeric,
  s numeric,
  p3 numeric,
  p5 numeric,
  p10 numeric,
  p15 numeric,
  p25 numeric,
  p50 numeric,
  p75 numeric,
  p85 numeric,
  p90 numeric,
  p95 numeric,
  p97 numeric,
  source text not null default 'WHO Child Growth Standards',
  version text not null default 'WHO-2006',
  created_at timestamptz not null default now(),
  unique (gender, indicator, age_months, version)
);

create table if not exists public.baby_measurements (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  measured_at timestamptz not null default now(),
  age_months numeric(5,2) check (age_months is null or age_months >= 0),
  weight_g integer check (weight_g is null or weight_g > 0),
  height_cm numeric(5,1) check (height_cm is null or height_cm > 0),
  head_cm numeric(5,1) check (head_cm is null or head_cm > 0),
  weight_percentile numeric(5,2) check (weight_percentile is null or weight_percentile between 0 and 100),
  height_percentile numeric(5,2) check (height_percentile is null or height_percentile between 0 and 100),
  head_percentile numeric(5,2) check (head_percentile is null or head_percentile between 0 and 100),
  weight_z_score numeric(5,2),
  height_z_score numeric(5,2),
  head_z_score numeric(5,2),
  assessment text,
  created_at timestamptz not null default now()
);

create table if not exists public.development_milestones (
  id uuid primary key default gen_random_uuid(),
  age_months integer not null check (age_months >= 0),
  category text not null,
  title text not null,
  description text,
  expected_from_month integer check (expected_from_month is null or expected_from_month >= 0),
  expected_to_month integer check (expected_to_month is null or expected_to_month >= 0),
  source text,
  version text not null default 'default',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.baby_milestone_records (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  milestone_id uuid not null references public.development_milestones(id) on delete cascade,
  status public.milestone_record_status not null default 'not_observed',
  achieved_at date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (baby_id, milestone_id)
);

create table if not exists public.baby_feeding_schedule (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  scheduled_date date not null,
  scheduled_time time,
  meal_type text,
  title text not null,
  description text,
  amount_ml integer check (amount_ml is null or amount_ml > 0),
  status public.feeding_status not null default 'pending',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  logo_url text,
  country text,
  description text,
  website_url text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.product_categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete set null,
  category_id uuid references public.product_categories(id) on delete set null,
  name text not null,
  slug text unique,
  description text,
  short_description text,
  image_urls text[] not null default '{}',
  price_vnd integer check (price_vnd is null or price_vnd >= 0),
  original_price_vnd integer check (original_price_vnd is null or original_price_vnd >= 0),
  unit text,
  sku text unique,
  attributes jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  status public.product_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.milk_products (
  product_id uuid primary key references public.products(id) on delete cascade,
  stage text,
  age_min_months integer check (age_min_months is null or age_min_months >= 0),
  age_max_months integer check (age_max_months is null or age_max_months >= 0),
  weight_g integer check (weight_g is null or weight_g > 0),
  key_ingredients jsonb not null default '{}'::jsonb,
  nutrition_tags text[] not null default '{}',
  rating numeric(3,2) check (rating is null or rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0)
);

create table if not exists public.c2c_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  category text,
  condition text,
  price integer not null check (price >= 0),
  original_price integer check (original_price is null or original_price >= 0),
  province text,
  delivery_method text,
  description text,
  images text[] not null default '{}',
  phone_hidden text,
  zalo text,
  escrow_enabled boolean not null default true,
  status public.listing_status not null default 'pending',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.escrow_transactions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.c2c_listings(id) on delete restrict,
  buyer_id uuid not null references public.users(id) on delete restrict,
  seller_id uuid not null references public.users(id) on delete restrict,
  amount integer not null check (amount >= 0),
  fee_amount integer check (fee_amount is null or fee_amount >= 0),
  payment_method text,
  payment_ref text,
  status public.escrow_status not null default 'holding',
  held_at timestamptz not null default now(),
  released_at timestamptz,
  check (buyer_id <> seller_id)
);

create table if not exists public.bs_nhi (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  specialty text,
  hospital text,
  experience_years integer check (experience_years is null or experience_years >= 0),
  bio text,
  avatar_url text,
  rating numeric(3,2) check (rating is null or rating between 0 and 5),
  consult_count integer not null default 0 check (consult_count >= 0),
  is_online boolean not null default false,
  response_hours integer not null default 2 check (response_hours > 0),
  verified boolean not null default false
);

create table if not exists public.consult_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  bs_id uuid references public.bs_nhi(id) on delete set null,
  question text not null,
  baby_age_months integer check (baby_age_months is null or baby_age_months >= 0),
  answer text,
  answered_at timestamptz,
  forwarded_at timestamptz,
  forwarded_by uuid references public.users(id) on delete set null,
  internal_note text,
  status public.consult_status not null default 'pending',
  rating smallint check (rating is null or rating between 1 and 5),
  created_at timestamptz not null default now()
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  partner_type text not null,
  category text,
  description text,
  logo_url text,
  cover_url text,
  phone text,
  email text,
  website_url text,
  province text,
  address text,
  rating numeric(3,2) check (rating is null or rating between 0 and 5),
  verified boolean not null default false,
  status public.partner_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_services (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  name text not null,
  service_type text,
  description text,
  price_from integer check (price_from is null or price_from >= 0),
  price_to integer check (price_to is null or price_to >= 0),
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete set null,
  partner_service_id uuid references public.partner_services(id) on delete set null,
  partner_type text,
  service text,
  amount integer check (amount is null or amount >= 0),
  fee_amount integer check (fee_amount is null or fee_amount >= 0),
  status public.booking_status not null default 'pending',
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.article_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.article_categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.users(id) on delete set null,
  category_id uuid references public.article_categories(id) on delete set null,
  title text not null,
  slug text unique,
  category text,
  excerpt text,
  content text,
  cover_url text,
  status public.article_status not null default 'draft',
  view_count integer not null default 0 check (view_count >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid references public.users(id) on delete set null,
  owner_table text,
  owner_id uuid,
  asset_type text,
  provider text not null default 'cloudinary',
  bucket text,
  public_id text,
  url text not null,
  secure_url text,
  mime_type text,
  size_bytes integer check (size_bytes is null or size_bytes >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  alt_text text,
  metadata jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists users_role_idx on public.users(role);
create index if not exists device_tokens_user_id_idx on public.device_tokens(user_id);
create index if not exists device_tokens_enabled_idx on public.device_tokens(enabled);
create index if not exists notifications_user_id_status_idx on public.notifications(user_id, status);
create index if not exists notifications_scheduled_at_idx on public.notifications(scheduled_at);
create index if not exists babies_user_id_idx on public.babies(user_id);
create index if not exists who_growth_standards_lookup_idx on public.who_growth_standards(gender, indicator, age_months, version);
create index if not exists baby_measurements_baby_id_measured_at_idx on public.baby_measurements(baby_id, measured_at desc);
create index if not exists development_milestones_age_category_idx on public.development_milestones(age_months, category);
create index if not exists baby_milestone_records_baby_id_idx on public.baby_milestone_records(baby_id);
create index if not exists baby_feeding_schedule_baby_date_idx on public.baby_feeding_schedule(baby_id, scheduled_date);
create index if not exists brands_slug_idx on public.brands(slug);
create index if not exists brands_verified_idx on public.brands(verified);
create index if not exists product_categories_parent_id_idx on public.product_categories(parent_id);
create index if not exists product_categories_active_sort_idx on public.product_categories(active, sort_order);
create index if not exists products_brand_id_idx on public.products(brand_id);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_status_idx on public.products(status);
create index if not exists products_tags_gin_idx on public.products using gin(tags);
create index if not exists products_attributes_gin_idx on public.products using gin(attributes);
create index if not exists milk_products_age_idx on public.milk_products(age_min_months, age_max_months);
create index if not exists milk_products_nutrition_tags_gin_idx on public.milk_products using gin(nutrition_tags);
create index if not exists c2c_listings_seller_id_idx on public.c2c_listings(seller_id);
create index if not exists c2c_listings_status_category_idx on public.c2c_listings(status, category);
create index if not exists c2c_listings_province_idx on public.c2c_listings(province);
create index if not exists escrow_transactions_listing_id_idx on public.escrow_transactions(listing_id);
create index if not exists escrow_transactions_buyer_id_idx on public.escrow_transactions(buyer_id);
create index if not exists escrow_transactions_seller_id_idx on public.escrow_transactions(seller_id);
create index if not exists bs_nhi_verified_specialty_idx on public.bs_nhi(verified, specialty);
create index if not exists consult_requests_user_id_idx on public.consult_requests(user_id);
create index if not exists consult_requests_bs_id_idx on public.consult_requests(bs_id);
create index if not exists consult_requests_forwarded_by_idx on public.consult_requests(forwarded_by);
create index if not exists partners_type_status_idx on public.partners(partner_type, status);
create index if not exists partners_verified_idx on public.partners(verified);
create index if not exists partners_province_idx on public.partners(province);
create index if not exists partner_services_partner_id_idx on public.partner_services(partner_id);
create index if not exists partner_services_active_idx on public.partner_services(active);
create index if not exists partner_bookings_user_id_idx on public.partner_bookings(user_id);
create index if not exists partner_bookings_partner_id_idx on public.partner_bookings(partner_id);
create index if not exists partner_bookings_partner_service_id_idx on public.partner_bookings(partner_service_id);
create index if not exists article_categories_parent_id_idx on public.article_categories(parent_id);
create index if not exists article_categories_active_sort_idx on public.article_categories(active, sort_order);
create index if not exists articles_author_id_idx on public.articles(author_id);
create index if not exists articles_category_id_idx on public.articles(category_id);
create index if not exists articles_status_category_idx on public.articles(status, category);
create index if not exists articles_slug_idx on public.articles(slug);
create index if not exists media_assets_owner_idx on public.media_assets(owner_table, owner_id);
create index if not exists media_assets_uploader_id_idx on public.media_assets(uploader_id);
create index if not exists media_assets_public_idx on public.media_assets(is_public);

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

alter table public.users enable row level security;
alter table public.device_tokens enable row level security;
alter table public.notifications enable row level security;
alter table public.babies enable row level security;
alter table public.who_growth_standards enable row level security;
alter table public.baby_measurements enable row level security;
alter table public.development_milestones enable row level security;
alter table public.baby_milestone_records enable row level security;
alter table public.baby_feeding_schedule enable row level security;
alter table public.brands enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.milk_products enable row level security;
alter table public.c2c_listings enable row level security;
alter table public.escrow_transactions enable row level security;
alter table public.bs_nhi enable row level security;
alter table public.consult_requests enable row level security;
alter table public.partners enable row level security;
alter table public.partner_services enable row level security;
alter table public.partner_bookings enable row level security;
alter table public.article_categories enable row level security;
alter table public.articles enable row level security;
alter table public.media_assets enable row level security;

create policy "users_select_own_or_admin"
  on public.users for select
  using (auth.uid() = id or public.is_admin());

create policy "users_insert_own"
  on public.users for insert
  with check (auth.uid() = id);

create policy "users_update_own_or_admin"
  on public.users for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

create policy "device_tokens_manage_own_or_admin"
  on public.device_tokens for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "notifications_read_own_or_admin"
  on public.notifications for select
  using (auth.uid() = user_id or public.is_admin());

create policy "notifications_update_own_or_admin"
  on public.notifications for update
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "notifications_insert_admin"
  on public.notifications for insert
  with check (public.is_admin());

create policy "babies_manage_own_or_admin"
  on public.babies for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "who_growth_standards_public_read"
  on public.who_growth_standards for select
  using (true);

create policy "who_growth_standards_admin_write"
  on public.who_growth_standards for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "baby_measurements_manage_own_or_admin"
  on public.baby_measurements for all
  using (
    public.is_admin()
    or exists (
      select 1
      from public.babies
      where babies.id = baby_measurements.baby_id
        and babies.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1
      from public.babies
      where babies.id = baby_measurements.baby_id
        and babies.user_id = auth.uid()
    )
  );

create policy "development_milestones_public_read_active"
  on public.development_milestones for select
  using (active = true or public.is_admin());

create policy "development_milestones_admin_write"
  on public.development_milestones for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "baby_milestone_records_manage_own_or_admin"
  on public.baby_milestone_records for all
  using (
    public.is_admin()
    or exists (
      select 1
      from public.babies
      where babies.id = baby_milestone_records.baby_id
        and babies.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1
      from public.babies
      where babies.id = baby_milestone_records.baby_id
        and babies.user_id = auth.uid()
    )
  );

create policy "baby_feeding_schedule_manage_own_or_admin"
  on public.baby_feeding_schedule for all
  using (
    public.is_admin()
    or exists (
      select 1
      from public.babies
      where babies.id = baby_feeding_schedule.baby_id
        and babies.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1
      from public.babies
      where babies.id = baby_feeding_schedule.baby_id
        and babies.user_id = auth.uid()
    )
  );

create policy "brands_public_read_verified"
  on public.brands for select
  using (verified = true or public.is_admin());

create policy "brands_admin_write"
  on public.brands for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "product_categories_public_read_active"
  on public.product_categories for select
  using (active = true or public.is_admin());

create policy "product_categories_admin_write"
  on public.product_categories for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "products_public_read_active"
  on public.products for select
  using (status = 'active' or public.is_admin());

create policy "products_admin_write"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "milk_products_public_read_active_product"
  on public.milk_products for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.products
      where products.id = milk_products.product_id
        and products.status = 'active'
    )
  );

create policy "milk_products_admin_write"
  on public.milk_products for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "c2c_listings_read_public_approved_or_owner"
  on public.c2c_listings for select
  using (status = 'approved' or auth.uid() = seller_id or public.is_admin());

create policy "c2c_listings_insert_own"
  on public.c2c_listings for insert
  with check (auth.uid() = seller_id);

create policy "c2c_listings_update_owner_or_admin"
  on public.c2c_listings for update
  using (auth.uid() = seller_id or public.is_admin())
  with check (auth.uid() = seller_id or public.is_admin());

create policy "c2c_listings_delete_owner_or_admin"
  on public.c2c_listings for delete
  using (auth.uid() = seller_id or public.is_admin());

create policy "escrow_transactions_read_participant_or_admin"
  on public.escrow_transactions for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id or public.is_admin());

create policy "escrow_transactions_insert_buyer_or_admin"
  on public.escrow_transactions for insert
  with check (auth.uid() = buyer_id or public.is_admin());

create policy "escrow_transactions_update_admin"
  on public.escrow_transactions for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "bs_nhi_read_verified_or_admin"
  on public.bs_nhi for select
  using (verified = true or public.is_admin());

create policy "bs_nhi_insert_admin"
  on public.bs_nhi for insert
  with check (public.is_admin());

create policy "bs_nhi_update_admin"
  on public.bs_nhi for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "bs_nhi_delete_admin"
  on public.bs_nhi for delete
  using (public.is_admin());

create policy "consult_requests_insert_own"
  on public.consult_requests for insert
  with check (auth.uid() = user_id);

create policy "consult_requests_read_owner_or_admin"
  on public.consult_requests for select
  using (auth.uid() = user_id or public.is_admin());

create policy "consult_requests_update_admin"
  on public.consult_requests for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "partners_public_read_active_verified"
  on public.partners for select
  using ((status = 'active' and verified = true) or public.is_admin());

create policy "partners_admin_write"
  on public.partners for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "partner_services_public_read_active_partner"
  on public.partner_services for select
  using (
    public.is_admin()
    or (
      active = true
      and exists (
        select 1
        from public.partners
        where partners.id = partner_services.partner_id
          and partners.status = 'active'
          and partners.verified = true
      )
    )
  );

create policy "partner_services_admin_write"
  on public.partner_services for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "partner_bookings_insert_own"
  on public.partner_bookings for insert
  with check (auth.uid() = user_id);

create policy "partner_bookings_read_own_or_admin"
  on public.partner_bookings for select
  using (auth.uid() = user_id or public.is_admin());

create policy "partner_bookings_update_admin"
  on public.partner_bookings for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "article_categories_public_read_active"
  on public.article_categories for select
  using (active = true or public.is_admin());

create policy "article_categories_admin_write"
  on public.article_categories for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "articles_read_published_or_admin"
  on public.articles for select
  using (status = 'published' or public.is_admin());

create policy "articles_insert_admin"
  on public.articles for insert
  with check (public.is_admin());

create policy "articles_update_admin"
  on public.articles for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "articles_delete_admin"
  on public.articles for delete
  using (public.is_admin());

create policy "media_assets_read_public_owner_or_admin"
  on public.media_assets for select
  using (is_public = true or auth.uid() = uploader_id or public.is_admin());

create policy "media_assets_insert_owner_or_admin"
  on public.media_assets for insert
  with check (auth.uid() = uploader_id or public.is_admin());

create policy "media_assets_update_owner_or_admin"
  on public.media_assets for update
  using (auth.uid() = uploader_id or public.is_admin())
  with check (auth.uid() = uploader_id or public.is_admin());

create policy "media_assets_delete_owner_or_admin"
  on public.media_assets for delete
  using (auth.uid() = uploader_id or public.is_admin());
