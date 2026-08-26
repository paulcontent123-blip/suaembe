import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/lib/auth/require-admin";
import { parseMilkFields, parseProductFields } from "@/lib/admin/product-validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PRODUCT_COLUMNS =
  "id, brand_id, category_id, name, slug, short_description, description, image_urls, price_vnd, original_price_vnd, unit, sku, attributes, tags, status, outbound_url, brands(id, name, logo_url), milk_products(stage, age_min_months, age_max_months, weight_g, key_ingredients, nutrition_tags, rating, review_count)";

// UC-23 - Quản Lý Nhãn Hàng, Danh Mục Và Sản Phẩm. Admin xem toàn bộ sản phẩm
// (kể cả draft/archived — RLS "products_public_read_active" chỉ ẩn với
// khách, is_admin() vẫn cho đọc hết).
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const admin = await requireAdminProfile(supabase);

  if (admin instanceof NextResponse) return admin;

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ products: data });
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

  const { fields, errors } = parseProductFields(body);

  if (!fields.name) errors.push("name là bắt buộc.");

  let milkFields: Record<string, unknown> | null = null;

  if (body.milk !== undefined && body.milk !== null) {
    if (typeof body.milk !== "object" || Array.isArray(body.milk)) {
      errors.push("milk phải là object.");
    } else {
      const parsed = parseMilkFields(body.milk as Record<string, unknown>);
      errors.push(...parsed.errors);
      milkFields = parsed.fields;
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert(fields)
    .select(PRODUCT_COLUMNS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sản phẩm sữa: tạo thêm bản ghi milk_products theo đúng bước 6 của UC-23.
  if (milkFields) {
    const { error: milkError } = await supabase
      .from("milk_products")
      .insert({ ...milkFields, product_id: product.id });

    if (milkError) {
      return NextResponse.json(
        { error: `Đã tạo sản phẩm nhưng lưu dữ liệu sữa thất bại: ${milkError.message}` },
        { status: 500 },
      );
    }
  }

  const { data: finalProduct } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", product.id)
    .single();

  return NextResponse.json({ product: finalProduct ?? product }, { status: 201 });
}
