// POST /api/admin/borrar-pruebas · { confirmacion: "BORRAR", cuestionario?: true }
// Borra todas las reservas de prueba. Tres seguros:
//  1) solo con la llave del equipo (la que da /admin);
//  2) solo ANTES de la apertura (30 de octubre a las 12:00, hora del servidor): después ya no hace nada;
//  3) hay que escribir la palabra BORRAR (el panel la pide antes de enviar).
import { conLlavePrevia } from "@/lib/previaServidor";
import { borrarReservasPrueba } from "@/lib/retiro";
import { APERTURA } from "@/lib/config";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";

export const POST = manejar(async (req) => {
  if (!(await conLlavePrevia())) return error("Entra con el correo y la contraseña del equipo.", 401);
  if (Date.now() >= APERTURA.getTime()) return error("La web ya está abierta: las reservas ya no se pueden borrar desde aquí.", 403);
  const { confirmacion, cuestionario } = await leerJson(req);
  if (confirmacion !== "BORRAR") return error("Escribe BORRAR para confirmar.");
  return ok(await borrarReservasPrueba({ cuestionario: cuestionario === true }));
});
