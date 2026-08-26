import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_CONSULT_COLUMNS } from "@/app/api/admin/consults/route";

export const runtime = "nodejs";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  let body: Record<string, unknown> = {};

  try {
    body = await request.json();
  } catch {
    // Body có thể bỏ trống khi Admin chỉ bấm "Đã chuyển tiếp".
  }

  const internalNote = body.internal_note;

  if (internalNote !== undefined && internalNote !== null && typeof internalNote !== "string") {
    return NextResponse.json({ error: "internal_note phải là chuỗi." }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    forwarded_at: new Date().toISOString(),
    forwarded_by: admin.id,
  };

  if (typeof internalNote === "string") update.internal_note = internalNote.trim() || null;

  const { data, error } = await supabase
    .from("consult_requests")
    .update(update)
    .eq("id", id)
    .select(ADMIN_CONSULT_COLUMNS)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Không tìm thấy yêu cầu tư vấn." }, { status: 404 });

  return NextResponse.json({ consult: data });
}
