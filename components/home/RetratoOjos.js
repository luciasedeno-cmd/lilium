"use client";
// Cuadros de «¿Qué es Lilium?» (Figma «HOME PAGE»): el retrato grande y el cuadro del ojo miran al ratón
// (en el móvil, hacia donde se toca); en el cuadro de la mano, la mariposa mueve las alas.
// El retrato está en capas: la cara sin iris (retrato-base.webp) y, encima, cada iris por separado
// (iris-izq.webp / iris-der.webp) dentro de un «hueco» con forma de ojo. Solo se mueven los iris,
// unos pocos píxeles, con una transición suave (ver .ojo en home.css).
import { useEffect, useRef } from "react";

/**
 * Hace que un elemento «mire» al ratón: guarda en --ox y --oy (de -1 a 1) hacia dónde está el puntero
 * respecto a ese elemento. alto = a qué altura están los ojos (0 arriba, 1 abajo); alcance = a cuántos
 * píxeles de distancia ya mira del todo hacia el ratón. Se usa en el retrato grande y en el cuadro del ojo.
 */
export function useMirada(alto = 0.5, alcance = 140) {
  const caja = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = caja.current;
    let visible = false;
    let pendiente = null;

    function mirar() {
      const { x, y } = pendiente;
      pendiente = null;
      const r = el.getBoundingClientRect();
      const dx = x - (r.left + r.width / 2);
      const dy = y - (r.top + r.height * alto);
      const distancia = Math.hypot(dx, dy) || 1;
      const fuerza = Math.min(1, distancia / alcance);
      el.style.setProperty("--ox", ((dx / distancia) * fuerza).toFixed(3));
      el.style.setProperty("--oy", ((dy / distancia) * fuerza).toFixed(3));
    }

    function alMover(e) {
      if (!visible) return;
      const vacio = pendiente === null;
      pendiente = { x: e.clientX, y: e.clientY };
      if (vacio) requestAnimationFrame(mirar);
    }

    // Solo escucha cuando está en pantalla
    const vigia = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    vigia.observe(el);
    window.addEventListener("pointermove", alMover, { passive: true }); // ratón (y dedo al arrastrar)
    window.addEventListener("pointerdown", alMover, { passive: true }); // toque en el móvil
    return () => {
      vigia.disconnect();
      window.removeEventListener("pointermove", alMover);
      window.removeEventListener("pointerdown", alMover);
    };
  }, [alto, alcance]);

  return caja;
}

export default function RetratoOjos({ alt }) {
  // Los ojos están a la altura del 29 % del retrato
  const caja = useMirada(0.29, 140);

  return (
    <div className="retrato__foto" ref={caja}>
      <img className="retrato__base" src="/assets/img/retrato-base.webp" width="696" height="1018" alt={alt} />
      <span className="ojo ojo--izq" aria-hidden="true">
        <img src="/assets/img/iris-izq.webp" alt="" />
      </span>
      <span className="ojo ojo--der" aria-hidden="true">
        <img src="/assets/img/iris-der.webp" alt="" />
      </span>
    </div>
  );
}

/** Cuadro pequeño del ojo (Figma «Frame 37»): el iris también sigue al ratón */
export function CuadroOjo({ alt }) {
  const caja = useMirada(0.48, 160);
  return (
    <div className="cuadro-ojo" ref={caja}>
      <img className="cuadro-ojo__base" src="/assets/img/cuadro-ojo.webp" width="663" height="918" alt={alt} />
      <span className="cuadro-ojo__hueco" aria-hidden="true">
        <img src="/assets/img/cuadro-ojo-iris.webp" alt="" />
      </span>
    </div>
  );
}

/** Cuadro pequeño de la mano con la mariposa (Figma «Frame 77»): la mariposa mueve las alas */
export function CuadroMariposa({ alt }) {
  return (
    <div className="cuadro-mariposa">
      <img className="cuadro-mariposa__base" src="/assets/img/cuadro-mano.webp" width="663" height="918" alt={alt} />
      <img className="cuadro-mariposa__alas" src="/assets/img/cuadro-mano-alas.webp" width="97" height="95" alt="" aria-hidden="true" />
    </div>
  );
}
