import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BRAND_COLUMNS = "id, name, slug, logo_url, country, description, website_url, verified";

interface BrandInput {
  name?: unknown;
  slug?: unknown;
  logo_url?: unknown;
  country?: unknown;
  description?: unknown;
  website_url?: unknown;
  verified?: unknown;
}

function parseBrandFields(body: BrandInput) {
  const fields: Record<string, string | boolean | null> = {};

  for (const key of ["name", "slug", "logo_url", "country", "description", "website_url"] as const) {
    const value = body[key];

    if (value === undefined) continue;

    if (value === null) {
      fields[key] = null;
    } else if (typeof value === "string") {
      fields[key] = value.trim() || null;
    }
  }

  if (typeof body.verified === "boolean") fields.verified = body.verified;

  return fields;
}

// UC-23 - Quản Lý Nhãn Hàng, Danh Mục Và Sản Phẩm. Không có trong danh sách
// Admin APIs §6 (chỉ liệt kê CRUD cho listings/consults/bs-nhi) nhưng UC-23
// mô tả rõ luồng CRUD nhãn hàng — bổ sung endpoint theo đúng UC đã tả.
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  const { data, error } = await supabase.from("brands").select(BRAND_COLUMNS).order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ brands: data });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  let body: BrandInput;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const fields = parseBrandFields(body);

  if (!fields.name) {
    return NextResponse.json({ error: "name là bắt buộc." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("brands")
    .insert(fields)
    .select(BRAND_COLUMNS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ brand: data }, { status: 201 });
}
