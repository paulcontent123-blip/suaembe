import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegisterBody {
  email?: unknown;
  password?: unknown;
  full_name?: unknown;
  phone?: unknown;
}

export async function POST(request: Request) {
  let body: RegisterBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : null;
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Mật khẩu phải có ít nhất 8 ký tự." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  // Đăng ký tài khoản trong Supabase Auth. Không có tuỳ chọn "role" ở đây —
  // client không được tự gán role, role luôn mặc định 'user' ở bước tạo profile bên dưới.
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    const status = error.status && error.status >= 400 && error.status < 500 ? error.status : 400;

    return NextResponse.json({ error: error.message }, { status });
  }

  if (!data.user) {
    return NextResponse.json(
      { error: "Không tạo được tài khoản, vui lòng thử lại." },
      { status: 500 },
    );
  }

  // Tạo hồ sơ mở rộng trong public.users bằng service role (bỏ qua RLS),
  // vì tại thời điểm này có thể chưa có session (dự án bật xác nhận email).
  const admin = createSupabaseAdminClient();
  const { error: profileError } = await admin
    .from("users")
    .upsert(
      {
        id: data.user.id,
        email,
        phone,
        full_name: fullName,
        role: "user",
      },
      { onConflict: "id" },
    );

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({
    user: { id: data.user.id, email },
    // Nếu project bật "Confirm email", data.session sẽ null cho tới khi user xác nhận.
    session_created: Boolean(data.session),
  });
}
