// Lilium · Idioma elegido, leído en el servidor (para las páginas que se preparan allí)
import { cookies } from "next/headers";
import { COOKIE_IDIOMA, idiomaValido } from "./idioma";

export async function idiomaActual() {
  const almacen = await cookies();
  return idiomaValido(almacen.get(COOKIE_IDIOMA)?.value);
}
