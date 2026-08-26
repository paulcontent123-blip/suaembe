import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ARTICLE_DETAIL_COLUMNS =
  "id, category_id, title, slug, excerpt, content, cover_url, view_count, published_at, article_categories(id, name, slug, parent_id)";

// UC-20 - Đọc Tin Tức / Học Viện. Public API, trang đọc bài theo slug. RLS
// "articles_read_published_or_admin" tự lọc status='published' cho khách.
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_DETAIL_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy bài viết." }, { status: 404 });
  }

  return NextResponse.json({ article: data });
}
