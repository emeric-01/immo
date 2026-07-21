alter table public.properties
  add column if not exists insee_code text;

create index if not exists properties_insee_code_idx
  on public.properties (insee_code)
  where insee_code is not null;
