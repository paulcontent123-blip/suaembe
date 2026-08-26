import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const LISTING_COLUMNS =
  "id, seller_id, seller_name, title, category, condition, price, original_price, province, delivery_method, description, images, zalo, phone_hidden, escrow_enabled, quantity_available, status, created_at, users(email, full_name, is_verified)";

// UC-11 - Duyệt Tin Chợ C2C. Hàng đợi tin chờ duyệt cho admin, theo đúng
// GET /api/admin/listings/pending trong §6.
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  const { data, error } = await supabase
    .from("c2c_listings")
    .select(LISTING_COLUMNS)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ listings: data });
}
