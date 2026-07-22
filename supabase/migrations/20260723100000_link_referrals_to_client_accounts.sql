alter table public.referral_leads
  add column if not exists sponsor_client_account_id uuid
  references public.client_accounts(id)
  on delete set null;

create index if not exists referral_leads_sponsor_client_idx
on public.referral_leads (sponsor_client_account_id, created_at desc);

create index if not exists referral_leads_sponsor_email_normalized_idx
on public.referral_leads (lower(trim(sponsor_email)));

update public.referral_leads referrals
set sponsor_client_account_id = accounts.id
from public.client_accounts accounts
where referrals.sponsor_client_account_id is null
  and lower(trim(referrals.sponsor_email)) = lower(trim(accounts.email));

comment on column public.referral_leads.sponsor_client_account_id is
  'Compte client du parrain lorsqu un compte existait deja ou a ete cree ulterieurement. Un parrainage seul ne cree jamais de compte.';
