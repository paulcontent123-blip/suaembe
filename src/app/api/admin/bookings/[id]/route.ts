import { NextResponse } from "next/server";

import { BOOKING_STATUSES, parsePartnerBookingFields } from "@/lib/admin/partner-validation";
import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BOOKING_COLUMNS } from "../route";

export const runtime = "nodejs";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  if (Object.keys(fields).length === 0) errors.push("Không có thay đổi nào để lưu.");

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  const now = new Date().toISOString();
  const nextFields: Record<string, unknown> = { ...fields, updated_at: now };

  if (fields.status && typeof fields.status === "string" && (BOOKING_STATUSES as readonly string[]).includes(fields.status)) {
    if (fields.status === "confirmed") {
      nextFields.confirmed_at = now;
      nextFields.notification_sent_at = now;
    }
    if (fields.status === "completed") nextFields.completed_at = now;
    if (fields.status === "cancelled") nextFields.cancelled_at = now;
  }

  if (body.forwarded === true) {
    nextFields.forwarded_at = now;
    nextFields.forwarded_by = admin.id;
  }

  const { data, error } = await supabase
    .from("partner_bookings")
    .update(nextFields)
    .eq("id", id)
    .select(BOOKING_COLUMNS)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Không tìm thấy booking/lead." }, { status: 404 });

  return NextResponse.json({
    booking: data,
    notification_stub:
      fields.status === "confirmed"
        ? "Đã đánh dấu notification_sent_at. Cần nối provider SMS/email thật ở bước tích hợp."
        : null,
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  const { error, count } = await supabase.from("partner_bookings").delete({ count: "exact" }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!count) return NextResponse.json({ error: "Không tìm thấy booking/lead." }, { status: 404 });

  return NextResponse.json({ deleted: true, id });
}
