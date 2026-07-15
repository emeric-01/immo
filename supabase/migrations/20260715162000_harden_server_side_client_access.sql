drop policy if exists "Public can create buyer searches"
on public.buyer_searches;

drop policy if exists "Public can create buyer search locations"
on public.buyer_search_locations;

drop policy if exists "Public can create buyer search priorities"
on public.buyer_search_priorities;

drop policy if exists "Public can create buyer search consents"
on public.buyer_search_consents;

revoke insert on public.buyer_searches from anon;
revoke insert on public.buyer_search_locations from anon;
revoke insert on public.buyer_search_priorities from anon;
revoke insert on public.buyer_search_consents from anon;
revoke usage, select on sequence public.buyer_search_locations_id_seq from anon;
revoke usage, select on sequence public.buyer_search_priorities_id_seq from anon;

alter function public.set_updated_at()
set search_path = '';
