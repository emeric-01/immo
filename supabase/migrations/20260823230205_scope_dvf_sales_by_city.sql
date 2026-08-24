alter table public.dvf_comparable_sales
  drop constraint if exists dvf_comparable_sales_pkey;

alter table public.dvf_comparable_sales
  add primary key (mutation_id, city_insee_code);

comment on constraint dvf_comparable_sales_pkey on public.dvf_comparable_sales is
  'A DVF mutation can exceptionally span two communes; duplicate source rows inside one commune remain collapsed.';
