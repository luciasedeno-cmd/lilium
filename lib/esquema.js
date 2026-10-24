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
