-- UC-10 (Gửi form pass đồ C2C) cho phép khách chưa đăng nhập đính kèm ảnh
-- sản phẩm. Ảnh được upload TRƯỚC khi tạo tin (chưa có listing_id để gắn
-- owner_id), nên uploader_id/owner đều null lúc insert — RLS insert cũ chỉ
-- cho phép auth.uid() = uploader_id hoặc admin, chặn hẳn khách vãng lai.
drop policy if exists "media_assets_insert_owner_or_admin" on public.media_assets;
create policy "media_assets_insert_owner_or_admin_or_guest"
  on public.media_assets for insert
  with check (
    (uploader_id is null and auth.uid() is null)
    or auth.uid() = uploader_id
    or public.is_admin()
  );
