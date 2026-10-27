// Lilium · Lo que pasa alrededor del día del retiro:
//  · el panel del equipo (/admin): lista de grupos, plazas y asistencia;
//  · quién ha valorado la experiencia (cuestionario);
//  · los correos automáticos del día antes (recordatorio) y del día después (¿nos valoras?).
import { db } from "./db";
import { asegurarEsquema } from "./esquema";
import { FRAGMENTOS, fragmentosLibres } from "./fragmentos";
import { EVENTO, MAX_PERSONAS, HORAS_CONFIRMACION, normalizarCorreo } from "./config";

// Hora a partir de la que se mandan los correos automáticos (hora de España)
const HORA_CORREOS = 10;

/** Fecha («2026-11-05») y hora (0-23) de ahora mismo en España */
function ahoraEnEspana() {
  // Solo para pruebas en el ordenador: LILIUM_HOY="2026-11-05 11" hace como si fuera ese día y esa hora
  if (process.env.LILIUM_HOY && process.env.NODE_ENV !== "production") {
    const [dia, hora] = process.env.LILIUM_HOY.split(" ");
    return { dia, hora: Number(hora || 12) };
  }
  const partes = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const v = Object.fromEntries(partes.map((p) => [p.type, p.value]));
  return { dia: `${v.year}-${v.month}-${v.day}`, hora: Number(v.hour) };
}

