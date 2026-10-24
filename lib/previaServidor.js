// Lilium · Para las rutas de la API: ¿este navegador tiene la «llave de pruebas»?
// Con ella, cualquier correo de ESADA puede entrar y reservar antes de la apertura (para probar).
import { cookies } from "next/headers";
import { COOKIE_PREVIA, llavePreviaValida } from "./previa";

export async function conLlavePrevia() {
  const almacen = await cookies();
  return llavePreviaValida(almacen.get(COOKIE_PREVIA)?.value);
}
