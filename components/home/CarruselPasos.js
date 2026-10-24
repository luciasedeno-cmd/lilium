"use client";
// Carrusel «Cómo funciona»: los 5 pasos de la reserva (variantes del componente de Figma)
// La barrita se va rellenando hasta el siguiente punto; al llenarse, pasa sola al paso siguiente.
// En cada paso la mano hace algo distinto y el fondo de toda la sección cambia de color
// (el color se guarda en --paso-color, en la raíz de la página, para que lo use también el encaje de arriba).
import { Fragment, useEffect, useRef, useState } from "react";
import { useIdioma } from "@/components/Idioma";

// Imagen y color de fondo de cada paso (colores de la paleta de Lilium; el texto crema se lee en todos)
const ESCENAS = [
  { imagen: "mano-1.webp", color: "#732f23", alt: { es: "Mano sosteniendo un clavel", en: "Hand holding a carnation" } },
  { imagen: "mano-2.webp", color: "#8a5247", alt: { es: "Mano sosteniendo un ramo de cinco claveles", en: "Hand holding a bouquet of five carnations" } },
  { imagen: "mano-3.webp", color: "#4f5341", alt: { es: "Mano sosteniendo un reloj de bolsillo", en: "Hand holding a pocket watch" } },
  { imagen: "mano-4.webp", color: "#5c2419", alt: { es: "Mano entregando una carta sellada con lacre", en: "Hand handing over a letter sealed with wax" } },
  { imagen: "mano-5.webp", color: "#6f705c", alt: { es: "Mano sosteniendo una llave antigua con un clavel", en: "Hand holding an antique key with a carnation" } },
];

const PASOS = {
  es: [
    { titulo: "Entra con tu correo", descripcion: ["Te mandamos un código a tu correo nombreapellido@alumnado.esada.es para que verifiques tu cuenta."] },
    { titulo: "Añade a tu grupo", descripcion: ["Escribe los correos de tu grupo (de 3 a 6 personas).", "El líder del grupo es quien hace la reserva."] },
    { titulo: "Elige hora", descripcion: ["Todo pasa un mismo día. Verás que grupos puedes abrir y cuáles necesitan ser completados. Elige una de las horas disponibles."] },
    { titulo: "Confirmad la reserva", descripcion: ["A cada persona le llega un correo. Tenéis 48 horas para confirmar o vuestra reserva se cancelará.", "La reserva seguirá para las personas que hayan confirmado."] },
    { titulo: "Recibe tu entrada", descripcion: ["A tu correo llega la entrada con un QR con un fragmento secreto que os ayudará una vez en el retiro."] },
  ],
  en: [
    { titulo: "Sign in with your email", descripcion: ["We send a code to your nameSurname@alumnado.esada.es email so you can verify your account."] },
    { titulo: "Add your group", descripcion: ["Write your group's emails (3 to 6 people).", "The group leader is the one who makes the booking."] },
    { titulo: "Choose a time", descripcion: ["Everything happens on a single day. You'll see which groups you can open and which need completing. Pick one of the available times."] },
    { titulo: "Confirm the booking", descripcion: ["Everyone gets an email. You have 48 hours to confirm or your booking will be cancelled.", "The booking stays for those who have confirmed."] },
    { titulo: "Get your ticket", descripcion: ["Your ticket arrives by email with a QR code and a secret fragment that will help you inside the retreat."] },
  ],
};

export default function CarruselPasos() {
  const { idioma } = useIdioma();
  const lista = PASOS[idioma];
  const [actual, setActual] = useState(0);
  const [cambiando, setCambiando] = useState(false);
  const [pausado, setPausado] = useState(true); // empieza parado hasta que la sección se ve en pantalla
  const seccion = useRef(null);

  // Cambia de paso con un pequeño fundido del texto
  function mostrar(indice) {
    const siguiente = (indice + lista.length) % lista.length;
    setCambiando(true);
    setTimeout(() => {
      setActual(siguiente);
      setCambiando(false);
    }, 250);
  }

  // La barrita solo avanza mientras la sección se ve en pantalla (si no, se para donde esté).
  // Quien tiene activado «reducir movimiento» en su móvil u ordenador no ve animaciones
  // ni cambios automáticos (el CSS quita la animación y por eso nunca termina).
  useEffect(() => {
    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const vigia = new IntersectionObserver(([e]) => setPausado(sinMovimiento || !e.isIntersecting), { threshold: 0.4 });
    vigia.observe(seccion.current);
    return () => vigia.disconnect();
  }, []);

  // El fondo de la sección toma el color del paso actual (el cambio es suave: ver --paso-color en home.css)
  useEffect(() => {
    document.documentElement.style.setProperty("--paso-color", ESCENAS[actual].color);
  }, [actual]);
  useEffect(() => () => document.documentElement.style.removeProperty("--paso-color"), []);

  const paso = lista[actual];
  return (
    <section
      className={`pasos${cambiando ? " is-cambiando" : ""}${pausado ? " is-pausado" : ""}`}
      aria-roledescription="carrusel"
      aria-label={idioma === "en" ? "Booking steps" : "Pasos de la reserva"}
      ref={seccion}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") mostrar(actual + 1);
        if (e.key === "ArrowLeft") mostrar(actual - 1);
      }}
    >
      {/* Las 5 manos están una encima de otra: solo se ve la del paso actual, que sube desde abajo */}
      <div className="pasos__imagen" data-revelar="izquierda">
        {ESCENAS.map((e, i) => (
          <img
            key={e.imagen}
            className={`pasos__mano${i === actual ? " is-activa" : ""}`}
            src={`/assets/img/pasos/${e.imagen}`}
            alt={i === actual ? e.alt[idioma] : ""}
            aria-hidden={i === actual ? undefined : true}
          />
        ))}
      </div>

      <div className="pasos__texto" aria-live="polite" data-revelar="derecha" style={{ "--retardo": "0.15s" }}>
        {/* Barrita de progreso: puntos (se pueden pulsar) unidos por líneas */}
        <div className="pasos__barra" role="tablist" aria-label={idioma === "en" ? "Choose step" : "Elegir paso"}>
          {lista.map((_, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <span className={`pasos__linea${i <= actual ? " is-llena" : ""}`} aria-hidden="true">
                  {/* La línea que va hacia el siguiente punto se rellena poco a poco */}
                  {i === actual + 1 && <span key={actual} className="pasos__relleno" />}
                </span>
              )}
              <button type="button" role="tab" aria-label={`${idioma === "en" ? "Step" : "Paso"} ${i + 1}`} aria-selected={i === actual}
                className={`pasos__punto${i < actual ? " is-hecho" : ""}${i === actual ? " is-actual" : ""}`}
                onClick={() => mostrar(i)} />
            </Fragment>
          ))}
          {/* Reloj invisible: dura lo mismo que el relleno y, al acabar, pasa al siguiente paso */}
          <span key={`reloj-${actual}`} className="pasos__reloj" aria-hidden="true" onAnimationEnd={() => mostrar(actual + 1)} />
        </div>
        <p className="pasos__numero">/0{actual + 1}</p>
        <h3 className="pasos__titulo">{paso.titulo}</h3>
        <div className="pasos__descripcion">
          {paso.descripcion.map((t) => <p key={t}>{t}</p>)}
        </div>
      </div>
    </section>
  );
}
