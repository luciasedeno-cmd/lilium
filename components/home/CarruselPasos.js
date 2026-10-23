"use client";
// Carrusel «Cómo funciona»: los 5 pasos de la reserva (variantes del componente de Figma)
// La barrita se va rellenando hasta el siguiente punto; al llenarse, pasa sola al paso siguiente.
import { Fragment, useEffect, useState } from "react";

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
  const [pausado, setPausado] = useState(false);

  // Cambia de paso con un pequeño fundido del texto
  function mostrar(indice) {
    const siguiente = (indice + PASOS.length) % PASOS.length;
    setCambiando(true);
    setTimeout(() => {
      setActual(siguiente);
      setCambiando(false);
    }, 250);
  }

  // Quien tiene activado «reducir movimiento» en su móvil u ordenador no ve animaciones
  // ni cambios automáticos (el CSS quita la animación y por eso nunca termina)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPausado(true);
  }, []);

  const paso = PASOS[actual];
  return (
    <section
      className={`pasos${cambiando ? " is-cambiando" : ""}${pausado ? " is-pausado" : ""}`}
      aria-roledescription="carrusel"
      aria-label="Pasos de la reserva"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(window.matchMedia("(prefers-reduced-motion: reduce)").matches)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") mostrar(actual + 1);
        if (e.key === "ArrowLeft") mostrar(actual - 1);
      }}
    >
      <div className="pasos__imagen">
        <img src="/assets/img/como-funciona-mano.png" alt="Mano sosteniendo un clavel" />
      </div>

      <div className="pasos__texto" aria-live="polite">
        {/* Barrita de progreso: puntos (se pueden pulsar) unidos por líneas */}
        <div className="pasos__barra" role="tablist" aria-label="Elegir paso">
          {PASOS.map((_, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <span className={`pasos__linea${i <= actual ? " is-llena" : ""}`} aria-hidden="true">
                  {/* La línea que va hacia el siguiente punto se rellena poco a poco */}
                  {i === actual + 1 && <span key={actual} className="pasos__relleno" />}
                </span>
              )}
              <button type="button" role="tab" aria-label={`Paso ${i + 1}`} aria-selected={i === actual}
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
