const ARTICLE_STATUSES = ["draft", "published", "archived"] as const;
type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

interface ArticleInput {
  category_id?: unknown;
  title?: unknown;
  slug?: unknown;
  excerpt?: unknown;
  content?: unknown;
  cover_url?: unknown;
  status?: unknown;
}

function str(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  return typeof value === "string" ? value.trim() || null : undefined;
}

export function parseArticleFields(body: ArticleInput): {
  fields: Record<string, unknown>;
  errors: string[];
} {
  const fields: Record<string, unknown> = {};
  const errors: string[] = [];

  const title = str(body.title);
  if (title !== undefined) fields.title = title;

  for (const key of ["category_id", "slug", "excerpt", "content", "cover_url"] as const) {
    const value = str(body[key]);
    if (value !== undefined) fields[key] = value;
  }

  if (body.status !== undefined) {
    if (typeof body.status === "string" && ARTICLE_STATUSES.includes(body.status as ArticleStatus)) {
      fields.status = body.status;
    } else {
      errors.push("status phải là draft, published hoặc archived.");
    }
  }

  return { fields, errors };
}
