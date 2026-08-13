-- Autorisations individuelles pour modifier ou supprimer ses propres fiches CRM et recherches.

alter table public.admin_role_permissions
  drop constraint if exists admin_role_permissions_permission_check;

alter table public.admin_role_permissions
  add constraint admin_role_permissions_permission_check
  check (permission in (
    'properties:read', 'properties:create', 'properties:update_own', 'properties:write',
    'buyer_searches:read', 'buyer_searches:update_own', 'buyer_searches:delete_own',
    'estimations:read', 'clients:read', 'crm_contacts:update_own', 'crm_contacts:delete_own',
    'referrals:read', 'city_searches:read', 'audience:read',
    'contents:read', 'contents:write', 'users:manage'
  ));

alter table public.admin_user_permissions
  drop constraint if exists admin_user_permissions_permission_check;

alter table public.admin_user_permissions
  add constraint admin_user_permissions_permission_check
  check (permission in (
    'properties:read', 'properties:create', 'properties:update_own', 'properties:write',
    'buyer_searches:read', 'buyer_searches:update_own', 'buyer_searches:delete_own',
    'estimations:read', 'clients:read', 'crm_contacts:update_own', 'crm_contacts:delete_own',
    'referrals:read', 'city_searches:read', 'audience:read',
    'contents:read', 'contents:write', 'users:manage'
  ));

insert into public.admin_role_permissions (role, permission)
select role, permission
from (values
  ('admin', 'buyer_searches:update_own'), ('admin', 'buyer_searches:delete_own'),
  ('admin', 'crm_contacts:update_own'), ('admin', 'crm_contacts:delete_own'),
  ('manager', 'buyer_searches:update_own'), ('manager', 'buyer_searches:delete_own'),
  ('manager', 'crm_contacts:update_own'), ('manager', 'crm_contacts:delete_own')
) as permissions(role, permission)
on conflict (role, permission) do nothing;

alter table public.crm_contacts
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by_admin_user_id uuid references public.admin_users(id) on delete set null;

create index if not exists crm_contacts_deleted_at_idx on public.crm_contacts (deleted_at desc)
where deleted_at is not null;
create index if not exists crm_contacts_deleted_by_admin_idx on public.crm_contacts (deleted_by_admin_user_id)
where deleted_by_admin_user_id is not null;
