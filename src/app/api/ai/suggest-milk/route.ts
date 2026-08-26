import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import { getClientIp, checkRateLimit } from "@/lib/ai/rate-limit";
import {
  CONDITIONS,
  CONDITION_LABEL,
  PRIORITIES,
  PRIORITY_LABEL,
  type Condition,
  type Priority,
  type SuggestMilkResultItem,
  type SuggestMilkResponse,
} from "@/lib/ai/suggest-milk-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MILK_PRODUCT_COLUMNS =
  "id, name, price_vnd, image_urls, tags, brands(name), milk_products!inner(stage, age_min_months, age_max_months, key_ingredients, nutrition_tags, rating)";
const FALLBACK_MESSAGE =
  "Chưa có sản phẩm khớp đầy đủ tiêu chí. Đây là Top 3 sản phẩm sữa tham khảo theo đánh giá chung; mẹ nên kiểm tra lại tuổi, ngân sách và hỏi bác sĩ khi cần.";
const NO_FALLBACK_MESSAGE = "Hiện chưa có sản phẩm sữa active trong danh mục để hiển thị tham khảo.";

const DISCLAIMER =
  "Gợi ý dựa trên dữ liệu thành phần công khai của sản phẩm đang bán trên SữaEmbe, chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ Nhi khoa.";

interface CandidateRow {
  id: string;
  name: string;
  price_vnd: number | null;
  image_urls: string[] | null;
  tags: string[] | null;
  brands: { name: string } | null;
  milk_products: {
    stage: string | null;
    age_min_months: number | null;
    age_max_months: number | null;
    key_ingredients: Record<string, unknown> | null;
    nutrition_tags: string[] | null;
    rating: number | null;
  } | null;
}

function parseBody(body: Record<string, unknown>): { fields: Record<string, unknown>; errors: string[] } {
  const errors: string[] = [];
  const fields: Record<string, unknown> = {};

  if (typeof body.age_months !== "number" || !Number.isFinite(body.age_months) || body.age_months < 0 || body.age_months > 60) {
    errors.push("age_months phải là số từ 0 đến 60.");
  } else {
    fields.age_months = body.age_months;
  }

  if (body.weight_g !== undefined && body.weight_g !== null) {
    if (typeof body.weight_g !== "number" || body.weight_g <= 0) {
      errors.push("weight_g phải là số dương.");
    } else {
      fields.weight_g = body.weight_g;
    }
  }

  if (typeof body.condition !== "string" || !CONDITIONS.includes(body.condition as Condition)) {
    errors.push("condition không hợp lệ.");
  } else {
    fields.condition = body.condition;
  }

  if (typeof body.budget_min !== "number" || typeof body.budget_max !== "number" || body.budget_min < 0 || body.budget_max < body.budget_min) {
    errors.push("budget_min/budget_max không hợp lệ.");
  } else {
    fields.budget_min = body.budget_min;
    fields.budget_max = body.budget_max;
  }

  if (
    body.priorities !== undefined &&
    (!Array.isArray(body.priorities) || !body.priorities.every((p) => PRIORITIES.includes(p as Priority)))
  ) {
    errors.push("priorities không hợp lệ.");
  } else {
    fields.priorities = (body.priorities as Priority[] | undefined) ?? [];
  }

  if (body.baby_id !== undefined && body.baby_id !== null && typeof body.baby_id !== "string") {
    errors.push("baby_id không hợp lệ.");
  } else {
    fields.baby_id = body.baby_id ?? null;
  }

  return { fields, errors };
}

function toFallbackResults(candidates: CandidateRow[]): SuggestMilkResultItem[] {
  return candidates.slice(0, 3).map((candidate, index) => ({
    rank: index + 1,
    product_id: candidate.id,
    brand: candidate.brands?.name ?? null,
    name: candidate.name,
    price_vnd: candidate.price_vnd,
    image_url: candidate.image_urls?.[0] ?? null,
    // Không dùng rating sản phẩm làm match_percent, tránh tạo cảm giác đây là
    // điểm phù hợp với bé khi sản phẩm không khớp đầy đủ tiêu chí đầu vào.
    match_percent: 0,
    matched_priorities: [],
    reason: FALLBACK_MESSAGE,
  }));
}

