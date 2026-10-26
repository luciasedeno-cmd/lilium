"use client";
// «Cómo funciona»: los 5 pasos de la reserva, con scroll horizontal.
// La sección se queda fija en la pantalla y, al bajar con la rueda o el dedo, las tarjetas de los
// pasos se desplazan hacia un lado (no cambian solas con el tiempo). Cada paso se detiene un momento.
// La barrita de puntos se va llenando con el avance y los puntos se pueden pulsar para ir a ese paso.
// En cada paso la mano hace algo distinto y el fondo cambia de color (--paso-color, en la raíz de la página).
import { useEffect, useRef, useState } from "react";
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
  const n = lista.length;
  const [actual, setActual] = useState(0);
  const pista = useRef(null);
  const relleno = useRef(null);

  // El avance (0 al principio, n-1 al final) sale de cuánto se ha bajado dentro del bloque alto
  useEffect(() => {
    const bloque = pista.current.closest(".como-bloque");
    // Navegadores antiguos sin «overflow: clip»: la parte fija no funciona; las tarjetas se deslizan con el dedo
    if (!CSS.supports("overflow-x", "clip")) {
      bloque.classList.add("como-bloque--simple");
      return;
    }
    // «objetivo» = dónde debería estar según la rueda; «pos» = dónde se pinta. pos va detrás de objetivo
    // poco a poco y con una velocidad máxima: así, aunque alguien gire la rueda muy deprisa,
    // las tarjetas pasan despacio y se ve cada mano (como un carrito que frena y acelera suave).
    const VELOCIDAD_MAX = 0.9; // pasos por segundo como mucho
    let objetivo = 0;
    let pos = null;
    let ultimo = 0;
    let animando = false;

    function calcularObjetivo() {
      const r = bloque.getBoundingClientRect();
      const recorrido = bloque.offsetHeight - window.innerHeight;
      const avance = Math.min(1, Math.max(0, -r.top / Math.max(1, recorrido))) * (n - 1);
      // Cada paso se queda quieto un buen rato y luego pasa suave al siguiente
      const i = Math.min(n - 2, Math.floor(avance));
      const f = Math.min(1, Math.max(0, (avance - i - 0.25) / 0.5));
      objetivo = i + f * f * (3 - 2 * f);
    }

    function pintar(pPos) {
      pista.current.style.transform = `translateX(${(-pPos * 100) / n}%)`;
      relleno.current.style.transform = `scaleX(${pPos / (n - 1)})`;
      setActual(Math.round(pPos));
    }

    function fotograma(t) {
      const dt = Math.min(0.05, (t - ultimo) / 1000 || 0.016);
      ultimo = t;
      const resta = objetivo - pos;
      // Se acerca un 8 % del camino que falta en cada fotograma, sin pasar de la velocidad máxima
      let paso = resta * (1 - Math.pow(0.92, dt * 60));
      const tope = VELOCIDAD_MAX * dt;
      paso = Math.max(-tope, Math.min(tope, paso));
      pos = Math.abs(resta) < 0.001 ? objetivo : pos + paso;
      pintar(pos);
      if (pos !== objetivo) requestAnimationFrame(fotograma);
      else animando = false;
    }

    const alBajar = () => {
      calcularObjetivo();
      if (!animando) {
        animando = true;
        ultimo = performance.now();
        requestAnimationFrame(fotograma);
      }
    };
    // Al cargar la página se coloca directamente donde toca (sin animación)
    calcularObjetivo();
    pos = objetivo;
    pintar(pos);
    window.addEventListener("scroll", alBajar, { passive: true });
    window.addEventListener("resize", alBajar);
    return () => {
      window.removeEventListener("scroll", alBajar);
      window.removeEventListener("resize", alBajar);
    };
  }, [n]);

  // El fondo de la sección toma el color del paso actual (el cambio es suave: ver --paso-color en home.css)
  useEffect(() => {
    document.documentElement.style.setProperty("--paso-color", ESCENAS[actual].color);
  }, [actual]);
  useEffect(() => () => document.documentElement.style.removeProperty("--paso-color"), []);

  // Pulsar un punto: baja (o sube) hasta donde se ve ese paso
  function irA(i) {
    const bloque = pista.current.closest(".como-bloque");
    if (bloque.classList.contains("como-bloque--simple")) {
      return pista.current.parentElement.scrollTo({ left: (i * pista.current.parentElement.scrollWidth) / n, behavior: "smooth" });
    }
    const recorrido = bloque.offsetHeight - window.innerHeight;
    const arriba = bloque.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: arriba + (recorrido * i) / (n - 1), behavior: "smooth" });
  }

  return (
    <section className="pasos" aria-roledescription="carrusel" aria-label={idioma === "en" ? "Booking steps" : "Pasos de la reserva"}>
      {/* Barrita de progreso: puntos (se pueden pulsar) sobre una línea que se va llenando */}
      <div className="pasos__barra" role="tablist" aria-label={idioma === "en" ? "Choose step" : "Elegir paso"}>
        <span className="pasos__linea" aria-hidden="true"><span className="pasos__relleno" ref={relleno} /></span>
        {lista.map((_, i) => (
          <button key={i} type="button" role="tab" aria-label={`${idioma === "en" ? "Step" : "Paso"} ${i + 1}`} aria-selected={i === actual}
            className={`pasos__punto${i < actual ? " is-hecho" : ""}${i === actual ? " is-actual" : ""}`}
            onClick={() => irA(i)} />
        ))}
      </div>

      {/* Las 5 tarjetas, una al lado de otra: se desplazan de lado al bajar */}
      <div className="pasos__ventana">
        <div className="pasos__pista" ref={pista} style={{ width: `${n * 100}%` }}>
          {lista.map((paso, i) => (
            <article key={i} className={`pasos__tarjeta${i === actual ? " is-actual" : ""}`} aria-hidden={i !== actual}>
              <div className="pasos__imagen">
                <img className="pasos__mano" src={`/assets/img/pasos/${ESCENAS[i].imagen}`} alt={ESCENAS[i].alt[idioma]}
                  loading={i === 0 ? undefined : "lazy"} decoding="async" />
              </div>
              <div className="pasos__texto">
                <p className="pasos__numero">/0{i + 1}</p>
                <h3 className="pasos__titulo">{paso.titulo}</h3>
                <div className="pasos__descripcion">
                  {paso.descripcion.map((t) => <p key={t}>{t}</p>)}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
