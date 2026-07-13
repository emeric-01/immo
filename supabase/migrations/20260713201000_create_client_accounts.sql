create table if not exists public.client_accounts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null unique,
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  preferred_channel text check (preferred_channel in ('email', 'sms', 'phone')),
  access_enabled boolean not null default true,
  last_search_id uuid references public.buyer_searches(id) on delete set null,
  last_login_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.buyer_searches
  add column if not exists client_account_id uuid references public.client_accounts(id) on delete set null;

create index if not exists client_accounts_created_at_idx on public.client_accounts (created_at desc);
create index if not exists client_accounts_email_idx on public.client_accounts (email);
create index if not exists buyer_searches_client_account_id_idx on public.buyer_searches (client_account_id);

drop trigger if exists set_client_accounts_updated_at on public.client_accounts;
create trigger set_client_accounts_updated_at
before update on public.client_accounts
for each row
execute function public.set_updated_at();

insert into public.client_accounts (
  email,
  first_name,
  last_name,
  phone,
  preferred_channel,
  last_search_id
)
select distinct on (lower(contact_email))
  lower(contact_email),
  contact_first_name,
  contact_last_name,
  contact_phone,
  preferred_channel,
  id
from public.buyer_searches
where nullif(trim(contact_email), '') is not null
order by lower(contact_email), created_at desc
on conflict (email) do update
set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  phone = excluded.phone,
  preferred_channel = excluded.preferred_channel,
  last_search_id = excluded.last_search_id;

update public.buyer_searches searches
set client_account_id = accounts.id
from public.client_accounts accounts
where searches.client_account_id is null
  and lower(searches.contact_email) = accounts.email;

alter table public.client_accounts enable row level security;

create policy "Admins can manage client accounts"
on public.client_accounts
for all
to authenticated
using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin')
with check ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');

grant select, insert, update, delete on public.client_accounts to service_role;
