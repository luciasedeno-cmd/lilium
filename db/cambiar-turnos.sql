-- Lilium · Cambiar los turnos del día
-- Cómo usarlo: Supabase → SQL Editor → pegar todo este texto → Run.
-- ⚠️ Borra TODAS las reservas que haya (por eso solo se usa antes de abrir las reservas o con datos de prueba).

-- 1. Vaciar las reservas, los integrantes, los códigos y la lista de espera
truncate miembros, reservas, codigos, lista_espera cascade;

-- 2. Quitar los turnos antiguos
delete from turnos;

-- 3. Poner los turnos nuevos: inicio, fin y si es solo para Erasmus (true = sí, false = no).
--    Cada turno dura una hora: 45 minutos de experiencia + 15 de cortesía para recolocar la sala.
insert into turnos (inicio, fin, erasmus) values
  ('10:00', '11:00', false),
  ('11:00', '12:00', false),
  ('12:00', '13:00', false),
  ('13:00', '14:00', true),
  ('16:00', '17:00', true),
  ('17:00', '18:00', false),
  ('18:00', '19:00', false),
  ('19:00', '20:00', false),
  ('20:00', '21:00', false);
