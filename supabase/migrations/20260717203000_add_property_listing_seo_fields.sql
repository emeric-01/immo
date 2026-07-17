alter table public.properties
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_noindex boolean not null default false;
