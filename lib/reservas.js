// Lilium · Reglas de las reservas (se aplican siempre en el servidor)
import { randomBytes } from "node:crypto";
import { db } from "./db";
import { asegurarEsquema } from "./esquema";
import { repartirFragmentos } from "./fragmentos";
import { MIN_SALA_NUEVA, MAX_PERSONAS, HORAS_CONFIRMACION, HORAS_RECORDATORIO, CORREO_VALIDO, normalizarCorreo, puedeReservar } from "./config";

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
// Tras quitar personas: borra reservas vacías, reasigna el liderazgo y libera el nombre de las salas vacías.
// Van juntas en un solo envío a la base de datos para que sea rápido (un viaje en vez de tres).
const ORDENAR_TRAS_SALIDAS = `
  delete from reservas r where not exists (select 1 from miembros m where m.reserva_id = r.id);
  update reservas r set lider = (
    select email from miembros m where m.reserva_id = r.id order by m.confirmado desc, m.orden limit 1)
  where not exists (select 1 from miembros m where m.reserva_id = r.id and m.email = r.lider);
  update turnos t set equipo = null
  where equipo is not null and not exists (select 1 from reservas r where r.turno_id = t.id);`;

async function limpiar(sql) {
  // La primera vez que arranca la web, crea lo que falte en la base de datos (lista de espera…)
  await asegurarEsquema(sql);
  // HORAS_CONFIRMACION es un número fijo de config.js (no viene del usuario)
  await sql.unsafe(`
    delete from miembros m using reservas r
    where m.reserva_id = r.id and not m.confirmado
      and coalesce(m.invitado_en, r.creada) < now() - interval '${Number(HORAS_CONFIRMACION)} hours';
    ${ORDENAR_TRAS_SALIDAS}`);
}

async function ordenarTrasSalidas(sql) {
  await sql.unsafe(ORDENAR_TRAS_SALIDAS);
}

export async function aplicarPlazos() {
  await limpiar(db());
}

/**
 * Turnos con plazas ocupadas (sin datos personales).
 * Si se pasa un correo, cada turno dice también si esa persona está en su lista de espera.
 */
export async function listarTurnos(email = null) {
  const sql = db();
  await limpiar(sql);
  const filas = await sql`
    select t.id, t.inicio, t.fin, t.erasmus, t.equipo, count(m.email)::int as ocupadas,
           exists (select 1 from lista_espera le where le.turno_id = t.id and le.email = ${normalizarCorreo(email)} and not le.avisado) as en_espera
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
  // La líder puede ser la cuenta de administración (para probar); el resto, siempre alumnado de ESADA
  const mal = !puedeReservar(todos[0]) ? todos[0] : todos.slice(1).find((e) => !CORREO_VALIDO.test(e));
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
      terminos_en: email === lider ? new Date() : null, // el líder acepta los términos al reservar
      token: nuevoToken(),
      orden: i,
    }));
    const miembros = await sql`insert into miembros ${sql(filas)} returning *`;
    // Quien ya tiene plaza deja de esperar en otros turnos
    await sql`delete from lista_espera where email in ${sql(todos)}`;
    return { ok: true, reserva, turno: { ...turno, equipo: nombreEquipo }, miembros };
  });
}

/** Reserva en la que está un correo, con su turno y sus integrantes. */
export async function reservaDe(email) {
  const sql = db();
  await limpiar(sql);
  // Una sola consulta para mi plaza, mi reserva, el turno y cuántas personas hay en él
  const [fila] = await sql`
    select m.email, m.confirmado, m.token, r.id as reserva_id, r.lider, r.creada,
           t.id as turno_id, t.inicio, t.fin, t.erasmus, t.equipo,
           (select count(*)::int from reservas r2 join miembros m2 on m2.reserva_id = r2.id where r2.turno_id = t.id) as ocupadas
    from miembros m join reservas r on r.id = m.reserva_id join turnos t on t.id = r.turno_id
    where m.email = ${normalizarCorreo(email)}`;
  if (!fila) return null;
  // Cada persona tiene su propio plazo: desde que la invitaron (o desde que se creó la reserva)
  const filasMiembros = await sql`
    select email, confirmado, coalesce(invitado_en, ${fila.creada}) as invitado_en
    from miembros where reserva_id = ${fila.reserva_id} order by orden`;
  const miembros = filasMiembros.map(({ invitado_en, ...m }) => ({ ...m, limite: m.confirmado ? null : limiteDe(invitado_en) }));
  return {
    id: fila.reserva_id,
    lider: fila.lider,
    limite: limiteDe(fila.creada),
    turno: { id: fila.turno_id, inicio: fila.inicio, fin: fila.fin, erasmus: fila.erasmus, equipo: fila.equipo, ocupadas: fila.ocupadas },
    miembros,
    yo: { email: fila.email, confirmado: fila.confirmado, token: fila.token },
  };
}

/** ¿Está este correo en alguna reserva? (rápido: para saber a qué página llevar al entrar) */
export async function tieneReserva(email) {
  const sql = db();
  await limpiar(sql);
  const [fila] = await sql`select 1 from miembros where email = ${normalizarCorreo(email)}`;
  return Boolean(fila);
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
    update miembros set confirmado = true, confirmado_en = coalesce(confirmado_en, now()),
      terminos_en = coalesce(terminos_en, now())
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
      insert into miembros (email, reserva_id, confirmado, confirmado_en, terminos_en, token, orden, invitado_en, recordatorio_en)
      values (${email}, ${nueva.id}, ${yo.confirmado}, ${yo.confirmado_en}, ${yo.terminos_en}, ${yo.token}, 0,
              ${yo.invitado_en || actual.creada}, ${yo.recordatorio_en})`; // quien no ha confirmado conserva su plazo
    await ordenarTrasSalidas(sql);
    return { ok: true, turno };
  });
}

