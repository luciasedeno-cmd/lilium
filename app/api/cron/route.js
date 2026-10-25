// GET /api/cron · Tarea programada (cada hora): aplica el plazo de 48 h, envía los recordatorios,
// avisa a la lista de espera si se ha liberado alguna plaza y, alrededor del día del retiro,
// manda el recordatorio del día antes y el correo del día después para valorar la experiencia.
// Requiere la cabecera Authorization: Bearer <CRON_SECRET>.
import { pendientesDeRecordatorio, marcarRecordatorio, limiteDe } from "@/lib/reservas";
import { correoRecordatorio, correoRecordatorioDia, correoValoracion, urlSitio } from "@/lib/correo";
import { tocaRecordatorioDia, tocaValoracion, pendientesRecordatorioDia, pendientesValoracion, marcarEnviado } from "@/lib/retiro";
import { ok, error, manejar } from "@/lib/respuestas";
import { avisarListaEspera } from "@/lib/avisos";

export const dynamic = "force-dynamic";
// Puede tardar un poco si hay muchos correos (Vercel deja hasta 60 s)
export const maxDuration = 60;

// Como mucho estos correos de golpe y estos en cada pasada (el resto, a la hora siguiente): así Gmail no se satura
const A_LA_VEZ = 8;
const POR_PASADA = 80;

export const GET = manejar(async (req) => {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || req.headers.get("authorization") !== `Bearer ${secreto}`) return error("No autorizado.", 401);

  const pendientes = await pendientesDeRecordatorio();
  const base = urlSitio();
  const resultados = await Promise.allSettled(pendientes.map((p) =>
    correoRecordatorio({
      para: p.email,
      turno: { inicio: p.inicio, fin: p.fin },
      equipo: p.equipo,
      enlace: `${base}/confirmar/${p.token}`,
      limite: limiteDe(p.creada),
    })
  ));
  // Se apunta el recordatorio solo a quien le salió bien el correo (al resto se reintenta la próxima hora)
  await marcarRecordatorio(pendientes.filter((_, i) => resultados[i].status === "fulfilled").map((p) => p.email));

  const listaEspera = await avisarListaEspera();

  // El día antes del retiro (desde las 10:00): recordatorio a todas las personas confirmadas
  let recordatorioDia = 0;
  if (tocaRecordatorioDia()) {
    const gente = await pendientesRecordatorioDia();
    recordatorioDia = await mandarYApuntar(gente, "recordatorio_dia_en", (p) =>
      correoRecordatorioDia({ para: p.email, turno: { inicio: p.inicio, fin: p.fin } }));
  }

  // Del día siguiente al retiro en adelante (desde las 10:00): «¿nos valoras?» a quien no ha rellenado el cuestionario
  let valoracion = 0;
  if (tocaValoracion()) {
    const gente = await pendientesValoracion();
    valoracion = await mandarYApuntar(gente, "aviso_valoracion_en", (p) =>
      correoValoracion({ para: p.email, enlace: `${base}/cuestionario?t=${p.token}` }));
  }

  return ok({
    listaEspera, recordatorioDia, valoracion,
    enviados: resultados.filter((r) => r.status === "fulfilled").length,
    fallidos: resultados.filter((r) => r.status === "rejected").length,
  });
});

/** Manda un correo a cada persona y apunta a quién le ha llegado (al resto se le reintenta la próxima hora) */
async function mandarYApuntar(gente, campo, mandar) {
  const bien = [];
  const tanda = gente.slice(0, POR_PASADA);
  for (let i = 0; i < tanda.length; i += A_LA_VEZ) {
    const grupo = tanda.slice(i, i + A_LA_VEZ);
    const resultados = await Promise.allSettled(grupo.map(mandar));
    resultados.forEach((r, j) => {
      if (r.status === "fulfilled") bien.push(grupo[j].email);
      else console.error("Error enviando correo:", r.reason);
    });
  }
  await marcarEnviado(campo, bien);
  return bien.length;
}
