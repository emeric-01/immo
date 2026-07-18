alter table public.admin_users
drop constraint if exists admin_users_role_check;

alter table public.admin_users
add constraint admin_users_role_check
check (role in ('admin', 'manager', 'editor'));

create table if not exists public.admin_role_permissions (
  role text not null check (role in ('admin', 'manager', 'editor')),
  permission text not null check (
    permission in (
      'buyer_searches:read',
      'estimations:read',
      'clients:read',
      'users:manage',
      'contents:read',
      'contents:write',
      'properties:read',
      'properties:write'
    )
  ),
  created_at timestamptz not null default now(),
  primary key (role, permission)
);

insert into public.admin_role_permissions (role, permission)
values
  ('admin', 'buyer_searches:read'),
  ('admin', 'estimations:read'),
  ('admin', 'clients:read'),
  ('admin', 'users:manage'),
  ('admin', 'contents:read'),
  ('admin', 'contents:write'),
  ('admin', 'properties:read'),
  ('admin', 'properties:write'),
  ('manager', 'buyer_searches:read'),
  ('manager', 'estimations:read'),
  ('manager', 'clients:read'),
  ('manager', 'contents:read'),
  ('manager', 'contents:write'),
  ('manager', 'properties:read'),
  ('manager', 'properties:write'),
  ('editor', 'contents:read'),
  ('editor', 'contents:write')
on conflict (role, permission) do nothing;

create table if not exists public.content_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) >= 3),
  slug text not null,
  excerpt text,
  body_markdown text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  category text not null default 'conseils',
  primary_keyword text,
  related_city_slug text,
  seo_title text,
  seo_description text,
  cover_image_url text,
  cover_image_alt text,
  reading_minutes integer not null default 1 check (reading_minutes >= 1),
  published_at timestamptz,
  created_by_admin_id uuid references public.admin_users(id) on delete set null,
  updated_by_admin_id uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_articles_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index if not exists content_articles_slug_unique_idx
on public.content_articles (slug);

create index if not exists content_articles_publication_idx
on public.content_articles (status, published_at desc, updated_at desc);

create index if not exists content_articles_category_idx
on public.content_articles (category);

alter table public.admin_role_permissions enable row level security;
alter table public.content_articles enable row level security;

revoke all on table public.admin_role_permissions from anon, authenticated, service_role;
revoke all on table public.content_articles from anon, authenticated, service_role;

grant usage on schema public to service_role;
grant select on table public.admin_role_permissions to service_role;
grant select, insert, update, delete on table public.content_articles to service_role;

drop policy if exists "Service role reads admin role permissions" on public.admin_role_permissions;
create policy "Service role reads admin role permissions"
on public.admin_role_permissions
for select
to service_role
using (true);

drop policy if exists "Service role manages content articles" on public.content_articles;
create policy "Service role manages content articles"
on public.content_articles
for all
to service_role
using (true)
with check (true);
