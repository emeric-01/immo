create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  email text not null default '',
  phone text not null default '',
  notes text not null default '',
  status text not null default 'prospect'
    check (status in ('prospect', 'active', 'archived')),
  source text not null default 'admin_crm',
  created_by_admin_user_id uuid references public.admin_users(id) on delete set null,
  assigned_admin_user_id uuid references public.admin_users(id) on delete set null,
  linked_client_account_id uuid references public.client_accounts(id) on delete set null
);

create index if not exists crm_contacts_created_at_idx
  on public.crm_contacts (created_at desc);
create index if not exists crm_contacts_assigned_admin_idx
  on public.crm_contacts (assigned_admin_user_id, updated_at desc);
create index if not exists crm_contacts_linked_client_idx
  on public.crm_contacts (linked_client_account_id)
  where linked_client_account_id is not null;
create index if not exists crm_contacts_email_idx
  on public.crm_contacts (lower(email))
  where nullif(trim(email), '') is not null;
create index if not exists crm_contacts_phone_idx
  on public.crm_contacts ((regexp_replace(phone, '[^0-9+]', '', 'g')))
  where nullif(trim(phone), '') is not null;

drop trigger if exists set_crm_contacts_updated_at on public.crm_contacts;
create trigger set_crm_contacts_updated_at
before update on public.crm_contacts
for each row execute function public.set_updated_at();

alter table public.buyer_searches
  add column if not exists crm_contact_id uuid references public.crm_contacts(id) on delete set null,
  add column if not exists created_by_admin_user_id uuid references public.admin_users(id) on delete set null,
  add column if not exists record_origin text not null default 'public';

alter table public.property_estimations
  add column if not exists crm_contact_id uuid references public.crm_contacts(id) on delete set null,
  add column if not exists created_by_admin_user_id uuid references public.admin_users(id) on delete set null,
  add column if not exists record_origin text not null default 'public';

update public.buyer_searches
set record_origin = case when client_account_id is null then 'public' else 'client' end
where record_origin = 'public';

update public.property_estimations
set record_origin = case when client_account_id is null then 'public' else 'client' end
where record_origin = 'public';

alter table public.buyer_searches
  drop constraint if exists buyer_searches_record_origin_check;
alter table public.buyer_searches
  add constraint buyer_searches_record_origin_check
  check (record_origin in ('public', 'client', 'admin'));

alter table public.property_estimations
  drop constraint if exists property_estimations_record_origin_check;
alter table public.property_estimations
  add constraint property_estimations_record_origin_check
  check (record_origin in ('public', 'client', 'admin'));

create index if not exists buyer_searches_crm_contact_created_idx
  on public.buyer_searches (crm_contact_id, created_at desc)
  where crm_contact_id is not null;
create index if not exists buyer_searches_created_by_admin_idx
  on public.buyer_searches (created_by_admin_user_id, created_at desc)
  where created_by_admin_user_id is not null;
create index if not exists property_estimations_crm_contact_created_idx
  on public.property_estimations (crm_contact_id, created_at desc)
  where crm_contact_id is not null;
create index if not exists property_estimations_created_by_admin_idx
  on public.property_estimations (created_by_admin_user_id, created_at desc)
  where created_by_admin_user_id is not null;

alter table public.crm_contacts enable row level security;
revoke all on public.crm_contacts from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.crm_contacts to service_role;

comment on table public.crm_contacts is
  'Contacts CRM internes, distincts des comptes clients et invisibles depuis l espace client.';
comment on column public.crm_contacts.linked_client_account_id is
  'Lien administratif facultatif vers le compte client correspondant, sans partage des donnees internes.';
comment on column public.buyer_searches.record_origin is
  'Origine de creation : public, client ou admin. Les lignes admin restent internes.';
comment on column public.property_estimations.record_origin is
  'Origine de creation : public, client ou admin. Les lignes admin restent internes.';
