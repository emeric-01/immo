alter table public.interkab_listings
  add column if not exists details_status text not null default 'pending'
    check (details_status in ('pending', 'processing', 'complete', 'retry', 'failed')),
  add column if not exists details_attempts integer not null default 0,
  add column if not exists details_synced_at timestamptz,
  add column if not exists details_next_attempt_at timestamptz not null default now(),
  add column if not exists details_error text;

create index if not exists interkab_listings_detail_queue_idx
  on public.interkab_listings (details_next_attempt_at, first_seen_at)
  where status = 'active' and details_status in ('pending', 'retry');

comment on column public.interkab_listings.details_status is 'State of the paced Interkab detail-page enrichment queue.';
