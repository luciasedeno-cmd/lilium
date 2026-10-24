"use client";
// Reloj de la cuenta atrás: «FALTAN» y horas:minutos:segundos (como en el diseño).
// Las horas son el total que queda (con 5 días por delante se ve, por ejemplo, 131:50:26).
import { useEffect, useState } from "react";

const dosCifras = (n) => String(n).padStart(2, "0");

function texto(restante) {
  const s = Math.max(0, Math.floor(restante / 1000));
  return `${dosCifras(Math.floor(s / 3600))}:${dosCifras(Math.floor((s % 3600) / 60))}:${dosCifras(s % 60)}`;
}

export default function CuentaAtras({ apertura }) {
  const objetivo = new Date(apertura).getTime();
  // Primer pintado sin la hora del navegador para que servidor y cliente coincidan
  const [restante, setRestante] = useState(null);

  useEffect(() => {
    const actualizar = () => {
      const r = objetivo - Date.now();
      setRestante(r);
      if (r <= 0) window.location.replace("/acceso");
    };
    actualizar();
    const intervalo = setInterval(actualizar, 1000);
    return () => clearInterval(intervalo);
  }, [objetivo]);

  return (
    <div className="cuenta__reloj">
      <p className="cuenta__faltan">Faltan</p>
      <p className="cuenta__tiempo" role="timer" aria-live="off">{restante === null ? "00:00:00" : texto(restante)}</p>
    </div>
  );
}
