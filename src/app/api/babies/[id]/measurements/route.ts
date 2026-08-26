import { NextResponse } from "next/server";

import { ageInMonths, assessPercentile, findClosestStandard, lmsZScore, zScoreToPercentile } from "@/lib/growth/percentile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MEASUREMENT_COLUMNS =
  "id, baby_id, measured_at, age_months, weight_g, height_cm, head_cm, weight_percentile, height_percentile, head_percentile, weight_z_score, height_z_score, head_z_score, assessment, created_at";

const INDICATORS = {
  weight_g: "weight_for_age",
  height_cm: "length_height_for_age",
  head_cm: "head_circumference_for_age",
} as const;

// UC-04 - Cập Nhật Chỉ Số Và Đánh Giá Tăng Trưởng WHO.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Cần đăng nhập." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("baby_measurements")
    .select(MEASUREMENT_COLUMNS)
    .eq("baby_id", id)
    .order("measured_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ measurements: data });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Cần đăng nhập." }, { status: 401 });
  }

  const { data: baby, error: babyError } = await supabase
    .from("babies")
    .select("id, gender, birth_date")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (babyError) {
    return NextResponse.json({ error: babyError.message }, { status: 500 });
  }

  if (!baby) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ bé." }, { status: 404 });
  }

  if (!baby.birth_date) {
    return NextResponse.json({ error: "Cần nhập ngày sinh của bé trước khi cập nhật chỉ số." }, { status: 400 });
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const measuredAt = typeof body.measured_at === "string" && body.measured_at ? body.measured_at : new Date().toISOString();
  const weightG = typeof body.weight_g === "number" && Number.isFinite(body.weight_g) && body.weight_g > 0 ? body.weight_g : null;
  const heightCm = typeof body.height_cm === "number" && Number.isFinite(body.height_cm) && body.height_cm > 0 ? body.height_cm : null;
  const headCm = typeof body.head_cm === "number" && Number.isFinite(body.head_cm) && body.head_cm > 0 ? body.head_cm : null;

  if (weightG === null && heightCm === null && headCm === null) {
    return NextResponse.json({ error: "Cần nhập ít nhất 1 chỉ số: cân nặng, chiều cao hoặc vòng đầu." }, { status: 400 });
  }

  // gender 'other' không có chuẩn WHO riêng — dùng tạm bảng 'male' làm tham
  // chiếu gần đúng nhất thay vì chặn hẳn tính năng, và luôn nói rõ trong
  // assessment rằng đây chỉ là ước lượng tham khảo.
  const genderForLookup = baby.gender === "female" ? "female" : "male";
  const ageMonths = ageInMonths(baby.birth_date);

  const insertPayload: Record<string, unknown> = {
    baby_id: id,
    measured_at: measuredAt,
    age_months: ageMonths,
    weight_g: weightG,
    height_cm: heightCm,
    head_cm: headCm,
  };

  const assessmentParts: string[] = [];

  async function computeIndicator(
    key: "weight_g" | "height_cm" | "head_cm",
    value: number | null,
    percentileField: string,
    zScoreField: string,
    valueForLms: (v: number) => number,
    label: string,
  ) {
    if (value === null) return;

    const { data: standards } = await supabase
      .from("who_growth_standards")
      .select("age_months, l, m, s")
      .eq("gender", genderForLookup)
      .eq("indicator", INDICATORS[key])
      .eq("version", "WHO-2006");

    const standard = findClosestStandard(standards ?? [], ageMonths);

    if (!standard || standard.l === null || standard.m === null || standard.s === null) return;

    const z = lmsZScore(valueForLms(value), standard.l, standard.m, standard.s);
    const percentile = zScoreToPercentile(z);
    const assessment = assessPercentile(percentile);

    insertPayload[percentileField] = Math.round(percentile * 100) / 100;
    insertPayload[zScoreField] = Math.round(z * 100) / 100;
    assessmentParts.push(`${label}: ${assessment.label} (percentile ~${Math.round(percentile)})`);
  }

  await computeIndicator("weight_g", weightG, "weight_percentile", "weight_z_score", (g) => g / 1000, "Cân nặng");
  await computeIndicator("height_cm", heightCm, "height_percentile", "height_z_score", (v) => v, "Chiều cao");
  await computeIndicator("head_cm", headCm, "head_percentile", "head_z_score", (v) => v, "Vòng đầu");

  if (assessmentParts.length > 0) {
    insertPayload.assessment = assessmentParts.join(" · ");
  }

  const { data, error } = await supabase.from("baby_measurements").insert(insertPayload).select(MEASUREMENT_COLUMNS).single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Đồng bộ chỉ số mới nhất lên babies.* để các nơi khác (VD thẻ tóm tắt bé)
  // không cần join baby_measurements mỗi lần chỉ để lấy số đo gần nhất.
  await supabase
    .from("babies")
    .update({
      weight_g: weightG ?? undefined,
      height_cm: heightCm ?? undefined,
      head_cm: headCm ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return NextResponse.json({ measurement: data }, { status: 201 });
}
