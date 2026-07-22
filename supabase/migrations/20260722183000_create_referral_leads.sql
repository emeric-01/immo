create table if not exists public.referral_leads (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'signed', 'rewarded', 'rejected')),
  sponsor_first_name text not null,
  sponsor_last_name text not null,
  sponsor_email text not null,
  sponsor_phone text not null,
  referred_first_name text not null,
  referred_last_name text not null,
  referred_email text,
  referred_phone text not null,
  project_kind text not null check (project_kind in ('buy', 'sell')),
  property_type text not null check (property_type in ('apartment', 'house', 'land', 'other')),
  property_city text not null,
  message text,
  source text not null default 'website_referral_page',
  consent_recorded_at timestamptz not null,
  reward_paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists referral_leads_status_created_idx
on public.referral_leads (status, created_at desc);

create index if not exists referral_leads_referred_phone_idx
on public.referral_leads (referred_phone);

alter table public.referral_leads enable row level security;

revoke all on table public.referral_leads from public, anon, authenticated, service_role;
grant select, insert, update, delete on table public.referral_leads to service_role;

drop policy if exists "Service role manages referral leads" on public.referral_leads;
create policy "Service role manages referral leads"
on public.referral_leads
for all
to service_role
using (true)
with check (true);