/** Personas sin confirmar a las que quedan menos de HORAS_RECORDATORIO del plazo y aún no se les avisó. */
export async function pendientesDeRecordatorio() {
  const sql = db();
  await limpiar(sql);
  const desde = HORAS_CONFIRMACION - HORAS_RECORDATORIO;
  // Cada persona recibe un solo recordatorio, 12 h antes de que acabe SU plazo.
  // (Las reservas avisadas antes de este cambio quedaron marcadas en reservas.recordatorio_enviado.)
  return sql`
    select m.email, m.token, r.id as reserva_id, coalesce(m.invitado_en, r.creada) as creada, t.inicio, t.fin, t.equipo
    from reservas r join miembros m on m.reserva_id = r.id join turnos t on t.id = r.turno_id
    where not m.confirmado and m.recordatorio_en is null
      and not (r.recordatorio_enviado and m.invitado_en is null)
      and coalesce(m.invitado_en, r.creada) < now() - make_interval(hours => ${desde})`;
}

/** Apunta que a estas personas ya se les mandó el recordatorio */
export async function marcarRecordatorio(correos) {
  if (!correos.length) return;
  await db()`update miembros set recordatorio_en = now() where email in ${db()(correos)}`;
}

/**
 * El líder cambia su grupo: quita y/o añade personas de una vez (botón «Guardar cambios»).
 * Las nuevas tienen 48 h desde ahora para confirmar. No se puede pasar de 6 personas en el turno.
 */
