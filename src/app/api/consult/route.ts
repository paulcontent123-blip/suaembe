import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export const CONSULT_COLUMNS =
  "id, user_id, bs_id, question, baby_age_months, answer, answered_at, forwarded_at, status, rating, created_at, bs_nhi(id, full_name, specialty, hospital, avatar_url, response_hours, verified)";

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) return NextResponse.json({ error: "Cần đăng nhập để xem yêu cầu tư vấn." }, { status: 401 });

  const { data, error } = await supabase
    .from("consult_requests")
    .select(CONSULT_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ consults: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập để gửi câu hỏi cho bác sĩ." }, { status: 401 });

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const bsId = body.bs_id;
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const babyAge = body.baby_age_months;

  if (!isUuid(bsId)) return NextResponse.json({ error: "Bác sĩ được chọn không hợp lệ." }, { status: 400 });
  if (question.length < 10) return NextResponse.json({ error: "Câu hỏi cần ít nhất 10 ký tự." }, { status: 400 });
  if (question.length > 2000) return NextResponse.json({ error: "Câu hỏi không được vượt quá 2.000 ký tự." }, { status: 400 });

  let babyAgeMonths: number | null = null;

  if (babyAge !== undefined && babyAge !== null && babyAge !== "") {
    if (typeof babyAge !== "number" || !Number.isInteger(babyAge) || babyAge < 0 || babyAge > 240) {
      return NextResponse.json({ error: "Tuổi của bé phải là số tháng từ 0 đến 240." }, { status: 400 });
    }

    babyAgeMonths = babyAge;
  }

  const { data: doctor, error: doctorError } = await supabase
    .from("bs_nhi")
    .select("id, verified")
    .eq("id", bsId)
    .eq("verified", true)
    .maybeSingle();

  if (doctorError) return NextResponse.json({ error: doctorError.message }, { status: 500 });
  if (!doctor) return NextResponse.json({ error: "Bác sĩ không tồn tại hoặc chưa được xác minh." }, { status: 404 });

  const { data, error } = await supabase
    .from("consult_requests")
    .insert({
      user_id: user.id,
      bs_id: bsId,
      question,
      baby_age_months: babyAgeMonths,
      status: "pending",
    })
    .select(CONSULT_COLUMNS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ consult: data }, { status: 201 });
}
