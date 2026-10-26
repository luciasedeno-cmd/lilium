"use client";
// Cursor de Lilium (solo en ordenadores con ratón): un punto terracota que va justo donde está el ratón
// y un aro fino que lo sigue con un poco de retraso, como si flotara.
//  · Sobre botones y enlaces el aro crece y dentro aparece el lirio.
//  · Al hacer clic el aro se encoge un momento.
//  · Sobre fondos oscuros (secciones con data-fondo="oscuro", el pie, Mi reserva…) se vuelve crema.
// En móviles y tabletas (sin ratón) y si el sistema pide «reducir movimiento» no se usa: queda el cursor normal.
// Los estilos están en app/estilos/transiciones.css (bloque «Cursor»).
import { useEffect, useRef } from "react";

// Qué cuenta como «se puede pulsar»
const PULSABLE = "a, button, [role='button'], [role='tab'], label, select, summary, input[type='checkbox'], input[type='radio'], input[type='submit']";
// Fondos oscuros sobre los que el cursor pasa a crema
const OSCURO = "[data-fondo='oscuro'], .footer, .carga, .como-bloque, main.mi-reserva, main.cues, main.cues-enviado, main.previa";

export default function Cursor() {
  const punto = useRef(null);
  const aro = useRef(null);

  useEffect(() => {
    const conRaton = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!conRaton || quieto) return;
    const raiz = document.documentElement;
    raiz.classList.add("cursor-lilium");

    // Dónde está el ratón (x, y) y dónde se pinta el aro (ax, ay), que va detrás poco a poco
    let x = -100, y = -100, ax = -100, ay = -100;
    let fotograma = null;

    function pintar() {
      ax += (x - ax) * 0.2;
      ay += (y - ay) * 0.2;
      punto.current.style.transform = `translate(${x}px, ${y}px)`;
      aro.current.style.transform = `translate(${ax}px, ${ay}px)`;
      // Sigue moviéndose hasta que el aro alcanza al punto
      fotograma = Math.abs(x - ax) + Math.abs(y - ay) > 0.3 ? requestAnimationFrame(pintar) : null;
    }

    function alMover(e) {
      x = e.clientX;
      y = e.clientY;
      raiz.classList.add("cursor-visible");
      const debajo = e.target instanceof Element ? e.target : null;
      raiz.classList.toggle("cursor-sobre", Boolean(debajo?.closest(PULSABLE)));
      raiz.classList.toggle("cursor-oscuro", Boolean(debajo?.closest(OSCURO)));
      if (!fotograma) fotograma = requestAnimationFrame(pintar);
    }
    const alPulsar = () => raiz.classList.add("cursor-pulsado");
    const alSoltar = () => raiz.classList.remove("cursor-pulsado");
    // Si el ratón sale de la ventana, el cursor se esconde
    const alSalir = () => raiz.classList.remove("cursor-visible");

    window.addEventListener("pointermove", alMover, { passive: true });
    window.addEventListener("pointerdown", alPulsar, { passive: true });
    window.addEventListener("pointerup", alSoltar, { passive: true });
    document.addEventListener("pointerleave", alSalir);
    return () => {
      cancelAnimationFrame(fotograma);
      raiz.classList.remove("cursor-lilium", "cursor-visible", "cursor-sobre", "cursor-oscuro", "cursor-pulsado");
      window.removeEventListener("pointermove", alMover);
      window.removeEventListener("pointerdown", alPulsar);
      window.removeEventListener("pointerup", alSoltar);
      document.removeEventListener("pointerleave", alSalir);
    };
  }, []);

  return (
    <div className="cursor" aria-hidden="true">
      <span className="cursor__aro" ref={aro}><span /></span>
      <span className="cursor__punto" ref={punto}><span /></span>
    </div>
  );
}
