"use client";
// Pop-up del paso 3 cuando otro grupo ocupa el turno elegido mientras se revisaba la reserva:
// explica lo que ha pasado y propone el turno con sitio más cercano en el tiempo (lib/turnos.js → turnoCercano).
// «Cambiar a este turno» lo pone en la reserva (hay que volver a pulsar «Confirmar reserva»);
// «Ver todos los turnos» vuelve al paso 2. Misma estética que el pop-up «Antes de irte…» (.pop-confirmar).
import { useEffect, useRef } from "react";
import { useTextos } from "./Idioma";
import { MAX_PERSONAS, MIN_SALA_NUEVA } from "@/lib/config";

const TEXTOS = {
  es: {
    titulo: "Este turno ya no está disponible",
    texto: (p) => `Lo sentimos: mientras revisabais la reserva, otro grupo ha ocupado el turno de las ${p.inicio}–${p.fin} y ya no queda sitio para todo vuestro grupo.`,
    textoVacio: (p) => `Lo sentimos: el grupo al que ibais a uniros a las ${p.inicio}–${p.fin} ha anulado su reserva y, para abrir una sala libre, hacen falta al menos ${MIN_SALA_NUEVA} personas.`,
    propuesta: "Os proponemos el turno con sitio más cercano:",
    libre: "Sala libre para vosotros",
    plazas: (n) => `${n} de ${MAX_PERSONAS} plazas libres · compartiréis sala`,
    erasmus: "Solo Erasmus",
    cambiar: "Cambiar a este turno",
    nota: "Aún no está reservado: revisad los datos y pulsad «Confirmar reserva».",
    ninguno: "Ahora mismo no queda ningún turno con sitio para todo vuestro grupo. En la lista de turnos podéis pulsar «Avísame si se libera una plaza» y os escribiremos si queda alguna libre.",
    verTodos: "Ver todos los turnos",
    cerrar: "Cerrar",
  },
  en: {
    titulo: "This session is no longer available",
    texto: (p) => `We're sorry: while you were reviewing your booking, another group took the ${p.inicio}–${p.fin} session and there's no longer room for your whole group.`,
    textoVacio: (p) => `We're sorry: the group you were joining at ${p.inicio}–${p.fin} has cancelled, and opening an empty room needs at least ${MIN_SALA_NUEVA} people.`,
    propuesta: "Here's the closest session with room for you:",
    libre: "Empty room, all yours",
    plazas: (n) => `${n} of ${MAX_PERSONAS} places free · you'll share the room`,
    erasmus: "Erasmus only",
    cambiar: "Switch to this session",
    nota: "It isn't booked yet: check the details and press “Confirm booking”.",
    ninguno: "Right now there's no session with room for your whole group. In the list of sessions you can press “Let me know if a place frees up” and we'll email you if one does.",
    verTodos: "See all sessions",
    cerrar: "Close",
  },
};

export default function TurnoPerdido({ perdido, alternativa, motivo, onCambiar, onVerTodos }) {
  const t = useTextos(TEXTOS);
  const boton = useRef(null);

  useEffect(() => {
    boton.current?.focus();
    const conTecla = (e) => e.key === "Escape" && onVerTodos();
    document.addEventListener("keydown", conTecla);
    return () => document.removeEventListener("keydown", conTecla);
  }, [onVerTodos]);

  return (
    <div className="pop-confirmar">
      <div className="pop-confirmar__caja pop-perdido" role="alertdialog" aria-modal="true" aria-labelledby="pop-perdido-titulo" aria-describedby="pop-perdido-texto">
        <img className="pop-confirmar__lirio" src="/assets/img/icono-lirio.webp" width="99" height="79" alt="" />
        <h2 id="pop-perdido-titulo" className="pop-confirmar__titulo">{t.titulo}</h2>
        <p id="pop-perdido-texto" className="pop-confirmar__texto">{motivo === "vacio" ? t.textoVacio(perdido) : t.texto(perdido)}</p>

        {alternativa ? (
          <>
            <p className="pop-perdido__propuesta">{t.propuesta}</p>
            {/* El turno propuesto, como una tarjeta */}
            <div className="pop-perdido__turno">
              <p className="pop-perdido__hora">{alternativa.inicio}–{alternativa.fin}</p>
              <p className="pop-perdido__estado">
                {alternativa.ocupadas === 0 ? t.libre : t.plazas(alternativa.hueco)}
                {alternativa.erasmus && <> · {t.erasmus}</>}
              </p>
              {alternativa.equipo && <p className="pop-perdido__equipo">“{alternativa.equipo}”</p>}
            </div>
            <div className="pop-perdido__botones">
              <button ref={boton} type="button" className="pop-confirmar__boton" onClick={() => onCambiar(alternativa)}>{t.cambiar}</button>
              <button type="button" className="pop-perdido__secundario" onClick={onVerTodos}>{t.verTodos}</button>
            </div>
            <p className="pop-perdido__nota">{t.nota}</p>
          </>
        ) : (
          <>
            <p className="pop-confirmar__texto">{t.ninguno}</p>
            <button ref={boton} type="button" className="pop-confirmar__boton" onClick={onVerTodos}>{t.verTodos}</button>
          </>
        )}
      </div>
    </div>
  );
}
