import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// UC-11 - Duyệt Tin Chợ C2C. PUT /api/admin/listings/:id/hide theo §6.
// Dùng chung cho cả "Từ chối" (tin đang pending) lẫn "Ẩn" (tin đã approved) —
// enum listing_status không có trạng thái "rejected" riêng, hidden là trạng
// thái duy nhất phù hợp cho cả hai hành động này.
export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  const { data, error } = await supabase
    .from("c2c_listings")
    .update({ status: "hidden" })
    .eq("id", id)
    .select("id, status")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy tin đăng." }, { status: 404 });
  }

  return NextResponse.json({ listing: data });
}
