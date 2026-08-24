alter table public.dvf_iris_zones
  add column if not exists official_name text,
  add column if not exists display_name text,
  add column if not exists neighborhood_names text[] not null default '{}',
  add column if not exists naming_sources jsonb not null default '[]'::jsonb;

update public.dvf_iris_zones
set
  official_name = coalesce(official_name, iris_name),
  display_name = coalesce(display_name, iris_name)
where official_name is null or display_name is null;

alter table public.dvf_iris_zones
  alter column official_name set not null,
  alter column display_name set not null;

alter table public.dvf_iris_zones
  add constraint dvf_iris_zones_naming_sources_is_array
  check (jsonb_typeof(naming_sources) = 'array') not valid;

alter table public.dvf_iris_zones
  validate constraint dvf_iris_zones_naming_sources_is_array;

comment on column public.dvf_iris_zones.official_name is
  'Official INSEE IRIS name, preserved unchanged for traceability.';
comment on column public.dvf_iris_zones.display_name is
  'Editorial public label; may correct typography without changing the IRIS boundary.';
comment on column public.dvf_iris_zones.neighborhood_names is
  'Verified IGN BD TOPO habitation names spatially attached to this IRIS.';
comment on column public.dvf_iris_zones.naming_sources is
  'Structured provenance for the IRIS label and verified neighborhood names.';
