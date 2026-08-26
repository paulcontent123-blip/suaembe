export const CONDITIONS = ["binh_thuong", "bieng_an", "tao_bon", "de_khang_yeu", "sinh_non"] as const;
export type Condition = (typeof CONDITIONS)[number];

export const CONDITION_LABEL: Record<Condition, string> = {
  binh_thuong: "Bình thường, khoẻ mạnh",
  bieng_an: "Biếng ăn / Chậm tăng cân",
  tao_bon: "Táo bón thường xuyên",
  de_khang_yeu: "Hay bị ốm, sức đề kháng yếu",
  sinh_non: "Sinh non / nhẹ cân",
};

export const PRIORITIES = ["tieu_hoa", "dha_cao", "tang_chieu_cao", "suc_de_khang", "it_duong", "huu_co"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABEL: Record<Priority, string> = {
  tieu_hoa: "Hỗ trợ tiêu hoá",
  dha_cao: "DHA cao",
  tang_chieu_cao: "Tăng chiều cao",
  suc_de_khang: "Sức đề kháng",
  it_duong: "Ít đường",
  huu_co: "Hữu cơ",
};

export interface SuggestMilkRequest {
  baby_id?: string | null;
  age_months: number;
  weight_g?: number | null;
  condition: Condition;
  budget_min: number;
  budget_max: number;
  priorities: Priority[];
}

export interface SuggestMilkResultItem {
  rank: number;
  product_id: string;
  brand: string | null;
  name: string;
  price_vnd: number | null;
  image_url: string | null;
  match_percent: number;
  matched_priorities: string[];
  reason: string;
}

export interface SuggestMilkResponse {
  query_summary: string;
  results: SuggestMilkResultItem[];
  disclaimer: string;
  model_version: string;
  generated_at: string;
  fallback?: boolean;
  fallback_message?: string;
}
