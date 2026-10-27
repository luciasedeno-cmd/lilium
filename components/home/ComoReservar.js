"use client";
// «¿Cómo reservar?» + los pasos: al bajar por la página, el fondo pasa poco a poco de crema a terracota
// y el texto de terracota a crema, hasta formar una sola sección con los pasos.
// Se calcula un número de 0 (aún crema) a 1 (ya terracota) según dónde está la sección en la pantalla.
import { useEffect, useRef } from "react";
import { useTextos } from "@/components/Idioma";

const TEXTOS = {
  es: { titulo: "¿Cómo reservar?", subtitulo: "Cinco sencillos pasos para completar la inscripción" },
  en: { titulo: "How do I book?", subtitulo: "Five simple steps to complete your registration" },
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
      // Se guarda en la raíz de la página para que también lo use el encaje de la sección de arriba
      const raiz = document.documentElement.style;
      raiz.setProperty("--p", p.toFixed(3));
      // El texto cambia más tarde y más rápido que el fondo, para que siempre se lea bien
      raiz.setProperty("--pt", Math.min(1, Math.max(0, (p - 0.4) / 0.2)).toFixed(3));
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
      document.documentElement.style.removeProperty("--p");
      document.documentElement.style.removeProperty("--pt");
      window.removeEventListener("scroll", alBajar);
      window.removeEventListener("resize", alBajar);
    };
  }, []);

  return (
    // El bloque es muy alto (una pantalla por paso) y dentro todo se queda fijo en la pantalla
    // mientras se baja: al bajar, los pasos se desplazan de lado (ver CarruselPasos).
    <div className="como-bloque" ref={bloque}>
      <div className="como-fijo">
        <section className="como-reservar" id="como-funciona">
          <h2 className="como-reservar__titulo" data-revelar="escala">{t.titulo}</h2>
          <p className="como-reservar__subtitulo" data-revelar="arriba" style={{ "--retardo": "0.15s" }}>{t.subtitulo}</p>
        </section>
        {children}
      </div>
    </div>
  );
}
