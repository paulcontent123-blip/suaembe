import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createPagination, parsePagination } from "@/lib/pagination";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export const ADMIN_CONSULT_COLUMNS =
  // consult_requests có hai FK tới users: user_id (mẹ bỉm) và forwarded_by (Admin).
  // Chỉ rõ FK để PostgREST không nhầm relationship khi embed thông tin người hỏi.
  "id, user_id, bs_id, question, baby_age_months, answer, answered_at, forwarded_at, forwarded_by, internal_note, status, rating, created_at, users!consult_requests_user_id_fkey(id, full_name, email, phone), bs_nhi(id, full_name, specialty, hospital, avatar_url, response_hours, verified)";

const CONSULT_STATUSES = ["pending", "answered", "closed", "cancelled"] as const;

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.trim();
  const q = searchParams.get("q")?.trim();
  const { page, pageSize, from, to } = parsePagination(searchParams);

  let query = supabase
    .from("consult_requests")
    .select(ADMIN_CONSULT_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status && status !== "all" && (CONSULT_STATUSES as readonly string[]).includes(status)) {
    query = query.eq("status", status);
  }

  if (q) query = query.or(`question.ilike.%${q}%,internal_note.ilike.%${q}%`);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const consults = data ?? [];

  return NextResponse.json({
    items: consults,
    consults,
    pagination: createPagination(page, pageSize, count ?? 0),
  });
}
