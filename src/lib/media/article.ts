import { destroyMediaAssets } from "@/lib/media/cleanup";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const ARTICLE_MEDIA_TYPES = ["cover", "article_inline"] as const;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isArticleDraftToken(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function extractArticleImageUrls(content: string | null | undefined): string[] {
  if (!content) return [];

  const urls: string[] = [];
  const imagePattern = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = imagePattern.exec(content)) !== null) {
    urls.push(match[1]);
  }

  return [...new Set(urls)];
}

export async function claimArticleDraftMedia(
  draftToken: string,
  articleId: string,
  uploaderId: string,
): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("media_assets")
    .update({ owner_table: "articles", owner_id: articleId })
    .eq("uploader_id", uploaderId)
    .is("owner_table", null)
    .is("owner_id", null)
    .in("asset_type", [...ARTICLE_MEDIA_TYPES])
    .eq("metadata->>draft_token", draftToken);

  return error?.message ?? null;
}

export async function cleanupArticleDraftMedia(draftToken: string, uploaderId: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { data: assets } = await admin
    .from("media_assets")
    .select("id, public_id")
    .eq("uploader_id", uploaderId)
    .is("owner_table", null)
    .is("owner_id", null)
    .in("asset_type", [...ARTICLE_MEDIA_TYPES])
    .eq("metadata->>draft_token", draftToken);

  await destroyMediaAssets(assets ?? []);
}

export async function cleanupArticleMedia(
  articleId: string,
  content: string | null | undefined,
  coverUrl: string | null | undefined,
): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { data: assets } = await admin
    .from("media_assets")
    .select("id, public_id, secure_url")
    .eq("owner_table", "articles")
    .eq("owner_id", articleId)
    .in("asset_type", [...ARTICLE_MEDIA_TYPES]);

  if (!assets || assets.length === 0) return;

  const kept = new Set([coverUrl, ...extractArticleImageUrls(content)].filter(Boolean));
  const removed = assets.filter((asset) => !asset.secure_url || !kept.has(asset.secure_url));

  await destroyMediaAssets(removed);
}
