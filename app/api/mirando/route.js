// POST /api/mirando · { turnoId } → apunta qué turno está mirando quien reserva y devuelve cuánta gente
// más mira cada turno y las plazas de cada uno ahora mismo (lib/mirando.js)
import { correoDeSesion } from "@/lib/sesion";
import { mirarTurno } from "@/lib/mirando";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";

export const dynamic = "force-dynamic";

export const POST = manejar(async (req) => {
  const email = await correoDeSesion();
  if (!email) return error("Tu sesión ha caducado. Vuelve a entrar con tu correo.", 401);
  const { turnoId } = await leerJson(req);
  return ok(await mirarTurno(email, Number(turnoId) || null));
});
