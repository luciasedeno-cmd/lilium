// POST /api/acceso/admin/verificar · { email, codigo } → si el código es bueno, este navegador recibe
// la llave del equipo (la misma que con la contraseña de lilium@esada.es) y ya puede ver el panel.
// También se abre su sesión normal, así puede ir a reservar sin volver a confirmar el correo.
import { normalizarCorreo, esCorreoAdmin } from "@/lib/config";
import { comprobarCodigo } from "@/lib/codigos";
import { comprobarLlaveSesion, iniciarSesion } from "@/lib/sesion";
import { darLlavePrevia } from "@/lib/previaServidor";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";

const MENSAJES = {
  sin_codigo: "Pide primero un código.",
  caducado: "El código ha caducado. Pide uno nuevo.",
  intentos: "Demasiados intentos. Pide un código nuevo.",
  incorrecto: "Código incorrecto. Revísalo o pide uno nuevo.",
};

export const POST = manejar(async (req) => {
  const { email, codigo } = await leerJson(req);
  const correo = normalizarCorreo(email);
  comprobarLlaveSesion();
  if (!esCorreoAdmin(correo)) return error(MENSAJES.incorrecto);
  const res = await comprobarCodigo(`admin:${correo}`, codigo);
  if (!res.ok) return error(MENSAJES[res.error]);
  await darLlavePrevia();
  // Además queda dentro de la web con su correo: puede reservar sin pasar por /acceso
  await iniciarSesion(correo);
  return ok();
});
