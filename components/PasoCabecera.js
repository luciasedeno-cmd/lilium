"use client";
// Cabecera de cada paso de la reserva (Figma: 3 puntos unidos por una línea + «PASO N DE 3»).
// Los puntos de los pasos anteriores son enlaces para volver atrás.
// Al entrar en un paso, la línea hasta su punto se dibuja y el punto se rellena (animación en CSS).
import Link from "next/link";
import { useTextos } from "./Idioma";

const RUTAS = ["/reserva/integrantes", "/reserva/hora", "/reserva/confirmacion"];

const TEXTOS = {
  es: { nombres: ["Integrantes", "Hora", "Confirmación"], pasos: "Pasos de la reserva", paso: "Paso", de: "de", volver: "Volver al paso", aqui: "(estás aquí)" },
  en: { nombres: ["Members", "Time", "Confirmation"], pasos: "Booking steps", paso: "Step", de: "of", volver: "Back to step", aqui: "(you are here)" },
};

export default function PasoCabecera({ paso }) {
  const t = useTextos(TEXTOS);
  const PASOS = RUTAS.map((href, i) => ({ href, nombre: t.nombres[i] }));
  return (
    <nav className="paso-cabecera" aria-label={t.pasos}>
      <ol className="pasos-puntos" data-paso={paso}>
        {PASOS.map(({ href, nombre }, i) => {
          const n = i + 1;
          const clase = `pasos-puntos__punto${n === paso ? " is-actual" : ""}${n < paso ? " is-hecho" : ""}`;
          return (
            <li key={href} className="pasos-puntos__paso">
              {/* Línea que une con el punto anterior; se dibuja al llegar a este paso */}
              {n > 1 && <span className={`pasos-puntos__linea${n <= paso ? " is-llena" : ""}${n === paso ? " is-nueva" : ""}`} aria-hidden="true" />}
              {n < paso ? (
                <Link className={clase} href={href} aria-label={`${t.volver} ${n}: ${nombre}`} />
              ) : (
                <span className={clase} aria-label={`${t.paso} ${n}: ${nombre}${n === paso ? ` ${t.aqui}` : ""}`}
                  aria-current={n === paso ? "step" : undefined} role="img" />
              )}
            </li>
          );
        })}
      </ol>
      <p className="paso-cabecera__titulo">{t.paso} {paso} {t.de} 3</p>
    </nav>
  );
}
