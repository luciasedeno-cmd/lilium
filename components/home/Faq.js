"use client";
// Preguntas frecuentes (acordeón: solo una abierta a la vez)
import { useState } from "react";

const PREGUNTAS = [
  ["¿Cuánto tiempo hay para confirmar?", "48 horas desde que se crea la reserva. Cada integrante confirma desde el enlace de su correo; os avisamos cuando queden 12 h."],
  ["¿Qué pasa si alguien no confirma?", "La reserva sigue adelante para las personas que hayan confirmado. Su plaza queda libre para otro grupo en formación."],
  ["¿Puedo cambiar de hora?", "Sí, desde «Mi reserva» mientras queden plazas libres en otro turno del mismo día."],
  ["¿Cómo cancelo?", "Desde «Mi reserva» o desde el enlace del correo de confirmación. Si eres líder, avisaremos al resto del grupo."],
  ["¿Entrada digital y entrada física?", "Recibirás una entrada digital con un QR en tu correo. No hace falta imprimirla: basta con enseñarla en la puerta."],
  ["¿Qué es el aviso de luces?", "Durante la experiencia hay cambios de luz y momentos de penumbra. Si alguien del grupo es sensible a ellos, avísanos antes."],
];

export default function Faq() {
  const [abierta, setAbierta] = useState(0);

  return (
    <section className="faq" id="faq">
      <div className="faq__bloque">
        <p className="faq__etiqueta"><img src="/assets/svg/punto.svg" width="7" height="7" alt="" />PREGUNTAS FRECUENTES</p>
        <h2 className="faq__titulo">LO QUE TODO EL MUNDO PREGUNTA</h2>

        <div className="faq__lista">
          {PREGUNTAS.map(([pregunta, respuesta], i) => (
            <div className={`faq__item${abierta === i ? " is-open" : ""}`} key={pregunta}>
              <div className="faq__caja">
                <button className="faq__pregunta" type="button" aria-expanded={abierta === i}
                  onClick={() => setAbierta(abierta === i ? null : i)}>
                  <span>{pregunta}</span><span className="faq__signo" aria-hidden="true">+</span>
                </button>
                <div className="faq__respuesta"><p>{respuesta}</p></div>
              </div>
              <img className="faq__linea" src="/assets/svg/linea.svg" width="478" height="1.2" alt="" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
