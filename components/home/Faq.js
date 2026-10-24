"use client";
// Preguntas frecuentes (acordeón: al principio todas cerradas; solo una abierta a la vez)
import { useState } from "react";
import { CONTACTO } from "@/lib/config";
import { useIdioma } from "@/components/Idioma";

const PREGUNTAS = {
  es: [
    ["¿Cuánto dura?", "45 minutos dentro de la sala. Llega 15 minutos antes, que hay una pequeña bienvenida."],
    ["¿Qué pasa si alguien de mi grupo no confirma?", "Tenéis 48 horas. Si al final confirmáis 3 o más, seguís adelante y las plazas sin confirmar se liberan. Si quedáis 1 o 2, pasáis a ser un grupo abierto y otras personas pueden completarlo."],
    ["¿Puedo cambiar de hora?", "Sí, desde «Mi reserva» (entra en la web con tu correo). El cambio es solo tuyo: el resto de tu grupo se queda en su hora."],
    ["¿Y si no puedo ir?", "Cancela tu plaza desde «Mi reserva» y quedará libre para otra persona. Si fuiste tú quien hizo la reserva, también puedes anular la del grupo entero."],
    ["¿Qué es eso que aparece al final de mi entrada?", "Cada persona recibe un fragmento distinto. Juntadlos antes del día y decidle al llegar a la guía lo que habéis descubierto. Merece la pena."],
    ["El horario que quiero está lleno, ¿qué hago?", "Pulsa «Avísame si se libera una plaza». Si alguien la suelta, te escribimos."],
    ["¿Hay luces o efectos fuertes?", `Puede que sí. Antes de reservar verás un aviso con todo lo que tienes que saber. Si tienes alguna sensibilidad, escríbenos a ${CONTACTO}.`],
    ["¿Es de verdad un retiro espiritual?", "Hay cosas que es mejor vivirlas en persona."],
  ],
  en: [
    ["How long does it last?", "45 minutes inside the room. Arrive 15 minutes early: there's a short welcome."],
    ["What if someone in my group doesn't confirm?", "You have 48 hours. If 3 or more of you confirm, you go ahead and the unconfirmed places are released. If only 1 or 2 are left, you become an open group and other people can complete it."],
    ["Can I change my time?", "Yes, from “My booking” (sign in with your email). The change is only yours: the rest of your group keeps their time."],
    ["What if I can't make it?", "Cancel your place from “My booking” and it will be free for someone else. If you made the booking, you can also cancel it for the whole group."],
    ["What is that at the end of my ticket?", "Each person gets a different fragment. Put them together before the day and tell the guide what you discovered when you arrive. It's worth it."],
    ["The time I want is full, what can I do?", "Press “Notify me if a place opens up”. If someone gives theirs up, we'll write to you."],
    ["Are there strong lights or effects?", `There may be. Before booking you'll see a warning with everything you need to know. If you have any sensitivity, write to us at ${CONTACTO}.`],
    ["Is it really a spiritual retreat?", "Some things are better experienced in person."],
  ],
};

const TEXTOS = {
  es: { etiqueta: "PREGUNTAS FRECUENTES", titulo: "LO QUE TODO EL MUNDO PREGUNTA" },
  en: { etiqueta: "FREQUENTLY ASKED QUESTIONS", titulo: "WHAT EVERYONE ASKS" },
};

export default function Faq() {
  const [abierta, setAbierta] = useState(null); // ninguna abierta al entrar
  const { idioma } = useIdioma();
  const t = TEXTOS[idioma];

  return (
    <section className="faq" id="faq" data-fondo="oscuro">
      <div className="faq__bloque">
        <p className="faq__etiqueta"><img src="/assets/svg/punto.svg" width="7" height="7" alt="" />{t.etiqueta}</p>
        <h2 className="faq__titulo">{t.titulo}</h2>

        <div className="faq__lista">
          {PREGUNTAS[idioma].map(([pregunta, respuesta], i) => (
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
