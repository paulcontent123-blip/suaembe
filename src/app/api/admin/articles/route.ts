import { NextResponse } from "next/server";

import { parseArticleFields } from "@/lib/admin/article-validation";
import { requireAdminProfile } from "@/lib/auth/require-admin";
import {
  getArticleRelationIds,
  getArticleRelationMap,
  parseRelatedArticleIds,
  replaceArticleRelations,
} from "@/lib/articles/related";
import { claimArticleDraftMedia, cleanupArticleMedia, isArticleDraftToken } from "@/lib/media/article";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ARTICLE_COLUMNS =
  "id, author_id, category_id, title, slug, excerpt, meta_description, content, cover_url, status, view_count, published_at, created_at, article_categories(id, name, slug)";

// UC-21 - Quản Lý Chuyên Mục Và Bài Viết. Admin xem toàn bộ bài viết (kể cả
// draft/archived — RLS "articles_read_published_or_admin" chỉ ẩn với khách,
// is_admin() vẫn cho đọc hết).
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const requestedPage = Number(searchParams.get("page"));
  const requestedPageSize = Number(searchParams.get("page_size"));
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const pageSize =
    Number.isFinite(requestedPageSize) && requestedPageSize > 0
      ? Math.min(Math.floor(requestedPageSize), 50)
      : 8;
  const status = searchParams.get("status");
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("articles")
    .select(ARTICLE_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false });

  if (status === "draft" || status === "published" || status === "archived") {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { map: relationMap, error: relationError } = await getArticleRelationMap(
    supabase,
    (data ?? []).map((article) => article.id),
  );

  if (relationError) return NextResponse.json({ error: relationError }, { status: 500 });

  const articles = (data ?? []).map((article) => ({
      ...article,
      related_article_ids: relationMap.get(article.id) ?? [],
    }));
  const total = count ?? 0;

  return NextResponse.json({
    articles,
    items: articles,
    pagination: {
      page,
      page_size: pageSize,
      total,
      has_more: from + articles.length < total,
    },
  });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const { fields, errors } = parseArticleFields(body);
  const relatedResult = parseRelatedArticleIds(body.related_article_ids);
  const mediaDraftTokenValue = body.media_draft_token;
  const mediaDraftToken = typeof mediaDraftTokenValue === "string" ? mediaDraftTokenValue : null;

  if (relatedResult.error) errors.push(relatedResult.error);

  if (mediaDraftTokenValue !== undefined && mediaDraftTokenValue !== null && !isArticleDraftToken(mediaDraftTokenValue)) {
    errors.push("media_draft_token khong hop le.");
  }

  if (!fields.title) errors.push("title là bắt buộc.");

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  // Bước 5/6 UC-21: admin lưu nháp (draft) hoặc xuất bản luôn (published) —
  // nếu xuất bản ngay từ lúc tạo mà chưa có published_at thì gán now().
  if (fields.status === "published" && !fields.published_at) {
    fields.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("articles")
    .insert({ ...fields, author_id: admin.id })
    .select(ARTICLE_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Slug đã được sử dụng bởi bài viết khác." }, { status: 409 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (mediaDraftToken) {
    const claimError = await claimArticleDraftMedia(mediaDraftToken, data.id, admin.id);

    if (claimError) console.error("[articles] Khong the gan media nhap vao bai viet:", claimError);
  }

  const relationError = await replaceArticleRelations(supabase, data.id, relatedResult.ids ?? []);

  if (relationError) return NextResponse.json({ error: relationError }, { status: 500 });

  await cleanupArticleMedia(data.id, data.content, data.cover_url);

  return NextResponse.json(
    { article: { ...data, related_article_ids: await getArticleRelationIds(supabase, data.id) } },
    { status: 201 },
  );
}
