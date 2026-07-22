drop trigger if exists set_referral_leads_updated_at on public.referral_leads;

create trigger set_referral_leads_updated_at
before update on public.referral_leads
for each row
execute function public.set_updated_at();
