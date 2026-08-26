import { NextResponse } from "next/server";

import { parseBabyInput } from "@/lib/babies/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BABY_COLUMNS =
  "id, user_id, name, gender, birth_date, weight_g, height_cm, head_cm, current_milk_stage, updated_at";

// UC-03 - Quản Lý Hồ Sơ Bé. RLS "babies_manage_own_or_admin" cũng cho phép
// Admin thao tác trên mọi hồ sơ bé, nhưng ở đây luôn lọc thêm user_id = auth.uid()
// để trang "hồ sơ bé của tôi" chỉ trả về bé của chính người gọi (kể cả khi caller
// là admin) — hỗ trợ vận hành cho user khác sẽ là một API/khu vực riêng sau này.
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Cần đăng nhập." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("babies")
    .select(BABY_COLUMNS)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ babies: data });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Cần đăng nhập." }, { status: 401 });
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const { fields, errors } = parseBabyInput(body);

  if (!fields.name) {
    errors.push("name là bắt buộc.");
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("babies")
    .insert({ ...fields, user_id: user.id })
    .select(BABY_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ baby: data }, { status: 201 });
}
