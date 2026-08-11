alter table public.interkab_sync_runs
  add column if not exists inserted_count integer not null default 0,
  add column if not exists updated_count integer not null default 0,
  add column if not exists archived_count integer not null default 0,
  add column if not exists unchanged_count integer not null default 0;

comment on column public.interkab_sync_runs.listing_count is 'Number of references verified during the complete city scan.';
