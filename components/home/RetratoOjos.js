"use client";
// Retrato de «¿Qué es Lilium?» con los ojos que siguen al ratón (en el móvil, miran hacia donde se toca).
// El retrato está en capas: la cara sin iris (retrato-base.webp) y, encima, cada iris por separado
// (iris-izq.webp / iris-der.webp) dentro de un «hueco» con forma de ojo. Solo se mueven los iris,
// unos pocos píxeles, con una transición suave (ver .ojo en home.css).
import { useEffect, useRef } from "react";

export default function RetratoOjos({ alt }) {
  const caja = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = caja.current;
    let visible = false;
    let pendiente = null;

    // Calcula hacia dónde mirar: -1 a 1 en horizontal y en vertical (0 = de frente)
    function mirar() {
      const { x, y } = pendiente;
      pendiente = null;
      const r = el.getBoundingClientRect();
      // Los ojos están a la altura del 29 % del retrato, un poco por encima del centro
      const dx = x - (r.left + r.width / 2);
      const dy = y - (r.top + r.height * 0.29);
      const distancia = Math.hypot(dx, dy) || 1;
      const fuerza = Math.min(1, distancia / 140); // en cuanto el ratón se aleja un poco, mira del todo hacia él
      el.style.setProperty("--ox", ((dx / distancia) * fuerza).toFixed(3));
      el.style.setProperty("--oy", ((dy / distancia) * fuerza).toFixed(3));
    }

    function alMover(e) {
      if (!visible) return;
      const vacio = pendiente === null;
      pendiente = { x: e.clientX, y: e.clientY };
      if (vacio) requestAnimationFrame(mirar);
    }

    // Solo escucha cuando el retrato está en pantalla
    const vigia = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    vigia.observe(el);
    window.addEventListener("pointermove", alMover, { passive: true }); // ratón (y dedo al arrastrar)
    window.addEventListener("pointerdown", alMover, { passive: true }); // toque en el móvil
    return () => {
      vigia.disconnect();
      window.removeEventListener("pointermove", alMover);
      window.removeEventListener("pointerdown", alMover);
    };
  }, []);

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
