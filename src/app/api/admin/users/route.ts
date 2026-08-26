import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createPagination, parsePagination } from "@/lib/pagination";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const USER_COLUMNS = "id, email, phone, role, full_name, is_verified, created_at";

// UC-27 - Quản Lý Người Dùng (Admin). GET theo §6, bổ sung tìm kiếm theo
// email/SĐT và lọc theo role (bước 2 của UC-27) — chưa có trong §6 nhưng UC
// mô tả rõ luồng này.
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const role = searchParams.get("role");
  const { page, pageSize, from, to } = parsePagination(searchParams);

  let query = supabase
    .from("users")
    .select(USER_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) query = query.or(`email.ilike.%${q}%,phone.ilike.%${q}%`);
  if (role === "admin" || role === "user") query = query.eq("role", role);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = data ?? [];

  return NextResponse.json({
    items: users,
    users,
    pagination: createPagination(page, pageSize, count ?? 0),
  });
}