/** Suma días a una fecha «AAAA-MM-DD» */
function sumarDias(dia, n) {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** ¿Toca hoy el recordatorio (el día antes del retiro, desde las 10:00)? */
export function tocaRecordatorioDia() {
  const { dia, hora } = ahoraEnEspana();
  return dia === sumarDias(EVENTO.fecha, -1) && hora >= HORA_CORREOS;
}

/** ¿Toca pedir la valoración (del día siguiente al retiro, desde las 10:00, hasta 3 días después)? */
export function tocaValoracion() {
  const { dia, hora } = ahoraEnEspana();
  const desde = sumarDias(EVENTO.fecha, 1);
  return (dia > desde || (dia === desde && hora >= HORA_CORREOS)) && dia <= sumarDias(EVENTO.fecha, 3);
}

/** Personas confirmadas a las que aún no se les ha mandado el recordatorio del día antes */
export async function pendientesRecordatorioDia() {
  const sql = db();
  await asegurarEsquema(sql);
  return sql`
    select m.email, t.inicio, t.fin, t.equipo
    from miembros m join reservas r on r.id = m.reserva_id join turnos t on t.id = r.turno_id
    where m.confirmado and m.recordatorio_dia_en is null`;
}

/**
 * Personas a las que pedir que valoren: confirmadas, que no estén marcadas como «no vino»
 * y que aún no hayan rellenado el cuestionario ni recibido este correo.
 */
export async function pendientesValoracion() {
  const sql = db();
  await asegurarEsquema(sql);
  return sql`
    select m.email, m.token from miembros m
    where m.confirmado and m.asistio is distinct from false
      and m.valorado_en is null and m.aviso_valoracion_en is null`;
}

/** Apunta que a estas personas ya se les mandó un correo (campo: recordatorio_dia_en o aviso_valoracion_en) */
export async function marcarEnviado(campo, correos) {
  if (!correos.length) return;
  const sql = db();
  if (campo === "recordatorio_dia_en") await sql`update miembros set recordatorio_dia_en = now() where email in ${sql(correos)}`;
  if (campo === "aviso_valoracion_en") await sql`update miembros set aviso_valoracion_en = now() where email in ${sql(correos)}`;
}

/**
 * Apunta que alguien ha rellenado el cuestionario, por su enlace personal (token) o por su correo.
 * @returns true si se ha encontrado a la persona entre las reservas
 */
export async function marcarValorado({ token, email }) {
  const sql = db();
  await asegurarEsquema(sql);
  let filas = [];
  if (token) filas = await sql`update miembros set valorado_en = coalesce(valorado_en, now()) where token = ${String(token)} returning email`;
  else if (email) filas = await sql`update miembros set valorado_en = coalesce(valorado_en, now()) where email = ${normalizarCorreo(email)} returning email`;
  return filas.length > 0;
}

/** El equipo marca si alguien vino (true), no vino (false) o lo deja sin marcar (null) */
export async function marcarAsistencia(email, asistio) {
  const sql = db();
  await asegurarEsquema(sql);
  const valor = asistio === true || asistio === false ? asistio : null;
  const filas = await sql`
    update miembros set asistio = ${valor}, asistio_en = ${valor === null ? null : sql`now()`}
    where email = ${normalizarCorreo(email)} returning email`;
  return filas.length > 0;
}

/**
 * Respuestas del cuestionario para el apartado «Valoraciones» del panel (solo lee).
 * Son anónimas: no llevan correo. Las medias y el reparto se calculan en el panel.
 */
export async function respuestasCuestionario() {
  const sql = db();
  await asegurarEsquema(sql);
  return sql`
    select creada, general, ambientacion, dificultad, originalidad, inmersion, duracion, idioma
    from cuestionario order by creada`;
}

/** Todo lo que enseña el panel del equipo: cada turno con sus grupos y personas, y los totales */
export async function datosPanel() {
  const sql = db();
  await asegurarEsquema(sql);
  // El panel SOLO LEE (no cambia nada en la base de datos): así carga rápido y nunca se queda esperando.
  // Las personas que no confirmaron a tiempo (48 h) no se enseñan; se borran en la siguiente reserva o visita.
  const [turnos, personas] = await Promise.all([
    sql`select id, inicio, fin, erasmus, equipo from turnos order by inicio`,
    sql`
      select m.email, m.confirmado, m.asistio, m.valorado_en, m.aviso_valoracion_en, m.orden, m.fragmento,
             r.id as reserva_id, r.turno_id, r.lider, r.notas
      from miembros m join reservas r on r.id = m.reserva_id
      where m.confirmado or coalesce(m.invitado_en, r.creada) >= now() - make_interval(hours => ${HORAS_CONFIRMACION})
      order by r.creada, m.orden`,
  ]);

  const salas = turnos.map((t) => {
    const suyas = personas.filter((p) => p.turno_id === t.id);
    // UN SOLO GRUPO POR SALA: todas las personas de la sala van juntas, en el orden en que entraron
    // (lib/reservas.js ya junta en la base de datos los grupos antiguos; aquí se asegura también al enseñarlo)
    const lider = suyas[0]?.lider;
    const notas = [...new Set(suyas.map((p) => p.notas).filter(Boolean))].join(" · ");
    const grupos = suyas.length
      ? [{
          id: `sala-${t.id}`,
          notas,
          personas: suyas.map((p) => ({
            email: p.email,
            lider: p.email === lider,
            // Su palabra de la frase secreta (solo la ve el equipo en el panel; null si aún no tiene)
            fragmento: p.fragmento === null ? null : FRAGMENTOS[p.fragmento] || null,
            confirmado: p.confirmado,
            asistio: p.asistio,
            valorado: Boolean(p.valorado_en),
            avisoValoracion: Boolean(p.aviso_valoracion_en),
          })),
        }]
      : [];
    // Palabras de la frase secreta que aún no tiene nadie de la sala (si son menos de 6): las da la guía
    const sinDueno = suyas.length ? fragmentosLibres(suyas.map((p) => p.fragmento).filter((f) => f !== null)) : [];
    return { id: t.id, inicio: t.inicio, fin: t.fin, erasmus: t.erasmus, equipo: t.equipo, ocupadas: suyas.length, grupos, sinDueno };
  });

  const totales = {
    plazas: turnos.length * MAX_PERSONAS,
    ocupadas: personas.length,
    confirmadas: personas.filter((p) => p.confirmado).length,
    libres: turnos.length * MAX_PERSONAS - personas.length,
    asistieron: personas.filter((p) => p.asistio === true).length,
    valoraron: personas.filter((p) => p.valorado_en).length,
    grupos: new Set(personas.map((p) => p.turno_id)).size, // un grupo por sala con gente
  };
  return { salas, totales };
}

/**
 * Borra TODAS las reservas de prueba (botón del panel, solo antes de la apertura).
 * Se vacían las reservas, sus personas, la lista de espera y los códigos de acceso de la web
 * (los del panel del equipo, «admin:…», se quedan). Los turnos siguen igual, sin nombre de equipo.
 * Si cuestionario = true, se borran también las respuestas del cuestionario.
 * @returns cuántas personas y reservas había (para el mensaje)
 */
export async function borrarReservasPrueba({ cuestionario = false } = {}) {
  return db().begin(async (sql) => {
    await asegurarEsquema(sql);
    const [{ personas }] = await sql`select count(*)::int as personas from miembros`;
    const [{ respuestas }] = await sql`select count(*)::int as respuestas from cuestionario`;
    await sql`truncate miembros, reservas, lista_espera cascade`;
    await sql`delete from codigos where email not like 'admin:%'`;
    await sql`update turnos set equipo = null`;
    if (cuestionario) await sql`truncate cuestionario`;
    return { personas, respuestas: cuestionario ? respuestas : 0 };
  });
}
