alter function public.reorder_public_properties(uuid[], uuid[]) security invoker;
revoke all on function public.reorder_public_properties(uuid[], uuid[]) from public, anon, authenticated;
grant execute on function public.reorder_public_properties(uuid[], uuid[]) to service_role;
