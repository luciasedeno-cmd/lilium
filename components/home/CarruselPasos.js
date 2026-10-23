"use client";
// Carrusel «Cómo funciona»: los 5 pasos de la reserva (variantes del componente de Figma)
import { useCallback, useEffect, useRef, useState } from "react";

const PASOS = [
  { titulo: "Entra con tu correo", descripcion: ["Te mandamos un código a tu correo nombreapellido@alumnado.esada.es para que verifiques tu cuenta."] },
  { titulo: "Añade a tu grupo", descripcion: ["Escribe los correos de tu grupo (de 3 a 6 personas).", "El líder del grupo es quien hace la reserva."] },
  { titulo: "Elige hora", descripcion: ["Todo pasa un mismo día. Verás que grupos puedes abrir y cuáles necesitan ser completados. Elige una de las horas disponibles."] },
  { titulo: "Confirmad la reserva", descripcion: ["A cada persona le llega un correo. Tenéis 48 horas para confirmar o vuestra reserva se cancelará.", "La reserva seguirá para las personas que hayan confirmado."] },
  { titulo: "Recibe tu entrada", descripcion: ["A tu correo llega la entrada con un QR con un fragmento secreto que os ayudará una vez en el retiro."] },
];

export default function CarruselPasos() {
  const [actual, setActual] = useState(0);
  const [cambiando, setCambiando] = useState(false);
  const temporizador = useRef(null);
  const reduceMotion = useRef(false);
  const actualRef = useRef(0);

  const mostrar = useCallback((indice) => {
    const siguiente = (indice + PASOS.length) % PASOS.length;
    setCambiando(true);
    actualRef.current = siguiente;
    setTimeout(() => {
      setActual(siguiente);
      setCambiando(false);
    }, reduceMotion.current ? 0 : 250);
  }, []);

  const detener = () => clearInterval(temporizador.current);
  const iniciar = useCallback(() => {
    if (reduceMotion.current) return;
    clearInterval(temporizador.current);
    temporizador.current = setInterval(() => mostrar(actualRef.current + 1), 6000);
  }, [mostrar]);

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    iniciar();
    return detener;
  }, [iniciar]);

  const paso = PASOS[actual];
  return (
    <section
      className={`pasos${cambiando ? " is-cambiando" : ""}`}
      aria-roledescription="carrusel"
      aria-label="Pasos de la reserva"
      onMouseEnter={detener}
      onMouseLeave={iniciar}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") mostrar(actual + 1);
        if (e.key === "ArrowLeft") mostrar(actual - 1);
      }}
    >
      <div className="pasos__imagen">
        <img src="/assets/img/como-funciona-mano.png" alt="Mano sosteniendo un clavel" />
      </div>

      <div className="pasos__texto" aria-live="polite">
        <div className="pasos__barra">
          <img src={`/assets/svg/progreso-${actual + 1}.svg`} width="316" height="12" alt="" />
          <div className="pasos__puntos" role="tablist" aria-label="Elegir paso">
            {PASOS.map((_, i) => (
              <button key={i} type="button" role="tab" aria-label={`Paso ${i + 1}`} aria-selected={i === actual}
                onClick={() => { mostrar(i); iniciar(); }} />
            ))}
          </div>
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
