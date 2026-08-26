import { NextResponse } from "next/server";

import { CONSULT_COLUMNS } from "@/app/api/consult/route";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Cần đăng nhập để xem yêu cầu tư vấn." }, { status: 401 });

  const { data, error } = await supabase
    .from("consult_requests")
    .select(CONSULT_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ consults: data ?? [] });
}
