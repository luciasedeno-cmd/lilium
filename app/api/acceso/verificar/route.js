// POST /api/acceso/verificar · { email, codigo } → inicia la sesión
import { normalizarCorreo } from "@/lib/config";
import { comprobarCodigo } from "@/lib/codigos";
import { iniciarSesion, comprobarLlaveSesion } from "@/lib/sesion";
import { reservaDe } from "@/lib/reservas";
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
  // Si la llave de la sesión está mal, avisar sin gastar el código
  comprobarLlaveSesion();
  const res = await comprobarCodigo(correo, codigo);
  if (!res.ok) return error(MENSAJES[res.error]);

  await iniciarSesion(correo);
  const reserva = await reservaDe(correo);
  return ok({ email: correo, tieneReserva: Boolean(reserva) });
});
