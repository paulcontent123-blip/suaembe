import { NextResponse } from "next/server";

import { parsePartnerFields } from "@/lib/admin/partner-validation";
import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PARTNER_COLUMNS } from "../route";

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

  const { fields, errors } = parsePartnerFields(body);

  if (Object.keys(fields).length === 0) errors.push("Không có thay đổi nào để lưu.");

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("partners")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(PARTNER_COLUMNS)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Không tìm thấy đối tác." }, { status: 404 });

  return NextResponse.json({ partner: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  const [{ count: servicesCount, error: servicesError }, { count: bookingsCount, error: bookingsError }] = await Promise.all([
    supabase.from("partner_services").select("id", { count: "exact", head: true }).eq("partner_id", id),
    supabase.from("partner_bookings").select("id", { count: "exact", head: true }).eq("partner_id", id),
  ]);

  if (servicesError) return NextResponse.json({ error: servicesError.message }, { status: 500 });
  if (bookingsError) return NextResponse.json({ error: bookingsError.message }, { status: 500 });

  if ((servicesCount ?? 0) > 0 || (bookingsCount ?? 0) > 0) {
    const { data, error } = await supabase
      .from("partners")
      .update({ status: "hidden", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(PARTNER_COLUMNS)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Không tìm thấy đối tác." }, { status: 404 });

    return NextResponse.json({ partner: data, soft_deleted: true });
  }

  const { error, count } = await supabase.from("partners").delete({ count: "exact" }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!count) return NextResponse.json({ error: "Không tìm thấy đối tác." }, { status: 404 });

  return NextResponse.json({ deleted: true, id });
}
