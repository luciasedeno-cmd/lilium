// GET /api/admin/panel → todo lo del panel del equipo: salas, grupos, personas y totales.
// Solo con la llave del equipo (la que da /admin con el correo lilium@esada.es y la contraseña).
import { conLlavePrevia } from "@/lib/previaServidor";
import { datosPanel } from "@/lib/retiro";
import { ok, error, manejar } from "@/lib/respuestas";

export const dynamic = "force-dynamic";

export const GET = manejar(async () => {
  if (!(await conLlavePrevia())) return error("Entra con el correo y la contraseña del equipo.", 401);
  return ok(await datosPanel());
});
