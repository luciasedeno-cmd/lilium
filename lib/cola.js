// Lilium · Sala de espera (cola virtual) para cuando entra muchísima gente a la vez.
//
// Funciona como la cola de una taquilla: dentro de la web (Home y pasos de la reserva) solo puede
// haber a la vez AFORO personas. Quien llega cuando está lleno recibe un «ticket» (una cookie con un
// número secreto) y espera en una pantalla que le dice su puesto. Cada pocos segundos su navegador
// pregunta «¿me toca ya?»; en cuanto alguien sale, entra la primera persona de la cola.
// - Quien espera tiene que seguir con la pestaña abierta: si no pregunta en SEG_ESPERA segundos, pierde su sitio.
// - Quien está dentro avisa cada minuto de que sigue ahí; si no avisa en SEG_DENTRO segundos, deja su sitio.
// - El aforo se cambia en Vercel con la variable AFORO_WEB (por defecto 150; 0 = sin cola).
import { db } from "./db";
import { asegurarEsquema } from "./esquema";

export const AFORO = process.env.AFORO_WEB?.trim() ? Number(process.env.AFORO_WEB) : 150; // vacía = 150
const SEG_ESPERA = 150; // generoso: con la pestaña en segundo plano, el navegador pregunta menos a menudo
const SEG_DENTRO = 180;
const CANDADO = 61031; // número cualquiera: un «candado» para que dos peticiones no repartan el mismo sitio

/**
 * Mira (o crea) el ticket de esta persona y responde si ya puede entrar o qué puesto tiene.
 * Devuelve { dentro: true } o { dentro: false, puesto, delante, enCola }.
 */
export async function pasarPorLaCola(ticket) {
  if (!(AFORO > 0)) return { dentro: true };
  const sql = db();
  await asegurarEsquema(sql);
  return sql.begin(async (sql) => {
    await sql`select pg_advisory_xact_lock(${CANDADO})`;
    // Fuera quien ya no está (cerró la pestaña o lleva un rato sin dar señales)
    await sql`
      delete from cola
      where (dentro_en is null and visto < now() - make_interval(secs => ${SEG_ESPERA}))
         or (dentro_en is not null and visto < now() - make_interval(secs => ${SEG_DENTRO}))`;
    // Su ticket: si ya existía, se apunta que sigue aquí (y conserva su puesto)
    await sql`
      insert into cola (ticket) values (${ticket})
      on conflict (ticket) do update set visto = now()`;
    // ¿Hay sitio? Entran las primeras de la cola, por orden de llegada
    const [{ dentro }] = await sql`select count(*)::int as dentro from cola where dentro_en is not null`;
    const libres = AFORO - dentro;
    if (libres > 0) {
      await sql`
        update cola set dentro_en = now()
        where ticket in (select ticket from cola where dentro_en is null order by creada, ticket limit ${libres})`;
    }
    const [yo] = await sql`select * from cola where ticket = ${ticket}`;
    if (yo.dentro_en) return { dentro: true };
    const [{ delante, encola }] = await sql`
      select count(*) filter (where creada < ${yo.creada} or (creada = ${yo.creada} and ticket < ${ticket}))::int as delante,
             count(*)::int as encola
      from cola where dentro_en is null`;
    return { dentro: false, puesto: delante + 1, delante, enCola: encola };
  });
}

/** Deja su sitio libre (al terminar la reserva), para que entre la siguiente persona de la cola */
export async function salirDeLaCola(ticket) {
  await db()`delete from cola where ticket = ${ticket}`;
}

/** Para el panel del equipo: cuántas personas hay dentro y cuántas esperando ahora mismo */
export async function estadoCola(sql) {
  const [fila] = await sql`
    select count(*) filter (where dentro_en is not null and visto > now() - make_interval(secs => ${SEG_DENTRO}))::int as dentro,
           count(*) filter (where dentro_en is null and visto > now() - make_interval(secs => ${SEG_ESPERA}))::int as esperando
    from cola`;
  return { ...fila, aforo: AFORO };
}
