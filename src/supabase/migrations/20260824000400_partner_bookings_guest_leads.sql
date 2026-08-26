-- UC-17/18/19 - Partner leads/bookings are handled by SuaEmbe/Admin as an
-- intermediary. Guests can submit contact/booking forms without logging in.

alter table public.partner_bookings
  alter column user_id drop not null;

alter table public.partner_bookings
  add column if not exists request_type text not null default 'booking'
    check (request_type in ('lead', 'booking')),
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists customer_email text,
  add column if not exists address text,
  add column if not exists note text,
  add column if not exists internal_note text,
  add column if not exists confirmed_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists forwarded_at timestamptz,
  add column if not exists forwarded_by uuid references public.users(id) on delete set null,
  add column if not exists notification_sent_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists partner_bookings_status_created_idx
  on public.partner_bookings(status, created_at desc);

create index if not exists partner_bookings_partner_status_idx
  on public.partner_bookings(partner_id, status);

drop policy if exists "partner_bookings_insert_own" on public.partner_bookings;
drop policy if exists "partner_bookings_delete_admin" on public.partner_bookings;

create policy "partner_bookings_insert_guest_or_own"
  on public.partner_bookings for insert
  with check (user_id is null or auth.uid() = user_id or public.is_admin());

create policy "partner_bookings_delete_admin"
  on public.partner_bookings for delete
  using (public.is_admin());
