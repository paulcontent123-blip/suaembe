import { NextResponse } from "next/server";

import { parseArticleFields } from "@/lib/admin/article-validation";
import { requireAdminProfile } from "@/lib/auth/require-admin";
import {
  getArticleRelationIds,
  parseRelatedArticleIds,
  replaceArticleRelations,
} from "@/lib/articles/related";
import { claimArticleDraftMedia, cleanupArticleMedia, isArticleDraftToken } from "@/lib/media/article";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ARTICLE_COLUMNS =
  "id, author_id, category_id, title, slug, excerpt, meta_description, content, cover_url, status, view_count, published_at, created_at, article_categories(id, name, slug)";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  if (Object.keys(fields).length === 0 && !mediaDraftToken) {
    return NextResponse.json({ error: "Không có thay đổi nào để lưu." }, { status: 400 });
  }

  // Bước 6 UC-21: lần đầu chuyển sang published thì gán published_at = now();
  // các lần sửa/ẩn/xuất bản lại sau đó giữ nguyên mốc xuất bản gốc.
  if (fields.status === "published") {
    const { data: current } = await supabase.from("articles").select("published_at").eq("id", id).maybeSingle();

    if (!current?.published_at) fields.published_at = new Date().toISOString();
  }

  // Sau khi lưu, claim media nháp và dọn các ảnh bài viết không còn được tham chiếu.
  const result =
    Object.keys(fields).length > 0
      ? await supabase.from("articles").update(fields).eq("id", id).select(ARTICLE_COLUMNS).maybeSingle()
      : await supabase.from("articles").select(ARTICLE_COLUMNS).eq("id", id).maybeSingle();
  const { data, error } = result;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy bài viết." }, { status: 404 });
  }

  if (mediaDraftToken) {
    const claimError = await claimArticleDraftMedia(mediaDraftToken, data.id, admin.id);

    if (claimError) console.error("[articles] Khong the gan media nhap vao bai viet:", claimError);
  }

  if (relatedResult.ids !== undefined) {
    const relationError = await replaceArticleRelations(supabase, data.id, relatedResult.ids);

    if (relationError) return NextResponse.json({ error: relationError }, { status: 500 });
  }

  await cleanupArticleMedia(data.id, data.content, data.cover_url);

  return NextResponse.json({
    article: { ...data, related_article_ids: await getArticleRelationIds(supabase, data.id) },
  });
}
