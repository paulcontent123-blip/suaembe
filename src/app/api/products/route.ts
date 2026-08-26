import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PRODUCT_COLUMNS =
  "id, brand_id, category_id, name, slug, short_description, description, image_urls, price_vnd, original_price_vnd, unit, tags, outbound_url, brands(id, name, logo_url), milk_products(stage, age_min_months, age_max_months, weight_g, nutrition_tags, rating, review_count)";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 60;

// UC-07 - Xem Bách Hóa Và Sản Phẩm. Public API. RLS "products_public_read_active"
// tự lọc status='active' cho khách; đọc lồng brands/milk_products trong 1 lần
// gọi để tránh N+1 query từ frontend.
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);

  const categoryIds = searchParams.get("category_id")?.split(",").map((v) => v.trim()).filter(Boolean);
  const brandId = searchParams.get("brand_id");
  const q = searchParams.get("q")?.trim();
  const tags = searchParams.get("tags")?.split(",").map((v) => v.trim()).filter(Boolean);
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const limit = Math.min(Number(searchParams.get("limit")) || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  let query = supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (categoryIds && categoryIds.length > 0) query = query.in("category_id", categoryIds);
  if (brandId) query = query.eq("brand_id", brandId);
  if (q) query = query.ilike("name", `%${q}%`);
  if (tags && tags.length > 0) query = query.overlaps("tags", tags);
  if (minPrice) query = query.gte("price_vnd", Number(minPrice));
  if (maxPrice) query = query.lte("price_vnd", Number(maxPrice));

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ products: data });
}
