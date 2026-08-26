export interface Brand {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  country: string | null;
  description: string | null;
  website_url: string | null;
  verified: boolean;
}

export interface ProductCategory {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

export interface MilkProductInfo {
  stage: string | null;
  age_min_months: number | null;
  age_max_months: number | null;
  weight_g: number | null;
  nutrition_tags: string[];
  rating: number | null;
  review_count: number;
}

export interface Product {
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
  tags: string[];
  // Affiliate Bách Hóa (đã chốt với techlead): SuaEmbe không bán trực tiếp,
  // chỉ hiển thị sản phẩm rồi redirect ra trang bán thật của đối tác (VD:
  // Shopee) kèm link affiliate khi có `outbound_url`.
  outbound_url: string | null;
  brands: { id: string; name: string; logo_url: string | null } | null;
  milk_products: MilkProductInfo | null;
}

// UC-10 MVP mới (Gửi Form Pass Đồ C2C): seller_id null khi người bán là
// khách vãng lai chưa đăng nhập — seller_name lưu snapshot tên nhập từ form.
export interface Listing {
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
  seller: { id: string | null; full_name: string | null; avatar_url: string | null; is_verified: boolean } | null;
}

// UC-12 - Đặt Mua C2C Thanh Toán Thường.
export interface C2cOrder {
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
  c2c_listings: { id: string; title: string; images: string[]; status: string } | null;
}
