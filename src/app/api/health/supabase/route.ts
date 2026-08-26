import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      service: "supabase",
      auth: "reachable",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Supabase error";

    return NextResponse.json(
      {
        ok: false,
        service: "supabase",
        error: message,
      },
      { status: 503 },
    );
  }
}

