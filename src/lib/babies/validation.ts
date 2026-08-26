import { BABY_GENDERS, type BabyGender } from "./types";

interface BabyInput {
  name?: unknown;
  gender?: unknown;
  birth_date?: unknown;
  weight_g?: unknown;
  height_cm?: unknown;
  head_cm?: unknown;
  current_milk_stage?: unknown;
}

export interface BabyFields {
  name?: string | null;
  gender?: BabyGender | null;
  birth_date?: string | null;
  weight_g?: number | null;
  height_cm?: number | null;
  head_cm?: number | null;
  current_milk_stage?: string | null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function parseOptionalPositiveNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return undefined;

  return value;
}

/**
 * Parses/validates a partial baby payload from the client. Returns `null`
 * for a field to signal "field present but invalid" so the route handler
 * can 400 instead of silently writing garbage. Fields absent from the
 * input are simply omitted from the result (untouched on update).
 */
export function parseBabyInput(body: BabyInput): { fields: BabyFields; errors: string[] } {
  const fields: BabyFields = {};
  const errors: string[] = [];

  const name = parseOptionalString(body.name);
  if (name !== undefined) fields.name = name;

  if (body.gender !== undefined) {
    if (body.gender === null) {
      fields.gender = null;
    } else if (typeof body.gender === "string" && BABY_GENDERS.includes(body.gender as BabyGender)) {
      fields.gender = body.gender as BabyGender;
    } else {
      errors.push("gender phải là male, female hoặc other.");
    }
  }

  if (body.birth_date !== undefined) {
    if (body.birth_date === null) {
      fields.birth_date = null;
    } else if (
      typeof body.birth_date === "string" &&
      DATE_RE.test(body.birth_date) &&
      !Number.isNaN(Date.parse(body.birth_date)) &&
      Date.parse(body.birth_date) <= Date.now()
    ) {
      fields.birth_date = body.birth_date;
    } else {
      errors.push("birth_date phải theo định dạng YYYY-MM-DD và không ở tương lai.");
    }
  }

  const weight = parseOptionalPositiveNumber(body.weight_g);
  if (weight === undefined && body.weight_g !== undefined) {
    errors.push("weight_g phải là số dương (gram).");
  } else if (weight !== undefined) {
    fields.weight_g = weight === null ? null : Math.round(weight);
  }

  const height = parseOptionalPositiveNumber(body.height_cm);
  if (height === undefined && body.height_cm !== undefined) {
    errors.push("height_cm phải là số dương (cm).");
  } else if (height !== undefined) {
    fields.height_cm = height;
  }

  const head = parseOptionalPositiveNumber(body.head_cm);
  if (head === undefined && body.head_cm !== undefined) {
    errors.push("head_cm phải là số dương (cm).");
  } else if (head !== undefined) {
    fields.head_cm = head;
  }

  const milkStage = parseOptionalString(body.current_milk_stage);
  if (milkStage !== undefined) fields.current_milk_stage = milkStage;

  return { fields, errors };
}
