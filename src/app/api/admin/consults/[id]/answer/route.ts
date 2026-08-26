import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_CONSULT_COLUMNS } from "@/app/api/admin/consults/route";

export const runtime = "nodejs";

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

  const answer = typeof body.answer === "string" ? body.answer.trim() : "";

  if (answer.length < 10) return NextResponse.json({ error: "Câu trả lời cần ít nhất 10 ký tự." }, { status: 400 });
  if (answer.length > 5000) return NextResponse.json({ error: "Câu trả lời không được vượt quá 5.000 ký tự." }, { status: 400 });

  const { data: current, error: currentError } = await supabase
    .from("consult_requests")
    .select("id, user_id, bs_id, status, answer")
    .eq("id", id)
    .maybeSingle();

  if (currentError) return NextResponse.json({ error: currentError.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Không tìm thấy yêu cầu tư vấn." }, { status: 404 });

  const answeredAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("consult_requests")
    .update({ answer, answered_at: answeredAt, status: "answered" })
    .eq("id", id)
    .select(ADMIN_CONSULT_COLUMNS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Chỉ tạo thông báo khi câu trả lời mới hoặc yêu cầu chưa từng ở trạng
  // thái answered, tránh nhân bản notification khi Admin lưu lại cùng nội dung.
  let notificationCreated = false;
  let notificationError: string | null = null;

  if (current.status !== "answered" || current.answer !== answer) {
    const { error: insertError } = await supabase.from("notifications").insert({
      user_id: current.user_id,
      type: "consult",
      title: "Bác sĩ đã trả lời yêu cầu tư vấn",
      body: answer,
      data: { consult_id: id, bs_id: current.bs_id },
      channel: "push",
      status: "pending",
    });

    notificationCreated = !insertError;
    notificationError = insertError?.message ?? null;
  }

  return NextResponse.json({
    consult: data,
    notification_created: notificationCreated,
    notification_error: notificationError,
  });
}
