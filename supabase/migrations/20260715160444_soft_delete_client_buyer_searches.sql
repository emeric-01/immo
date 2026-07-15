alter table public.buyer_searches
  add column if not exists deleted_at timestamptz;

alter table public.buyer_searches
  drop constraint if exists buyer_searches_status_check;

alter table public.buyer_searches
  add constraint buyer_searches_status_check
  check (
    status in (
      'new',
      'qualified',
      'contacted',
      'matched',
      'paused',
      'closed',
      'deleted_by_client'
    )
  );

create index if not exists buyer_searches_active_client_account_idx
  on public.buyer_searches (client_account_id, created_at desc)
  where status <> 'deleted_by_client';

comment on column public.buyer_searches.deleted_at is
  'Date de suppression logique de la recherche par le client.';
