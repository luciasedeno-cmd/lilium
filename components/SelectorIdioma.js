"use client";
// Botones ES / EN (en la cabecera de la Home y de las páginas de reserva)
import { useIdioma } from "./Idioma";

export default function SelectorIdioma() {
  const { idioma, cambiar } = useIdioma();
  return (
    <div className="idioma" role="group" aria-label={idioma === "en" ? "Language" : "Idioma"}>
      <button type="button" aria-pressed={idioma === "es"} lang="es" onClick={() => cambiar("es")}>ES</button>
      <button type="button" aria-pressed={idioma === "en"} lang="en" onClick={() => cambiar("en")}>EN</button>
    </div>
  );
}
