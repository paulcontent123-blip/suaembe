import { NextResponse } from "next/server";

import { parseArticleFields } from "@/lib/admin/article-validation";
import { requireAdminProfile } from "@/lib/auth/require-admin";
import { cleanupRemovedMediaUrls } from "@/lib/media/cleanup";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ARTICLE_COLUMNS =
  "id, author_id, category_id, title, slug, excerpt, content, cover_url, status, view_count, published_at, created_at, article_categories(id, name, slug)";

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

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "Không có thay đổi nào để lưu." }, { status: 400 });
  }

  // Bước 6 UC-21: lần đầu chuyển sang published thì gán published_at = now();
  // các lần sửa/ẩn/xuất bản lại sau đó giữ nguyên mốc xuất bản gốc.
  if (fields.status === "published") {
    const { data: current } = await supabase.from("articles").select("published_at").eq("id", id).maybeSingle();

    if (!current?.published_at) fields.published_at = new Date().toISOString();
  }

  // Ghi lại cover_url cũ trước khi update để dọn Cloudinary/media_assets nếu
  // bị thay thế hoặc gỡ bỏ — tránh rò rỉ file khi đổi ảnh cover.
  let previousCoverUrl: string | null = null;

  if ("cover_url" in fields) {
    const { data: before } = await supabase.from("articles").select("cover_url").eq("id", id).maybeSingle();

    previousCoverUrl = before?.cover_url ?? null;
  }

  const { data, error } = await supabase
    .from("articles")
    .update(fields)
    .eq("id", id)
    .select(ARTICLE_COLUMNS)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy bài viết." }, { status: 404 });
  }

  if ("cover_url" in fields && previousCoverUrl) {
    await cleanupRemovedMediaUrls([previousCoverUrl], [fields.cover_url as string | null]);
  }

  return NextResponse.json({ article: data });
}
