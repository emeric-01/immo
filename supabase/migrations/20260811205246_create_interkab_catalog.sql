create table if not exists public.interkab_cities (
  insee_code text primary key,
  slug text not null unique,
  city_name text not null,
  postal_code text not null,
  department_code text not null check (department_code in ('13', '83')),
  interkab_location_id text,
  source_url text not null,
  sync_enabled boolean not null default true,
  status text not null default 'pending' check (status in ('pending', 'syncing', 'ready', 'error')),
  last_listing_count integer not null default 0 check (last_listing_count >= 0),
  last_synced_at timestamptz,
  next_sync_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interkab_listings (
  external_id text primary key,
  city_insee_code text not null references public.interkab_cities(insee_code) on delete cascade,
  listing_url text not null,
  image_url text,
  property_type text not null default '',
  city_label text not null default '',
  neighborhood text,
  price numeric(12,2) check (price is null or price >= 0),
  surface_m2 numeric(10,2) check (surface_m2 is null or surface_m2 >= 0),
  rooms integer check (rooms is null or rooms >= 0),
  bedrooms integer check (bedrooms is null or bedrooms >= 0),
  bathrooms integer check (bathrooms is null or bathrooms >= 0),
  toilets integer check (toilets is null or toilets >= 0),
  land_area_m2 numeric(12,2) check (land_area_m2 is null or land_area_m2 >= 0),
  features text[] not null default '{}',
  agency_name text,
  agency_phone text,
  agency_site_url text,
  agent_label text,
  published_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'missing', 'removed')),
  updated_at timestamptz not null default now()
);

create table if not exists public.interkab_sync_runs (
  id uuid primary key default gen_random_uuid(),
  city_insee_code text not null references public.interkab_cities(insee_code) on delete cascade,
  status text not null default 'running' check (status in ('running', 'success', 'error')),
  result_count integer not null default 0,
  listing_count integer not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists interkab_cities_due_idx on public.interkab_cities (next_sync_at) where sync_enabled;
create index if not exists interkab_listings_city_status_idx on public.interkab_listings (city_insee_code, status, last_seen_at desc);
create index if not exists interkab_listings_price_idx on public.interkab_listings (city_insee_code, price);
create index if not exists interkab_sync_runs_city_started_idx on public.interkab_sync_runs (city_insee_code, started_at desc);

alter table public.interkab_cities enable row level security;
alter table public.interkab_listings enable row level security;
alter table public.interkab_sync_runs enable row level security;

revoke all on table public.interkab_cities from anon, authenticated;
revoke all on table public.interkab_listings from anon, authenticated;
revoke all on table public.interkab_sync_runs from anon, authenticated;
grant all on table public.interkab_cities to service_role;
grant all on table public.interkab_listings to service_role;
grant all on table public.interkab_sync_runs to service_role;

comment on table public.interkab_cities is 'Private internal Interkab synchronization queue.';
comment on table public.interkab_listings is 'Private Interkab listing snapshot; never exposed to public clients.';
