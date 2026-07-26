-- Droits individuels du back-office et propriété des annonces.

alter table public.admin_role_permissions
  drop constraint if exists admin_role_permissions_permission_check;

alter table public.admin_role_permissions
  add constraint admin_role_permissions_permission_check
  check (permission in (
    'properties:read',
    'properties:create',
    'properties:update_own',
    'properties:write',
    'buyer_searches:read',
    'estimations:read',
    'clients:read',
    'referrals:read',
    'city_searches:read',
    'audience:read',
    'contents:read',
    'contents:write',
    'users:manage'
  ));

insert into public.admin_role_permissions (role, permission)
values
  ('admin', 'properties:create'),
  ('admin', 'properties:update_own'),
  ('admin', 'referrals:read'),
  ('admin', 'city_searches:read'),
  ('admin', 'audience:read'),
  ('manager', 'properties:create'),
  ('manager', 'properties:update_own'),
  ('manager', 'referrals:read'),
  ('manager', 'city_searches:read'),
  ('manager', 'audience:read'),
  ('agent', 'properties:read'),
  ('agent', 'properties:create'),
  ('agent', 'properties:update_own'),
  ('agent', 'referrals:read')
on conflict (role, permission) do nothing;

create table if not exists public.admin_user_permissions (
  admin_user_id uuid not null references public.admin_users(id) on delete cascade,
  permission text not null check (permission in (
    'properties:read',
    'properties:create',
    'properties:update_own',
    'properties:write',
    'buyer_searches:read',
    'estimations:read',
    'clients:read',
    'referrals:read',
    'city_searches:read',
    'audience:read',
    'contents:read',
    'contents:write',
    'users:manage'
  )),
  is_allowed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (admin_user_id, permission)
);

create index if not exists admin_user_permissions_user_allowed_idx
  on public.admin_user_permissions (admin_user_id, is_allowed);

drop trigger if exists set_admin_user_permissions_updated_at on public.admin_user_permissions;
create trigger set_admin_user_permissions_updated_at
before update on public.admin_user_permissions
for each row execute function public.set_updated_at();

alter table public.admin_user_permissions enable row level security;
revoke all on table public.admin_user_permissions from anon, authenticated, service_role;
grant select, insert, update, delete on table public.admin_user_permissions to service_role;

drop policy if exists "Service role manages admin user permissions" on public.admin_user_permissions;
create policy "Service role manages admin user permissions"
on public.admin_user_permissions
for all
to service_role
using (true)
with check (true);

alter table public.properties
  add column if not exists created_by_admin_id uuid references public.admin_users(id) on delete set null,
  add column if not exists updated_by_admin_id uuid references public.admin_users(id) on delete set null;

create index if not exists properties_created_by_admin_idx
  on public.properties (created_by_admin_id, updated_at desc);

grant select, insert, update, delete on table public.properties to service_role;
