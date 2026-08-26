-- Đã chốt với techlead: Bách Hóa đi theo hướng AFFILIATE, không bán trực
-- tiếp trên platform. SuaEmbe chỉ hiển thị sản phẩm; bấm "Mua ngay" thì
-- redirect sang trang bán thật của đối tác (VD: Shopee) kèm link affiliate.
-- Không cần bảng `orders` (đã bàn ở database.md §3) vì không xử lý thanh
-- toán/đơn hàng nào trên SuaEmbe cho Bách Hóa.
alter table public.products
  add column if not exists outbound_url text;
