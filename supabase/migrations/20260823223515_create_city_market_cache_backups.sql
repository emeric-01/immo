create table if not exists public.city_market_cache_backups (
  backup_set_id uuid not null,
  insee_code text not null,
  city_slug text not null,
  market_data jsonb not null,
  fetched_at timestamptz not null,
  updated_at timestamptz not null,
  backup_reason text not null,
  backed_up_at timestamptz not null default now(),
  primary key (backup_set_id, insee_code),
  check (jsonb_typeof(market_data) = 'object')
);

create index if not exists city_market_cache_backups_created_idx
  on public.city_market_cache_backups (backed_up_at desc);

alter table public.city_market_cache_backups enable row level security;

revoke all on table public.city_market_cache_backups from anon, authenticated;
grant select, insert, delete on table public.city_market_cache_backups to service_role;

comment on table public.city_market_cache_backups is
  'Private point-in-time backups of published market snapshots before controlled DVF releases.';
