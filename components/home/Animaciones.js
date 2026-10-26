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
//  · data-subir (en los encajes de unión entre secciones): guarda en --sub de 0 a 1 cuánto ha entrado en
//    pantalla el borde entre las dos secciones, para que el encaje «suba» y tape el corte poco a poco.
//
// Ojo: lo que ya ha aparecido se marca con el atributo data-visible (no con una clase), porque React
// rehace las clases cuando algo cambia (por ejemplo, al abrir una pregunta) y la marca se perdería.
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
    // Móviles antiguos sin estas herramientas: sin animaciones, pero todo visible y en su sitio
    if (!("IntersectionObserver" in window) || !("ResizeObserver" in window)) return;
    const raiz = document.documentElement;

    // 1) Aparecer al entrar en pantalla (una sola vez)
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            e.target.setAttribute("data-visible", "");
            observador.unobserve(e.target);
          }
        }
      },
      { threshold: 0.05 }
    );
    document.querySelectorAll("[data-revelar]").forEach((el) => observador.observe(el));
    // Si aparecen elementos nuevos (por ejemplo, al cambiar de idioma se vuelven a crear los textos),
    // también se vigilan; si no, se quedarían invisibles
    const nuevos = new MutationObserver((cambios) => {
      for (const c of cambios) {
        for (const nodo of c.addedNodes) {
          if (nodo.nodeType !== 1) continue;
          if (nodo.matches("[data-revelar]:not([data-visible])")) observador.observe(nodo);
          nodo.querySelectorAll?.("[data-revelar]:not([data-visible])").forEach((el) => observador.observe(el));
        }
      }
    });
    nuevos.observe(document.body, { childList: true, subtree: true });

    // 2) Parallax, escala y salida de la portada: se miden las posiciones y se actualizan al bajar
    const parallax = [...document.querySelectorAll("[data-parallax]")].map((el) => ({ el, f: parseFloat(el.dataset.parallax) || 0 }));
    const escalas = [...document.querySelectorAll("[data-escala]")].map((el) => ({ el, desde: parseFloat(el.dataset.escala) || 1 }));
    const salida = document.querySelector("[data-salida]");
    const uniones = [...document.querySelectorAll("[data-subir]")].map((el) => ({ el }));
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
      for (const u of uniones) {
        u.el.style.setProperty("--sub", "1");
        // El dibujo del encaje deja 33 px vacíos abajo: el borde real entre secciones está ahí
        u.borde = u.el.getBoundingClientRect().bottom + y - 33;
      }
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
      for (const u of uniones) {
        // 0 cuando el borde asoma por abajo de la pantalla; 1 cuando ya ha subido casi media pantalla
        const sub = Math.min(1, Math.max(0, (y + alto - u.borde) / (alto * 0.45)));
        u.el.style.setProperty("--sub", sub.toFixed(3));
      }
    }

    let pendiente = false;
    const alBajar = () => {
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(pintar);
      }
    };

    medir();
    // Solo ahora (cuando todo está preparado) se esconden los elementos que van a aparecer
    raiz.classList.add("anim");
    // Cuando cargan las imágenes o cambia el tamaño de la ventana, la página cambia de alto: se vuelve a medir
    const vigilante = new ResizeObserver(() => requestAnimationFrame(medir));
    vigilante.observe(document.body);
    window.addEventListener("scroll", alBajar, { passive: true });
    window.addEventListener("resize", medir);

    return () => {
      raiz.classList.remove("anim");
      observador.disconnect();
      nuevos.disconnect();
      vigilante.disconnect();
      window.removeEventListener("scroll", alBajar);
      window.removeEventListener("resize", medir);
    };
  }, []);

  return null;
}
