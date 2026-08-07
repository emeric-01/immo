alter table public.property_estimations
  add column if not exists generated_result_payload jsonb;

update public.property_estimations
set generated_result_payload = result_payload || jsonb_build_object(
  'lowPrice', coalesce(generated_low_price, low_price),
  'medianPrice', coalesce(generated_median_price, median_price),
  'highPrice', coalesce(generated_high_price, high_price),
  'pricePerM2', round(coalesce(generated_median_price, median_price) / nullif(surface_m2, 0))
)
where generated_result_payload is null;

alter table public.property_estimations
  alter column generated_result_payload set not null;

create table if not exists public.insee_housing_profiles (
  insee_code text primary key,
  city_name text not null,
  vintage smallint not null default 2022,
  source_url text not null,
  payload jsonb not null,
  synced_at timestamptz not null default now()
);

alter table public.insee_housing_profiles enable row level security;
revoke all on table public.insee_housing_profiles from anon, authenticated;
grant all on table public.insee_housing_profiles to service_role;

create table if not exists public.estimation_report_snapshots (
  id uuid primary key default gen_random_uuid(),
  estimation_id uuid not null references public.property_estimations(id) on delete cascade,
  version integer not null check (version > 0),
  created_at timestamptz not null default now(),
  created_by_admin_user_id uuid references public.admin_users(id) on delete set null,
  input_payload jsonb not null,
  generated_result_payload jsonb not null,
  report_result_payload jsonb not null,
  insee_profile jsonb,
  low_price integer not null,
  median_price integer not null,
  high_price integer not null,
  price_per_m2 integer not null,
  pdf_storage_path text not null,
  pdf_sha256 text not null,
  unique (estimation_id, version)
);

create index if not exists estimation_report_snapshots_estimation_created_idx
  on public.estimation_report_snapshots (estimation_id, created_at desc);
create index if not exists estimation_report_snapshots_created_by_idx
  on public.estimation_report_snapshots (created_by_admin_user_id);

alter table public.estimation_report_snapshots enable row level security;
revoke all on table public.estimation_report_snapshots from anon, authenticated;
grant all on table public.estimation_report_snapshots to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('estimation-reports', 'estimation-reports', false, 15728640, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
