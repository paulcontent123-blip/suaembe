import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MILK_PRODUCT_COLUMNS =
  "product_id, stage, age_min_months, age_max_months, weight_g, key_ingredients, nutrition_tags, rating, review_count, products(id, name, slug, image_urls, price_vnd, original_price_vnd, brand_id, brands(id, name, logo_url))";

// UC-07 - Xem Bách Hóa Và Sản Phẩm (dữ liệu dinh dưỡng sữa riêng theo
// milk_products, tách khỏi /api/products theo đúng danh sách API §6). RLS
// "milk_products_public_read_active_product" tự lọc theo products.status.
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);

  const productId = searchParams.get("product_id");
  const ageMonthsParam = searchParams.get("age_months");
  const ageMonths = ageMonthsParam ? Number(ageMonthsParam) : null;

  let query = supabase.from("milk_products").select(MILK_PRODUCT_COLUMNS);

  if (productId) query = query.eq("product_id", productId);

  if (ageMonths != null && !Number.isNaN(ageMonths)) {
    query = query
      .lte("age_min_months", ageMonths)
      .or(`age_max_months.is.null,age_max_months.gte.${ageMonths}`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ milk_products: data });
}
