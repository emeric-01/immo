alter table public.referral_leads
  add column if not exists attribution_visitor_id uuid references public.visitor_attributions(id) on delete set null,
  add column if not exists attributed_admin_user_id uuid references public.admin_users(id) on delete set null,
  add column if not exists assigned_admin_user_id uuid references public.admin_users(id) on delete set null,
  add column if not exists attribution_snapshot jsonb;

update public.referral_leads referrals
set
  attributed_admin_user_id = coalesce(accounts.attributed_admin_user_id, accounts.assigned_admin_user_id),
  assigned_admin_user_id = accounts.assigned_admin_user_id,
  attribution_visitor_id = accounts.attribution_visitor_id,
  attribution_snapshot = nullif(accounts.first_attribution, '{}'::jsonb)
from public.client_accounts accounts
where accounts.id = referrals.sponsor_client_account_id
  and referrals.attributed_admin_user_id is null
  and referrals.assigned_admin_user_id is null;

create index if not exists referral_leads_attributed_admin_idx
  on public.referral_leads (attributed_admin_user_id, created_at desc);

create index if not exists referral_leads_assigned_admin_idx
  on public.referral_leads (assigned_admin_user_id, created_at desc);

create index if not exists referral_leads_attribution_visitor_idx
  on public.referral_leads (attribution_visitor_id, created_at desc);

comment on column public.referral_leads.attributed_admin_user_id is
  'Agent resolved from the visitor attribution link when the referral was submitted.';

comment on column public.referral_leads.assigned_admin_user_id is
  'Agent currently responsible for processing the referral.';
