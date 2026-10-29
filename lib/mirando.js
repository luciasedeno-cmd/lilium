// Lilium · «X personas están mirando este turno».
// Mientras alguien está eligiendo hora (paso 2) o revisando la reserva (paso 3), su navegador avisa cada
// pocos segundos de qué turno está mirando. Así se puede decir cuánta gente más está mirando cada turno
// y, en el paso 3, avisar si otro grupo ocupa ese turno antes (sin tener que recargar la página).
import { db } from "./db";
import { asegurarEsquema } from "./esquema";
import { HORAS_CONFIRMACION, ADMIN_CORREO, normalizarCorreo, esProfesorado } from "./config";
import { huecoPara, plazaProfeEnTurno } from "./turnos";

const SEG_MIRANDO = 30; // si no avisa en 30 s, ya no cuenta como «mirando»

/**
 * Apunta qué turno está mirando esta persona (o ninguno) y devuelve:
 * - mirando: { turnoId: cuántas OTRAS personas lo están mirando ahora }
 * - turnos: plazas ocupadas de cada turno ahora mismo (para saber si el suyo sigue teniendo sitio)
 */
export async function mirarTurno(email, turnoId) {
  const sql = db();
  await asegurarEsquema(sql);
  email = normalizarCorreo(email);
  if (turnoId) {
    await sql`
      insert into mirando (email, turno_id) values (${email}, ${turnoId})
      on conflict (email) do update set turno_id = excluded.turno_id, visto = now()`;
  } else {
    await sql`delete from mirando where email = ${email}`;
  }
  // Limpieza: quien dejó de avisar hace rato
  await sql`delete from mirando where visto < now() - interval '10 minutes'`;
  const [cuentas, turnos] = await Promise.all([
    sql`
      select turno_id, count(*)::int as n from mirando
      where email <> ${email} and visto > now() - make_interval(secs => ${SEG_MIRANDO})
      group by turno_id`,
    sql`
      select t.id, t.inicio, t.fin, t.erasmus, t.equipo, count(m.email)::int as ocupadas,
             coalesce(bool_or(m.email like ${"%@esada.es"} and m.email <> ${ADMIN_CORREO}), false) as profe
      from turnos t
      left join reservas r on r.turno_id = t.id
      -- (no cuenta a quien ya pasó sus 48 h sin confirmar: esa plaza se libera en la siguiente reserva)
      left join miembros m on m.reserva_id = r.id
        and (m.confirmado or coalesce(m.invitado_en, r.creada) > now() - make_interval(hours => ${HORAS_CONFIRMACION}))
      group by t.id
      order by t.inicio::time`,
  ]);
  return {
    mirando: Object.fromEntries(cuentas.map((c) => [c.turno_id, c.n])),
    // Plazas libres para quien mira (alumnado o profesorado: ver huecoPara en lib/turnos.js)
    turnos: turnos.map((t) => ({ ...t, hueco: huecoPara(t, esProfesorado(email)), plazaProfe: plazaProfeEnTurno(t) })),
  };
}

/** Ya ha reservado: deja de contar como «mirando» */
export async function dejarDeMirar(email) {
  await db()`delete from mirando where email = ${normalizarCorreo(email)}`;
}
