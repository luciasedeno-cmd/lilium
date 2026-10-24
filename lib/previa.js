// Lilium · «Llave de pruebas»: hasta la apertura, solo quien entra por la página del equipo (/admin)
// puede ver la web. Es una cookie firmada (como la sesión), separada de la sesión del correo.
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_PREVIA = "lilium_previa";
export const DIAS_PREVIA = 30;

function clave() {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto || secreto.length < 32) return null;
  return new TextEncoder().encode(secreto);
}

/** Crea el valor de la llave de pruebas */
export async function crearLlavePrevia() {
  const k = clave();
  if (!k) throw new Error("Falta configurar la llave SESSION_SECRET en Vercel.");
  return new SignJWT({ previa: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DIAS_PREVIA}d`)
    .sign(k);
}

/** ¿Es válida esta llave? (sirve tanto en el middleware como en las rutas de la API) */
export async function llavePreviaValida(valor) {
  const k = clave();
  if (!valor || !k) return false;
  try {
    const { payload } = await jwtVerify(valor, k);
    return payload.previa === true;
  } catch {
    return false;
  }
}
