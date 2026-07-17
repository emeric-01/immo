create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(), slug text not null unique,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  title text not null, city_name text not null, postal_code text, neighborhood text,
  property_type text not null default 'apartment', transaction_type text not null default 'sale',
  price integer not null check (price >= 0), surface_m2 numeric(8,2), rooms integer, bedrooms integer,
  floor_label text, short_description text, description text, address text,
  latitude double precision, longitude double precision, energy_rating text, ghg_rating text,
  condominium_charges_monthly numeric(10,2), property_tax_annual numeric(10,2), condominium_lots integer,
  terrace_m2 numeric(8,2), heating text, exposure text, construction_year integer, parking_details text,
  amenities text[] not null default '{}', fees_paid_by text default 'Vendeur',
  contact_name text, contact_phone text, contact_email text, published_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text, public_url text not null, alt_text text, position integer not null default 0,
  is_cover boolean not null default false, created_at timestamptz not null default now()
);
create index if not exists properties_public_idx on public.properties(status, published_at desc);
create index if not exists property_images_order_idx on public.property_images(property_id, position);
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
revoke all on public.properties from anon, authenticated;
revoke all on public.property_images from anon, authenticated;
grant all on public.properties to service_role;
grant all on public.property_images to service_role;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('property-images','property-images',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
