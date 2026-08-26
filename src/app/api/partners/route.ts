import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PUBLIC_PARTNER_COLUMNS =
  "id, name, partner_type, category, description, logo_url, cover_url, phone, email, website_url, province, address, rating, verified, status";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type")?.trim();

  let query = supabase.from("partners").select(PUBLIC_PARTNER_COLUMNS).order("name");

  if (type && type !== "all") query = query.eq("partner_type", type);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ partners: data ?? [] });
}
