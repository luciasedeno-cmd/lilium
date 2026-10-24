"use client";
// Animaciones de la Home al bajar por la página (no pinta nada: solo da vida a lo que ya hay).
//
// En el HTML se marcan los elementos con estos atributos:
//  · data-revelar="arriba | izquierda | derecha | escala | girar": aparece suavemente la primera vez
//    que entra en pantalla. Con style={{ "--retardo": "0.2s" }} se escalona (uno detrás de otro).
//  · data-parallax="0.3": se desplaza más despacio (número positivo, parece que está «al fondo») o más
//    deprisa (negativo, «más cerca») que el resto de la página. Es el efecto parallax.
//  · data-escala="0.9": va creciendo desde ese tamaño hasta su tamaño normal a medida que entra en pantalla
//    (con un número mayor que 1, por ejemplo 1.15, se va encogiendo hasta su tamaño).
//  · data-salida (en la portada): guarda en --salida cuánto se ha bajado (0 arriba, 1 al pasarla) para que
//    el título se aleje y se desvanezca.
//
// Para que no afecte al rendimiento:
//  · solo se mueven propiedades que el navegador anima sin redibujar la página (opacidad y desplazamientos);
//  · las posiciones se miden una vez (y al cambiar el tamaño), no en cada movimiento de la rueda;
//  · los cálculos se hacen como mucho una vez por fotograma y solo para lo que está cerca de la pantalla;
//  · quien tiene activado «reducir movimiento» en su ordenador o móvil no ve ninguna animación.
import { useEffect } from "react";

export default function Animaciones() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const raiz = document.documentElement;
    raiz.classList.add("anim");

    // 1) Aparecer al entrar en pantalla (una sola vez)
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            observador.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    document.querySelectorAll("[data-revelar]").forEach((el) => observador.observe(el));

    // 2) Parallax, escala y salida de la portada: se miden las posiciones y se actualizan al bajar
    const parallax = [...document.querySelectorAll("[data-parallax]")].map((el) => ({ el, f: parseFloat(el.dataset.parallax) || 0 }));
    const escalas = [...document.querySelectorAll("[data-escala]")].map((el) => ({ el, desde: parseFloat(el.dataset.escala) || 1 }));
    const salida = document.querySelector("[data-salida]");
    let alto = window.innerHeight;
    let suave = 1; // en el móvil el parallax es más suave

    function medir() {
      alto = window.innerHeight;
      suave = window.innerWidth <= 760 ? 0.5 : 1;
      const y = window.scrollY;
      for (const p of parallax) {
        p.el.style.translate = "";
        const r = p.el.getBoundingClientRect();
        p.centro = r.top + y + r.height / 2;
      }
      for (const s of escalas) {
        const r = s.el.getBoundingClientRect();
        // getBoundingClientRect ya incluye la escala actual: se corrige para tener la posición real
        const actual = parseFloat(s.el.style.scale) || 1;
        const h = r.height / actual;
        s.arriba = r.top + y + (r.height - h) / 2;
      }
      if (salida) salida.alto = salida.offsetHeight;
      pintar();
    }

    function pintar() {
      pendiente = false;
      const y = window.scrollY;
      const mitad = y + alto / 2;
      for (const p of parallax) {
        const d = p.centro - mitad;
        if (Math.abs(d) > alto * 1.5) continue; // lejos de la pantalla: no se toca
        p.el.style.translate = `0 ${(-d * p.f * suave).toFixed(1)}px`;
      }
      for (const s of escalas) {
        // 0 cuando asoma por abajo, 1 cuando su parte de arriba llega a la mitad de la pantalla
        const avance = Math.min(1, Math.max(0, (y + alto - s.arriba) / (alto / 2)));
        s.el.style.scale = (s.desde + (1 - s.desde) * avance).toFixed(4);
      }
      if (salida) salida.style.setProperty("--salida", Math.min(1, y / (salida.alto || alto)).toFixed(3));
    }

    let pendiente = false;
    const alBajar = () => {
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(pintar);
      }
    };

    medir();
    // Cuando cargan las imágenes o cambia el tamaño de la ventana, la página cambia de alto: se vuelve a medir
    const vigilante = new ResizeObserver(() => requestAnimationFrame(medir));
    vigilante.observe(document.body);
    window.addEventListener("scroll", alBajar, { passive: true });
    window.addEventListener("resize", medir);

    return () => {
      raiz.classList.remove("anim");
      observador.disconnect();
      vigilante.disconnect();
      window.removeEventListener("scroll", alBajar);
      window.removeEventListener("resize", medir);
    };
  }, []);

  return null;
}
