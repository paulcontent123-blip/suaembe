import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ARTICLE_COLUMNS =
  "id, category_id, title, slug, excerpt, cover_url, view_count, published_at, article_categories(id, name, slug, parent_id)";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

// UC-20 - Đọc Tin Tức / Học Viện. Public API. RLS "articles_read_published_or_admin"
// tự lọc status='published' cho khách; đọc lồng article_categories trong 1
// lần gọi để tránh N+1 query từ frontend.
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);

  const categoryIds = searchParams.get("category_id")?.split(",").map((v) => v.trim()).filter(Boolean);
  const q = searchParams.get("q")?.trim();
  const sort = searchParams.get("sort") === "views" ? "view_count" : "published_at";
  const limit = Math.min(Number(searchParams.get("limit")) || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  let query = supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .order(sort, { ascending: false })
    .range(offset, offset + limit - 1);

  if (categoryIds && categoryIds.length > 0) query = query.in("category_id", categoryIds);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ articles: data });
}
