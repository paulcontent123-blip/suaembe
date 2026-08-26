import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CATEGORY_COLUMNS = "id, parent_id, name, slug, description, sort_order, active";

interface CategoryInput {
  parent_id?: unknown;
  name?: unknown;
  slug?: unknown;
  description?: unknown;
  sort_order?: unknown;
  active?: unknown;
}

function parseCategoryFields(body: CategoryInput) {
  const fields: Record<string, string | number | boolean | null> = {};

  for (const key of ["parent_id", "name", "slug", "description"] as const) {
    const value = body[key];

    if (value === undefined) continue;

    if (value === null) {
      fields[key] = null;
    } else if (typeof value === "string") {
      fields[key] = value.trim() || null;
    }
  }

  if (typeof body.sort_order === "number" && Number.isFinite(body.sort_order)) {
    fields.sort_order = Math.trunc(body.sort_order);
  }

  if (typeof body.active === "boolean") fields.active = body.active;

  return fields;
}

// UC-23 - Quản Lý Nhãn Hàng, Danh Mục Và Sản Phẩm.
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  const { data, error } = await supabase
    .from("product_categories")
    .select(CATEGORY_COLUMNS)
    .order("sort_order")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ categories: data });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  let body: CategoryInput;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const fields = parseCategoryFields(body);

  if (!fields.name || !fields.slug) {
    return NextResponse.json({ error: "name và slug là bắt buộc." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("product_categories")
    .insert(fields)
    .select(CATEGORY_COLUMNS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ category: data }, { status: 201 });
}
