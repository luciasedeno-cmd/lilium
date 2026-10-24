"use client";
// «¿Cómo reservar?» + los pasos: al bajar por la página, el fondo pasa poco a poco de crema a terracota
// y el texto de terracota a crema, hasta formar una sola sección con los pasos.
// Se calcula un número de 0 (aún crema) a 1 (ya terracota) según dónde está la sección en la pantalla.
import { useEffect, useRef } from "react";
import { useTextos } from "@/components/Idioma";

const TEXTOS = {
  es: { titulo: "¿Cómo reservar?", subtitulo: "Cinco sencillos pasos para completar la inscripción" },
  en: { titulo: "How to book?", subtitulo: "Five simple steps to complete your registration" },
};

export default function ComoReservar({ children }) {
  const t = useTextos(TEXTOS);
  const bloque = useRef(null);

  useEffect(() => {
    let pendiente = false;
    function actualizar() {
      pendiente = false;
      const arriba = bloque.current.getBoundingClientRect().top / window.innerHeight;
      // Empieza cuando la sección está al 70 % de la pantalla y termina al llegar al 30 %
      const p = Math.min(1, Math.max(0, (0.7 - arriba) / 0.4));
      bloque.current.style.setProperty("--p", p.toFixed(3));
      // El texto cambia más tarde y más rápido que el fondo, para que siempre se lea bien
      bloque.current.style.setProperty("--pt", Math.min(1, Math.max(0, (p - 0.4) / 0.2)).toFixed(3));
    }
    const alBajar = () => {
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(actualizar);
      }
    };
    actualizar();
    window.addEventListener("scroll", alBajar, { passive: true });
    window.addEventListener("resize", alBajar);
    return () => {
      window.removeEventListener("scroll", alBajar);
      window.removeEventListener("resize", alBajar);
    };
  }, []);

  return (
    <div className="como-bloque" ref={bloque}>
      <section className="como-reservar" id="como-funciona">
        <h2 className="como-reservar__titulo">{t.titulo}</h2>
        <p className="como-reservar__subtitulo">{t.subtitulo}</p>
      </section>
      {children}
    </div>
  );
}
