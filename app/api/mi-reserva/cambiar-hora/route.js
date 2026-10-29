// POST /api/mi-reserva/cambiar-hora · { turnoId } → mueve solo a esta persona a otro turno
import { correoDeSesion } from "@/lib/sesion";
import { cambiarHora } from "@/lib/reservas";
import { MIN_SALA_NUEVA } from "@/lib/config";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";
import { avisarListaEspera } from "@/lib/avisos";

// Al quedar una plaza libre, se avisa a quien la estaba esperando (si falla, lo reintenta /api/cron)
const avisar = () => avisarListaEspera().catch((e) => console.error("Lista de espera:", e));

const MENSAJES = {
  sin_reserva: "No tienes ninguna reserva.",
  mismo: "Ya estás en ese turno.",
  turno: "Ese turno no existe.",
  minimo: `Para abrir una sala libre hacen falta ${MIN_SALA_NUEVA} personas. Elige un grupo en formación.`,
  sin_hueco: "Ese turno ya no tiene hueco.",
  profe_ocupada: "La plaza del profesorado de ese turno ya está cogida. Elige otro.",
};

export const POST = manejar(async (req) => {
  const email = await correoDeSesion();
  if (!email) return error("Tu sesión ha caducado. Vuelve a entrar con tu correo.", 401);
  const { turnoId } = await leerJson(req);
  const res = await cambiarHora(email, Number(turnoId));
  if (!res.ok) return error(MENSAJES[res.error], 409);
  await avisar();
  return ok();
});
