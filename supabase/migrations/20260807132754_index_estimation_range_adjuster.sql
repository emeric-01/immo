create index if not exists property_estimations_range_adjusted_by_admin_idx
  on public.property_estimations (range_adjusted_by_admin_user_id)
  where range_adjusted_by_admin_user_id is not null;
