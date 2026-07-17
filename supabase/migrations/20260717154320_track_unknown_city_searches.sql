create table if not exists public.city_search_misses (
  id bigint generated always as identity primary key,
  query_display text not null,
  query_normalized text not null,
  source text not null default 'city_directory',
  created_at timestamptz not null default now(),
  constraint city_search_misses_query_display_length check (char_length(query_display) between 2 and 80),
  constraint city_search_misses_query_normalized_length check (char_length(query_normalized) between 2 and 80),
  constraint city_search_misses_source_check check (source in ('city_directory'))
);

comment on table public.city_search_misses is 'Failed city searches from the public prix m2 directory, stored without IP or personal identifiers.';
comment on column public.city_search_misses.query_display is 'Cleaned query exactly as useful for back-office display.';
comment on column public.city_search_misses.query_normalized is 'Accent-insensitive normalized query used for aggregation.';
comment on column public.city_search_misses.source is 'Public feature that generated the miss.';

create index if not exists city_search_misses_query_created_idx
  on public.city_search_misses (query_normalized, created_at desc);

create index if not exists city_search_misses_created_idx
  on public.city_search_misses (created_at desc);

alter table public.city_search_misses enable row level security;

revoke all on table public.city_search_misses from public;
revoke all on table public.city_search_misses from anon, authenticated;
revoke all on sequence public.city_search_misses_id_seq from public;
revoke all on sequence public.city_search_misses_id_seq from anon, authenticated;

grant select, insert on table public.city_search_misses to service_role;
grant usage, select on sequence public.city_search_misses_id_seq to service_role;

drop policy if exists "Service role can read city search misses" on public.city_search_misses;
create policy "Service role can read city search misses"
  on public.city_search_misses
  for select
  to service_role
  using (true);

drop policy if exists "Service role can add city search misses" on public.city_search_misses;
create policy "Service role can add city search misses"
  on public.city_search_misses
  for insert
  to service_role
  with check (true);
