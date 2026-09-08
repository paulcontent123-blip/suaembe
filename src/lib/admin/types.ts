export interface AdminStats {
  users_total: number;
  users_new_7d: number;
  listings_total: number;
  listings_new_today: number;
  listings_pending: number;
  products_total: number;
  products_new_7d: number;
  bs_nhi_total: number;
  bs_nhi_pending_verification: number;
  orders_pending_review: number;
  consults_pending: number;
  partner_bookings_pending: number;
}

// UC-10 MVP mới: seller_id null khi người bán là khách vãng lai chưa đăng
// nhập — dùng seller_name (snapshot lúc gửi form) để hiển thị thay vì join
// `users`.
export interface AdminPendingListing {
  id: string;
  seller_id: string | null;
  seller_name: string | null;
  title: string;
  category: string | null;
  condition: string | null;
  price: number;
  original_price: number | null;
  province: string | null;
  delivery_method: string | null;
  description: string | null;
  images: string[];
  zalo: string | null;
  phone_hidden: string | null;
  escrow_enabled: boolean;
  quantity_available: number;
  status: "pending" | "approved" | "sold" | "hidden";
  created_at: string;
  users: { email: string; full_name: string | null; is_verified: boolean } | null;
}

// UC-12 - Đặt Mua C2C Thanh Toán Thường (thay cho Escrow trong luồng chính).
export interface AdminC2cOrder {
  id: string;
  listing_id: string;
  buyer_id: string | null;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string | null;
  shipping_address: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_method: string | null;
  payment_ref: string | null;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  order_status:
    | "pending_admin_review"
    | "confirmed"
    | "processing"
    | "completed"
    | "cancelled"
    | "partially_available";
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  c2c_listings:
    | {
        id: string;
        title: string;
        quantity_available: number;
        status: string;
        seller_name: string | null;
        phone_hidden: string | null;
        zalo: string | null;
        users: { full_name: string | null; email: string; is_verified: boolean } | null;
      }
    | null;
}

export interface AdminUserRow {
  id: string;
  email: string;
  phone: string | null;
  role: "admin" | "user";
  full_name: string | null;
  is_verified: boolean;
  created_at: string;
}

// UC-23 - Quản Lý Nhãn Hàng, Danh Mục Và Sản Phẩm.
export interface AdminBrand {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  country: string | null;
  description: string | null;
  website_url: string | null;
  verified: boolean;
}

export interface AdminCategory {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  active: boolean;
}

export type ProductStatus = "draft" | "active" | "archived";

export interface AdminMilkFields {
  stage: string | null;
  age_min_months: number | null;
  age_max_months: number | null;
  weight_g: number | null;
  key_ingredients: Record<string, unknown>;
  nutrition_tags: string[];
  rating: number | null;
  review_count: number;
}

export interface AdminProduct {
  id: string;
  brand_id: string | null;
  category_id: string | null;
  name: string;
  slug: string | null;
  short_description: string | null;
  description: string | null;
  image_urls: string[];
  price_vnd: number | null;
  original_price_vnd: number | null;
  unit: string | null;
  sku: string | null;
  attributes: Record<string, unknown>;
  tags: string[];
  status: ProductStatus;
  outbound_url: string | null;
  brands: { id: string; name: string; logo_url: string | null } | null;
  milk_products: AdminMilkFields | null;
}

// UC-21 - Quản Lý Chuyên Mục Và Bài Viết.
export interface AdminArticleCategory {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  active: boolean;
}

export type ArticleStatus = "draft" | "published" | "archived";

export interface AdminArticle {
  id: string;
  author_id: string | null;
  category_id: string | null;
  title: string;
  slug: string | null;
  excerpt: string | null;
  meta_description: string | null;
  content: string | null;
  cover_url: string | null;
  status: ArticleStatus;
  view_count: number;
  published_at: string | null;
  created_at: string;
  related_article_ids: string[];
  article_categories: { id: string; name: string; slug: string } | null;
}

// UC-22 - Quản Lý Bác Sĩ Nhi Đối Tác. bs_nhi không có created_at/updated_at
// trong schema (xem document/database.md) — danh sách admin sắp theo tên.
export interface AdminBsNhi {
  id: string;
  full_name: string;
  specialty: string | null;
  hospital: string | null;
  experience_years: number | null;
  bio: string | null;
  avatar_url: string | null;
  rating: number | null;
  consult_count: number;
  is_online: boolean;
  response_hours: number;
  verified: boolean;
}

// UC-16 - Admin chuyển tiếp yêu cầu và cập nhật câu trả lời tư vấn.
export type ConsultStatus = "pending" | "answered" | "closed" | "cancelled";

export interface AdminConsultRequest {
  id: string;
  user_id: string;
  bs_id: string | null;
  question: string;
  baby_age_months: number | null;
  answer: string | null;
  answered_at: string | null;
  forwarded_at: string | null;
  forwarded_by: string | null;
  internal_note: string | null;
  status: ConsultStatus;
  rating: number | null;
  created_at: string;
  users: { id: string; full_name: string | null; email: string; phone: string | null } | null;
  bs_nhi: {
    id: string;
    full_name: string;
    specialty: string | null;
    hospital: string | null;
    avatar_url: string | null;
    response_hours: number;
    verified: boolean;
  } | null;
}

// UC-19 - Quản Lý Đối Tác, Gói Dịch Vụ Và Booking.
export type PartnerStatus = "pending" | "active" | "inactive" | "hidden";
export type PartnerBookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type PartnerRequestType = "lead" | "booking" | "doctor_lead";

export interface AdminPartner {
  id: string;
  name: string;
  partner_type: string;
  category: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  province: string | null;
  address: string | null;
  rating: number | null;
  verified: boolean;
  status: PartnerStatus;
  created_at: string;
  updated_at: string;
}

export interface AdminPartnerService {
  id: string;
  partner_id: string;
  name: string;
  service_type: string | null;
  description: string | null;
  price_from: number | null;
  price_to: number | null;
  duration_minutes: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  partners?: { id: string; name: string; partner_type: string } | null;
}

export interface AdminPartnerBooking {
  id: string;
  user_id: string | null;
  bs_id: string | null;
  partner_id: string | null;
  partner_service_id: string | null;
  partner_type: string | null;
  service: string | null;
  amount: number | null;
  fee_amount: number | null;
  status: PartnerBookingStatus;
  scheduled_at: string | null;
  request_type: PartnerRequestType;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  address: string | null;
  note: string | null;
  internal_note: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  forwarded_at: string | null;
  forwarded_by: string | null;
  notification_sent_at: string | null;
  created_at: string;
  updated_at: string;
  partners: { id: string; name: string; partner_type: string } | null;
  partner_services: { id: string; name: string } | null;
  bs_nhi: { id: string; full_name: string; specialty: string | null; hospital: string | null } | null;
}
