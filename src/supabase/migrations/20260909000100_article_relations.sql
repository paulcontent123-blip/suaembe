-- Admin-managed related articles for the public article detail page.
create table if not exists public.article_relations (
  article_id uuid not null references public.articles(id) on delete cascade,
  related_article_id uuid not null references public.articles(id) on delete cascade,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  primary key (article_id, related_article_id),
  constraint article_relations_no_self check (article_id <> related_article_id)
);

create index if not exists article_relations_article_idx
  on public.article_relations(article_id, sort_order);

create index if not exists article_relations_related_idx
  on public.article_relations(related_article_id);

alter table public.article_relations enable row level security;

create policy "article_relations_read_published_or_admin"
  on public.article_relations for select
  using (
    public.is_admin()
    or (
      exists (
        select 1
        from public.articles source_article
        where source_article.id = article_relations.article_id
          and source_article.status = 'published'
      )
      and exists (
        select 1
        from public.articles related_article
        where related_article.id = article_relations.related_article_id
          and related_article.status = 'published'
      )
    )
  );

create policy "article_relations_admin_write"
  on public.article_relations for all
  using (public.is_admin())
  with check (public.is_admin());
