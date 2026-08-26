import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// UC-07 - Xem Bách Hóa Và Sản Phẩm. Public API. RLS
// "product_categories_public_read_active" tự lọc active=true cho khách.
export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("product_categories")
    .select("id, parent_id, name, slug, description, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categories: data });
}
