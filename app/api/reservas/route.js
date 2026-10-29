// POST /api/reservas · { otros: [correos], turnoId, equipo? } → apunta a quien reserva (la sesión) y a su gente
// en la sala: si la sala está vacía se crea su grupo; si ya tiene grupo, entran en ese mismo grupo.
import { correoDeSesion } from "@/lib/sesion";
import { crearReserva, fragmentosDe } from "@/lib/reservas";
import { dejarDeMirar } from "@/lib/mirando";
import { correoInvitacion, correoEntrada, urlSitio } from "@/lib/correo";
import { reservasAbiertas, MIN_SALA_NUEVA, MAX_PERSONAS, DOMINIO } from "@/lib/config";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";
import { conLlavePrevia } from "@/lib/previaServidor";

const MENSAJES = {
  correo: (r) => `${r.email} no es un correo válido (nombreapellido@${DOMINIO}).`,
  profe_solo: () => "Como profesorado, reservas solo tu plaza: no puedes apuntar a más personas.",
  profe_invitado: (r) => `${r.email} es del profesorado: cada profesor reserva su plaza por su cuenta.`,
  profe_ocupada: () => "La plaza del profesorado de ese turno ya está cogida. Elige otro.",
  plaza_profe: () => "En ese turno queda una plaza guardada para el profesorado (hasta el 2 de noviembre a las 12:00). Elige otro turno.",
  repetido: () => "Hay correos repetidos en el grupo.",
  maximo: () => `Máximo ${MAX_PERSONAS} personas por turno.`,
  turno: () => "Ese turno no existe.",
  inscrito: (r) => `${r.email} ya está en otra reserva. Cada correo solo puede estar en una.`,
  minimo: () => `Necesitáis al menos ${MIN_SALA_NUEVA} personas para abrir una sala libre.`,
  sin_hueco: () => "En ese turno ya no queda hueco para todo el grupo. Elige otro.",
};

export const POST = manejar(async (req) => {
  const lider = await correoDeSesion();
  if (!lider) return error("Tu sesión ha caducado. Vuelve a entrar con tu correo.", 401);
  if (!reservasAbiertas(lider) && !(await conLlavePrevia())) return error("Las reservas abren el 30 de octubre a las 12:00.", 403);

  const { otros = [], turnoId, equipo, notas, aceptaTerminos } = await leerJson(req);
  if (!Array.isArray(otros)) return error("Datos no válidos.");
  if (aceptaTerminos !== true) return error("Para reservar tienes que aceptar los Términos y Condiciones.");

  const res = await crearReserva({ lider, otros, turnoId: Number(turnoId), equipo, notas });
  if (!res.ok) return error(MENSAJES[res.error](res), 409, { motivo: res.error });
  await dejarDeMirar(lider).catch(() => {}); // ya ha reservado: deja de contar como «mirando»

  // Correos: invitación a cada integrante y entrada al líder (ya confirmado).
  // Si falla un envío la reserva sigue creada; se informa para avisar a mano.
  // (miembros = solo las personas que se acaban de apuntar; si la sala ya tenía grupo, entran en él)
  const { turno, miembros, limite } = res;
  const base = urlSitio();
  const fragmentosLider = await fragmentosDe(lider);
  const envios = miembros.map((m) =>
    m.email === lider
      ? correoEntrada({ para: m.email, turno, equipo: turno.equipo, enlaceEntrada: `${base}/entrada/${m.token}`, enlaceReserva: `${base}/mi-reserva`, fragmentos: fragmentosLider })
      : correoInvitacion({ para: m.email, lider, turno, equipo: turno.equipo, enlace: `${base}/confirmar/${m.token}`, limite })
  );
  const resultados = await Promise.allSettled(envios);
  const fallidos = miembros.filter((_, i) => resultados[i].status === "rejected").map((m) => m.email);
  resultados.forEach((r) => r.status === "rejected" && console.error("Error enviando correo:", r.reason));

  return ok({ fallidos });
});
