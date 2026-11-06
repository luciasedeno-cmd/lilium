// Lilium · Pone al día la base de datos sola (para no tener que pegar nada en Supabase).
// Solo añade lo que falte; si ya existe, no toca nada. Se ejecuta una vez cada vez que Vercel arranca la web.
// OJO: si se añade algo nuevo aquí, cambiad también la comprobación de abajo (la última columna añadida).
const CAMBIOS = `
  create table if not exists lista_espera (
    turno_id  integer not null references turnos(id) on delete cascade,
    email     text not null,
    creada    timestamptz not null default now(),
    avisado   boolean not null default false,
    primary key (turno_id, email)
  );
  alter table lista_espera enable row level security;
  alter table miembros add column if not exists terminos_en timestamptz;
  -- Cuándo se invitó a cada persona (para su plazo de 48 h) y cuándo se le mandó el recordatorio.
  -- Si está vacío, cuenta la fecha de la reserva (personas invitadas al crearla).
  alter table miembros add column if not exists invitado_en timestamptz;
  alter table miembros add column if not exists recordatorio_en timestamptz;
  -- Anotaciones de la líder al reservar («¿Algo que debamos saber?»)
  alter table reservas add column if not exists notas text;
  -- Respuestas del cuestionario de después de la experiencia (/cuestionario). Son anónimas.
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
  -- El día del retiro: si la persona vino (lo marca el equipo en /admin), si ha valorado la experiencia
  -- (cuestionario) y qué correos automáticos se le han mandado (recordatorio del día antes y aviso para valorar)
  alter table miembros add column if not exists asistio boolean;
  alter table miembros add column if not exists asistio_en timestamptz;
  alter table miembros add column if not exists valorado_en timestamptz;
  alter table miembros add column if not exists recordatorio_dia_en timestamptz;
  alter table miembros add column if not exists aviso_valoracion_en timestamptz;
  -- Quién apuntó a cada persona (ella misma si reservó): cada cual solo gestiona a la gente que apuntó
  alter table miembros add column if not exists apuntado_por text;
  -- La palabra de la frase secreta de cada persona (0-5 = I a VI); se guarda para que no cambie nunca
  alter table miembros add column if not exists fragmento smallint;
  -- Cuestionario: en qué turno estuvo («12:00–13:00», sin nombre) y cómo se enteró de Lilium
  alter table cuestionario add column if not exists turno text;
  alter table cuestionario add column if not exists origen text;
  -- Sala de espera (lib/cola.js): un ticket por navegador; dentro_en = cuándo le tocó entrar
  create table if not exists cola (
    ticket     text primary key,
    creada     timestamptz not null default now(),
    visto      timestamptz not null default now(),
    dentro_en  timestamptz
  );
  create index if not exists cola_creada on cola (creada);
  alter table cola enable row level security;
  -- «X personas están mirando este turno» (lib/mirando.js): qué turno mira cada persona mientras reserva
  create table if not exists mirando (
    email     text primary key,
    turno_id  integer not null references turnos(id) on delete cascade,
    visto     timestamptz not null default now()
  );
  alter table mirando enable row level security;
  -- Personas que el equipo apunta en la puerta el día del retiro (llegaron sin reserva): cuándo
  alter table miembros add column if not exists puerta_en timestamptz;
  -- Quien perdió su plaza por no confirmar a tiempo (para poder escribirle «¿Perdiste tu plaza?»)
  create table if not exists plazas_perdidas (
    email       text primary key,
    turno_id    integer references turnos(id) on delete set null,
    perdida_en  timestamptz not null default now(),
    avisado_en  timestamptz
  );
  alter table plazas_perdidas enable row level security;

  -- ---------- Segundo día: lunes 9 de noviembre ----------
  -- (un «candado» para que dos copias de la web no hagan esto a la vez y dupliquen los turnos)
  select pg_advisory_xact_lock(424242);
  -- Cada turno es de un día: los que ya había son del viernes 6
  alter table turnos add column if not exists dia date;
  update turnos set dia = '2026-11-06' where dia is null;
  -- Correo «Uy uy uy ¿se te ha olvidado algo?» (segundo aviso para valorar)
  alter table miembros add column if not exists aviso_olvido_en timestamptz;
  -- De qué día es cada respuesta del cuestionario (las que ya hay, del viernes 6)
  alter table cuestionario add column if not exists dia date;
  update cuestionario set dia = '2026-11-06' where dia is null;
  -- Archivo del viernes 6: sus reservas y personas pasan a estas tablas (iguales a las de siempre).
  -- Así el panel sigue enseñando el día 6 y cada correo puede volver a reservar el lunes 9.
  create table if not exists reservas_archivo (like reservas including defaults);
  create unique index if not exists reservas_archivo_id on reservas_archivo (id);
  create table if not exists miembros_archivo (like miembros including defaults);
  create unique index if not exists miembros_archivo_token on miembros_archivo (token);
  alter table reservas_archivo enable row level security;
  alter table miembros_archivo enable row level security;
  insert into reservas_archivo
    select r.* from reservas r join turnos t on t.id = r.turno_id where t.dia = '2026-11-06'
    on conflict do nothing;
  insert into miembros_archivo
    select m.* from miembros m join reservas r on r.id = m.reserva_id join turnos t on t.id = r.turno_id
    where t.dia = '2026-11-06'
    on conflict do nothing;
  delete from lista_espera where turno_id in (select id from turnos where dia = '2026-11-06');
  delete from mirando where turno_id in (select id from turnos where dia = '2026-11-06');
  delete from reservas where turno_id in (select id from turnos where dia = '2026-11-06');
  -- Los turnos del lunes 9: los mismos que el viernes 6 (sin el de las 9:00), sin nombre de grupo
  insert into turnos (inicio, fin, erasmus, dia)
    select inicio, fin, erasmus, date '2026-11-09' from turnos
    where dia = '2026-11-06' and inicio <> '9:00'
      and not exists (select 1 from turnos where dia = '2026-11-09')
    order by inicio::time;
`;

/** @param sql conexión a la base de datos */
export async function asegurarEsquema(sql) {
  if (globalThis.__liliumEsquemaListo) return;
  try {
    // Antes se ejecutaban siempre los «alter table»: aunque no cambien nada, bloquean la tabla un momento
    // y, con varias visitas a la vez, la web (y el panel de admin) podía quedarse esperando.
    // Ahora primero se MIRA (sin bloquear nada) si ya está lo último que se añadió; si está, no se toca.
    const [ya] = await sql`
      select 1 from information_schema.columns
      where table_name = 'miembros_archivo' and column_name = 'aviso_olvido_en' limit 1`;
    if (ya) {
      globalThis.__liliumEsquemaListo = true;
      return;
    }
    await sql.unsafe(CAMBIOS);
    globalThis.__liliumEsquemaListo = true;
  } catch (e) {
    // Si falla (por ejemplo, la tabla turnos aún no existe), se intentará en la siguiente petición
    console.error("No se pudo poner al día la base de datos:", e.message);
  }
}
