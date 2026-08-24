create index if not exists dvf_comparable_sales_import_run_idx
  on public.dvf_comparable_sales (import_run_id)
  where import_run_id is not null;

create index if not exists dvf_city_market_snapshots_import_run_idx
  on public.dvf_city_market_snapshots (import_run_id)
  where import_run_id is not null;
