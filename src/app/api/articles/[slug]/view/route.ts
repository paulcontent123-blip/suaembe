import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// UC-20 - Đọc Tin Tức / Học Viện. Public API, không yêu cầu đăng nhập. Gọi
// function SECURITY DEFINER "increment_article_view" (xem migration
// 20260821000700_article_view_increment_function.sql) vì RLS
// "articles_update_admin" không cho khách UPDATE trực tiếp — function này
// chỉ +1 view_count của đúng 1 bài đang published theo slug, không mở quyền
// ghi rộng hơn.
export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc("increment_article_view", { p_slug: slug });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
