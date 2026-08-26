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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "Không có thay đổi nào để lưu." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("brands")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(BRAND_COLUMNS)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy nhãn hàng." }, { status: 404 });
  }

  return NextResponse.json({ brand: data });
}
