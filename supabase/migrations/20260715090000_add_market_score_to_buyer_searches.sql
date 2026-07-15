alter table public.buyer_searches
  add column if not exists market_score smallint,
  add column if not exists market_score_label text,
  add column if not exists market_score_status text,
  add column if not exists market_score_payload jsonb,
  add column if not exists market_scored_at timestamptz;

alter table public.buyer_searches
  drop constraint if exists buyer_searches_market_score_range;

alter table public.buyer_searches
  add constraint buyer_searches_market_score_range
  check (market_score is null or market_score between 0 and 100);

comment on column public.buyer_searches.market_score is
  'Score de coherence entre la demande acheteur et les prix immobiliers observes.';

comment on column public.buyer_searches.market_score_payload is
  'Instantane Immo Data et detail du calcul, conserve pour eviter des appels API repetes.';
