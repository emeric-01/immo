alter table public.property_estimations
  add column if not exists generated_low_price integer,
  add column if not exists generated_median_price integer,
  add column if not exists generated_high_price integer,
  add column if not exists range_adjusted boolean not null default false,
  add column if not exists range_adjusted_at timestamptz,
  add column if not exists range_adjusted_by_admin_user_id uuid
    references public.admin_users(id) on delete set null;

update public.property_estimations
set
  generated_low_price = coalesce(generated_low_price, low_price),
  generated_median_price = coalesce(generated_median_price, median_price),
  generated_high_price = coalesce(generated_high_price, high_price)
where generated_low_price is null
   or generated_median_price is null
   or generated_high_price is null;

alter table public.property_estimations
  alter column generated_low_price set not null,
  alter column generated_median_price set not null,
  alter column generated_high_price set not null;

alter table public.property_estimations
  drop constraint if exists property_estimations_generated_price_range_check;
alter table public.property_estimations
  add constraint property_estimations_generated_price_range_check
  check (
    generated_low_price >= 0
    and generated_low_price <= generated_median_price
    and generated_median_price <= generated_high_price
  );

create index if not exists property_estimations_range_adjusted_idx
  on public.property_estimations (range_adjusted_at desc)
  where range_adjusted = true;

comment on column public.property_estimations.generated_low_price is
  'Fourchette basse initialement calculee par le moteur d estimation.';
comment on column public.property_estimations.generated_median_price is
  'Valeur centrale initialement calculee par le moteur d estimation.';
comment on column public.property_estimations.generated_high_price is
  'Fourchette haute initialement calculee par le moteur d estimation.';
comment on column public.property_estimations.range_adjusted is
  'Indique que la fourchette affichee a ete ajustee manuellement dans le back-office.';
