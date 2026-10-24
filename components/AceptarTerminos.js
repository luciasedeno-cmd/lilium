"use client";
// Casilla «He leído y acepto los Términos y Condiciones» (obligatoria para reservar o confirmar la plaza)
import { useIdioma } from "./Idioma";

export default function AceptarTerminos({ aceptado, onCambiar }) {
  const { idioma } = useIdioma();
  return (
    <label className="aceptar-terminos">
      <input type="checkbox" checked={aceptado} onChange={(e) => onCambiar(e.target.checked)} />
      {idioma === "en" ? (
        <span>
          I have read and accept the{" "}
          <a href="/terminos" target="_blank" rel="noopener">Terms and Conditions</a>,
          including the lights and effects warning.
        </span>
      ) : (
        <span>
          He leído y acepto los{" "}
          <a href="/terminos" target="_blank" rel="noopener">Términos y Condiciones</a>,
          incluido el aviso de luces y efectos.
        </span>
      )}
    </label>
  );
}
