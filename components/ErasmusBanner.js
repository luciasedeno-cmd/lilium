"use client";
// ERASMUS BANNER (Figma): pop-up que sale solo la primera vez que se entra en la página de inicio (/inicio)
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { guardarBorrador } from "@/lib/borrador";

// Se guarda en el navegador (localStorage, como una nota que se queda en ese ordenador o móvil)
// para no volver a enseñarlo aunque se cierre la web y se vuelva otro día
const CLAVE = "lilium-erasmus-visto";

export default function ErasmusBanner() {
  const [abierto, setAbierto] = useState(false);
  const router = useRouter();
  const dialogo = useRef(null);

  useEffect(() => {
    let visto = false;
    try {
      visto = localStorage.getItem(CLAVE) === "1";
      localStorage.setItem(CLAVE, "1");
    } catch {
      // Sin almacenamiento (modo privado): se muestra igualmente una vez por carga
    }
    if (!visto) {
      const t = setTimeout(() => setAbierto(true), 350);
      return () => clearTimeout(t);
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

  const verTurnos = () => {
    guardarBorrador({ soloErasmus: true });
    setAbierto(false);
    router.push("/reserva/integrantes");
  };

  return (
    <div className="erasmus-pop" onClick={(e) => e.target === e.currentTarget && setAbierto(false)}>
      <div className="erasmus-pop__caja" role="dialog" aria-modal="true" aria-labelledby="erasmus-pop-titulo" lang="en" ref={dialogo}>
        <button className="erasmus-pop__cerrar" type="button" aria-label="Close" onClick={() => setAbierto(false)}>×</button>
        <h2 id="erasmus-pop-titulo">Erasmus student?</h2>
        <p>Some sessions are just for Erasmus students, with guides who speak English. Coming alone? We’ll put you in a group!</p>
        <div className="erasmus-pop__botones">
          <button type="button" className="erasmus-pop__boton is-lleno" onClick={() => { document.documentElement.lang = "en"; setAbierto(false); }}>
            Switch to English
          </button>
          <button type="button" className="erasmus-pop__boton" onClick={verTurnos} data-autofocus>
            See Erasmus turns
          </button>
        </div>
      </div>
    </div>
  );
}
