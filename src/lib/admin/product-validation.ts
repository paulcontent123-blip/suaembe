const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;
type ProductStatus = (typeof PRODUCT_STATUSES)[number];

interface ProductInput {
  brand_id?: unknown;
  category_id?: unknown;
  name?: unknown;
  slug?: unknown;
  description?: unknown;
  short_description?: unknown;
  image_urls?: unknown;
  price_vnd?: unknown;
  original_price_vnd?: unknown;
  unit?: unknown;
  sku?: unknown;
  attributes?: unknown;
  tags?: unknown;
  status?: unknown;
  outbound_url?: unknown;
}

export interface MilkInput {
  stage?: unknown;
  age_min_months?: unknown;
  age_max_months?: unknown;
  weight_g?: unknown;
  key_ingredients?: unknown;
  nutrition_tags?: unknown;
  rating?: unknown;
  review_count?: unknown;
}

function str(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  return typeof value === "string" ? value.trim() || null : undefined;
}

function num(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function strArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return undefined;

  return value.filter((v): v is string => typeof v === "string");
}

export function parseProductFields(body: ProductInput): {
  fields: Record<string, unknown>;
  errors: string[];
} {
  const fields: Record<string, unknown> = {};
  const errors: string[] = [];

  const name = str(body.name);
  if (name !== undefined) fields.name = name;

  for (const key of [
    "brand_id",
    "category_id",
    "slug",
    "description",
    "short_description",
    "unit",
    "sku",
    "outbound_url",
  ] as const) {
    const value = str(body[key]);
    if (value !== undefined) fields[key] = value;
  }

  const priceVnd = num(body.price_vnd);
  if (priceVnd === undefined && body.price_vnd !== undefined) errors.push("price_vnd phải là số.");
  else if (priceVnd !== undefined) fields.price_vnd = priceVnd;

  const originalPriceVnd = num(body.original_price_vnd);
  if (originalPriceVnd === undefined && body.original_price_vnd !== undefined) {
    errors.push("original_price_vnd phải là số.");
  } else if (originalPriceVnd !== undefined) {
    fields.original_price_vnd = originalPriceVnd;
  }

  const imageUrls = strArray(body.image_urls);
  if (imageUrls !== undefined) fields.image_urls = imageUrls;

  const tags = strArray(body.tags);
  if (tags !== undefined) fields.tags = tags;

  if (body.attributes !== undefined) {
    if (body.attributes === null || (typeof body.attributes === "object" && !Array.isArray(body.attributes))) {
      fields.attributes = body.attributes ?? {};
    } else {
      errors.push("attributes phải là object.");
    }
  }

  if (body.status !== undefined) {
    if (typeof body.status === "string" && PRODUCT_STATUSES.includes(body.status as ProductStatus)) {
      fields.status = body.status;
    } else {
      errors.push("status phải là draft, active hoặc archived.");
    }
  }

  return { fields, errors };
}

export function parseMilkFields(body: MilkInput): { fields: Record<string, unknown>; errors: string[] } {
  const fields: Record<string, unknown> = {};
  const errors: string[] = [];

  const stage = str(body.stage);
  if (stage !== undefined) fields.stage = stage;

  const ageMin = num(body.age_min_months);
  if (ageMin === undefined && body.age_min_months !== undefined) errors.push("age_min_months phải là số.");
  else if (ageMin !== undefined) fields.age_min_months = ageMin;

  const ageMax = num(body.age_max_months);
  if (ageMax === undefined && body.age_max_months !== undefined) errors.push("age_max_months phải là số.");
  else if (ageMax !== undefined) fields.age_max_months = ageMax;

  const weightG = num(body.weight_g);
  if (weightG === undefined && body.weight_g !== undefined) errors.push("weight_g phải là số.");
  else if (weightG !== undefined) fields.weight_g = weightG;

  const rating = num(body.rating);
  if (rating === undefined && body.rating !== undefined) errors.push("rating phải là số.");
  else if (rating !== undefined) fields.rating = rating;

  const reviewCount = num(body.review_count);
  if (reviewCount === undefined && body.review_count !== undefined) errors.push("review_count phải là số.");
  else if (reviewCount !== undefined) fields.review_count = reviewCount;

  const nutritionTags = strArray(body.nutrition_tags);
  if (nutritionTags !== undefined) fields.nutrition_tags = nutritionTags;

  if (body.key_ingredients !== undefined) {
    if (
      body.key_ingredients === null ||
      (typeof body.key_ingredients === "object" && !Array.isArray(body.key_ingredients))
    ) {
      fields.key_ingredients = body.key_ingredients ?? {};
    } else {
      errors.push("key_ingredients phải là object.");
    }
  }

  return { fields, errors };
}
