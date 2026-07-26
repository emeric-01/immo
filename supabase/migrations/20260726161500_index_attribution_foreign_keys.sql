-- Indexes couvrant les clefs étrangères utilisées pour le filtrage des leads
-- et les agrégations d'attribution dans le back-office.

create index if not exists attribution_touches_link_idx
  on public.attribution_touches (attribution_link_id);
create index if not exists visitor_attributions_first_link_idx
  on public.visitor_attributions (first_link_id);
create index if not exists visitor_attributions_last_link_idx
  on public.visitor_attributions (last_link_id);

create index if not exists property_estimations_attribution_visitor_idx
  on public.property_estimations (attribution_visitor_id);
create index if not exists property_estimations_assigned_admin_idx
  on public.property_estimations (assigned_admin_user_id, created_at desc);

create index if not exists buyer_searches_attribution_visitor_idx
  on public.buyer_searches (attribution_visitor_id);
create index if not exists buyer_searches_assigned_admin_idx
  on public.buyer_searches (assigned_admin_user_id, created_at desc);

create index if not exists client_accounts_attribution_visitor_idx
  on public.client_accounts (attribution_visitor_id);
create index if not exists client_accounts_assigned_admin_idx
  on public.client_accounts (assigned_admin_user_id, updated_at desc);

create index if not exists site_analytics_attributed_admin_idx
  on public.site_analytics_events (attributed_admin_user_id, created_at desc);
