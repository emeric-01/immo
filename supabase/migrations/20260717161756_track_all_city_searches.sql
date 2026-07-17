alter table public.city_search_misses
  add column if not exists is_referenced boolean not null default false,
  add column if not exists city_slug text;

alter table public.city_search_misses
  drop constraint if exists city_search_misses_reference_consistency;

alter table public.city_search_misses
  add constraint city_search_misses_reference_consistency
  check (not is_referenced or city_slug is not null);

create index if not exists city_search_misses_reference_created_idx
  on public.city_search_misses (is_referenced, created_at desc);

comment on column public.city_search_misses.is_referenced is
  'True when the visitor selected a city that already has a public price page.';
comment on column public.city_search_misses.city_slug is
  'Matched public city slug for referenced searches; null for missing cities.';
