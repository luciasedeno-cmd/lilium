"use client";
// Pantalla de espera de las páginas de reserva: «Cargando…» o, si algo ha fallado, el motivo
import NavReserva from "./NavReserva";
import { useIdioma } from "./Idioma";

export default function Cargando({ error, texto }) {
  const { idioma } = useIdioma();
  return (
    <>
      <NavReserva />
      <main>
        <div className="columna">
          {error ? (
            <p className="aviso-error" role="alert">{error}</p>
          ) : (
            <p className="cargando" role="status">{texto || (idioma === "en" ? "Loading…" : "Cargando…")}</p>
          )}
        </div>
      </main>
    </>
  );
}
