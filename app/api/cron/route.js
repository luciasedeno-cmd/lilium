// GET /api/cron · Tarea programada (cada hora): aplica el plazo de 48 h, envía los recordatorios
// y avisa a la lista de espera si se ha liberado alguna plaza.
// Requiere la cabecera Authorization: Bearer <CRON_SECRET>.
import { pendientesDeRecordatorio, marcarRecordatorio, limiteDe } from "@/lib/reservas";
import { correoRecordatorio, urlSitio } from "@/lib/correo";
import { ok, error, manejar } from "@/lib/respuestas";
import { avisarListaEspera } from "@/lib/avisos";

export const dynamic = "force-dynamic";

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
  // Se marca la reserva como avisada solo si todos sus correos salieron bien
  const fallidas = new Set(pendientes.filter((_, i) => resultados[i].status === "rejected").map((p) => p.reserva_id));
  const avisadas = [...new Set(pendientes.map((p) => p.reserva_id))].filter((id) => !fallidas.has(id));
  await marcarRecordatorio(avisadas);

  const listaEspera = await avisarListaEspera();
  return ok({ listaEspera, enviados: resultados.filter((r) => r.status === "fulfilled").length, fallidos: resultados.filter((r) => r.status === "rejected").length });
});
