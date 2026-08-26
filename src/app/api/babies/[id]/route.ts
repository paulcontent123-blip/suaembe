import { NextResponse } from "next/server";

import { parseBabyInput } from "@/lib/babies/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BABY_COLUMNS =
  "id, user_id, name, gender, birth_date, weight_g, height_cm, head_cm, current_milk_stage, updated_at";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "Không có thay đổi nào để lưu." }, { status: 400 });
  }

  // Lọc thêm user_id = auth.uid() ngoài RLS: endpoint tự phục vụ này chỉ dành
  // cho mẹ bỉm sửa hồ sơ bé của chính mình, không phải kênh admin hỗ trợ.
  const { data, error } = await supabase
    .from("babies")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(BABY_COLUMNS)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ bé." }, { status: 404 });
  }

  return NextResponse.json({ baby: data });
}
