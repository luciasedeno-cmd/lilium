"use client";
// POP-UP DE LA HOME (mismo diseño que el antiguo «Erasmus student?» del Figma): ahora anuncia el nuevo pase.
// «¿Te quedaste sin ir al escape? No te preocupes: hay un nuevo pase el lunes 9 de noviembre» + botón para
// apuntarse. Sale solo en /inicio y solo la primera vez en ese navegador.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTextos } from "./Idioma";

// Se guarda en el navegador (localStorage, como una nota que se queda en ese ordenador o móvil)
// para no volver a enseñarlo aunque se cierre la web y se vuelva otro día.
// (Clave nueva: así lo ve también quien ya había visto el pop-up de Erasmus.)
const CLAVE = "lilium-pase-9-visto";

const TEXTOS = {
  es: {
    titulo: "¿Te quedaste sin ir al escape?",
    texto: "No te preocupes: hay un nuevo pase disponible este lunes 9 de noviembre. Pueden venir tanto el alumnado como el profesorado.",
    apuntarme: "Apuntarme al lunes 9",
    ahoraNo: "Ahora no",
    cerrar: "Cerrar",
  },
  en: {
    titulo: "Missed the escape room?",
    texto: "Don't worry: there's a new session available this Monday, 9 November. Students and teaching staff are all welcome.",
    apuntarme: "Sign me up for Monday 9",
    ahoraNo: "Not now",
    cerrar: "Close",
  },
};

export default function ErasmusBanner() {
  const [abierto, setAbierto] = useState(false);
  const router = useRouter();
  const dialogo = useRef(null);
  const t = useTextos(TEXTOS);

  useEffect(() => {
    let visto = false;
    try {
      visto = localStorage.getItem(CLAVE) === "1";
    } catch {
      // Sin almacenamiento (modo privado): se muestra igualmente una vez por carga
    }
    if (!visto) {
      // Se apunta como «visto» justo cuando se abre (no antes: si no, a veces no llegaba a salir)
      const espera = setTimeout(() => {
        setAbierto(true);
        try { localStorage.setItem(CLAVE, "1"); } catch {}
      }, 350);
      return () => clearTimeout(espera);
    }
  }, []); // solo al abrir la página de inicio

  useEffect(() => {
    if (!abierto) return;
    dialogo.current?.querySelector("[data-autofocus]")?.focus();
    const alPulsar = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [abierto]);

  if (!abierto) return null;

  const apuntarme = () => {
    setAbierto(false);
    router.push("/reserva/integrantes");
  };

  return (
    <div className="erasmus-pop" onClick={(e) => e.target === e.currentTarget && setAbierto(false)}>
      <div className="erasmus-pop__caja" role="dialog" aria-modal="true" aria-labelledby="erasmus-pop-titulo" ref={dialogo}>
        <button className="erasmus-pop__cerrar" type="button" aria-label={t.cerrar} onClick={() => setAbierto(false)}>×</button>
        <h2 id="erasmus-pop-titulo">{t.titulo}</h2>
        <p>{t.texto}</p>
        <div className="erasmus-pop__botones">
          <button type="button" className="erasmus-pop__boton is-lleno" onClick={apuntarme} data-autofocus>
            {t.apuntarme}
          </button>
          <button type="button" className="erasmus-pop__boton" onClick={() => setAbierto(false)}>
            {t.ahoraNo}
          </button>
        </div>
      </div>
    </div>
  );
}
