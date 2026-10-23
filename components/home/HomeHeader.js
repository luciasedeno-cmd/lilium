"use client";
// Header de la Home con menú desplegable en móvil
import { useState } from "react";
import Link from "next/link";

export default function HomeHeader() {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  return (
    <header className={`header${abierto ? " is-open" : ""}`}>
      <Link className="logo" href="/inicio" aria-label="Lilium, inicio">
        <img src="/assets/img/logo-lilium.png" alt="Lilium" />
      </Link>
      <button className="header__menu" type="button" aria-expanded={abierto} aria-controls="menu" onClick={() => setAbierto(!abierto)}>
        Menú
      </button>
      <nav className="header__nav" id="menu">
        <a href="#paraiso" onClick={cerrar}>El paraíso</a>
        <a href="#como-funciona" onClick={cerrar}>Cómo funciona</a>
        <a href="#faq" onClick={cerrar}>FaQ</a>
        <Link className="boton-reserva" href="/reserva/integrantes" onClick={cerrar}>Reserva ahora</Link>
      </nav>
    </header>
  );
}
