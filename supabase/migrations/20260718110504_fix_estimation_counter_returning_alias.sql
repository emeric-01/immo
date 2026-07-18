create or replace function public.record_estimation_api_usage(p_ip_hash text)
returns table (
  ip_count integer,
  global_count integer,
  alert_ip boolean,
  alert_global boolean,
  bucket_started_at timestamptz
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

  insert into public.estimation_api_usage as usage (
    scope, identifier_hash, window_started_at, request_count
  ) values (
    'ip', p_ip_hash, current_window, 1
  )
  on conflict (scope, identifier_hash, window_started_at)
  do update set request_count = usage.request_count + 1, updated_at = now()
  returning usage.request_count into current_ip_count;

  insert into public.estimation_api_usage as usage (
    scope, identifier_hash, window_started_at, request_count
  ) values (
    'global', 'all', current_window, 1
  )
  on conflict (scope, identifier_hash, window_started_at)
  do update set request_count = usage.request_count + 1, updated_at = now()
  returning usage.request_count into current_global_count;

  update public.estimation_api_usage as usage
  set alert_sent_at = now(), updated_at = now()
  where usage.scope = 'ip'
    and usage.identifier_hash = p_ip_hash
    and usage.window_started_at = current_window
    and usage.request_count >= 4
    and usage.alert_sent_at is null;
  should_alert_ip := found;

  update public.estimation_api_usage as usage
  set alert_sent_at = now(), updated_at = now()
  where usage.scope = 'global'
    and usage.identifier_hash = 'all'
    and usage.window_started_at = current_window
    and usage.request_count >= 30
    and usage.alert_sent_at is null;
  should_alert_global := found;

  delete from public.estimation_api_usage as usage
  where usage.window_started_at < now() - interval '7 days';

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
