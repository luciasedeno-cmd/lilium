"use client";
// Reloj de la cuenta atrás: «FALTAN» y días:horas:minutos:segundos, con el nombre debajo de cada número.
import { Fragment, useEffect, useState } from "react";
import { useIdioma } from "./Idioma";

const UNIDADES = { es: ["días", "horas", "min", "seg"], en: ["days", "hours", "min", "sec"] };

const dosCifras = (n) => String(n).padStart(2, "0");

function partes(restante, nombres) {
  const s = Math.max(0, Math.floor(restante / 1000));
  return [
    [dosCifras(Math.floor(s / 86400)), nombres[0]],
    [dosCifras(Math.floor((s % 86400) / 3600)), nombres[1]],
    [dosCifras(Math.floor((s % 3600) / 60)), nombres[2]],
    [dosCifras(s % 60), nombres[3]],
  ];
}

export default function CuentaAtras({ apertura, ahoraServidor }) {
  const objetivo = new Date(apertura).getTime();
  // Diferencia entre el reloj de este dispositivo y el del servidor (se calcula una vez al cargar)
  const [desfase] = useState(() => (ahoraServidor ? ahoraServidor - Date.now() : 0));
  // Primer pintado sin la hora del navegador para que servidor y cliente coincidan
  const [restante, setRestante] = useState(null);

  useEffect(() => {
    const actualizar = () => {
      const r = objetivo - (Date.now() + desfase);
      setRestante(r);
      if (r <= 0) window.location.replace("/acceso");
    };
    actualizar();
    const intervalo = setInterval(actualizar, 1000);
    return () => clearInterval(intervalo);
  }, [objetivo, desfase]);

  const { idioma } = useIdioma();
  const grupos = partes(restante === null ? 0 : restante, UNIDADES[idioma]);
  return (
    <div className="cuenta__reloj">
      <p className="cuenta__faltan">{idioma === "en" ? "Opens in" : "Faltan"}</p>
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
