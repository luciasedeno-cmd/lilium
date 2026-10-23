"use client";
// Cabecera de las páginas de acceso y reserva: logo + selector de idioma
import { useState } from "react";
import Link from "next/link";

export default function NavReserva() {
  const [idioma, setIdioma] = useState("es");
  const cambiar = (valor) => {
    setIdioma(valor);
    document.documentElement.lang = valor;
  };
  return (
    <header className="nav-reserva">
      <Link className="logo" href="/inicio" aria-label="Lilium, inicio">
        <img src="/assets/img/logo-lilium.png" alt="Lilium" />
      </Link>
      <div className="idioma" role="group" aria-label="Idioma">
        <button type="button" aria-pressed={idioma === "es"} onClick={() => cambiar("es")}>ES</button>
        <button type="button" aria-pressed={idioma === "en"} onClick={() => cambiar("en")}>EN</button>
      </div>
    </header>
  );
}
