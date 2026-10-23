// POST /api/mi-reserva/cancelar · { grupo: boolean } → cancela mi plaza o (si soy líder) la del grupo
import { correoDeSesion } from "@/lib/sesion";
import { cancelarAsistencia, cancelarGrupo } from "@/lib/reservas";
import { correoCancelacion } from "@/lib/correo";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";

export const POST = manejar(async (req) => {
  const email = await correoDeSesion();
  if (!email) return error("Tu sesión ha caducado. Vuelve a entrar con tu correo.", 401);
  const { grupo } = await leerJson(req);

  if (!grupo) {
    const res = await cancelarAsistencia(email);
    return res.ok ? ok() : error("No tienes ninguna reserva.", 404);
  }

  const res = await cancelarGrupo(email);
  if (!res.ok) return error("Solo la persona líder puede cancelar la reserva del grupo.", 403);
  await Promise.allSettled(res.avisar.map((para) =>
    correoCancelacion({ para, turno: res.turno, motivo: `${email} ha cancelado la reserva del grupo.` })
  ));
  return ok();
});
