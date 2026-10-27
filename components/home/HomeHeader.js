"use client";
// Barra de navegación de TODA la web (Home, acceso, reserva, mi reserva, términos…).
// - Va SIEMPRE por encima de la página (la primera sección empieza debajo de ella, desde arriba del todo).
// - 100 % transparente mientras está sobre la sección principal (la marcada con data-principal, o el
//   principio de la página); al pasarla, se vuelve un cristal de color con un leve desenfoque.
// - Detecta si lo que hay detrás es oscuro o claro y cambia el color del texto para que siempre se lea.
// - Se esconde al bajar por la página y vuelve a aparecer al subir.
// - En la Home subraya el apartado que se está viendo; en el móvil tiene un menú desplegable (☰ → ✕).
// - En la Home, el logo de Lilium sube la página hasta arriba con una animación suave (en el resto de páginas lleva a la Home).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SelectorIdioma from "@/components/SelectorIdioma";
import { useTextos } from "@/components/Idioma";

const ENLACES = ["paraiso", "como-funciona", "faq"];

const TEXTOS = {
  es: { paraiso: "El retiro", "como-funciona": "Cómo funciona", faq: "FaQ", reservar: "Reserva ahora", abrir: "Abrir menú", cerrar: "Cerrar menú", apartados: "Apartados de la página", inicio: "Lilium, inicio" },
  en: { paraiso: "The retreat", "como-funciona": "How it works", faq: "FAQ", reservar: "Book now", abrir: "Open menu", cerrar: "Close menu", apartados: "Page sections", inicio: "Lilium, home" },
};

/** Lee un color de CSS («rgb(…)», «rgba(…)» o «color(srgb …)») → [r, g, b, opacidad] de 0 a 1 */
function leerColor(texto) {
  const n = (texto.match(/[\d.]+/g) || []).map(Number);
  if (texto.startsWith("color(")) return [n[0], n[1], n[2], n[3] ?? 1];
  return [n[0] / 255, n[1] / 255, n[2] / 255, n[3] ?? 1];
}

/**
 * ¿Lo que hay justo debajo de la barra es oscuro? Mira el elemento de esa zona y sube por sus «padres»
 * hasta encontrar un fondo: una sección marcada con data-fondo="oscuro|claro" o un color de fondo.
 */
function fondoOscuro(barra) {
  const y = barra.getBoundingClientRect().height / 2;
  const debajo = document.elementsFromPoint(window.innerWidth / 2, y).find((el) => !barra.contains(el));
  for (let el = debajo; el && el !== document.documentElement; el = el.parentElement) {
    if (el.dataset?.fondo) return el.dataset.fondo === "oscuro";
    const [r, g, b, a] = leerColor(getComputedStyle(el).backgroundColor);
    if (a > 0.5) return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5; // brillo del color
  }
  return false;
}

/**
 * Sube la página hasta arriba poco a poco: empieza despacio, acelera y frena al llegar.
 * Tarda más cuanto más abajo se esté (entre 0,7 y 1,6 s). Si la persona mueve la rueda o toca la
 * pantalla mientras tanto, se para (para no «pelearse» con ella). Sin animación si pide «reducir movimiento».
 */
function subirArriba() {
  const desde = window.scrollY;
  if (desde <= 0) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return window.scrollTo({ top: 0, behavior: "instant" });
  const duracion = Math.min(1600, Math.max(700, desde / 4));
  const inicio = performance.now();
  let parado = false;
  const parar = () => (parado = true);
  const quitar = () => ["wheel", "touchstart", "keydown"].forEach((ev) => window.removeEventListener(ev, parar));
  ["wheel", "touchstart", "keydown"].forEach((ev) => window.addEventListener(ev, parar, { passive: true }));
  function paso(ahora) {
    if (parado) return quitar();
    const f = Math.min(1, (ahora - inicio) / duracion);
    const suave = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2; // acelera y frena
    // «instant»: la suavidad la pone esta animación (la página tiene scroll-behavior: smooth, que se pelearía con ella)
    window.scrollTo({ top: Math.round(desde * (1 - suave)), behavior: "instant" });
    if (f < 1) requestAnimationFrame(paso);
    else quitar();
  }
  requestAnimationFrame(paso);
}

