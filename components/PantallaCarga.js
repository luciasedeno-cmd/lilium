"use client";
// Pantalla de carga al entrar en la Home (/inicio): fondo verde, el lirio que «respira», la firma
// «Lilium», una línea que se va llenando y el porcentaje (0 % → 100 %) contando a la vez.
// Mientras la página carga, el número sube despacio hasta el 90 %; cuando ya ha cargado (y como
// mínimo 1,4 s, para que se vea con calma) llega al 100 % y la pantalla se retira. Solo sale la primera vez en cada visita (mientras no se cierre
// la pestaña). Si algo fallara, el CSS la quita sola a los 6 s.
import { useEffect, useRef, useState } from "react";
import { useTextos } from "./Idioma";

const TEXTOS = { es: { cargando: "Cargando tu destino…" }, en: { cargando: "Loading your destiny…" } };
const YA_VISTA = "lilium_carga_vista";
const MINIMO_MS = 1400;
const FINAL_MS = 350; // lo que tarda en ir del número que tenga al 100 % al terminar de cargar

export default function PantallaCarga() {
  const t = useTextos(TEXTOS);
  const [estado, setEstado] = useState("visible"); // visible | fuera (se va desvaneciendo) | oculta (ya vista)
  const [porcentaje, setPorcentaje] = useState(0);
  const linea = useRef(null);

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

    const inicio = performance.now();
    let cargada = document.readyState === "complete";
    let finDesde = null; // cuándo empezó el tramo final hasta el 100 % (y desde qué número)
    let ultimo = 0;
    let fotograma;
    const alCargar = () => (cargada = true);
    if (!cargada) window.addEventListener("load", alCargar, { once: true });

    // Cada fotograma calcula el número y lo pinta (también la línea, que va a la par)
    function avanzar(ahora) {
      const t = ahora - inicio;
      let valor;
      if (finDesde) {
        const f = Math.min(1, (ahora - finDesde.momento) / FINAL_MS);
        valor = finDesde.valor + (100 - finDesde.valor) * f;
      } else {
        // Sube rápido al principio y cada vez más despacio, sin pasar del 90 % hasta que cargue
        const f = Math.min(1, t / MINIMO_MS);
        valor = 90 * (1 - Math.pow(1 - f, 3));
        if (cargada && t >= MINIMO_MS) finDesde = { momento: ahora, valor };
      }
      const entero = Math.floor(valor);
      if (entero !== ultimo) {
        ultimo = entero;
        setPorcentaje(entero);
      }
      if (linea.current) linea.current.style.transform = `scaleX(${valor / 100})`;
      if (valor >= 100) {
        // Un momento en el 100 % y se desvanece
        fotograma = setTimeout(() => setEstado("fuera"), 250);
        return;
      }
      fotograma = requestAnimationFrame(avanzar);
    }
    fotograma = requestAnimationFrame(avanzar);
    return () => {
      cancelAnimationFrame(fotograma);
      clearTimeout(fotograma);
      window.removeEventListener("load", alCargar);
    };
  }, []);

  return (
    <div className={`carga${estado === "visible" ? "" : ` is-${estado}`}`} aria-hidden={estado !== "visible"} role="status" suppressHydrationWarning>
      {/* Si ya se vio en esta visita, se esconde antes de pintarse (sin parpadeo) */}
      <script dangerouslySetInnerHTML={{ __html: `try{if(sessionStorage.getItem("${YA_VISTA}")==="1")document.currentScript.parentNode.classList.add("is-oculta")}catch(e){}` }} />
      <img className="carga__lirio" src="/assets/img/icono-lirio.webp" width="99" height="80" alt="" />
      <img className="carga__logo" src="/assets/img/logo-lilium.webp" width="198" height="118" alt="Lilium" />
      {/* La línea la mueve el código (no la animación del CSS), a la par que el porcentaje */}
      <span className="carga__linea carga__linea--progreso" aria-hidden="true"><span ref={linea} /></span>
      <p className="carga__porcentaje" aria-hidden="true">{porcentaje}<span>%</span></p>
      <p className="carga__texto">{t.cargando}</p>
    </div>
  );
}
