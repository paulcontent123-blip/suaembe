import { NextResponse } from "next/server";

import { parsePartnerBookingFields } from "@/lib/admin/partner-validation";
import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createPagination, parsePagination } from "@/lib/pagination";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export const BOOKING_COLUMNS =
  "id, user_id, bs_id, partner_id, partner_service_id, partner_type, service, amount, fee_amount, status, scheduled_at, request_type, customer_name, customer_phone, customer_email, address, note, internal_note, confirmed_at, completed_at, cancelled_at, forwarded_at, forwarded_by, notification_sent_at, created_at, updated_at, partners(id, name, partner_type), partner_services(id, name), bs_nhi(id, full_name, specialty, hospital)";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.trim();
  const requestType = searchParams.get("request_type")?.trim();
  const partnerType = searchParams.get("partner_type")?.trim();
  const { page, pageSize, from, to } = parsePagination(searchParams);

  let query = supabase
    .from("partner_bookings")
    .select(BOOKING_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status && status !== "all") query = query.eq("status", status);
  if (requestType && requestType !== "all") query = query.eq("request_type", requestType);
  if (partnerType && partnerType !== "all") query = query.eq("partner_type", partnerType);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const bookings = data ?? [];

  return NextResponse.json({
    items: bookings,
    bookings,
    pagination: createPagination(page, pageSize, count ?? 0),
  });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const { fields, errors } = parsePartnerBookingFields(body);

  if (!fields.customer_name) errors.push("customer_name là bắt buộc.");
  if (!fields.customer_phone) errors.push("customer_phone là bắt buộc.");
  if (!fields.request_type) fields.request_type = "booking";

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("partner_bookings")
    .insert({ ...fields, user_id: null })
    .select(BOOKING_COLUMNS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ booking: data }, { status: 201 });
}
