// Lilium · Reglas de las reservas (se aplican siempre en el servidor)
import { randomBytes } from "node:crypto";
import { db } from "./db";
import { MIN_SALA_NUEVA, MAX_PERSONAS, HORAS_CONFIRMACION, HORAS_RECORDATORIO, CORREO_VALIDO, normalizarCorreo } from "./config";

const nuevoToken = () => randomBytes(24).toString("base64url");

export const limiteDe = (creada) => new Date(new Date(creada).getTime() + HORAS_CONFIRMACION * 3600e3);

function estadoTurno(ocupadas) {
  if (ocupadas === 0) return "libre";
  if (ocupadas >= MAX_PERSONAS) return "completo";
  return "formacion";
}

/**
 * Aplica el plazo de confirmación: quien no confirmó en 48 h pierde su plaza.
 * Se llama antes de leer o cambiar reservas, así el plazo se cumple aunque no haya tarea programada.
 */
async function limpiar(sql) {
  await sql`
    delete from miembros m using reservas r
    where m.reserva_id = r.id and not m.confirmado
      and r.creada < now() - make_interval(hours => ${HORAS_CONFIRMACION})`;
  await ordenarTrasSalidas(sql);
}

/** Tras quitar personas: borra reservas vacías, reasigna el liderazgo y libera el nombre de las salas vacías. */
async function ordenarTrasSalidas(sql) {
  await sql`delete from reservas r where not exists (select 1 from miembros m where m.reserva_id = r.id)`;
  await sql`
    update reservas r set lider = (
      select email from miembros m where m.reserva_id = r.id order by m.confirmado desc, m.orden limit 1)
    where not exists (select 1 from miembros m where m.reserva_id = r.id and m.email = r.lider)`;
  await sql`
    update turnos t set equipo = null
    where equipo is not null and not exists (select 1 from reservas r where r.turno_id = t.id)`;
}

export async function aplicarPlazos() {
  await limpiar(db());
}

/** Turnos con plazas ocupadas (sin datos personales). */
export async function listarTurnos() {
  const sql = db();
  await limpiar(sql);
  const filas = await sql`
    select t.id, t.inicio, t.fin, t.erasmus, t.equipo, count(m.email)::int as ocupadas
    from turnos t
    left join reservas r on r.turno_id = t.id
    left join miembros m on m.reserva_id = r.id
    group by t.id
    order by t.inicio::time`;
  return filas.map((t) => ({ ...t, hueco: Math.max(0, MAX_PERSONAS - t.ocupadas), estado: estadoTurno(t.ocupadas) }));
}

/** Comprueba la lista de correos de un grupo. Devuelve un mensaje de error o null. */
export function validarGrupo(lider, otros) {
  const todos = [lider, ...otros].map(normalizarCorreo);
  const mal = todos.find((e) => !CORREO_VALIDO.test(e));
  if (mal) return { error: "correo", email: mal };
  if (new Set(todos).size !== todos.length) return { error: "repetido" };
  if (todos.length > MAX_PERSONAS) return { error: "maximo" };
  return null;
}

/**
 * Crea una reserva. El líder queda confirmado (ya verificó su correo); el resto recibe un correo.
 * Bloquea el turno durante la operación para que dos grupos no ocupen las mismas plazas.
 */
export async function crearReserva({ lider, otros, turnoId, equipo }) {
  lider = normalizarCorreo(lider);
  otros = otros.map(normalizarCorreo);
  const invalido = validarGrupo(lider, otros);
  if (invalido) return { ok: false, ...invalido };

  const todos = [lider, ...otros];
  return db().begin(async (sql) => {
    await limpiar(sql);
    const [turno] = await sql`select * from turnos where id = ${turnoId} for update`;
    if (!turno) return { ok: false, error: "turno" };

    const ya = await sql`select email from miembros where email in ${sql(todos)} limit 1`;
    if (ya.length) return { ok: false, error: "inscrito", email: ya[0].email };

    const [{ ocupadas }] = await sql`
      select count(m.email)::int as ocupadas from reservas r join miembros m on m.reserva_id = r.id
      where r.turno_id = ${turnoId}`;
    if (ocupadas === 0 && todos.length < MIN_SALA_NUEVA) return { ok: false, error: "minimo" };
    if (ocupadas + todos.length > MAX_PERSONAS) return { ok: false, error: "sin_hueco" };

    let nombreEquipo = turno.equipo;
    if (ocupadas === 0) {
      nombreEquipo = String(equipo || "").trim().slice(0, 40) || null;
      await sql`update turnos set equipo = ${nombreEquipo} where id = ${turnoId}`;
    }

    const [reserva] = await sql`insert into reservas (turno_id, lider) values (${turnoId}, ${lider}) returning *`;
    const filas = todos.map((email, i) => ({
      email,
      reserva_id: reserva.id,
      confirmado: email === lider,
      confirmado_en: email === lider ? new Date() : null,
      token: nuevoToken(),
      orden: i,
    }));
    const miembros = await sql`insert into miembros ${sql(filas)} returning *`;
    return { ok: true, reserva, turno: { ...turno, equipo: nombreEquipo }, miembros };
  });
}

