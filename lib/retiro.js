// Lilium · Lo que pasa alrededor del día del retiro:
//  · el panel del equipo (/admin): lista de grupos, plazas y asistencia;
//  · quién ha valorado la experiencia (cuestionario);
//  · los correos automáticos del día antes (recordatorio) y del día después (¿nos valoras?).
import { db } from "./db";
import { asegurarEsquema } from "./esquema";
import { EVENTO, MAX_PERSONAS, normalizarCorreo } from "./config";

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

/** Todo lo que enseña el panel del equipo: cada turno con sus grupos y personas, y los totales */
export async function datosPanel() {
  const sql = db();
  await asegurarEsquema(sql);
  const [turnos, personas] = await Promise.all([
    sql`select id, inicio, fin, erasmus, equipo from turnos order by inicio`,
    sql`
      select m.email, m.confirmado, m.asistio, m.valorado_en, m.aviso_valoracion_en, m.orden,
             r.id as reserva_id, r.turno_id, r.lider, r.notas
      from miembros m join reservas r on r.id = m.reserva_id
      order by r.creada, m.orden`,
  ]);

  const salas = turnos.map((t) => {
    const suyas = personas.filter((p) => p.turno_id === t.id);
    // Dentro de una sala puede haber varios grupos (reservas) que se han unido para completarla
    const grupos = [...new Set(suyas.map((p) => p.reserva_id))].map((id) => {
      const gente = suyas.filter((p) => p.reserva_id === id);
      return {
        id,
        notas: gente[0].notas || "",
        personas: gente.map((p) => ({
          email: p.email,
          lider: p.email === p.lider,
          confirmado: p.confirmado,
          asistio: p.asistio,
          valorado: Boolean(p.valorado_en),
          avisoValoracion: Boolean(p.aviso_valoracion_en),
        })),
      };
    });
    return { id: t.id, inicio: t.inicio, fin: t.fin, erasmus: t.erasmus, equipo: t.equipo, ocupadas: suyas.length, grupos };
  });

  const totales = {
    plazas: turnos.length * MAX_PERSONAS,
    ocupadas: personas.length,
    confirmadas: personas.filter((p) => p.confirmado).length,
    libres: turnos.length * MAX_PERSONAS - personas.length,
    asistieron: personas.filter((p) => p.asistio === true).length,
    valoraron: personas.filter((p) => p.valorado_en).length,
    grupos: new Set(personas.map((p) => p.reserva_id)).size,
  };
  return { salas, totales };
}
