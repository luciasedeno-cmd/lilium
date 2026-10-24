"use client";
// Header de la Home: se queda arriba al bajar, subraya el apartado que se está viendo
// y en el móvil tiene un menú desplegable (icono de tres rayas que se convierte en ✕)
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const ENLACES = [
  { id: "paraiso", texto: "El retiro" },
  { id: "como-funciona", texto: "Cómo funciona" },
  { id: "faq", texto: "FaQ" },
];

export default function HomeHeader() {
  const [abierto, setAbierto] = useState(false);
  const [bajado, setBajado] = useState(false); // ¿se ha bajado por la página? (para poner la sombra)
  const [activo, setActivo] = useState(null); // apartado que se está viendo ahora
  const cabecera = useRef(null);
  const cerrar = () => setAbierto(false);

  // Sombra al bajar y apartado activo
  useEffect(() => {
    const alBajar = () => setBajado(window.scrollY > 10);
    alBajar();
    window.addEventListener("scroll", alBajar, { passive: true });

    // Un apartado cuenta como «activo» cuando cruza la franja central de la pantalla
    const vigia = new IntersectionObserver(
      (entradas) => entradas.forEach((e) => e.isIntersecting && setActivo(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    ENLACES.forEach(({ id }) => {
      const seccion = document.getElementById(id);
      if (seccion) vigia.observe(seccion);
    });
    // Arriba del todo (en la portada) no hay ningún apartado activo
    const enPortada = () => window.scrollY < 200 && setActivo(null);
    window.addEventListener("scroll", enPortada, { passive: true });

    return () => {
      window.removeEventListener("scroll", alBajar);
      window.removeEventListener("scroll", enPortada);
      vigia.disconnect();
    };
  }, []);

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

  return (
    <header ref={cabecera} className={`header${abierto ? " is-open" : ""}${bajado ? " is-bajado" : ""}`}>
      <Link className="logo" href="/inicio" aria-label="Lilium, inicio" onClick={cerrar}>
        <img src="/assets/img/logo-lilium.png" alt="Lilium" />
      </Link>
      <button className="header__menu" type="button" aria-expanded={abierto} aria-controls="menu"
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"} onClick={() => setAbierto(!abierto)}>
        <span className="header__rayas" aria-hidden="true"><span /><span /><span /></span>
      </button>
      <nav className="header__nav" id="menu" aria-label="Apartados de la página">
        {ENLACES.map(({ id, texto }) => (
          <a key={id} href={`#${id}`} onClick={cerrar} className={activo === id ? "is-activo" : undefined}
            aria-current={activo === id ? "location" : undefined}>
            {texto}
          </a>
        ))}
        <Link className="boton-reserva" href="/reserva/integrantes" onClick={cerrar}>Reserva ahora</Link>
      </nav>
    </header>
  );
}
