"use client";
// Reloj de la cuenta atrás: «FALTAN» y días:horas:minutos:segundos, con el nombre debajo de cada número.
import { Fragment, useEffect, useState } from "react";

const dosCifras = (n) => String(n).padStart(2, "0");

function partes(restante) {
  const s = Math.max(0, Math.floor(restante / 1000));
  return [
    [dosCifras(Math.floor(s / 86400)), "días"],
    [dosCifras(Math.floor((s % 86400) / 3600)), "horas"],
    [dosCifras(Math.floor((s % 3600) / 60)), "min"],
    [dosCifras(s % 60), "seg"],
  ];
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

  const grupos = partes(restante === null ? 0 : restante);
  return (
    <div className="cuenta__reloj">
      <p className="cuenta__faltan">Faltan</p>
      <p className="cuenta__tiempo" role="timer" aria-live="off">
        {grupos.map(([numero, nombre], i) => (
          <Fragment key={nombre}>
            {i > 0 && <span className="cuenta__dos-puntos" aria-hidden="true">:</span>}
            <span className="cuenta__grupo">
              <span className="cuenta__numero">{numero}</span>
              <span className="cuenta__unidad">{nombre}</span>
            </span>
          </Fragment>
        ))}
      </p>
    </div>
  );
}
