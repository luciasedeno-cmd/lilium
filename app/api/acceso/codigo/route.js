// POST /api/acceso/codigo · { email } → envía un código de 6 dígitos al correo
import { CORREO_VALIDO, DOMINIO, normalizarCorreo, reservasAbiertas } from "@/lib/config";
import { nuevoCodigo } from "@/lib/codigos";
import { correoCodigo } from "@/lib/correo";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";

export const POST = manejar(async (req) => {
  const { email } = await leerJson(req);
  const correo = normalizarCorreo(email);
  if (!CORREO_VALIDO.test(correo)) {
    return error(`Usa tu correo institucional: nombreapellido@${DOMINIO}`);
  }
  if (!reservasAbiertas(correo)) return error("Las reservas abren el 30 de octubre.", 403);

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
