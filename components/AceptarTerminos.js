"use client";
// Casilla «He leído y acepto los Términos y Condiciones» (obligatoria para reservar o confirmar la plaza)
export default function AceptarTerminos({ aceptado, onCambiar }) {
  return (
    <label className="aceptar-terminos">
      <input type="checkbox" checked={aceptado} onChange={(e) => onCambiar(e.target.checked)} />
      <span>
        He leído y acepto los{" "}
        <a href="/terminos" target="_blank" rel="noopener">Términos y Condiciones</a>,
        incluido el aviso de luces y efectos.
      </span>
    </label>
  );
}
