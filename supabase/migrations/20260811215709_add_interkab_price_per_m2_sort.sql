alter table public.interkab_listings
  add column if not exists price_per_m2 numeric(12,2)
  generated always as (
    case when price is not null and surface_m2 is not null and surface_m2 > 0
      then round(price / surface_m2, 2)
      else null
    end
  ) stored;

create index if not exists interkab_listings_price_per_m2_idx
  on public.interkab_listings (price_per_m2)
  where status = 'active';
