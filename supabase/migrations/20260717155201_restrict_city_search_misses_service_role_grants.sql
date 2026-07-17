revoke all on table public.city_search_misses from service_role;
revoke all on sequence public.city_search_misses_id_seq from service_role;

grant select, insert on table public.city_search_misses to service_role;
grant usage, select on sequence public.city_search_misses_id_seq to service_role;
