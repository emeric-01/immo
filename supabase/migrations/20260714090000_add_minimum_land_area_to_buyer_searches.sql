alter table public.buyer_searches
add column if not exists minimum_land_area integer;

comment on column public.buyer_searches.minimum_land_area is
'Minimum land area requested by the buyer, in square meters.';
