alter table public.properties
  add column if not exists display_order integer;

with ranked_properties as (
  select
    id,
    row_number() over (
      partition by (status = 'sold')
      order by coalesce(published_at, created_at) desc, id
    ) - 1 as position
  from public.properties
)
update public.properties as property
set display_order = ranked_properties.position
from ranked_properties
where property.id = ranked_properties.id
  and property.display_order is null;

alter table public.properties
  alter column display_order set default 1000,
  alter column display_order set not null;

create index if not exists properties_status_display_order_idx
  on public.properties (status, display_order, published_at desc);

create or replace function public.reorder_public_properties(
  p_published_ids uuid[],
  p_sold_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if cardinality(p_published_ids) <> (
    select count(*) from public.properties where status = 'published'
  ) or exists (
    select 1
    from unnest(p_published_ids) as requested(id)
    left join public.properties as property on property.id = requested.id
    where property.status is distinct from 'published'
  ) then
    raise exception 'La liste des biens en vente a change. Rechargez la page.';
  end if;

  if cardinality(p_sold_ids) <> (
    select count(*) from public.properties where status = 'sold'
  ) or exists (
    select 1
    from unnest(p_sold_ids) as requested(id)
    left join public.properties as property on property.id = requested.id
    where property.status is distinct from 'sold'
  ) then
    raise exception 'La liste des biens vendus a change. Rechargez la page.';
  end if;

  update public.properties as property
  set display_order = requested.position - 1,
      updated_at = now()
  from unnest(p_published_ids) with ordinality as requested(id, position)
  where property.id = requested.id;

  update public.properties as property
  set display_order = requested.position - 1,
      updated_at = now()
  from unnest(p_sold_ids) with ordinality as requested(id, position)
  where property.id = requested.id;
end;
$$;

revoke all on function public.reorder_public_properties(uuid[], uuid[]) from public, anon, authenticated;
grant execute on function public.reorder_public_properties(uuid[], uuid[]) to service_role;
