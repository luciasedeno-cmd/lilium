// Lilium · Para las rutas de la API: ¿este navegador tiene la «llave de pruebas»?
// Con ella, cualquier correo de ESADA puede entrar y reservar antes de la apertura (para probar).
import { cookies } from "next/headers";
import { COOKIE_PREVIA, DIAS_PREVIA, crearLlavePrevia, llavePreviaValida } from "./previa";

/** Da a este navegador la llave del equipo (30 días) */
export async function darLlavePrevia() {
  const almacen = await cookies();
  almacen.set(COOKIE_PREVIA, await crearLlavePrevia(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DIAS_PREVIA * 24 * 3600,
  });
}

export async function conLlavePrevia() {
  const almacen = await cookies();
  return llavePreviaValida(almacen.get(COOKIE_PREVIA)?.value);
}
