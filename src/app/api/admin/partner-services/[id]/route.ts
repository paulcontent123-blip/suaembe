import { NextResponse } from "next/server";

import { parsePartnerServiceFields } from "@/lib/admin/partner-validation";
import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SERVICE_COLUMNS } from "../../partners/[id]/services/route";

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

  const { fields, errors } = parsePartnerServiceFields(body);

  if (Object.keys(fields).length === 0) errors.push("Không có thay đổi nào để lưu.");

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("partner_services")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(SERVICE_COLUMNS)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Không tìm thấy gói/dịch vụ." }, { status: 404 });

  return NextResponse.json({ service: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  const { count: bookingsCount, error: bookingsError } = await supabase
    .from("partner_bookings")
    .select("id", { count: "exact", head: true })
    .eq("partner_service_id", id);

  if (bookingsError) return NextResponse.json({ error: bookingsError.message }, { status: 500 });

  if ((bookingsCount ?? 0) > 0) {
    const { data, error } = await supabase
      .from("partner_services")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(SERVICE_COLUMNS)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Không tìm thấy gói/dịch vụ." }, { status: 404 });

    return NextResponse.json({ service: data, soft_deleted: true });
  }

  const { error, count } = await supabase.from("partner_services").delete({ count: "exact" }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!count) return NextResponse.json({ error: "Không tìm thấy gói/dịch vụ." }, { status: 404 });

  return NextResponse.json({ deleted: true, id });
}
