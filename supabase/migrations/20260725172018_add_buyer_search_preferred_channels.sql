alter table public.buyer_searches
  add column if not exists preferred_channels text[] not null default '{}';

update public.buyer_searches
set preferred_channels = array[preferred_channel]
where cardinality(preferred_channels) = 0
  and preferred_channel is not null;

alter table public.buyer_searches
  drop constraint if exists buyer_searches_preferred_channels_check;

alter table public.buyer_searches
  add constraint buyer_searches_preferred_channels_check
  check (preferred_channels <@ array['email', 'sms', 'phone']::text[]);

alter table public.client_accounts
  add column if not exists preferred_channels text[] not null default '{}';

update public.client_accounts
set preferred_channels = array[preferred_channel]
where cardinality(preferred_channels) = 0
  and preferred_channel is not null;

alter table public.client_accounts
  drop constraint if exists client_accounts_preferred_channels_check;

alter table public.client_accounts
  add constraint client_accounts_preferred_channels_check
  check (preferred_channels <@ array['email', 'sms', 'phone']::text[]);
