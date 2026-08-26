// UC-04 - Cập Nhật Chỉ Số Và Đánh Giá Tăng Trưởng WHO.
export interface BabyMeasurement {
  id: string;
  baby_id: string;
  measured_at: string;
  age_months: number | null;
  weight_g: number | null;
  height_cm: number | null;
  head_cm: number | null;
  weight_percentile: number | null;
  height_percentile: number | null;
  head_percentile: number | null;
  weight_z_score: number | null;
  height_z_score: number | null;
  head_z_score: number | null;
  assessment: string | null;
  created_at: string;
}

// UC-05 - Theo Dõi Mốc Phát Triển Của Bé.
export interface DevelopmentMilestone {
  id: string;
  age_months: number;
  category: string;
  title: string;
  description: string | null;
  expected_from_month: number | null;
  expected_to_month: number | null;
}

export type MilestoneStatus = "achieved" | "in_progress" | "not_observed" | "delayed";

export interface BabyMilestoneRecord {
  id: string;
  baby_id: string;
  milestone_id: string;
  status: MilestoneStatus;
  achieved_at: string | null;
  note: string | null;
}

// UC-06 - Quản Lý Lịch Ăn/Sữa/Ăn Dặm.
export type FeedingStatus = "pending" | "upcoming" | "done" | "skipped" | "cancelled";

export interface FeedingScheduleItem {
  id: string;
  baby_id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  meal_type: string | null;
  title: string;
  description: string | null;
  amount_ml: number | null;
  status: FeedingStatus;
  completed_at: string | null;
}
