// POST /api/reservas · { otros: [correos], turnoId, equipo? } → crea la reserva del líder (la sesión)
import { correoDeSesion } from "@/lib/sesion";
import { crearReserva, limiteDe } from "@/lib/reservas";
import { correoInvitacion, correoEntrada, urlSitio } from "@/lib/correo";
import { reservasAbiertas, MIN_SALA_NUEVA, MAX_PERSONAS, DOMINIO } from "@/lib/config";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";

const MENSAJES = {
  correo: (r) => `${r.email} no es un correo válido (nombreapellido@${DOMINIO}).`,
  repetido: () => "Hay correos repetidos en el grupo.",
  maximo: () => `Máximo ${MAX_PERSONAS} personas por turno.`,
  turno: () => "Ese turno no existe.",
  inscrito: (r) => `${r.email} ya está en otra reserva. Cada correo solo puede estar en una.`,
  minimo: () => `Necesitáis al menos ${MIN_SALA_NUEVA} personas para abrir una sala libre.`,
  sin_hueco: () => "En ese turno ya no queda hueco para todo el grupo. Elige otro.",
};

export const POST = manejar(async (req) => {
  if (!reservasAbiertas()) return error("Las reservas abren el 30 de octubre.", 403);
  const lider = await correoDeSesion();
  if (!lider) return error("Tu sesión ha caducado. Vuelve a entrar con tu correo.", 401);

  const { otros = [], turnoId, equipo } = await leerJson(req);
  if (!Array.isArray(otros)) return error("Datos no válidos.");

  const res = await crearReserva({ lider, otros, turnoId: Number(turnoId), equipo });
  if (!res.ok) return error(MENSAJES[res.error](res), 409, { motivo: res.error });

  // Correos: invitación a cada integrante y entrada al líder (ya confirmado).
  // Si falla un envío la reserva sigue creada; se informa para avisar a mano.
  const { turno, miembros, reserva } = res;
  const limite = limiteDe(reserva.creada);
  const base = urlSitio();
  const envios = miembros.map((m) =>
    m.email === lider
      ? correoEntrada({ para: m.email, turno, equipo: turno.equipo, enlaceEntrada: `${base}/entrada/${m.token}`, enlaceReserva: `${base}/mi-reserva` })
      : correoInvitacion({ para: m.email, lider, turno, equipo: turno.equipo, enlace: `${base}/confirmar/${m.token}`, limite })
  );
  const resultados = await Promise.allSettled(envios);
  const fallidos = miembros.filter((_, i) => resultados[i].status === "rejected").map((m) => m.email);
  resultados.forEach((r) => r.status === "rejected" && console.error("Error enviando correo:", r.reason));

  return ok({ fallidos });
});
