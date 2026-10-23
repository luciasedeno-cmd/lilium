"use client";
// Reloj de la cuenta atrás (días, horas, minutos, segundos)
import { useEffect, useState } from "react";

const dosCifras = (n) => String(n).padStart(2, "0");

function partes(restante) {
  const s = Math.max(0, Math.floor(restante / 1000));
  return {
    dias: dosCifras(Math.floor(s / 86400)),
    horas: dosCifras(Math.floor((s % 86400) / 3600)),
    minutos: dosCifras(Math.floor((s % 3600) / 60)),
    segundos: dosCifras(s % 60),
  };
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

  const t = restante === null ? { dias: "00", horas: "00", minutos: "00", segundos: "00" } : partes(restante);
  return (
    <div className="cuenta__reloj" role="timer" aria-live="off">
      <div className="cuenta__bloque"><span className="cuenta__numero">{t.dias}</span><span className="cuenta__unidad">Días</span></div>
      <div className="cuenta__bloque"><span className="cuenta__numero">{t.horas}</span><span className="cuenta__unidad">Horas</span></div>
      <div className="cuenta__bloque"><span className="cuenta__numero">{t.minutos}</span><span className="cuenta__unidad">Minutos</span></div>
      <div className="cuenta__bloque"><span className="cuenta__numero">{t.segundos}</span><span className="cuenta__unidad">Segundos</span></div>
    </div>
  );
}
