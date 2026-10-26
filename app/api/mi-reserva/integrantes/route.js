// POST /api/mi-reserva/integrantes · { anadir: [correos], quitar: [correos] }
// Quien reservó: añade y/o quita a la gente que apuntó ella (botón «Guardar cambios» de Mi reserva).
// A la gente que apuntaron otras personas de la sala no la puede quitar.
import { correoDeSesion } from "@/lib/sesion";
import { editarIntegrantes, limiteDe } from "@/lib/reservas";
import { correoInvitacion, correoCancelacion, urlSitio } from "@/lib/correo";
import { MAX_PERSONAS, DOMINIO } from "@/lib/config";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";
import { avisarListaEspera } from "@/lib/avisos";

const MENSAJES = {
  correo: (r) => `${r.email} no es un correo válido (nombreapellido@${DOMINIO}).`,
  sin_reserva: () => "No tienes ninguna reserva.",
  no_lider: () => "Solo quien hizo la reserva puede cambiar a las personas que apuntó.",
  quitar_lider: () => "No puedes quitarte a ti: usa «Cancelar solo mi asistencia».",
  no_es_del_grupo: (r) => `No puedes quitar a ${r.email}: solo a las personas que apuntaste tú.`,
  ya_en_grupo: (r) => `${r.email} ya está en tu grupo.`,
  inscrito: (r) => `${r.email} ya está en otra reserva. Cada correo solo puede estar en una.`,
  sin_hueco: (r) => `En vuestro turno solo caben ${MAX_PERSONAS} personas: podéis añadir ${Math.max(0, r.hueco)} como mucho.`,
};

export const POST = manejar(async (req) => {
  const lider = await correoDeSesion();
  if (!lider) return error("Tu sesión ha caducado. Vuelve a entrar con tu correo.", 401);
  const { anadir = [], quitar = [] } = await leerJson(req);
  if (!Array.isArray(anadir) || !Array.isArray(quitar)) return error("Datos no válidos.");
  if (!anadir.length && !quitar.length) return ok({ fallidos: [] });

  const res = await editarIntegrantes(lider, { anadir, quitar });
  if (!res.ok) return error(MENSAJES[res.error](res), 409, { motivo: res.error });

  const { turno, nuevos, quitados } = res;
  const base = urlSitio();
  // Invitación a las personas nuevas (48 h desde ahora) y aviso a quien sale del grupo
  const envios = [
    ...nuevos.map((m) => correoInvitacion({
      para: m.email, lider, turno, equipo: turno.equipo, enlace: `${base}/confirmar/${m.token}`, limite: limiteDe(m.invitado_en),
    })),
    ...quitados.map((para) => correoCancelacion({ para, turno, motivo: `${lider} te ha quitado del grupo.` })),
  ];
  const resultados = await Promise.allSettled(envios);
  resultados.forEach((r) => r.status === "rejected" && console.error("Error enviando correo:", r.reason));
  const fallidos = nuevos.filter((_, i) => resultados[i].status === "rejected").map((m) => m.email);

  // Si queda una plaza libre, se avisa a la lista de espera
  if (quitados.length) await avisarListaEspera().catch((e) => console.error("Lista de espera:", e));
  return ok({ fallidos });
});
