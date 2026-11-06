// POST /api/admin/asistencia · { email, asistio: true | false | null } → el equipo marca si alguien vino al retiro
import { conLlavePrevia } from "@/lib/previaServidor";
import { marcarAsistencia } from "@/lib/retiro";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";

export const POST = manejar(async (req) => {
  if (!(await conLlavePrevia())) return error("Entra con el correo y la contraseña del equipo.", 401);
  const { email, asistio, dia } = await leerJson(req);
  if (!email) return error("Datos no válidos.");
  // `dia`: el día del panel (el viernes 6 se marca en su archivo); sin él, el día que se reserva ahora
  const hecho = await marcarAsistencia(email, asistio, dia || undefined);
  return hecho ? ok() : error("Esa persona ya no está en ninguna reserva.", 404);
});
