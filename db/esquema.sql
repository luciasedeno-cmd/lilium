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

-- Las tablas solo se usan desde el servidor (con la cadena de conexión), nunca desde el navegador
alter table turnos   enable row level security;
alter table reservas enable row level security;
alter table miembros enable row level security;
alter table codigos  enable row level security;

-- Turnos del día (edítalos aquí o desde el panel de Supabase). Solo se insertan si la tabla está vacía.
insert into turnos (inicio, fin, erasmus)
select * from (values
  ('10:00', '11:00', true),
  ('11:15', '12:15', false),
  ('12:30', '13:30', false),
  ('13:45', '14:45', false),
  ('16:00', '17:00', true),
  ('17:15', '18:15', false),
  ('18:30', '19:30', false)
) as t(inicio, fin, erasmus)
where not exists (select 1 from turnos);
