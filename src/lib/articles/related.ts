import type { SupabaseClient } from "@supabase/supabase-js";

import type { Article } from "@/lib/articles/types";

export const MAX_RELATED_ARTICLES = 6;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const RELATED_ARTICLE_COLUMNS =
  "id, category_id, title, slug, excerpt, meta_description, cover_url, view_count, published_at, article_categories(id, name, slug, parent_id)";

export interface RelatedArticleIdsResult {
  ids: string[] | undefined;
  error?: string;
}

export function parseRelatedArticleIds(value: unknown): RelatedArticleIdsResult {
  if (value === undefined) return { ids: undefined };
  if (value === null) return { ids: [] };

  if (!Array.isArray(value) || value.some((id) => typeof id !== "string" || !UUID_PATTERN.test(id))) {
    return { ids: [], error: "related_article_ids phải là danh sách UUID hợp lệ." };
  }

  const ids = [...new Set(value)];

  if (ids.length > MAX_RELATED_ARTICLES) {
    return { ids: [], error: `Chỉ được chọn tối đa ${MAX_RELATED_ARTICLES} bài viết liên quan.` };
  }

  return { ids };
}

export async function getArticleRelationMap(
  supabase: SupabaseClient,
  articleIds?: string[],
): Promise<{ map: Map<string, string[]>; error?: string }> {
  const map = new Map<string, string[]>();

  if (articleIds && articleIds.length === 0) return { map };

  let query = supabase
    .from("article_relations")
    .select("article_id, related_article_id, sort_order")
    .order("sort_order", { ascending: true });

  if (articleIds) query = query.in("article_id", articleIds);

  const { data, error } = await query;

  if (error) return { map, error: error.message };

  for (const row of data ?? []) {
    const ids = map.get(row.article_id) ?? [];
    ids.push(row.related_article_id);
    map.set(row.article_id, ids);
  }

  return { map };
}

export async function getArticleRelationIds(supabase: SupabaseClient, articleId: string): Promise<string[]> {
  const { map } = await getArticleRelationMap(supabase, [articleId]);

  return map.get(articleId) ?? [];
}

export async function replaceArticleRelations(
  supabase: SupabaseClient,
  articleId: string,
  relatedArticleIds: string[],
): Promise<string | null> {
  const ids = [...new Set(relatedArticleIds)].filter((id) => id !== articleId).slice(0, MAX_RELATED_ARTICLES);

  if (ids.length > 0) {
    const { data: targets, error: targetError } = await supabase
      .from("articles")
      .select("id")
      .in("id", ids);

    if (targetError) return targetError.message;
    if ((targets ?? []).length !== ids.length) return "Một hoặc nhiều bài viết liên quan không tồn tại.";
  }

  const { error: deleteError } = await supabase.from("article_relations").delete().eq("article_id", articleId);

  if (deleteError) return deleteError.message;
  if (ids.length === 0) return null;

  const { error: insertError } = await supabase.from("article_relations").insert(
    ids.map((relatedArticleId, sortOrder) => ({
      article_id: articleId,
      related_article_id: relatedArticleId,
      sort_order: sortOrder,
    })),
  );

  return insertError?.message ?? null;
}

export async function getRelatedArticles(
  supabase: SupabaseClient,
  articleId: string,
): Promise<{ articles: Article[]; error?: string }> {
  const { data: links, error: linksError } = await supabase
    .from("article_relations")
    .select("related_article_id, sort_order")
    .eq("article_id", articleId)
    .order("sort_order", { ascending: true });

  if (linksError) return { articles: [], error: linksError.message };

  const ids = (links ?? []).map((link) => link.related_article_id as string);
  if (ids.length === 0) return { articles: [] };

  const { data, error } = await supabase
    .from("articles")
    .select(RELATED_ARTICLE_COLUMNS)
    .in("id", ids)
    .eq("status", "published");

  if (error) return { articles: [], error: error.message };

  const byId = new Map<string, Article>();

  for (const rawArticle of data ?? []) {
    const category = Array.isArray(rawArticle.article_categories)
      ? rawArticle.article_categories[0] ?? null
      : rawArticle.article_categories ?? null;

    byId.set(
      rawArticle.id,
      { ...rawArticle, article_categories: category } as unknown as Article,
    );
  }

  return {
    articles: ids.map((id) => byId.get(id)).filter((article): article is Article => Boolean(article?.slug)),
  };
}
