// POST /api/mi-reserva/cancelar · { grupo: boolean } → cancela mi plaza o (si reservé yo) mi reserva:
// mi plaza y la de las personas que apunté. La gente que apuntaron otras personas de la sala sigue.
import { correoDeSesion } from "@/lib/sesion";
import { cancelarAsistencia, cancelarGrupo } from "@/lib/reservas";
import { correoCancelacion } from "@/lib/correo";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";
import { avisarListaEspera } from "@/lib/avisos";

// Al quedar una plaza libre, se avisa a quien la estaba esperando (si falla, lo reintenta /api/cron)
const avisar = () => avisarListaEspera().catch((e) => console.error("Lista de espera:", e));

export const POST = manejar(async (req) => {
  const email = await correoDeSesion();
  if (!email) return error("Tu sesión ha caducado. Vuelve a entrar con tu correo.", 401);
  const { grupo } = await leerJson(req);

  if (!grupo) {
    const res = await cancelarAsistencia(email);
    if (!res.ok) return error("No tienes ninguna reserva.", 404);
    await avisar();
    return ok();
  }

  const res = await cancelarGrupo(email);
  if (!res.ok) return error("Solo quien hizo la reserva puede anularla.", 403);
  await Promise.allSettled(res.avisar.map((para) =>
    correoCancelacion({ para, turno: res.turno, motivo: `${email} ha anulado la reserva en la que te apuntó.` })
  ));
  await avisar();
  return ok();
});