/** Reserva en la que está un correo, con su turno y sus integrantes. */
export async function reservaDe(email) {
  const sql = db();
  await limpiar(sql);
  const [yo] = await sql`select * from miembros where email = ${normalizarCorreo(email)}`;
  if (!yo) return null;
  const [reserva] = await sql`select * from reservas where id = ${yo.reserva_id}`;
  const [turno] = await sql`select * from turnos where id = ${reserva.turno_id}`;
  const miembros = await sql`select email, confirmado from miembros where reserva_id = ${reserva.id} order by orden`;
  const [{ ocupadas }] = await sql`
    select count(m.email)::int as ocupadas from reservas r join miembros m on m.reserva_id = r.id
    where r.turno_id = ${turno.id}`;
  return {
    id: reserva.id,
    lider: reserva.lider,
    limite: limiteDe(reserva.creada),
    turno: { id: turno.id, inicio: turno.inicio, fin: turno.fin, erasmus: turno.erasmus, equipo: turno.equipo, ocupadas },
    miembros,
    yo: { email: yo.email, confirmado: yo.confirmado, token: yo.token },
  };
}

export async function miembroPorToken(token) {
  const sql = db();
  await limpiar(sql);
  const [m] = await sql`select * from miembros where token = ${String(token || "")}`;
  return m || null;
}

/** Confirma la asistencia desde el enlace del correo. */
export async function confirmarPorToken(token) {
  const sql = db();
  await limpiar(sql);
  const [m] = await sql`
    update miembros set confirmado = true, confirmado_en = coalesce(confirmado_en, now())
    where token = ${String(token || "")} returning *`;
  return m || null;
}

/** Quita a una persona de su reserva (el resto del grupo sigue). */
export async function cancelarAsistencia(email) {
  return db().begin(async (sql) => {
    const [m] = await sql`delete from miembros where email = ${normalizarCorreo(email)} returning *`;
    if (!m) return { ok: false };
    await ordenarTrasSalidas(sql);
    return { ok: true };
  });
}

/** El líder cancela la reserva de todo su grupo. Devuelve a quién avisar. */
export async function cancelarGrupo(email) {
  return db().begin(async (sql) => {
    const [r] = await sql`
      select r.*, t.inicio, t.fin from reservas r join turnos t on t.id = r.turno_id
      join miembros m on m.reserva_id = r.id where m.email = ${normalizarCorreo(email)}`;
    if (!r || r.lider !== normalizarCorreo(email)) return { ok: false, error: "no_lider" };
    const otros = await sql`select email from miembros where reserva_id = ${r.id} and email <> ${r.lider}`;
    await sql`delete from reservas where id = ${r.id}`;
    await ordenarTrasSalidas(sql);
    return { ok: true, avisar: otros.map((o) => o.email), turno: { inicio: r.inicio, fin: r.fin } };
  });
}

/** Cambia solo a esta persona a otro turno con grupo en formación y hueco. */
export async function cambiarHora(email, turnoId) {
  email = normalizarCorreo(email);
  return db().begin(async (sql) => {
    await limpiar(sql);
    const [yo] = await sql`select * from miembros where email = ${email}`;
    if (!yo) return { ok: false, error: "sin_reserva" };
    const [actual] = await sql`select * from reservas where id = ${yo.reserva_id}`;
    if (actual.turno_id === Number(turnoId)) return { ok: false, error: "mismo" };

    const [turno] = await sql`select * from turnos where id = ${turnoId} for update`;
    if (!turno) return { ok: false, error: "turno" };
    const [{ ocupadas }] = await sql`
      select count(m.email)::int as ocupadas from reservas r join miembros m on m.reserva_id = r.id
      where r.turno_id = ${turno.id}`;
    if (ocupadas === 0) return { ok: false, error: "minimo" };
    if (ocupadas >= MAX_PERSONAS) return { ok: false, error: "sin_hueco" };

    await sql`delete from miembros where email = ${email}`;
    const [nueva] = await sql`insert into reservas (turno_id, lider) values (${turno.id}, ${email}) returning *`;
    await sql`
      insert into miembros (email, reserva_id, confirmado, confirmado_en, token, orden)
      values (${email}, ${nueva.id}, ${yo.confirmado}, ${yo.confirmado_en}, ${yo.token}, 0)`;
    await ordenarTrasSalidas(sql);
    return { ok: true, turno };
  });
}

/** Personas sin confirmar a las que quedan menos de HORAS_RECORDATORIO del plazo y aún no se les avisó. */
export async function pendientesDeRecordatorio() {
  const sql = db();
  await limpiar(sql);
  const desde = HORAS_CONFIRMACION - HORAS_RECORDATORIO;
  return sql`
    select m.email, m.token, r.id as reserva_id, r.creada, t.inicio, t.fin, t.equipo
    from reservas r join miembros m on m.reserva_id = r.id join turnos t on t.id = r.turno_id
    where not r.recordatorio_enviado and not m.confirmado
      and r.creada < now() - make_interval(hours => ${desde})`;
}

export async function marcarRecordatorio(reservaIds) {
  if (!reservaIds.length) return;
  await db()`update reservas set recordatorio_enviado = true where id in ${db()(reservaIds)}`;
}
