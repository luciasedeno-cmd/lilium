// POST /api/acceso/admin · { email, clave } → página del equipo (/admin: botón «Admin» de la cuenta atrás y del pie)
// DELETE /api/acceso/admin → salir del panel (se borra la llave de este navegador)
// Solo lilium@esada.es, con la contraseña guardada en Vercel como ADMIN_CLAVE (nunca en el código).
// Si es correcta, el navegador recibe la «llave de pruebas» para ver la web antes de la apertura.
import { createHash, timingSafeEqual } from "node:crypto";
import { ADMIN_CORREO, normalizarCorreo } from "@/lib/config";
import { cookies } from "next/headers";
import { comprobarLlaveSesion } from "@/lib/sesion";
import { COOKIE_PREVIA } from "@/lib/previa";
import { darLlavePrevia } from "@/lib/previaServidor";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";

// Freno contra quien pruebe contraseñas sin parar: tras 10 fallos, 15 minutos de bloqueo
const MAX_FALLOS = 10;
const BLOQUEO_MS = 15 * 60 * 1000;
const fallos = (globalThis.__liliumFallosAdmin ??= { n: 0, desde: 0 });

const resumen = (texto) => createHash("sha256").update(String(texto)).digest();
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export const POST = manejar(async (req) => {
  const guardada = process.env.ADMIN_CLAVE;
  if (!guardada || guardada.length < 12) {
    return error("Falta configurar la contraseña de administración (ADMIN_CLAVE) en Vercel.", 503);
  }
  if (fallos.n >= MAX_FALLOS && Date.now() - fallos.desde < BLOQUEO_MS) {
    return error("Demasiados intentos. Espera 15 minutos y vuelve a probar.", 429);
  }
  if (Date.now() - fallos.desde >= BLOQUEO_MS) fallos.n = 0;

  const { email, clave } = await leerJson(req);
  const correo = normalizarCorreo(email);
  // Se comparan los «resúmenes» de las contraseñas, siempre en el mismo tiempo (así no se puede adivinar por la espera)
  const buena = correo === ADMIN_CORREO && timingSafeEqual(resumen(clave), resumen(guardada));
  if (!buena) {
    if (fallos.n === 0) fallos.desde = Date.now();
    fallos.n += 1;
    await espera(800); // cada fallo tarda un poco, para frenar a quien pruebe a lo loco
    return error("Correo o contraseña incorrectos.", 401);
  }

  fallos.n = 0;
  comprobarLlaveSesion();
  await darLlavePrevia();
  return ok();
});

export const DELETE = manejar(async () => {
  const almacen = await cookies();
  almacen.delete(COOKIE_PREVIA);
  return ok();
});
