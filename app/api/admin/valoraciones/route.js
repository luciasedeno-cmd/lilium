// GET /api/admin/valoraciones → todas las respuestas del cuestionario (anónimas), para el apartado
// «Valoraciones» del panel del equipo. Solo con la llave del equipo (la misma que /api/admin/panel).
import { conLlavePrevia } from "@/lib/previaServidor";
import { respuestasCuestionario } from "@/lib/retiro";
import { ok, error, manejar } from "@/lib/respuestas";

export const dynamic = "force-dynamic";

export const GET = manejar(async () => {
  if (!(await conLlavePrevia())) return error("Entra con el correo y la contraseña del equipo.", 401);
  return ok({ respuestas: await respuestasCuestionario() });
});
