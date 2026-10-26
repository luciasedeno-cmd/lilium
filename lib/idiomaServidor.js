// Lilium · Idioma elegido, leído en el servidor (para las páginas que se preparan allí).
// 1) Si la persona ya eligió ES / EN con los botones, se respeta (cookie).
// 2) Si no, se mira el idioma del dispositivo (lo manda el navegador): español → español; cualquier otro → inglés.
import { cookies, headers } from "next/headers";
import { COOKIE_IDIOMA, IDIOMAS } from "./idioma";

export async function idiomaActual() {
  const almacen = await cookies();
  const elegido = almacen.get(COOKIE_IDIOMA)?.value;
  if (IDIOMAS.includes(elegido)) return elegido;
  const cabeceras = await headers();
  return idiomaDelDispositivo(cabeceras.get("accept-language"));
}

/** «es-ES,es;q=0.9,en;q=0.8» → "es" · «fr-FR,fr;q=0.9» → "en" · sin dato → "es" */
export function idiomaDelDispositivo(cabecera) {
  if (!cabecera) return "es";
  const primero = cabecera.split(",")[0].trim().toLowerCase();
  return primero.startsWith("es") ? "es" : "en";
}
