// POST /api/acceso/codigo · { email } → envía un código de 6 dígitos al correo
import { correoPermitido, normalizarCorreo, reservasAbiertas } from "@/lib/config";
import { nuevoCodigo } from "@/lib/codigos";
import { correoCodigo } from "@/lib/correo";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";
import { conLlavePrevia } from "@/lib/previaServidor";

export const POST = manejar(async (req) => {
  const { email } = await leerJson(req);
  const correo = normalizarCorreo(email);
  // Alumnado de ESADA o, como excepción, los correos de ADMIN_CORREOS (por ejemplo, el profesor)
  if (!correoPermitido(correo)) {
    return error("Usa tu correo de ESADA: nombreapellido@alumnado.esada.es (alumnado) o nombre@esada.es (profesorado).");
  }
  if (!reservasAbiertas(correo) && !(await conLlavePrevia())) return error("Las reservas abren el 30 de octubre a las 12:00.", 403);

  const res = await nuevoCodigo(correo);
  if (!res.ok) return error(`Espera ${res.espera} s para pedir otro código.`, 429);

  try {
    await correoCodigo(correo, res.codigo);
  } catch (e) {
    console.error("Error enviando el código:", e);
    return error("No hemos podido enviar el correo con el código. Inténtalo de nuevo en un minuto.", 502);
  }
  // En desarrollo sin Gmail configurado, el código se devuelve para poder probar
  const demo = process.env.NODE_ENV !== "production" && !process.env.GMAIL_USER ? { codigoDemo: res.codigo } : {};
  return ok(demo);
});
