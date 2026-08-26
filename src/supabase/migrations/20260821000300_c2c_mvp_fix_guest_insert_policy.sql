-- Policy trước dùng "auth.uid() is null" để nhận diện khách vãng lai nhưng
-- bị RLS chặn insert dù đúng logic — đơn giản hoá điều kiện: chỉ cần
-- seller_id null (khách) hoặc seller_id khớp chính auth.uid() (đã đăng
-- nhập). Không còn ràng buộc "phải auth.uid() is null mới được seller_id
-- null" — ai đăng nhập cũng để trống seller_id nếu tự chọn ẩn danh cũng
-- không phải rủi ro bảo mật (chỉ ảnh hưởng việc tự nhận diện chủ tin).
drop policy if exists "c2c_listings_insert_own_or_guest" on public.c2c_listings;
create policy "c2c_listings_insert_own_or_guest"
  on public.c2c_listings for insert
  with check (
    (seller_id is null and seller_name is not null)
    or auth.uid() = seller_id
  );
