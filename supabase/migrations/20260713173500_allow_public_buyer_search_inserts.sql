create policy "Public can create buyer searches"
on public.buyer_searches
for insert
to anon
with check (
  source = 'website'
  and status = 'new'
  and consent is true
  and client_user_id is null
  and assigned_to is null
);

create policy "Public can create buyer search locations"
on public.buyer_search_locations
for insert
to anon
with check (true);

create policy "Public can create buyer search priorities"
on public.buyer_search_priorities
for insert
to anon
with check (level in ('essential', 'desired'));

create policy "Public can create buyer search consents"
on public.buyer_search_consents
for insert
to anon
with check (
  consent_type = 'contact_and_matching'
  and consent_given is true
);

grant insert on public.buyer_searches to anon;
grant insert on public.buyer_search_locations to anon;
grant insert on public.buyer_search_priorities to anon;
grant insert on public.buyer_search_consents to anon;
grant usage, select on sequence public.buyer_search_locations_id_seq to anon;
grant usage, select on sequence public.buyer_search_priorities_id_seq to anon;
