import { NextResponse } from "next/server";

import { parsePartnerServiceFields } from "@/lib/admin/partner-validation";
import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export const SERVICE_COLUMNS =
  "id, partner_id, name, service_type, description, price_from, price_to, duration_minutes, active, created_at, updated_at, partners(id, name, partner_type)";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  const { data, error } = await supabase
    .from("partner_services")
    .select(SERVICE_COLUMNS)
    .eq("partner_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ services: data ?? [] });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  if (!fields.name) errors.push("name là bắt buộc.");

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  const { data: partner } = await supabase.from("partners").select("id").eq("id", id).maybeSingle();

  if (!partner) return NextResponse.json({ error: "Không tìm thấy đối tác." }, { status: 404 });

  const { data, error } = await supabase
    .from("partner_services")
    .insert({ ...fields, partner_id: id })
    .select(SERVICE_COLUMNS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ service: data }, { status: 201 });
}
