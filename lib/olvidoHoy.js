// «Uy uy uy ¿se te ha olvidado algo?» el MISMO DÍA del retiro (lunes 9):
// a cada persona le llega 1 hora después de que termine su turno si todavía no ha valorado.
// Quién: plaza confirmada, no marcada «No vino», sin valorar y sin haber recibido ya este correo.
// Se revisa desde /api/cron (GitHub lo llama cada pocos minutos/horas) y, para que sea puntual, también
// cada vez que el panel /admin se actualiza (cada 30 s mientras el equipo lo tiene abierto en la puerta).
import { db } from "./db";
import { asegurarEsquema } from "./esquema";
import { DIA_ACTIVO } from "./config";
import { correoOlvido, urlSitio } from "./correo";

// Para no revisar la base de datos cada 30 s: como mucho una vez cada 2 minutos (por servidor)
const CADA_MS = 2 * 60 * 1000;
let ultimaRevision = 0;

/** Ahora mismo en España como «2026-11-09 12:34» (en pruebas: LILIUM_HOY="2026-11-09 12" o "2026-11-09 12:34") */
function momentoEspana() {
  if (process.env.LILIUM_HOY && process.env.NODE_ENV !== "production") {
    const [dia, hora = "12"] = process.env.LILIUM_HOY.split(" ");
    return `${dia} ${hora.includes(":") ? hora : `${hora}:00`}`;
  }
  const v = Object.fromEntries(new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  return `${v.year}-${v.month}-${v.day} ${v.hour}:${v.minute}`;
}

/**
 * Manda el correo a quien le toque ahora. Devuelve cuántos se han enviado.
 * `conPausa`: si es true (desde el panel), no hace nada si ya se revisó hace menos de 2 minutos.
 */
export async function mandarOlvidosHoy({ conPausa = false } = {}) {
  if (conPausa && Date.now() - ultimaRevision < CADA_MS) return 0;
  ultimaRevision = Date.now();

  const sql = db();
  await asegurarEsquema(sql);
  // Se «reservan» las personas apuntando la hora de envío en el mismo paso (así, aunque dos revisiones
  // coincidan, a nadie le llega dos veces)
  const gente = await sql`
    update miembros m set aviso_olvido_en = now()
    from reservas r, turnos t
    where r.id = m.reserva_id and t.id = r.turno_id
      and t.dia = ${DIA_ACTIVO}
      and t.dia + t.fin::time + interval '1 hour' <= ${momentoEspana()}::timestamp
      and m.confirmado and m.asistio is distinct from false
      and m.valorado_en is null and m.aviso_olvido_en is null
    returning m.email, m.token`;
  if (!gente.length) return 0;

  const base = urlSitio();
  const res = await Promise.allSettled(gente.map((p) =>
    correoOlvido({ para: p.email, enlace: `${base}/cuestionario?t=${p.token}`, hoy: true })));
  // A quien no le llegó (fallo de Gmail) se le quita la marca, para intentarlo en la siguiente revisión
  const fallidos = gente.filter((_, i) => res[i].status === "rejected").map((p) => p.email);
  res.forEach((r) => r.status === "rejected" && console.error("Error enviando «Uy uy uy»:", r.reason));
  if (fallidos.length) await sql`update miembros set aviso_olvido_en = null where email in ${sql(fallidos)}`;
  return gente.length - fallidos.length;
}
