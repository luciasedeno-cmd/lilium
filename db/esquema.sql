-- Lilium · Esquema de la base de datos (Postgres / Supabase)
-- Se puede ejecutar varias veces: solo crea lo que falta.

create table if not exists turnos (
  id        serial primary key,
  inicio    text    not null,            -- "10:00"
  fin       text    not null,            -- "11:00"
  erasmus   boolean not null default false,
  equipo    text                          -- nombre del equipo; lo pone el primer grupo que abre la sala
);

create table if not exists reservas (
  id                    uuid primary key default gen_random_uuid(),
  turno_id              integer not null references turnos(id),
  lider                 text not null,
  creada                timestamptz not null default now(),
  recordatorio_enviado  boolean not null default false
);

-- Un correo solo puede estar en una reserva: el correo es la clave primaria
create table if not exists miembros (
  email          text primary key,
  reserva_id     uuid not null references reservas(id) on delete cascade,
  confirmado     boolean not null default false,
  confirmado_en  timestamptz,
  token          text not null unique,    -- enlace personal del correo (confirmar / gestionar)
  orden          integer not null default 0
);
create index if not exists miembros_reserva_idx on miembros(reserva_id);

-- Códigos de acceso enviados por correo (se guarda solo el hash)
create table if not exists codigos (
  email     text primary key,
  hash      text not null,
  expira    timestamptz not null,
  enviado   timestamptz not null default now(),
  intentos  integer not null default 0
);

-- Lista de espera: quien pulsa «Avísame si se libera una plaza» en un turno lleno
create table if not exists lista_espera (
  turno_id  integer not null references turnos(id) on delete cascade,
  email     text not null,
  creada    timestamptz not null default now(),
  avisado   boolean not null default false,       -- ya se le escribió porque se liberó una plaza
  primary key (turno_id, email)
);

-- Cuándo aceptó cada persona los Términos y Condiciones (al reservar o al confirmar su plaza)
alter table miembros add column if not exists terminos_en timestamptz;
-- Plazo de 48 h de cada persona (vacío = desde que se creó la reserva) y recordatorio enviado
alter table miembros add column if not exists invitado_en timestamptz;
alter table miembros add column if not exists recordatorio_en timestamptz;
-- Quién apuntó a cada persona (ella misma si reservó): cada cual solo gestiona a la gente que apuntó
alter table miembros add column if not exists apuntado_por text;
-- Anotaciones de la líder al reservar
alter table reservas add column if not exists notas text;

-- Las tablas solo se usan desde el servidor (con la cadena de conexión), nunca desde el navegador
alter table turnos   enable row level security;
alter table reservas enable row level security;
alter table miembros enable row level security;
alter table codigos  enable row level security;
alter table lista_espera enable row level security;

-- Respuestas del cuestionario de después de la experiencia (/cuestionario). Son anónimas.
-- Flores de 1 a 5 (general, ambientacion, originalidad, inmersion); escalas de 0 a 5 (dificultad: 0 muy fácil, 5 muy difícil;
-- duracion: 0 muy corta, 3 genial, 5 muy larga).
create table if not exists cuestionario (
  id            serial primary key,
  creada        timestamptz not null default now(),
  general       smallint not null,
  ambientacion  smallint not null,
  dificultad    smallint not null,
  originalidad  smallint not null,
  inmersion     smallint not null,
  duracion      smallint not null,
  comentario    text,
  idioma        text
);
alter table cuestionario enable row level security;

-- El día del retiro (panel /admin y correos automáticos):
alter table miembros add column if not exists asistio boolean;              -- vino (sí / no / vacío = sin marcar)
alter table miembros add column if not exists asistio_en timestamptz;
alter table miembros add column if not exists valorado_en timestamptz;      -- rellenó el cuestionario
alter table miembros add column if not exists recordatorio_dia_en timestamptz; -- correo del día antes enviado
alter table miembros add column if not exists aviso_valoracion_en timestamptz; -- correo «¿nos valoras?» enviado

-- Turnos del día (edítalos aquí o desde el panel de Supabase). Solo se insertan si la tabla está vacía.
-- Cada turno dura una hora: 45 minutos de experiencia + 15 de cortesía para recolocar la sala.
insert into turnos (inicio, fin, erasmus)
select * from (values
  ('9:00',  '10:00', false),
  ('10:00', '11:00', false),
  ('11:00', '12:00', false),
  ('12:00', '13:00', false),
  ('13:00', '14:00', true),
  ('16:00', '17:00', true),
  ('17:00', '18:00', false),
  ('18:00', '19:00', false),
  ('19:00', '20:00', false),
  ('20:00', '21:00', false)
) as t(inicio, fin, erasmus)
where not exists (select 1 from turnos);
