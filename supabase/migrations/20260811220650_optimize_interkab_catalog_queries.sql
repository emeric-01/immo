create index if not exists interkab_listings_active_recent_idx
  on public.interkab_listings (last_seen_at desc)
  where status = 'active';

create index if not exists interkab_listings_active_price_idx
  on public.interkab_listings (price)
  where status = 'active';

create index if not exists interkab_listings_active_surface_idx
  on public.interkab_listings (surface_m2)
  where status = 'active';

create index if not exists interkab_listings_active_price_per_m2_idx
  on public.interkab_listings (price_per_m2)
  where status = 'active';
