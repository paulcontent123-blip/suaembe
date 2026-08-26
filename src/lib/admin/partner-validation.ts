export const PARTNER_TYPES = ["hospital", "insurance", "equipment", "recovery", "service", "other"] as const;
export const PARTNER_STATUSES = ["pending", "active", "inactive", "hidden"] as const;
export const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
export const REQUEST_TYPES = ["lead", "booking", "doctor_lead"] as const;

type Parsed = {
  fields: Record<string, unknown>;
  errors: string[];
};

function stringField(body: Record<string, unknown>, key: string): string | null | undefined {
  const value = body[key];

  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === "string") return value.trim() || null;

  return undefined;
}

function numberField(body: Record<string, unknown>, key: string, options: { integer?: boolean; min?: number } = {}) {
  const value = body[key];

  if (value === undefined) return { present: false as const, value: undefined, error: null };
  if (value === null || value === "") return { present: true as const, value: null, error: null };

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { present: true as const, value: null, error: `${key} phải là số.` };
  }

  const normalized = options.integer ? Math.trunc(value) : value;

  if (options.min !== undefined && normalized < options.min) {
    return { present: true as const, value: null, error: `${key} phải >= ${options.min}.` };
  }

  return { present: true as const, value: normalized, error: null };
}

function booleanField(body: Record<string, unknown>, key: string) {
  const value = body[key];

  if (value === undefined) return { present: false as const, value: undefined, error: null };
  if (typeof value !== "boolean") return { present: true as const, value: null, error: `${key} phải là boolean.` };

  return { present: true as const, value, error: null };
}

export function parsePartnerFields(body: Record<string, unknown>): Parsed {
  const fields: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const key of [
    "name",
    "category",
    "description",
    "logo_url",
    "cover_url",
    "phone",
    "email",
    "website_url",
    "province",
    "address",
  ]) {
    const value = stringField(body, key);
    if (value !== undefined) fields[key] = value;
  }

  const partnerType = stringField(body, "partner_type");
  if (partnerType !== undefined) {
    if (partnerType && (PARTNER_TYPES as readonly string[]).includes(partnerType)) fields.partner_type = partnerType;
    else errors.push("partner_type không hợp lệ.");
  }

  const status = stringField(body, "status");
  if (status !== undefined) {
    if (status && (PARTNER_STATUSES as readonly string[]).includes(status)) fields.status = status;
    else errors.push("status không hợp lệ.");
  }

  const rating = numberField(body, "rating", { min: 0 });
  if (rating.error) errors.push(rating.error);
  if (rating.present) {
    if (rating.value !== null && rating.value > 5) errors.push("rating phải <= 5.");
    else fields.rating = rating.value;
  }

  const verified = booleanField(body, "verified");
  if (verified.error) errors.push(verified.error);
  if (verified.present) fields.verified = verified.value;

  return { fields, errors };
}

export function parsePartnerServiceFields(body: Record<string, unknown>): Parsed {
  const fields: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const key of ["name", "service_type", "description"]) {
    const value = stringField(body, key);
    if (value !== undefined) fields[key] = value;
  }

  for (const [key, integer] of [
    ["price_from", true],
    ["price_to", true],
    ["duration_minutes", true],
  ] as const) {
    const parsed = numberField(body, key, { integer, min: 0 });
    if (parsed.error) errors.push(parsed.error);
    if (parsed.present) fields[key] = parsed.value;
  }

  const active = booleanField(body, "active");
  if (active.error) errors.push(active.error);
  if (active.present) fields.active = active.value;

  return { fields, errors };
}

export function parsePartnerBookingFields(body: Record<string, unknown>): Parsed {
  const fields: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const key of [
    "partner_id",
    "partner_service_id",
    "partner_type",
    "service",
    "scheduled_at",
    "customer_name",
    "customer_phone",
    "customer_email",
    "address",
    "note",
    "internal_note",
  ]) {
    const value = stringField(body, key);
    if (value !== undefined) fields[key] = value;
  }

  const requestType = stringField(body, "request_type");
  if (requestType !== undefined) {
    if (requestType && (REQUEST_TYPES as readonly string[]).includes(requestType)) fields.request_type = requestType;
    else errors.push("request_type không hợp lệ.");
  }

  const status = stringField(body, "status");
  if (status !== undefined) {
    if (status && (BOOKING_STATUSES as readonly string[]).includes(status)) fields.status = status;
    else errors.push("status không hợp lệ.");
  }

  for (const key of ["amount", "fee_amount"] as const) {
    const parsed = numberField(body, key, { integer: true, min: 0 });
    if (parsed.error) errors.push(parsed.error);
    if (parsed.present) fields[key] = parsed.value;
  }

  return { fields, errors };
}
