alter table public.buyer_searches
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by_admin_user_id uuid references public.admin_users(id) on delete set null,
  add column if not exists archived_from_status text;

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
      'archived',
      'deleted_by_client'
    )
  );

alter table public.buyer_searches
  drop constraint if exists buyer_searches_archived_from_status_check;

alter table public.buyer_searches
  add constraint buyer_searches_archived_from_status_check
  check (
    archived_from_status is null
    or archived_from_status in ('new', 'qualified', 'contacted', 'matched', 'paused', 'closed')
  );

create index if not exists buyer_searches_archived_at_idx
  on public.buyer_searches (archived_at desc)
  where status = 'archived';

comment on column public.buyer_searches.archived_at is
  'Date du dernier archivage administratif de la recherche.';

comment on column public.buyer_searches.archived_by_admin_user_id is
  'Administrateur ou manager ayant effectué le dernier archivage.';

comment on column public.buyer_searches.archived_from_status is
  'Statut métier mémorisé afin de restaurer la recherche dans son état précédent.';
