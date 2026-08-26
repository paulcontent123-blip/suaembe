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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "Không có thay đổi nào để lưu." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("article_categories")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(CATEGORY_COLUMNS)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy chuyên mục." }, { status: 404 });
  }

  return NextResponse.json({ category: data });
}
