-- Lilium · Borrar TODAS las reservas (por ejemplo, las de prueba antes de abrir)
-- Cómo usarlo: Supabase → SQL Editor → pegar todo este texto → Run.
-- Los turnos se quedan como están; solo se vacían las reservas.

-- 1. Vaciar las reservas, las personas de cada grupo, los códigos de acceso pendientes y la lista de espera
truncate miembros, reservas, codigos, lista_espera cascade;

-- 2. Quitar los nombres de equipo de los turnos (vuelven a estar todos libres)
update turnos set equipo = null;
