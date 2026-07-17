create table if not exists public.city_market_cache (
  insee_code text primary key,
  city_slug text not null unique,
  market_data jsonb not null,
  fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.city_market_cache enable row level security;

revoke all on table public.city_market_cache from anon, authenticated;
grant select, insert, update, delete on table public.city_market_cache to service_role;

comment on table public.city_market_cache is
  'Cache serveur des données Immo Data par ville, actualisé à la visite après 90 jours.';

