create extension if not exists pgcrypto;

create table if not exists public.buyer_searches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'qualified', 'contacted', 'matched', 'paused', 'closed')),
  source text not null default 'website',
  client_user_id uuid references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  contact_first_name text not null,
  contact_last_name text not null,
  contact_email text not null,
  contact_phone text not null,
  preferred_channel text check (preferred_channel in ('email', 'sms', 'phone')),
  consent boolean not null default false,
  consent_at timestamptz,
  location_summary text,
  city_names text[] not null default '{}',
  city_codes text[] not null default '{}',
  postal_codes text[] not null default '{}',
  property_types text[] not null default '{}',
  ideal_budget integer,
  maximum_budget integer,
  minimum_living_area integer,
  minimum_rooms integer,
  minimum_bedrooms integer,
  minimum_bathrooms integer,
  purchase_timeline text,
  financing_status text,
  current_situation text,
  preferences jsonb not null default '{}'::jsonb,
  priorities jsonb not null default '[]'::jsonb,
  raw_payload jsonb not null,
  metadata jsonb not null default '{}'::jsonb,
  notes text
);

create table if not exists public.buyer_search_locations (
  id bigserial primary key,
  buyer_search_id uuid not null references public.buyer_searches(id) on delete cascade,
  position integer not null default 1,
  name text not null,
  postal_code text,
  postal_codes text[] not null default '{}',
  city_code text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  radius_km numeric(6, 2),
  created_at timestamptz not null default now()
);

create table if not exists public.buyer_search_priorities (
  id bigserial primary key,
  buyer_search_id uuid not null references public.buyer_searches(id) on delete cascade,
  position integer not null default 1,
  priority_key text not null,
  label text not null,
  value text not null,
  category text not null,
  level text not null check (level in ('essential', 'desired')),
  created_at timestamptz not null default now()
);

create table if not exists public.buyer_search_consents (
  id uuid primary key default gen_random_uuid(),
  buyer_search_id uuid not null references public.buyer_searches(id) on delete cascade,
  consent_type text not null default 'contact_and_matching',
  consent_given boolean not null,
  consent_text text not null,
  collected_at timestamptz not null default now(),
  collected_ip inet,
  user_agent text
);

create index if not exists buyer_searches_created_at_idx on public.buyer_searches (created_at desc);
create index if not exists buyer_searches_status_idx on public.buyer_searches (status);
create index if not exists buyer_searches_contact_email_idx on public.buyer_searches (lower(contact_email));
create index if not exists buyer_searches_city_names_idx on public.buyer_searches using gin (city_names);
create index if not exists buyer_searches_property_types_idx on public.buyer_searches using gin (property_types);
create index if not exists buyer_search_locations_search_id_idx on public.buyer_search_locations (buyer_search_id);
create index if not exists buyer_search_priorities_search_id_idx on public.buyer_search_priorities (buyer_search_id);
create index if not exists buyer_search_consents_search_id_idx on public.buyer_search_consents (buyer_search_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_buyer_searches_updated_at on public.buyer_searches;
create trigger set_buyer_searches_updated_at
before update on public.buyer_searches
for each row
execute function public.set_updated_at();

alter table public.buyer_searches enable row level security;
alter table public.buyer_search_locations enable row level security;
alter table public.buyer_search_priorities enable row level security;
alter table public.buyer_search_consents enable row level security;

create policy "Admins can manage buyer searches"
on public.buyer_searches
for all
to authenticated
using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin')
with check ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');

create policy "Clients can read own buyer searches"
on public.buyer_searches
for select
to authenticated
using ((select auth.uid()) = client_user_id);

create policy "Admins can manage buyer search locations"
on public.buyer_search_locations
for all
to authenticated
using (
  exists (
    select 1
    from public.buyer_searches searches
    where searches.id = buyer_search_locations.buyer_search_id
      and ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin')
  )
)
with check (
  exists (
    select 1
    from public.buyer_searches searches
    where searches.id = buyer_search_locations.buyer_search_id
      and ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin')
  )
);

create policy "Clients can read own buyer search locations"
on public.buyer_search_locations
for select
to authenticated
using (
  exists (
    select 1
    from public.buyer_searches searches
    where searches.id = buyer_search_locations.buyer_search_id
      and (select auth.uid()) = searches.client_user_id
  )
);

create policy "Admins can manage buyer search priorities"
on public.buyer_search_priorities
for all
to authenticated
using (
  exists (
    select 1
    from public.buyer_searches searches
    where searches.id = buyer_search_priorities.buyer_search_id
      and ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin')
  )
)
with check (
  exists (
    select 1
    from public.buyer_searches searches
    where searches.id = buyer_search_priorities.buyer_search_id
      and ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin')
  )
);

create policy "Clients can read own buyer search priorities"
on public.buyer_search_priorities
for select
to authenticated
using (
  exists (
    select 1
    from public.buyer_searches searches
    where searches.id = buyer_search_priorities.buyer_search_id
      and (select auth.uid()) = searches.client_user_id
  )
);

create policy "Admins can manage buyer search consents"
on public.buyer_search_consents
for all
to authenticated
using (
  exists (
    select 1
    from public.buyer_searches searches
    where searches.id = buyer_search_consents.buyer_search_id
      and ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin')
  )
)
with check (
  exists (
    select 1
    from public.buyer_searches searches
    where searches.id = buyer_search_consents.buyer_search_id
      and ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin')
  )
);

create policy "Clients can read own buyer search consents"
on public.buyer_search_consents
for select
to authenticated
using (
  exists (
    select 1
    from public.buyer_searches searches
    where searches.id = buyer_search_consents.buyer_search_id
      and (select auth.uid()) = searches.client_user_id
  )
);

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on public.buyer_searches to service_role;
grant select, insert, update, delete on public.buyer_search_locations to service_role;
grant select, insert, update, delete on public.buyer_search_priorities to service_role;
grant select, insert, update, delete on public.buyer_search_consents to service_role;
grant usage, select on sequence public.buyer_search_locations_id_seq to service_role;
grant usage, select on sequence public.buyer_search_priorities_id_seq to service_role;
grant select on public.buyer_searches to authenticated;
grant select on public.buyer_search_locations to authenticated;
grant select on public.buyer_search_priorities to authenticated;
grant select on public.buyer_search_consents to authenticated;
