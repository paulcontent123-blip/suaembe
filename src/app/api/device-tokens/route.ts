import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface DeviceTokenBody {
  token?: unknown;
  provider?: unknown;
  platform?: unknown;
  device_id?: unknown;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Cần đăng nhập." }, { status: 401 });
  }

  let body: DeviceTokenBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";

  if (!token) {
    return NextResponse.json({ error: "Thiếu token thiết bị." }, { status: 400 });
  }

  const provider = typeof body.provider === "string" ? body.provider : "fcm";
  const platform = typeof body.platform === "string" ? body.platform : null;
  const deviceId = typeof body.device_id === "string" ? body.device_id : null;

  const { data, error } = await supabase
    .from("device_tokens")
    .upsert(
      {
        user_id: user.id,
        token,
        provider,
        platform,
        device_id: deviceId,
        enabled: true,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "token" },
    )
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
