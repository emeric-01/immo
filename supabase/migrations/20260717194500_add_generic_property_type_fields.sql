alter table public.properties
  add column if not exists land_area_m2 numeric(10,2),
  add column if not exists bathrooms integer,
  add column if not exists levels integer,
  add column if not exists parking_spaces integer,
  add column if not exists property_condition text,
  add column if not exists kitchen_type text,
  add column if not exists land_is_buildable boolean,
  add column if not exists land_is_serviced boolean;
