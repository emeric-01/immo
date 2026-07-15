create table if not exists public.client_login_challenges (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_account_id uuid not null references public.client_accounts(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempt_count smallint not null default 0 check (attempt_count between 0 and 5),
  request_ip inet,
  user_agent text
);

create index if not exists client_login_challenges_account_created_idx
on public.client_login_challenges (client_account_id, created_at desc);

create index if not exists client_login_challenges_expires_idx
on public.client_login_challenges (expires_at)
where consumed_at is null;

create table if not exists public.property_estimations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_account_id uuid not null references public.client_accounts(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'archived')),
  address_label text not null,
  city_name text,
  postal_code text,
  property_type text not null check (property_type in ('apartment', 'house')),
  surface_m2 integer not null check (surface_m2 > 0),
  rooms integer not null check (rooms > 0),
  median_price integer not null check (median_price >= 0),
  low_price integer not null check (low_price >= 0),
  high_price integer not null check (high_price >= 0),
  price_per_m2 integer not null check (price_per_m2 >= 0),
  confidence_score smallint check (confidence_score between 0 and 5),
  source text not null,
  input_payload jsonb not null,
  result_payload jsonb not null
);

create index if not exists property_estimations_client_created_idx
on public.property_estimations (client_account_id, created_at desc);

drop trigger if exists set_property_estimations_updated_at on public.property_estimations;
create trigger set_property_estimations_updated_at
before update on public.property_estimations
for each row
execute function public.set_updated_at();

update public.buyer_searches
set
  client_access_enabled = false,
  client_reference = null,
  client_access_code_hash = null
where
  client_access_enabled = true
  or client_reference is not null
  or client_access_code_hash is not null;

alter table public.buyer_searches
  alter column client_access_enabled set default false;

alter table public.client_login_challenges enable row level security;
alter table public.property_estimations enable row level security;

revoke all on public.client_login_challenges from anon, authenticated;
revoke all on public.property_estimations from anon, authenticated;

grant select, insert, update, delete on public.client_login_challenges to service_role;
grant select, insert, update, delete on public.property_estimations to service_role;

comment on table public.client_login_challenges is
  'Codes de connexion client temporaires, haches et a usage unique.';

comment on table public.property_estimations is
  'Estimations immobilieres enregistrees dans le compte client.';
