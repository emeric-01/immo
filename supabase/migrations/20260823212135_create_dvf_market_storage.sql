create table if not exists public.dvf_import_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'running'
    check (status in ('running', 'success', 'partial', 'error')),
  source_release text not null,
  source_years smallint[] not null default '{}',
  city_insee_codes text[] not null default '{}',
  downloaded_files integer not null default 0 check (downloaded_files >= 0),
  comparable_sales integer not null default 0 check (comparable_sales >= 0),
  snapshot_count integer not null default 0 check (snapshot_count >= 0),
  errors jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.dvf_iris_zones (
  code_iris text primary key,
  city_insee_code text not null,
  city_slug text not null,
  city_name text not null,
  iris_name text not null,
  iris_type text,
  geometry jsonb not null,
  label_longitude numeric(10,7),
  label_latitude numeric(10,7),
  source_updated_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(geometry) = 'object')
);

create table if not exists public.dvf_comparable_sales (
  mutation_id text primary key,
  source_year smallint not null check (source_year between 2014 and 2100),
  city_insee_code text not null,
  city_slug text not null,
  iris_code text references public.dvf_iris_zones(code_iris) on delete set null,
  sale_date date not null,
  sale_price numeric(14,2) not null check (sale_price > 0),
  property_type text not null check (property_type in ('apartment', 'house')),
  built_area_m2 numeric(10,2) not null check (built_area_m2 > 0),
  rooms smallint check (rooms is null or rooms >= 0),
  land_area_m2 numeric(12,2) check (land_area_m2 is null or land_area_m2 >= 0),
  price_per_m2 numeric(12,2)
    generated always as (round(sale_price / nullif(built_area_m2, 0), 2)) stored,
  address_label text not null,
  postal_code text,
  longitude numeric(10,7) not null,
  latitude numeric(10,7) not null,
  source_url text not null,
  import_run_id uuid references public.dvf_import_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dvf_city_market_snapshots (
  city_insee_code text primary key,
  city_slug text not null unique,
  methodology_version text not null,
  observed_from date not null,
  observed_to date not null,
  latest_sale_at date,
  source_release text not null,
  transaction_count integer not null default 0 check (transaction_count >= 0),
  market_data jsonb not null,
  audit_data jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  import_run_id uuid references public.dvf_import_runs(id) on delete set null,
  check (jsonb_typeof(market_data) = 'object'),
  check (jsonb_typeof(audit_data) = 'object')
);

create index if not exists dvf_iris_zones_city_idx
  on public.dvf_iris_zones (city_insee_code, code_iris);

create index if not exists dvf_comparable_sales_city_type_date_idx
  on public.dvf_comparable_sales (city_insee_code, property_type, sale_date desc);

create index if not exists dvf_comparable_sales_iris_type_date_idx
  on public.dvf_comparable_sales (iris_code, property_type, sale_date desc)
  where iris_code is not null;

create index if not exists dvf_comparable_sales_source_year_idx
  on public.dvf_comparable_sales (source_year, city_insee_code);

alter table public.dvf_import_runs enable row level security;
alter table public.dvf_iris_zones enable row level security;
alter table public.dvf_comparable_sales enable row level security;
alter table public.dvf_city_market_snapshots enable row level security;

revoke all on table public.dvf_import_runs from anon, authenticated;
revoke all on table public.dvf_iris_zones from anon, authenticated;
revoke all on table public.dvf_comparable_sales from anon, authenticated;
revoke all on table public.dvf_city_market_snapshots from anon, authenticated;

grant select, insert, update, delete on table public.dvf_import_runs to service_role;
grant select, insert, update, delete on table public.dvf_iris_zones to service_role;
grant select, insert, update, delete on table public.dvf_comparable_sales to service_role;
grant select, insert, update, delete on table public.dvf_city_market_snapshots to service_role;

comment on table public.dvf_import_runs is
  'Private audit trail for official DVF and IRIS refreshes.';
comment on table public.dvf_iris_zones is
  'Private IGN/INSEE IRIS geometries used to aggregate and render local market data.';
comment on table public.dvf_comparable_sales is
  'Private normalized DVF sales containing exactly one comparable built property per mutation.';
comment on table public.dvf_city_market_snapshots is
  'Versioned DVF market snapshots published to city_market_cache for public pages.';

comment on table public.city_market_cache is
  'Server-only published market snapshot by city. DVF is the factual base; stored professional listings may provide a dampened current-market signal.';

-- Marseille is published as one city. The legacy arrondissement records never
-- contained listings and are removed from the internal synchronization queue.
delete from public.interkab_cities where insee_code in ('13211', '13212');
delete from public.city_market_cache where insee_code in ('13211', '13212');
