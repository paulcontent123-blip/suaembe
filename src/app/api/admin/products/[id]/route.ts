import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/lib/auth/require-admin";
import { parseMilkFields, parseProductFields } from "@/lib/admin/product-validation";
import { cleanupRemovedMediaUrls } from "@/lib/media/cleanup";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PRODUCT_COLUMNS =
  "id, brand_id, category_id, name, slug, short_description, description, image_urls, price_vnd, original_price_vnd, unit, sku, attributes, tags, status, outbound_url, brands(id, name, logo_url), milk_products(stage, age_min_months, age_max_months, weight_g, key_ingredients, nutrition_tags, rating, review_count)";

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

  const { fields, errors } = parseProductFields(body);

  let milkFields: Record<string, unknown> | null | undefined;

  if (body.milk === null) {
    // milk: null nghĩa là gỡ khỏi nhóm sữa (xoá bản ghi milk_products).
    milkFields = null;
  } else if (body.milk !== undefined) {
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

  if (Object.keys(fields).length === 0 && milkFields === undefined) {
    return NextResponse.json({ error: "Không có thay đổi nào để lưu." }, { status: 400 });
  }

  if (Object.keys(fields).length > 0) {
    // Ghi lại image_urls cũ trước khi update để dọn Cloudinary/media_assets
    // cho những ảnh bị thay thế/gỡ bớt khỏi mảng — tránh rò rỉ file.
    let previousImageUrls: string[] = [];

    if ("image_urls" in fields) {
      const { data: before } = await supabase.from("products").select("image_urls").eq("id", id).maybeSingle();

      previousImageUrls = before?.image_urls ?? [];
    }

    const { error } = await supabase
      .from("products")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if ("image_urls" in fields) {
      await cleanupRemovedMediaUrls(previousImageUrls, (fields.image_urls as string[] | null) ?? []);
    }
  }

  if (milkFields === null) {
    const { error } = await supabase.from("milk_products").delete().eq("product_id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (milkFields) {
    const { error } = await supabase
      .from("milk_products")
      .upsert({ ...milkFields, product_id: id }, { onConflict: "product_id" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
  }

  return NextResponse.json({ product: data });
}
