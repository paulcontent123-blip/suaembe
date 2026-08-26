import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { parsePartnerBookingFields } from "@/lib/admin/partner-validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const { fields, errors } = parsePartnerBookingFields(body);

  if (!fields.partner_id) errors.push("partner_id là bắt buộc.");
  if (!fields.customer_name) errors.push("customer_name là bắt buộc.");
  if (!fields.customer_phone) errors.push("customer_phone là bắt buộc.");
  if (!fields.scheduled_at) errors.push("scheduled_at là bắt buộc.");

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  const { data: partner, error: partnerError } = await supabase
    .from("partners")
    .select("id, name, partner_type")
    .eq("id", fields.partner_id as string)
    .eq("partner_type", "service")
    .maybeSingle();

  if (partnerError) return NextResponse.json({ error: partnerError.message }, { status: 500 });
  if (!partner) return NextResponse.json({ error: "Không tìm thấy đối tác dịch vụ đang hoạt động." }, { status: 404 });

  let serviceSnapshot: { id: string; name: string; price_from: number | null } | null = null;

  if (fields.partner_service_id) {
    const { data: service, error: serviceError } = await supabase
      .from("partner_services")
      .select("id, name, price_from")
      .eq("id", fields.partner_service_id as string)
      .eq("partner_id", partner.id)
      .maybeSingle();

    if (serviceError) return NextResponse.json({ error: serviceError.message }, { status: 500 });
    if (!service) return NextResponse.json({ error: "Không tìm thấy gói/dịch vụ đang hoạt động." }, { status: 404 });

    serviceSnapshot = service;
  }

  const bookingId = randomUUID();
  const createdAt = new Date().toISOString();
  const { error } = await supabase.from("partner_bookings").insert({
    id: bookingId,
    ...fields,
    user_id: user?.id ?? null,
    request_type: "booking",
    status: "pending",
    partner_type: partner.partner_type,
    service: fields.service ?? serviceSnapshot?.name ?? `Đặt lịch: ${partner.name}`,
    amount: fields.amount ?? serviceSnapshot?.price_from ?? null,
    created_at: createdAt,
    updated_at: createdAt,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    { booking: { id: bookingId, status: "pending", request_type: "booking", created_at: createdAt } },
    { status: 201 },
  );
}
