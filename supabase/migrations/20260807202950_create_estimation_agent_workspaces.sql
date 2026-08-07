create table public.estimation_agent_workspaces (
  id uuid primary key default gen_random_uuid(),
  source_estimation_id uuid not null unique references public.property_estimations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_admin_user_id uuid references public.admin_users(id) on delete set null,
  updated_by_admin_user_id uuid references public.admin_users(id) on delete set null,
  assigned_admin_user_id uuid references public.admin_users(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'ready', 'archived')),
  title text not null,
  draft_input_payload jsonb not null,
  draft_result_payload jsonb not null,
  low_price integer not null check (low_price >= 0),
  median_price integer not null check (median_price >= low_price),
  high_price integer not null check (high_price >= median_price),
  price_per_m2 integer not null check (price_per_m2 >= 0),
  agent_analysis text not null default '',
  strengths text not null default '',
  reservations text not null default '',
  sale_strategy text not null default '',
  report_blocks jsonb not null default '[]'::jsonb,
  constraint estimation_agent_workspaces_report_blocks_array check (jsonb_typeof(report_blocks) = 'array')
);

create index estimation_agent_workspaces_assigned_idx
  on public.estimation_agent_workspaces (assigned_admin_user_id, updated_at desc);
create index estimation_agent_workspaces_created_by_idx
  on public.estimation_agent_workspaces (created_by_admin_user_id);
create index estimation_agent_workspaces_updated_by_idx
  on public.estimation_agent_workspaces (updated_by_admin_user_id);

alter table public.estimation_agent_workspaces enable row level security;
revoke all on table public.estimation_agent_workspaces from anon, authenticated;
grant all on table public.estimation_agent_workspaces to service_role;

alter table public.estimation_report_snapshots
  add column if not exists workspace_id uuid references public.estimation_agent_workspaces(id) on delete set null,
  add column if not exists report_config jsonb;

create index if not exists estimation_report_snapshots_workspace_idx
  on public.estimation_report_snapshots (workspace_id, created_at desc);
