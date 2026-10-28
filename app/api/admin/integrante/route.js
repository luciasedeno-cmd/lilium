// POST /api/admin/integrante · { turnoId, email } → el equipo apunta en la puerta a alguien que llega sin
// reserva, en una sala con plazas libres (queda confirmado y con la asistencia marcada). Solo con la llave.
import { conLlavePrevia } from "@/lib/previaServidor";
import { anadirEnPuerta } from "@/lib/retiro";
import { MAX_PERSONAS } from "@/lib/config";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";

const MENSAJES = {
  correo: () => "Escribe un correo válido (por ejemplo, nombre@gmail.com).",
  turno: () => "Ese turno no existe.",
  inscrito: (r) => `Ese correo ya está apuntado en el turno de las ${r.turno.inicio}–${r.turno.fin}.`,
  lleno: () => `Esta sala ya está completa (${MAX_PERSONAS} personas).`,
};

export const POST = manejar(async (req) => {
  if (!(await conLlavePrevia())) return error("Entra con el correo y la contraseña del equipo.", 401);
  const { turnoId, email } = await leerJson(req);
  if (!turnoId || !email) return error("Datos no válidos.");
  const res = await anadirEnPuerta(Number(turnoId), String(email));
  return res.ok ? ok() : error(MENSAJES[res.error](res), 409);
});
