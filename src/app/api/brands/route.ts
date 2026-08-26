import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// UC-07 - Xem Bách Hóa Và Sản Phẩm. Public API, không yêu cầu đăng nhập.
// Dùng server client (không phải admin) để RLS "brands_public_read_verified"
// tự lọc — khách chỉ thấy brand verified=true, admin thấy tất cả.
export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url, country, description, website_url, verified")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ brands: data });
}
