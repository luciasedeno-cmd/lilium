// Cabecera de las páginas de acceso y reserva: el mismo logo y tamaño que la Home, y el selector ES / EN
import Link from "next/link";
import SelectorIdioma from "./SelectorIdioma";

export default function NavReserva() {
  return (
    <header className="nav-reserva">
      <Link className="logo" href="/inicio" aria-label="Lilium">
        <img src="/assets/img/logo-lilium.png" alt="Lilium" />
      </Link>
      <SelectorIdioma />
    </header>
  );
}
