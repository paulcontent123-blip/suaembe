import { NextResponse } from "next/server";

import { parsePartnerFields } from "@/lib/admin/partner-validation";
import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createPagination, parsePagination } from "@/lib/pagination";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export const PARTNER_COLUMNS =
  "id, name, partner_type, category, description, logo_url, cover_url, phone, email, website_url, province, address, rating, verified, status, created_at, updated_at";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const type = searchParams.get("type")?.trim();
  const status = searchParams.get("status")?.trim();
  const { page, pageSize, from, to } = parsePagination(searchParams);

  let query = supabase
    .from("partners")
    .select(PARTNER_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) query = query.or(`name.ilike.%${q}%,category.ilike.%${q}%,description.ilike.%${q}%,province.ilike.%${q}%`);
  if (type && type !== "all") query = query.eq("partner_type", type);
  if (status && status !== "all") query = query.eq("status", status);

  const visiblePartnersQuery = supabase
    .from("partners")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .eq("verified", true);
  const activeServicesQuery = supabase
    .from("partner_services")
    .select("id", { count: "exact", head: true })
    .eq("active", true);

  const [partnersResult, visiblePartnersResult, activeServicesResult] = await Promise.all([
    query,
    visiblePartnersQuery,
    activeServicesQuery,
  ]);

  const { data, error, count } = partnersResult;

  if (error || visiblePartnersResult.error || activeServicesResult.error) {
    return NextResponse.json(
      { error: (error ?? visiblePartnersResult.error ?? activeServicesResult.error)?.message ?? "Không tải được dữ liệu đối tác." },
      { status: 500 },
    );
  }

  const partners = data ?? [];

  return NextResponse.json({
    items: partners,
    partners,
    pagination: createPagination(page, pageSize, count ?? 0),
    stats: {
      visible_partners: visiblePartnersResult.count ?? 0,
      active_services: activeServicesResult.count ?? 0,
    },
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

  const { fields, errors } = parsePartnerFields(body);

  if (!fields.name) errors.push("name là bắt buộc.");
  if (!fields.partner_type) errors.push("partner_type là bắt buộc.");

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  const { data, error } = await supabase.from("partners").insert(fields).select(PARTNER_COLUMNS).single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ partner: data }, { status: 201 });
}
