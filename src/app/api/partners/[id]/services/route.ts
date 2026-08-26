import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PUBLIC_SERVICE_COLUMNS =
  "id, partner_id, name, service_type, description, price_from, price_to, duration_minutes, active";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("partner_services")
    .select(PUBLIC_SERVICE_COLUMNS)
    .eq("partner_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ services: data ?? [] });
}
