alter table public.buyer_searches
  add column if not exists client_reference text,
  add column if not exists client_access_code_hash text,
  add column if not exists client_access_enabled boolean not null default true,
  add column if not exists client_last_access_at timestamptz;

create unique index if not exists buyer_searches_client_reference_unique_idx
on public.buyer_searches (client_reference)
where client_reference is not null;

create index if not exists buyer_searches_client_access_email_idx
on public.buyer_searches (lower(contact_email), client_reference)
where client_reference is not null and client_access_enabled = true;
