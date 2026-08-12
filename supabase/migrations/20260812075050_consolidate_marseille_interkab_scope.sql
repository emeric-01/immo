update public.interkab_cities
set sync_enabled = false,
    status = 'pending',
    last_error = null,
    updated_at = now()
where insee_code in ('13211', '13212');

comment on column public.interkab_cities.sync_enabled is
  'Interkab collection scope. Marseille arrondissements are consolidated under city INSEE 13055.';
