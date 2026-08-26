import { NextResponse } from "next/server";

import { getUserProfile } from "@/lib/auth/profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

export async function POST(request: Request) {
  let body: LoginBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Vui lòng nhập email và mật khẩu." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.json({ error: "Email hoặc mật khẩu không đúng." }, { status: 401 });
  }

  let profile = await getUserProfile(supabase, data.user.id);

  // Trường hợp hiếm: tài khoản auth tồn tại nhưng chưa có hồ sơ public.users
  // (VD tạo trực tiếp từ Supabase Dashboard). Tự tạo hồ sơ mặc định role 'user'
  // để không chặn đăng nhập.
  if (!profile) {
    const admin = createSupabaseAdminClient();
    const { error: repairError } = await admin.from("users").upsert(
      { id: data.user.id, email: data.user.email ?? email, role: "user" },
      { onConflict: "id" },
    );

    if (repairError) {
      return NextResponse.json({ error: repairError.message }, { status: 500 });
    }

    profile = await getUserProfile(supabase, data.user.id);
  }

  return NextResponse.json({ user: profile });
}
