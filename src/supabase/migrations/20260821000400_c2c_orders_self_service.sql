-- UC-29 - Quản Lý Đơn Hàng Của Tôi (Mẹ bỉm). Người mua có tài khoản đã đọc
-- lại được đơn của chính mình qua policy "c2c_orders_select_admin_or_buyer"
-- có sẵn — bổ sung quyền HUỶ đơn khi đơn còn 'pending_admin_review' (trước
-- khi admin xử lý). Chỉ cho đổi đúng 1 chiều pending_admin_review -> cancelled
-- (using kiểm tra dòng cũ, with check kiểm tra dòng mới) — không cho tự
-- confirm/complete đơn của mình hay đổi các cột khác qua policy này; tầng
-- API cũng chỉ gửi đúng {order_status: 'cancelled'}, không forward field tự do.
create policy "c2c_orders_update_buyer_cancel"
  on public.c2c_orders for update
  using (buyer_id is not null and auth.uid() = buyer_id and order_status = 'pending_admin_review')
  with check (buyer_id is not null and auth.uid() = buyer_id and order_status = 'cancelled');
