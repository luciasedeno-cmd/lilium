// POST /api/acceso/codigo · { email } → envía un código de 6 dígitos al correo
import { CORREO_VALIDO, DOMINIO, normalizarCorreo, reservasAbiertas } from "@/lib/config";
import { nuevoCodigo } from "@/lib/codigos";
import { correoCodigo } from "@/lib/correo";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";

export const POST = manejar(async (req) => {
  if (!reservasAbiertas()) return error("Las reservas abren el 30 de octubre.", 403);

  const { email } = await leerJson(req);
  const correo = normalizarCorreo(email);
  if (!CORREO_VALIDO.test(correo)) {
    return error(`Usa tu correo institucional: nombreapellido@${DOMINIO}`);
  }

  const res = await nuevoCodigo(correo);
  if (!res.ok) return error(`Espera ${res.espera} s para pedir otro código.`, 429);

  await correoCodigo(correo, res.codigo);
  // En desarrollo sin Gmail configurado, el código se devuelve para poder probar
  const demo = process.env.NODE_ENV !== "production" && !process.env.GMAIL_USER ? { codigoDemo: res.codigo } : {};
  return ok(demo);
});
