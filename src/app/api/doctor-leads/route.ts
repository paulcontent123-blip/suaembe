import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function stringValue(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

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

  const bsId = body.bs_id;
  const customerName = stringValue(body, "customer_name");
  const customerPhone = stringValue(body, "customer_phone");
  const customerEmail = stringValue(body, "customer_email");
  const note = stringValue(body, "note");

  if (!isUuid(bsId)) return NextResponse.json({ error: "Bác sĩ được chọn không hợp lệ." }, { status: 400 });
  if (!customerName) return NextResponse.json({ error: "Họ tên là bắt buộc." }, { status: 400 });
  if (!customerPhone) return NextResponse.json({ error: "Số điện thoại là bắt buộc." }, { status: 400 });
  if (customerName.length > 120) return NextResponse.json({ error: "Họ tên không được vượt quá 120 ký tự." }, { status: 400 });
  if (customerPhone.length > 30) return NextResponse.json({ error: "Số điện thoại không hợp lệ." }, { status: 400 });
  if (customerEmail.length > 160) return NextResponse.json({ error: "Email không được vượt quá 160 ký tự." }, { status: 400 });
  if (note.length > 2000) return NextResponse.json({ error: "Ghi chú không được vượt quá 2.000 ký tự." }, { status: 400 });

  const { data: doctor, error: doctorError } = await supabase
    .from("bs_nhi")
    .select("id, full_name, verified")
    .eq("id", bsId)
    .eq("verified", true)
    .maybeSingle();

  if (doctorError) return NextResponse.json({ error: doctorError.message }, { status: 500 });
  if (!doctor) return NextResponse.json({ error: "Bác sĩ không tồn tại hoặc chưa được xác minh." }, { status: 404 });

  const leadId = randomUUID();
  const createdAt = new Date().toISOString();
  const { error } = await supabase.from("partner_bookings").insert({
    id: leadId,
    user_id: user?.id ?? null,
    bs_id: doctor.id,
    partner_id: null,
    partner_service_id: null,
    partner_type: null,
    request_type: "doctor_lead",
    status: "pending",
    service: `Liên hệ ${doctor.full_name}`,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: customerEmail || null,
    note: note || null,
    created_at: createdAt,
    updated_at: createdAt,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    { lead: { id: leadId, bs_id: doctor.id, status: "pending", request_type: "doctor_lead", created_at: createdAt } },
    { status: 201 },
  );
}
