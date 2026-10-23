"use client";
// Preguntas frecuentes (acordeón: solo una abierta a la vez)
import { useState } from "react";
import { CONTACTO } from "@/lib/config";

const PREGUNTAS = [
  ["¿Cuánto dura?", "Una hora dentro de la sala. Llega 15 minutos antes, que hay una pequeña bienvenida."],
  ["¿Qué pasa si alguien de mi grupo no confirma?", "Tenéis 48 horas. Si al final confirmáis 3 o más, seguís adelante y las plazas sin confirmar se liberan. Si quedáis 1 o 2, pasáis a ser un grupo abierto y otras personas pueden completarlo."],
  ["¿Puedo cambiar de hora?", "Sí, desde el enlace que te llega al correo. El cambio es solo tuyo: el resto de tu grupo se queda en su hora."],
  ["¿Y si no puedo ir?", "Cancela desde tu enlace y tu plaza queda libre para otra persona. Si fuiste tú quien hizo la reserva, también puedes cancelar la del grupo entero."],
  ["¿Qué es eso que aparece al final de mi entrada?", "Cada persona recibe un fragmento distinto. Juntadlos antes del día y decidle al llegar a la guía lo que habéis descubierto. Merece la pena."],
  ["¿Hay entrada física?", "Una por grupo. Os la dan en la puerta cuando os escanean el QR. Guardadla bien, que la vais a necesitar."],
  ["El horario que quiero está lleno, ¿qué hago?", "Pulsa «Avísame si se libera una plaza». Si alguien la suelta, te escribimos."],
  ["¿Hay luces o efectos fuertes?", `Puede que sí. Antes de reservar verás un aviso con todo lo que tienes que saber. Si tienes alguna sensibilidad, escríbenos a ${CONTACTO}.`],
  ["¿Es de verdad un retiro espiritual?", "Hay cosas que es mejor vivirlas en persona."],
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
