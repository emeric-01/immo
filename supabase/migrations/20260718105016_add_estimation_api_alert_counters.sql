create table if not exists public.estimation_api_usage (
  scope text not null,
  identifier_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0,
  alert_sent_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (scope, identifier_hash, window_started_at),
  constraint estimation_api_usage_scope_check check (scope in ('ip', 'global')),
  constraint estimation_api_usage_count_check check (request_count >= 0)
);

comment on table public.estimation_api_usage is
  'Hourly counters for Immo Data estimation alerts. IP addresses are stored only as HMAC hashes.';

create index if not exists estimation_api_usage_window_idx
  on public.estimation_api_usage (window_started_at desc);

alter table public.estimation_api_usage enable row level security;

revoke all on table public.estimation_api_usage from public, anon, authenticated;
grant select, insert, update, delete on table public.estimation_api_usage to service_role;

drop policy if exists "Service role manages estimation API usage" on public.estimation_api_usage;
create policy "Service role manages estimation API usage"
  on public.estimation_api_usage
  for all
  to service_role
  using (true)
  with check (true);

create or replace function public.record_estimation_api_usage(p_ip_hash text)
returns table (
  ip_count integer,
  global_count integer,
  alert_ip boolean,
  alert_global boolean,
  window_started_at timestamptz
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_window timestamptz := date_trunc('hour', now());
  current_ip_count integer;
  current_global_count integer;
  should_alert_ip boolean := false;
  should_alert_global boolean := false;
begin
  if p_ip_hash is null or char_length(p_ip_hash) <> 64 then
    raise exception 'Invalid IP hash';
  end if;

  insert into public.estimation_api_usage (
    scope, identifier_hash, window_started_at, request_count
  ) values (
    'ip', p_ip_hash, current_window, 1
  )
  on conflict (scope, identifier_hash, window_started_at)
  do update set
    request_count = public.estimation_api_usage.request_count + 1,
    updated_at = now()
  returning request_count into current_ip_count;

  insert into public.estimation_api_usage (
    scope, identifier_hash, window_started_at, request_count
  ) values (
    'global', 'all', current_window, 1
  )
  on conflict (scope, identifier_hash, window_started_at)
  do update set
    request_count = public.estimation_api_usage.request_count + 1,
    updated_at = now()
  returning request_count into current_global_count;

  update public.estimation_api_usage
  set alert_sent_at = now(), updated_at = now()
  where scope = 'ip'
    and identifier_hash = p_ip_hash
    and estimation_api_usage.window_started_at = current_window
    and request_count >= 4
    and alert_sent_at is null;
  should_alert_ip := found;

  update public.estimation_api_usage
  set alert_sent_at = now(), updated_at = now()
  where scope = 'global'
    and identifier_hash = 'all'
    and estimation_api_usage.window_started_at = current_window
    and request_count >= 30
    and alert_sent_at is null;
  should_alert_global := found;

  delete from public.estimation_api_usage
  where estimation_api_usage.window_started_at < now() - interval '7 days';

  return query select
    current_ip_count,
    current_global_count,
    should_alert_ip,
    should_alert_global,
    current_window;
end;
$$;

revoke all on function public.record_estimation_api_usage(text) from public, anon, authenticated;
grant execute on function public.record_estimation_api_usage(text) to service_role;
