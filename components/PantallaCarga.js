"use client";
// Pantalla de carga al entrar en la Home (/inicio): fondo verde, el lirio que «respira», la firma
// «Lilium» y una línea que se va llenando. Se retira cuando la página ha cargado (y como mínimo
// 1,4 s, para que se vea con calma). Solo sale la primera vez en cada visita (mientras no se cierre
// la pestaña). Si algo fallara, el CSS la quita sola a los 6 s.
import { useEffect, useState } from "react";
import { useTextos } from "./Idioma";

const TEXTOS = { es: { cargando: "Abriendo el prado…" }, en: { cargando: "Opening the meadow…" } };
const YA_VISTA = "lilium_carga_vista";
const MINIMO_MS = 1400;

export default function PantallaCarga() {
  const t = useTextos(TEXTOS);
  const [estado, setEstado] = useState("visible"); // visible | fuera (se va desvaneciendo) | oculta (ya vista)

  useEffect(() => {
    // Se mira una sola vez por carga de página (aunque este código se ejecute dos veces)
    if (window.__liliumCargaVista === undefined) {
      try {
        window.__liliumCargaVista = sessionStorage.getItem(YA_VISTA) === "1";
        sessionStorage.setItem(YA_VISTA, "1");
      } catch {
        window.__liliumCargaVista = false;
      }
    }
    if (window.__liliumCargaVista) return setEstado("oculta");

    const inicio = Date.now();
    const retirar = () => setTimeout(() => setEstado("fuera"), Math.max(0, MINIMO_MS - (Date.now() - inicio)));
    if (document.readyState === "complete") retirar();
    else window.addEventListener("load", retirar, { once: true });
    return () => window.removeEventListener("load", retirar);
  }, []);

  return (
    <div className={`carga${estado === "visible" ? "" : ` is-${estado}`}`} aria-hidden={estado !== "visible"} role="status" suppressHydrationWarning>
      {/* Si ya se vio en esta visita, se esconde antes de pintarse (sin parpadeo) */}
      <script dangerouslySetInnerHTML={{ __html: `try{if(sessionStorage.getItem("${YA_VISTA}")==="1")document.currentScript.parentNode.classList.add("is-oculta")}catch(e){}` }} />
      <img className="carga__lirio" src="/assets/img/icono-lirio.webp" width="99" height="80" alt="" />
      <img className="carga__logo" src="/assets/img/logo-lilium.webp" width="198" height="118" alt="Lilium" />
      <span className="carga__linea" aria-hidden="true"><span /></span>
      <p className="carga__texto">{t.cargando}</p>
    </div>
  );
}