export default function HomeHeader() {
  const enHome = usePathname() === "/inicio";
  const [abierto, setAbierto] = useState(false);
  const [oculta, setOculta] = useState(false); // escondida al bajar
  const [oscuro, setOscuro] = useState(false); // ¿fondo oscuro detrás?
  const [transparente, setTransparente] = useState(true); // ¿sobre la sección principal?
  const [activo, setActivo] = useState(null); // apartado de la Home que se está viendo
  const cabecera = useRef(null);
  const cerrar = () => setAbierto(false);
  const t = useTextos(TEXTOS);

  // Al bajar se esconde, al subir aparece; y se revisa el fondo de detrás
  useEffect(() => {
    let anterior = window.scrollY;
    let pendiente = false;
    function revisar() {
      pendiente = false;
      const y = window.scrollY;
      if (y < 80) setOculta(false);
      else if (y > anterior + 6) setOculta(true);
      else if (y < anterior - 6) setOculta(false);
      anterior = y;
      if (!cabecera.current) return;
      setOscuro(fondoOscuro(cabecera.current));
      // Transparente hasta que el final de la sección principal pasa por debajo de la barra
      const principal = document.querySelector("[data-principal]");
      const alto = cabecera.current.offsetHeight;
      setTransparente(principal ? principal.getBoundingClientRect().bottom > alto : y < 10);
    }
    const alMover = () => {
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(revisar);
      }
    };
    revisar();
    window.addEventListener("scroll", alMover, { passive: true });
    window.addEventListener("resize", alMover);
    const otraVez = setTimeout(revisar, 600); // cuando ya han cargado las imágenes
    return () => {
      window.removeEventListener("scroll", alMover);
      window.removeEventListener("resize", alMover);
      clearTimeout(otraVez);
    };
  }, []);

  // Apartado activo (solo en la Home): el que cruza la franja central de la pantalla
  useEffect(() => {
    if (!enHome) return;
    const vigia = new IntersectionObserver(
      (entradas) => entradas.forEach((e) => e.isIntersecting && setActivo(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    ENLACES.forEach((id) => {
      const seccion = document.getElementById(id);
      if (seccion) vigia.observe(seccion);
    });
    const enPortada = () => window.scrollY < 200 && setActivo(null);
    window.addEventListener("scroll", enPortada, { passive: true });
    return () => {
      vigia.disconnect();
      window.removeEventListener("scroll", enPortada);
    };
  }, [enHome]);

  // Al llegar a la Home desde otra página con un apartado en el enlace (p. ej. «/inicio#faq» desde
  // «Mi reserva»): el navegador salta al apartado antes de que la página termine de colocarse (las
  // secciones animadas crecen después), y se quedaba a medio camino. Se vuelve a colocar unas cuantas
  // veces mientras se asienta, salvo que la persona ya esté moviendo la página.
  useEffect(() => {
    if (!enHome || !window.location.hash) return;
    const destino = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (!destino) return;
    let movida = false;
    const parar = () => (movida = true);
    const eventos = ["wheel", "touchstart", "keydown"];
    eventos.forEach((ev) => window.addEventListener(ev, parar, { passive: true }));
    const colocar = () => !movida && destino.scrollIntoView({ behavior: "instant", block: "start" });
    const relojes = [0, 150, 400, 900, 1600, 2500].map((ms) => setTimeout(colocar, ms));
    return () => {
      relojes.forEach(clearTimeout);
      eventos.forEach((ev) => window.removeEventListener(ev, parar));
    };
  }, [enHome]);

  // Menú del móvil: se cierra con la tecla Esc o tocando fuera
  useEffect(() => {
    if (!abierto) return;
    const conTecla = (e) => e.key === "Escape" && setAbierto(false);
    const conToque = (e) => !cabecera.current?.contains(e.target) && setAbierto(false);
    document.addEventListener("keydown", conTecla);
    document.addEventListener("pointerdown", conToque);
    return () => {
      document.removeEventListener("keydown", conTecla);
      document.removeEventListener("pointerdown", conToque);
    };
  }, [abierto]);

  const clases = ["header", abierto && "is-open", oculta && !abierto && "is-oculta", oscuro && !abierto && "is-oscuro",
    transparente && !abierto && "is-transparente"].filter(Boolean).join(" ");

  return (
    <header ref={cabecera} className={clases}>
        <Link className="logo" href="/inicio" aria-label={t.inicio} onClick={(e) => {
          cerrar();
          // Ya en la Home: en vez de recargar, sube hasta arriba con la animación
          if (enHome) {
            e.preventDefault();
            subirArriba();
          }
        }}>
          <img src="/assets/img/logo-lilium.webp" alt="Lilium" />
        </Link>
        <button className="header__menu" type="button" aria-expanded={abierto} aria-controls="menu"
          aria-label={abierto ? t.cerrar : t.abrir} onClick={() => setAbierto(!abierto)}>
          <span className="header__rayas" aria-hidden="true"><span /><span /><span /></span>
        </button>
        <nav className="header__nav" id="menu" aria-label={t.apartados}>
          {ENLACES.map((id) => (
            <a key={id} href={enHome ? `#${id}` : `/inicio#${id}`} onClick={cerrar} className={activo === id ? "is-activo" : undefined}
              aria-current={activo === id ? "location" : undefined}>
              {t[id]}
            </a>
          ))}
          <Link className="boton-reserva" href="/reserva/integrantes" onClick={cerrar}>{t.reservar}</Link>
          <SelectorIdioma />
        </nav>
    </header>
  );
}
