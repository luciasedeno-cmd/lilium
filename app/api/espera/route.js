// POST /api/espera · { turnoId } → «Avísame si se libera una plaza» en un turno lleno
import { correoDeSesion } from "@/lib/sesion";
import { apuntarListaEspera } from "@/lib/reservas";
import { reservasAbiertas } from "@/lib/config";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";
import { conLlavePrevia } from "@/lib/previaServidor";

export const POST = manejar(async (req) => {
  const email = await correoDeSesion();
  if (!email) return error("Tu sesión ha caducado. Vuelve a entrar con tu correo.", 401);
  if (!reservasAbiertas(email) && !(await conLlavePrevia())) return error("Las reservas abren el 30 de octubre.", 403);

  const { turnoId } = await leerJson(req);
  const res = await apuntarListaEspera(Number(turnoId), email);
  return res.ok ? ok() : error("Ese turno no existe.", 404);
});
