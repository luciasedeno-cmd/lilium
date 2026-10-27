"use client";
// Sección «¿Erasmus?» que se va montando al bajar por la página, como un decorado:
//   1) suben las columnas y el arco, 2) aparecen las plantas y la estatua de la izquierda,
//   3) luego las de la derecha y 4) por último el lirio, el título, la frase y el botón.
// Cómo funciona: la sección se queda quieta en la pantalla (position: sticky) dentro de un bloque más
// alto (.erasmus-bloque). Mientras se baja por ese bloque, la página no avanza: lo que avanza es el
// montaje. Al terminar, la sección sigue subiendo con normalidad y aparece la siguiente.
// El dibujo está recortado en piezas que encajan exactas (public/assets/img/erasmus/):
//   fondo (textura sola), izq, der y arco; en el móvil, las mismas con «-movil».
// Sin animación (si el sistema pide «reducir movimiento» o el navegador es antiguo) se ve todo a la vez,
// igual que antes. Estilos: bloque «¿Erasmus?» de app/estilos/home.css.
import { useEffect, useRef } from "react";

// Cuándo empieza y termina cada pieza (0 = principio del bloque, 1 = final)
const TRAMOS = {
  arco: [0, 0.3],
  izq: [0.28, 0.52],
  der: [0.42, 0.66],
  t1: [0.64, 0.76], // lirio
  t2: [0.69, 0.81], // título
  t3: [0.74, 0.86], // frase
  t4: [0.79, 0.92], // botón (y del 0,92 al 1, un momento quieta con todo montado)
};

// Del avance general (0–1) al avance de una pieza (0–1), que arranca y frena con suavidad
function tramo(p, [desde, hasta]) {
  const f = Math.min(1, Math.max(0, (p - desde) / (hasta - desde)));
  return f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
}

function Capa({ nombre }) {
  return (
    <picture>
      <source media="(max-width: 760px)" srcSet={`/assets/img/erasmus/${nombre}-movil.webp`} />
      <img className={`erasmus__capa erasmus__capa--${nombre}`} src={`/assets/img/erasmus/${nombre}.webp`}
        width="1440" height="734" alt="" loading="lazy" decoding="async" />
    </picture>
  );
}

export default function ErasmusArco({ children }) {
  const bloque = useRef(null);
  const seccion = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!CSS.supports("position", "sticky")) return;
    const caja = bloque.current;
    const sec = seccion.current;
    caja.setAttribute("data-animada", ""); // a partir de aquí el bloque es alto y las piezas empiezan ocultas

    let objetivo = 0; // hasta dónde se ha bajado
    let pintado = 0; // lo que se está enseñando (sigue al objetivo con suavidad)
    let fotograma = 0;

    function medir() {
      const r = caja.getBoundingClientRect();
      // El montaje empieza un poco antes de que la sección se quede fija (cuando asoma por abajo),
      // para que no se vea nunca la pantalla vacía
      const adelanto = window.innerHeight * 0.9;
      const recorrido = caja.offsetHeight - sec.offsetHeight + adelanto;
      objetivo = Math.min(1, Math.max(0, (adelanto - r.top) / recorrido));
      if (!fotograma) fotograma = requestAnimationFrame(pintar);
    }

    function pintar() {
      fotograma = 0;
      pintado += (objetivo - pintado) * 0.14;
      if (Math.abs(objetivo - pintado) < 0.001) pintado = objetivo;
      for (const [nombre, t] of Object.entries(TRAMOS)) sec.style.setProperty(`--${nombre}`, tramo(pintado, t).toFixed(4));
      sec.toggleAttribute("data-montada", tramo(pintado, TRAMOS.t4) > 0.6); // el botón ya se puede pulsar
      if (pintado !== objetivo) fotograma = requestAnimationFrame(pintar);
    }

    medir();
    window.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => {
      window.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
      cancelAnimationFrame(fotograma);
      caja.removeAttribute("data-animada");
    };
  }, []);

  return (
    <div className="erasmus-bloque" ref={bloque}>
      <section className="erasmus" id="erasmus" data-fondo="oscuro" ref={seccion}>
        {/* Las piezas del dibujo, de atrás hacia delante */}
        <div className="erasmus__capas" aria-hidden="true">
          <Capa nombre="fondo" />
          <Capa nombre="izq" />
          <Capa nombre="der" />
          <Capa nombre="arco" />
        </div>
        {children}
      </section>
    </div>
  );
}