// UC-08 - AI Gợi Ý Sữa. Public API, không yêu cầu đăng nhập — nếu có JWT hợp
// lệ kèm baby_id, backend chỉ dùng baby_id để đối chiếu quyền sở hữu
// (babies.user_id = auth.uid()), không bắt buộc. Luồng: (1) lọc ứng viên
// thật bằng SQL trước (retrieval), (2) gọi Claude chỉ trong tập ứng viên đã
// lọc, (3) validate product_id trả về khớp đúng tập đã gửi (chống bịa), (4)
// enrich lại tên/ảnh/giá từ DB, không tin nội dung Claude tự viết.
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = await checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: "Bạn đã gọi tính năng này quá nhiều lần trong 1 giờ. Vui lòng thử lại sau." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ." }, { status: 400 });
  }

  const { fields, errors } = parseBody(body);

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  const ageMonths = fields.age_months as number;
  const condition = fields.condition as Condition;
  const budgetMin = fields.budget_min as number;
  const budgetMax = fields.budget_max as number;
  const priorities = fields.priorities as Priority[];
  const babyId = fields.baby_id as string | null;

  const supabase = await createSupabaseServerClient();

  // baby_id chỉ dùng để hiển thị lại đúng ngữ cảnh (không bắt buộc, không
  // ảnh hưởng kết quả nếu không hợp lệ) — verify quyền sở hữu, âm thầm bỏ
  // qua nếu không phải bé của chính người gọi thay vì lỗi cứng.
  let babyName: string | null = null;

  if (babyId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: baby } = await supabase.from("babies").select("name").eq("id", babyId).eq("user_id", user.id).maybeSingle();
      babyName = baby?.name ?? null;
    }
  }

  // 1. Retrieval - lọc ứng viên thật bằng SQL trước khi gọi AI.
  const { data: candidates, error: candidatesError } = await supabase
    .from("products")
    .select(
      "id, name, price_vnd, image_urls, tags, brands(name), milk_products!inner(stage, age_min_months, age_max_months, key_ingredients, nutrition_tags, rating)",
    )
    .eq("status", "active")
    .lte("milk_products.age_min_months", ageMonths)
    .gte("milk_products.age_max_months", ageMonths)
    .gte("price_vnd", budgetMin)
    .lte("price_vnd", budgetMax)
    .order("rating", { foreignTable: "milk_products", ascending: false, nullsFirst: false })
    .limit(15);

  if (candidatesError) {
    return NextResponse.json({ error: candidatesError.message }, { status: 500 });
  }

  const candidateList = (candidates ?? []) as unknown as CandidateRow[];

  const querySummary = `Bé ${ageMonths} tháng${fields.weight_g ? ` · ${((fields.weight_g as number) / 1000).toFixed(1)}kg` : ""} · ${CONDITION_LABEL[condition]} · Ngân sách ${(budgetMin / 1000).toFixed(0)}–${(budgetMax / 1000).toFixed(0)}K`;

  if (candidateList.length === 0) {
    // Fallback does not call Claude. It keeps the Top 3 checklist useful while
    // clearly marking these products as general references, not exact matches.
    const { data: fallbackCandidates, error: fallbackError } = await supabase
      .from("products")
      .select(MILK_PRODUCT_COLUMNS)
      .eq("status", "active")
      .order("rating", { foreignTable: "milk_products", ascending: false, nullsFirst: false })
      .limit(3);

    if (fallbackError) {
      return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    }

    const fallbackList = (fallbackCandidates ?? []) as unknown as CandidateRow[];

    return NextResponse.json({
      query_summary: querySummary,
      results: toFallbackResults(fallbackList),
      disclaimer: DISCLAIMER,
      model_version: "fallback-top-rated",
      generated_at: new Date().toISOString(),
      fallback: true,
      fallback_message: fallbackList.length > 0 ? FALLBACK_MESSAGE : NO_FALLBACK_MESSAGE,
    } satisfies SuggestMilkResponse);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === "sk-ant-your-key") {
    return NextResponse.json(
      { error: "Tính năng AI gợi ý sữa chưa được cấu hình (thiếu ANTHROPIC_API_KEY thật trong .env)." },
      { status: 503 },
    );
  }

  const candidateIds = new Set(candidateList.map((c) => c.id));

  const candidateSummaries = candidateList.map((c) => ({
    product_id: c.id,
    brand: c.brands?.name ?? null,
    name: c.name,
    price_vnd: c.price_vnd,
    stage: c.milk_products?.stage ?? null,
    age_range_months: [c.milk_products?.age_min_months, c.milk_products?.age_max_months],
    key_ingredients: c.milk_products?.key_ingredients ?? {},
    nutrition_tags: c.milk_products?.nutrition_tags ?? [],
    tags: c.tags ?? [],
    rating: c.milk_products?.rating ?? null,
  }));

  const priorityLabels = priorities.map((p) => PRIORITY_LABEL[p]);

  const systemPrompt = [
    "Bạn là chuyên gia tư vấn dinh dưỡng sữa công thức cho SữaEmbe, nền tảng mẹ & bé tại Việt Nam.",
    "Nhiệm vụ: chọn TỐI ĐA 3 sản phẩm phù hợp nhất cho bé, CHỈ được chọn product_id có trong danh sách ứng viên bên dưới — tuyệt đối không tự bịa thêm sản phẩm hay product_id nào khác ngoài danh sách này.",
    "Với mỗi sản phẩm chọn, đưa ra match_percent (0-100, ước lượng mức phù hợp), matched_priorities (những ưu tiên của mẹ mà sản phẩm này đáp ứng tốt) và reason (1-2 câu tiếng Việt giải thích ngắn gọn, dựa trên thành phần/stage/tuổi thật của sản phẩm, không bịa thông tin không có trong dữ liệu).",
    "Sắp xếp theo mức phù hợp giảm dần (rank 1 phù hợp nhất). Nếu không có sản phẩm nào thực sự phù hợp, có thể trả về ít hơn 3 sản phẩm.",
  ].join("\n");

  const userPrompt = [
    `Thông tin bé: ${ageMonths} tháng tuổi${fields.weight_g ? `, ${fields.weight_g}g` : ""}, tình trạng: ${CONDITION_LABEL[condition]}.`,
    `Ngân sách: ${budgetMin.toLocaleString("vi-VN")}đ – ${budgetMax.toLocaleString("vi-VN")}đ / hộp.`,
    priorityLabels.length > 0 ? `Ưu tiên đặc biệt: ${priorityLabels.join(", ")}.` : "Không có ưu tiên đặc biệt.",
    "",
    "Danh sách ứng viên (JSON):",
    JSON.stringify(candidateSummaries, null, 2),
  ].join("\n");

  const client = new Anthropic({ apiKey });

  const recommendTool: Anthropic.Tool = {
    name: "recommend_milk",
    description: "Trả về danh sách tối đa 3 sản phẩm sữa phù hợp nhất, chọn từ đúng danh sách ứng viên đã cung cấp.",
    input_schema: {
      type: "object",
      properties: {
        recommendations: {
          type: "array",
          maxItems: 3,
          items: {
            type: "object",
            properties: {
              product_id: { type: "string", description: "Phải là 1 id có trong danh sách ứng viên." },
              match_percent: { type: "integer", minimum: 0, maximum: 100 },
              matched_priorities: { type: "array", items: { type: "string" } },
              reason: { type: "string" },
            },
            required: ["product_id", "match_percent", "matched_priorities", "reason"],
            additionalProperties: false,
          },
        },
      },
      required: ["recommendations"],
      additionalProperties: false,
    },
    strict: true,
  };

  let message: Anthropic.Message;

  try {
    message = await client.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-opus-5",
      max_tokens: Number(process.env.CLAUDE_MAX_TOKENS) || 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      tools: [recommendTool],
      tool_choice: { type: "tool", name: "recommend_milk" },
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định.";

    return NextResponse.json({ error: `Gọi AI thất bại: ${message}` }, { status: 502 });
  }

  const toolUse = message.content.find((block): block is Anthropic.ToolUseBlock => block.type === "tool_use");

  if (!toolUse) {
    return NextResponse.json({ error: "AI không trả về kết quả hợp lệ." }, { status: 502 });
  }

  const parsed = toolUse.input as { recommendations?: unknown };
  const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];

  // 2. Anti-hallucination: chỉ giữ product_id thật sự nằm trong tập ứng viên đã gửi.
  const validated = recommendations.filter(
    (r): r is { product_id: string; match_percent: number; matched_priorities: string[]; reason: string } =>
      typeof r === "object" &&
      r !== null &&
      "product_id" in r &&
      typeof (r as { product_id: unknown }).product_id === "string" &&
      candidateIds.has((r as { product_id: string }).product_id),
  );

  // 3. Enrich lại dữ liệu hiển thị từ DB thật, không dùng tên/giá do AI tự viết.
  const results = validated.map((r, i) => {
    const candidate = candidateList.find((c) => c.id === r.product_id)!;

    return {
      rank: i + 1,
      product_id: candidate.id,
      brand: candidate.brands?.name ?? null,
      name: candidate.name,
      price_vnd: candidate.price_vnd,
      image_url: candidate.image_urls?.[0] ?? null,
      match_percent: Math.min(100, Math.max(0, Math.round(r.match_percent))),
      matched_priorities: Array.isArray(r.matched_priorities) ? r.matched_priorities : [],
      reason: typeof r.reason === "string" ? r.reason : "",
    };
  });

  const response: SuggestMilkResponse = {
    query_summary: babyName ? `${babyName} · ${querySummary}` : querySummary,
    results,
    disclaimer: DISCLAIMER,
    model_version: process.env.CLAUDE_MODEL || "claude-opus-5",
    generated_at: new Date().toISOString(),
  };

  return NextResponse.json(response);
}
