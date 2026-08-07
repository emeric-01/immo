alter table public.estimation_agent_workspaces
  add column if not exists photos jsonb not null default '[]'::jsonb,
  add constraint estimation_agent_workspaces_photos_array check (jsonb_typeof(photos) = 'array');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'estimation-report-assets',
  'estimation-report-assets',
  false,
  12582912,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

revoke all on table public.estimation_agent_workspaces from anon, authenticated;
grant all on table public.estimation_agent_workspaces to service_role;
