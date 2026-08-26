interface ListingInput {
  title?: unknown;
  category?: unknown;
  condition?: unknown;
  price?: unknown;
  original_price?: unknown;
  province?: unknown;
  delivery_method?: unknown;
  description?: unknown;
  images?: unknown;
  phone_hidden?: unknown;
  zalo?: unknown;
  escrow_enabled?: unknown;
  seller_name?: unknown;
  quantity_available?: unknown;
}

export interface ListingFields {
  title?: string;
  category?: string | null;
  condition?: string | null;
  price?: number;
  original_price?: number | null;
  province?: string | null;
  delivery_method?: string | null;
  description?: string | null;
  images?: string[];
  phone_hidden?: string | null;
  zalo?: string | null;
  escrow_enabled?: boolean;
  seller_name?: string | null;
  quantity_available?: number;
}

function str(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  return typeof value === "string" ? value.trim() || null : undefined;
}

/**
 * UC-10 - Gửi Form Pass Đồ C2C. Field nào absent thì bỏ qua (giữ nguyên khi
 * update); field gửi nhưng sai kiểu thì báo lỗi thay vì âm thầm bỏ qua.
 * `seller_name` dùng chung cho cả người bán có tài khoản lẫn khách vãng lai
 * (MVP mới không bắt buộc đăng nhập) — lưu snapshot tên để hiển thị/duyệt
 * tin không phụ thuộc join bảng users (seller_id có thể null).
 */
export function parseListingFields(body: ListingInput): { fields: ListingFields; errors: string[] } {
  const fields: ListingFields = {};
  const errors: string[] = [];

  const title = str(body.title);
  if (title !== undefined) fields.title = title ?? undefined;

  for (const key of [
    "category",
    "condition",
    "province",
    "delivery_method",
    "description",
    "phone_hidden",
    "zalo",
    "seller_name",
  ] as const) {
    const value = str(body[key]);
    if (value !== undefined) fields[key] = value;
  }

  if (body.price !== undefined) {
    if (typeof body.price === "number" && Number.isFinite(body.price) && body.price >= 0) {
      fields.price = body.price;
    } else {
      errors.push("price phải là số không âm.");
    }
  }

  if (body.original_price !== undefined) {
    if (body.original_price === null) {
      fields.original_price = null;
    } else if (typeof body.original_price === "number" && Number.isFinite(body.original_price) && body.original_price >= 0) {
      fields.original_price = body.original_price;
    } else {
      errors.push("original_price phải là số không âm.");
    }
  }

  if (body.images !== undefined) {
    if (Array.isArray(body.images) && body.images.every((v) => typeof v === "string")) {
      fields.images = body.images as string[];
    } else {
      errors.push("images phải là mảng URL.");
    }
  }

  if (body.escrow_enabled !== undefined) {
    if (typeof body.escrow_enabled === "boolean") {
      fields.escrow_enabled = body.escrow_enabled;
    } else {
      errors.push("escrow_enabled phải là boolean.");
    }
  }

  if (body.quantity_available !== undefined) {
    if (
      typeof body.quantity_available === "number" &&
      Number.isFinite(body.quantity_available) &&
      body.quantity_available >= 0
    ) {
      fields.quantity_available = Math.trunc(body.quantity_available);
    } else {
      errors.push("quantity_available phải là số không âm.");
    }
  }

  return { fields, errors };
}
