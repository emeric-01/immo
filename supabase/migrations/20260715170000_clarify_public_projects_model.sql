-- Keep the client account as the shared identity while separating the two
-- business flows: buyer searches and seller/property estimations.

drop policy if exists "Clients can read own buyer searches"
on public.buyer_searches;

drop policy if exists "Clients can read own buyer search locations"
on public.buyer_search_locations;

drop policy if exists "Clients can read own buyer search priorities"
on public.buyer_search_priorities;

drop policy if exists "Clients can read own buyer search consents"
on public.buyer_search_consents;

drop index if exists public.buyer_searches_client_reference_unique_idx;
drop index if exists public.buyer_searches_client_access_email_idx;
drop index if exists public.client_accounts_email_idx;

alter table public.buyer_searches
  drop column if exists client_user_id,
  drop column if exists client_reference,
  drop column if exists client_access_code_hash,
  drop column if exists client_access_enabled,
  drop column if exists client_last_access_at;

alter table public.client_accounts
  drop column if exists last_search_id;

create index if not exists buyer_searches_assigned_to_idx
on public.buyer_searches (assigned_to)
where assigned_to is not null;

update public.client_accounts
set email = lower(trim(email))
where email <> lower(trim(email));

create unique index if not exists client_accounts_email_normalized_idx
on public.client_accounts (lower(email));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'client_accounts_email_normalized_check'
      and conrelid = 'public.client_accounts'::regclass
  ) then
    alter table public.client_accounts
      add constraint client_accounts_email_normalized_check
      check (email = lower(trim(email)) and email <> '');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'buyer_searches_source_check'
      and conrelid = 'public.buyer_searches'::regclass
  ) then
    alter table public.buyer_searches
      add constraint buyer_searches_source_check
      check (source in ('website', 'client_space', 'admin_import'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'property_estimations_price_range_check'
      and conrelid = 'public.property_estimations'::regclass
  ) then
    alter table public.property_estimations
      add constraint property_estimations_price_range_check
      check (low_price <= median_price and median_price <= high_price);
  end if;
end
$$;

comment on table public.client_accounts is
  'Identite client centrale partagee par les recherches acheteurs et les estimations de biens.';

comment on table public.buyer_searches is
  'Projets d achat crees depuis le parcours public de recherche immobiliere.';

comment on table public.property_estimations is
  'Estimations de biens creees depuis le parcours public d estimation immobiliere.';

comment on column public.buyer_searches.client_account_id is
  'Compte client proprietaire de la recherche acheteur.';

comment on column public.buyer_searches.source is
  'Canal de creation metier : website, client_space ou admin_import.';

comment on column public.property_estimations.client_account_id is
  'Compte client proprietaire de l estimation de bien.';

grant usage on schema public to service_role;
grant select, insert, update, delete on public.client_accounts to service_role;
grant select, insert, update, delete on public.buyer_searches to service_role;
grant select, insert, update, delete on public.buyer_search_locations to service_role;
grant select, insert, update, delete on public.buyer_search_priorities to service_role;
grant select, insert, update, delete on public.buyer_search_consents to service_role;
grant select, insert, update, delete on public.property_estimations to service_role;
