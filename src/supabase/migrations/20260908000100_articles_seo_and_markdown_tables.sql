-- Add SEO metadata for article pages.
alter table public.articles
  add column if not exists meta_description text;

comment on column public.articles.meta_description is
  'SEO description shown in the page metadata; the article excerpt remains the visible sapo.';
