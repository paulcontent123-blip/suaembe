-- UC-14 - Lead liên hệ bác sĩ nhi qua SữaEmbe/Admin.
-- Bác sĩ vẫn giữ hồ sơ riêng trong bs_nhi; partner_bookings chỉ lưu yêu cầu trung gian.

alter table public.partner_bookings
  add column if not exists bs_id uuid references public.bs_nhi(id) on delete set null;

create index if not exists partner_bookings_bs_id_idx
  on public.partner_bookings(bs_id);

alter table public.partner_bookings
  drop constraint if exists partner_bookings_request_type_check;

alter table public.partner_bookings
  add constraint partner_bookings_request_type_check
  check (
    request_type in ('lead', 'booking', 'doctor_lead')
    and (request_type <> 'doctor_lead' or (bs_id is not null and partner_id is null))
  );
