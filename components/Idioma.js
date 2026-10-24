"use client";
// Lilium · Idioma compartido por toda la web.
// useIdioma() devuelve { idioma, cambiar }: idioma es "es" o "en"; cambiar("en") pasa la web a inglés.
import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { COOKIE_IDIOMA } from "@/lib/idioma";

const Contexto = createContext({ idioma: "es", cambiar: () => {} });

export function IdiomaProvider({ inicial, children }) {
  const [idioma, setIdioma] = useState(inicial);
  const router = useRouter();

  function cambiar(nuevo) {
    if (nuevo === idioma) return;
    // Se guarda un año en el navegador, para que la próxima vez la web salga ya en ese idioma
    document.cookie = `${COOKIE_IDIOMA}=${nuevo}; path=/; max-age=${365 * 24 * 3600}; samesite=lax`;
    document.documentElement.lang = nuevo;
    setIdioma(nuevo);
    router.refresh(); // vuelve a preparar las partes que se hacen en el servidor
  }

  return <Contexto.Provider value={{ idioma, cambiar }}>{children}</Contexto.Provider>;
}

export const useIdioma = () => useContext(Contexto);

/** Elige el texto del idioma actual: const t = useTextos(TEXTOS) */
export function useTextos(textos) {
  return textos[useIdioma().idioma];
}
