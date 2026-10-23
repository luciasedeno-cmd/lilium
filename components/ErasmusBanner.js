"use client";
// ERASMUS BANNER (Figma): pop-up que sale una vez al entrar en la web
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { guardarBorrador } from "@/lib/borrador";

const CLAVE = "lilium-erasmus-visto";
// En estas páginas no molesta: se llega desde un correo o se enseña en la puerta
const SIN_POPUP = ["/confirmar", "/entrada"];

export default function ErasmusBanner() {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dialogo = useRef(null);

  useEffect(() => {
    if (SIN_POPUP.some((p) => pathname.startsWith(p))) return;
    let visto = false;
    try {
      visto = sessionStorage.getItem(CLAVE) === "1";
      sessionStorage.setItem(CLAVE, "1");
    } catch {
      // Sin almacenamiento (modo privado): se muestra igualmente una vez por carga
    }
    if (!visto) {
      const t = setTimeout(() => setAbierto(true), 350);
      return () => clearTimeout(t);
    }
  }, []); // solo al entrar en la web

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
