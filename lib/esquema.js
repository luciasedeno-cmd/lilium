// Lilium · Pone al día la base de datos sola (para no tener que pegar nada en Supabase).
// Solo añade lo que falte; si ya existe, no toca nada. Se ejecuta una vez cada vez que Vercel arranca la web.
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
`;

/** @param sql conexión a la base de datos */
export async function asegurarEsquema(sql) {
  if (globalThis.__liliumEsquemaListo) return;
  try {
    await sql.unsafe(CAMBIOS);
    globalThis.__liliumEsquemaListo = true;
  } catch (e) {
    // Si falla (por ejemplo, la tabla turnos aún no existe), se intentará en la siguiente petición
    console.error("No se pudo poner al día la base de datos:", e.message);
  }
}
