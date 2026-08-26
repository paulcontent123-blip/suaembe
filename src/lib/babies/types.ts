export type BabyGender = "male" | "female" | "other";

export interface Baby {
  id: string;
  user_id: string;
  name: string | null;
  gender: BabyGender | null;
  birth_date: string | null;
  weight_g: number | null;
  height_cm: number | null;
  head_cm: number | null;
  current_milk_stage: string | null;
  updated_at: string;
}

export const BABY_GENDERS: BabyGender[] = ["male", "female", "other"];
