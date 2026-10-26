// POST /api/acceso/admin/codigo · { email } → código de 6 cifras para entrar al panel del equipo sin contraseña.
// Solo se envía si el correo está en la lista ADMIN_CORREOS de Vercel. Para no desvelar quién tiene acceso,
// la respuesta es la misma aunque el correo no esté en la lista (en ese caso, simplemente no llega nada).
import { normalizarCorreo, esCorreoAdmin } from "@/lib/config";
import { nuevoCodigo } from "@/lib/codigos";
import { correoCodigoAdmin } from "@/lib/correo";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";

export const POST = manejar(async (req) => {
  const { email } = await leerJson(req);
  const correo = normalizarCorreo(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return error("Escribe un correo válido.");
  if (!esCorreoAdmin(correo)) return ok();

  // Los códigos del panel se guardan aparte de los de reservar (con «admin:» delante)
  const res = await nuevoCodigo(`admin:${correo}`);
  if (!res.ok) return error(`Espera ${res.espera} s para pedir otro código.`, 429);
  try {
    await correoCodigoAdmin(correo, res.codigo);
  } catch (e) {
    console.error("Error enviando el código del panel:", e);
    return error("No hemos podido enviar el correo con el código. Inténtalo de nuevo en un minuto.", 502);
  }
  // En desarrollo sin Gmail configurado, el código se devuelve para poder probar
  const demo = process.env.NODE_ENV !== "production" && !process.env.GMAIL_USER ? { codigoDemo: res.codigo } : {};
  return ok(demo);
});
