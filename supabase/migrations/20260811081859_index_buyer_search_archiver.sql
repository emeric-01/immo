create index if not exists buyer_searches_archived_by_admin_idx
  on public.buyer_searches (archived_by_admin_user_id, archived_at desc);
