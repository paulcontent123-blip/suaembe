-- UC-20 (Đọc Tin Tức / Học Viện): khách vãng lai đọc bài cần tăng
-- articles.view_count, nhưng RLS "articles_update_admin" chỉ cho phép admin
-- UPDATE. Dùng 1 function SECURITY DEFINER phạm vi hẹp — chỉ +1 view_count
-- của đúng 1 bài đang published theo slug, không cho ghi bất kỳ cột nào khác
-- — thay vì mở rộng RLS UPDATE cho anon hoặc dùng service-role client trong
-- route (sẽ cấp quyền ghi rộng hơn nhiều so với mức cần thiết).
create or replace function public.increment_article_view(p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.articles
  set view_count = view_count + 1
  where slug = p_slug and status = 'published';
end;
$$;

revoke all on function public.increment_article_view(text) from public;
grant execute on function public.increment_article_view(text) to anon, authenticated;
