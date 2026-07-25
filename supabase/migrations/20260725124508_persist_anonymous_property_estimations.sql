alter table public.property_estimations
  alter column client_account_id drop not null;

alter table public.property_estimations
  drop constraint if exists property_estimations_client_account_id_fkey;

alter table public.property_estimations
  add constraint property_estimations_client_account_id_fkey
  foreign key (client_account_id)
  references public.client_accounts(id)
  on delete set null;

comment on column public.property_estimations.client_account_id is
  'Compte client rattache a l estimation. NULL tant que le visiteur reste anonyme.';

create index if not exists property_estimations_anonymous_created_at_idx
  on public.property_estimations (created_at desc)
  where client_account_id is null;
