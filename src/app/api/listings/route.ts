import { NextResponse } from "next/server";

import { parseListingFields } from "@/lib/listings/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const LISTING_COLUMNS =
  "id, seller_id, seller_name, title, category, condition, price, original_price, province, delivery_method, description, images, zalo, phone_hidden, escrow_enabled, quantity_available, status, created_at";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 60;

// UC-09 - Xem Tin Chợ C2C. Public API. Dùng server client (không phải admin)
// nên RLS "c2c_listings_read_public_approved_or_owner" tự áp dụng: khách chỉ
// thấy status='approved', mẹ bỉm đăng nhập thấy thêm tin của chính mình
// (mọi status) — không cần thêm logic phân nhánh ở route này.
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);

  const category = searchParams.get("category");
  const province = searchParams.get("province");
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const limit = Math.min(Number(searchParams.get("limit")) || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  let query = supabase
    .from("c2c_listings")
    .select(LISTING_COLUMNS)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq("category", category);
  if (province) query = query.eq("province", province);
  if (minPrice) query = query.gte("price", Number(minPrice));
  if (maxPrice) query = query.lte("price", Number(maxPrice));

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const listings = data ?? [];

  // Gắn thông tin người bán công khai (tên, avatar, badge xác minh) qua RPC
  // "get_c2c_seller_profile" (SECURITY DEFINER) — public.users bị RLS chặn
  // đọc trực tiếp, RPC này là lối public duy nhất được thiết kế sẵn cho đúng
  // nhu cầu hiển thị người bán ở Chợ C2C. Chỉ gọi cho tin có seller_id thật;
  // tin của khách vãng lai (seller_id null, MVP mới UC-10) dùng thẳng
  // seller_name đã lưu snapshot lúc gửi form, không qua RPC/join.
  const sellerIds = [...new Set(listings.map((l) => l.seller_id).filter((id): id is string => id != null))];
  const sellers = await Promise.all(
    sellerIds.map((id) => supabase.rpc("get_c2c_seller_profile", { p_seller_id: id })),
  );
  const sellerById = new Map(
    sellerIds.map((id, i) => [id, sellers[i].error ? null : sellers[i].data?.[0] ?? null]),
  );

  const enriched = listings.map((l) => ({
    ...l,
    seller: l.seller_id
      ? (sellerById.get(l.seller_id) ?? null)
      : { id: null, full_name: l.seller_name, avatar_url: null, is_verified: false },
  }));

  return NextResponse.json({ listings: enriched });
}

// UC-10 - Gửi Form Pass Đồ C2C. MVP mới không bắt buộc đăng nhập: nếu đã
// đăng nhập thì seller_id = auth.uid() (không nhận từ client); nếu là khách
// vãng lai thì seller_id = null và bắt buộc seller_name + ít nhất 1 kênh
// liên hệ (SĐT hoặc Zalo) để Admin còn liên hệ được khi duyệt tin (UC-11).
// status luôn hardcode 'pending' — admin phải duyệt trước khi tin hiển thị
// công khai, người đăng không tự set 'approved' được.
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const { fields, errors } = parseListingFields(body);

  if (!fields.title) errors.push("title là bắt buộc.");
  if (fields.price === undefined) errors.push("price là bắt buộc.");

  if (!user) {
    if (!fields.seller_name) errors.push("seller_name là bắt buộc khi chưa đăng nhập.");
    if (!fields.phone_hidden && !fields.zalo) {
      errors.push("Cần ít nhất một cách liên hệ (số điện thoại hoặc Zalo) khi chưa đăng nhập.");
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  const insertPayload = { ...fields, seller_id: user?.id ?? null, status: "pending" as const };

  // Khách vãng lai (seller_id null) không đọc lại được chính dòng vừa insert
  // qua RLS select (tin đang 'pending' — chỉ chủ tin có tài khoản hoặc admin
  // mới xem được, không có auth.uid() nào khớp với khách) — bỏ .select() để
  // insert không cần quyền SELECT, rồi tự dựng lại payload phản hồi. Người
  // đăng có tài khoản thì đọc lại bình thường được (auth.uid() = seller_id).
  if (user) {
    const { data, error } = await supabase
      .from("c2c_listings")
      .insert(insertPayload)
      .select(LISTING_COLUMNS)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ listing: data }, { status: 201 });
  }

  const { error } = await supabase.from("c2c_listings").insert(insertPayload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { listing: { ...insertPayload, id: null, images: fields.images ?? [], created_at: new Date().toISOString() } },
    { status: 201 },
  );
}