export async function editarIntegrantes(lider, { anadir = [], quitar = [] }) {
  lider = normalizarCorreo(lider);
  anadir = [...new Set(anadir.map(normalizarCorreo))];
  quitar = [...new Set(quitar.map(normalizarCorreo))];
  const mal = anadir.find((c) => !CORREO_VALIDO.test(c));
  if (mal) return { ok: false, error: "correo", email: mal };

  return db().begin(async (sql) => {
    await limpiar(sql);
    const [r] = await sql`
      select r.* from reservas r join miembros m on m.reserva_id = r.id where m.email = ${lider}`;
    if (!r) return { ok: false, error: "sin_reserva" };
    if (r.lider !== lider) return { ok: false, error: "no_lider" };
    // Se bloquea el turno para que nadie ocupe las plazas a la vez
    const [turno] = await sql`select * from turnos where id = ${r.turno_id} for update`;

    const actuales = await sql`select email, orden from miembros where reserva_id = ${r.id}`;
    const delGrupo = new Set(actuales.map((m) => m.email));
    if (quitar.includes(lider)) return { ok: false, error: "quitar_lider" };
    const ajeno = quitar.find((c) => !delGrupo.has(c));
    if (ajeno) return { ok: false, error: "no_es_del_grupo", email: ajeno };
    const repetido = anadir.find((c) => delGrupo.has(c) && !quitar.includes(c));
    if (repetido) return { ok: false, error: "ya_en_grupo", email: repetido };

    if (anadir.length) {
      const ya = await sql`select email from miembros where email in ${sql(anadir)} and reserva_id <> ${r.id} limit 1`;
      if (ya.length) return { ok: false, error: "inscrito", email: ya[0].email };
    }
    const [{ ocupadas }] = await sql`
      select count(m.email)::int as ocupadas from reservas r2 join miembros m on m.reserva_id = r2.id
      where r2.turno_id = ${r.turno_id}`;
    if (ocupadas - quitar.length + anadir.length > MAX_PERSONAS) return { ok: false, error: "sin_hueco", hueco: MAX_PERSONAS - ocupadas + quitar.length };

    if (quitar.length) await sql`delete from miembros where reserva_id = ${r.id} and email in ${sql(quitar)}`;
    let nuevos = [];
    if (anadir.length) {
      const siguiente = Math.max(0, ...actuales.map((m) => m.orden)) + 1;
      const filas = anadir.map((email, i) => ({
        email, reserva_id: r.id, confirmado: false, token: nuevoToken(), orden: siguiente + i, invitado_en: new Date(),
      }));
      nuevos = await sql`insert into miembros ${sql(filas)} returning *`;
      await sql`delete from lista_espera where email in ${sql(anadir)}`;
    }
    await ordenarTrasSalidas(sql);
    return { ok: true, turno, quitados: quitar, nuevos };
  });
}

/* ---------- Fragmentos de la frase secreta ---------- */

/** Palabras de la frase secreta que le tocan a este correo, según quién hay en su sala. */
export async function fragmentosDe(email) {
  const sql = db();
  const correo = normalizarCorreo(email);
  // Todas las personas de la sala (pueden ser de varios grupos), en el orden en que entraron
  const sala = await sql`
    select m.email, r.turno_id
    from miembros m join reservas r on r.id = m.reserva_id
    where r.turno_id = (select r2.turno_id from miembros m2 join reservas r2 on r2.id = m2.reserva_id where m2.email = ${correo})
    order by r.creada, m.orden`;
  if (!sala.length) return [];
  return repartirFragmentos(sala[0].turno_id, sala.map((p) => p.email))[correo] || [];
}

/* ---------- Lista de espera («Avísame si se libera una plaza») ---------- */

/** Apunta a una persona en la lista de espera de un turno. */
export async function apuntarListaEspera(turnoId, email) {
  const sql = db();
  await limpiar(sql);
  const [turno] = await sql`select id from turnos where id = ${turnoId}`;
  if (!turno) return { ok: false, error: "turno" };
  await sql`
    insert into lista_espera (turno_id, email) values (${turnoId}, ${normalizarCorreo(email)})
    on conflict (turno_id, email) do update set avisado = false, creada = now()`;
  return { ok: true };
}

/** Personas en lista de espera de turnos que ahora tienen alguna plaza libre (y a las que aún no se avisó). */
export async function pendientesListaEspera() {
  const sql = db();
  await limpiar(sql);
  return sql`
    select le.turno_id, le.email, t.inicio, t.fin, ${MAX_PERSONAS} - count(m.email)::int as hueco
    from lista_espera le
    join turnos t on t.id = le.turno_id
    left join reservas r on r.turno_id = t.id
    left join miembros m on m.reserva_id = r.id
    where not le.avisado
    group by le.turno_id, le.email, le.creada, t.inicio, t.fin
    having count(m.email) < ${MAX_PERSONAS}
    order by le.creada`;
}

export async function marcarAvisados(filas) {
  for (const f of filas) {
    await db()`update lista_espera set avisado = true where turno_id = ${f.turno_id} and email = ${f.email}`;
  }
}
