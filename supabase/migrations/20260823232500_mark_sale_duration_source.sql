update public.city_market_cache
set market_data = jsonb_set(market_data, '{saleDurationSource}', '"immo-data"'::jsonb, true)
where market_data->>'source' = 'dvf'
  and market_data->>'saleDurationDays' is not null;

update public.dvf_city_market_snapshots
set market_data = jsonb_set(market_data, '{saleDurationSource}', '"immo-data"'::jsonb, true)
where market_data->>'source' = 'dvf'
  and market_data->>'saleDurationDays' is not null;
