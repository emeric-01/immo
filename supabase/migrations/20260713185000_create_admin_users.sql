create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null,
  full_name text not null default '',
  role text not null default 'manager' check (role in ('admin', 'manager')),
  password_hash text not null,
  is_active boolean not null default true,
  last_login_at timestamptz
);

create unique index if not exists admin_users_email_unique_idx on public.admin_users (lower(email));
create index if not exists admin_users_created_at_idx on public.admin_users (created_at desc);

drop trigger if exists set_admin_users_updated_at on public.admin_users;
create trigger set_admin_users_updated_at
before update on public.admin_users
for each row
execute function public.set_updated_at();

alter table public.admin_users enable row level security;

create policy "Admins can manage admin users"
on public.admin_users
for all
to authenticated
using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin')
with check ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');

grant select, insert, update, delete on public.admin_users to service_role;
