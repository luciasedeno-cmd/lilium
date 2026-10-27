"use client";
// Sala de espera de Lilium (cola virtual). Envuelve TODA la web (app/layout.js), pero solo actúa en la
// Home y en los pasos de la reserva: antes de enseñarlas, pregunta al servidor si hay sitio (/api/cola).
// - Si hay sitio, se ve la página como siempre y, cada minuto, se avisa de que la persona sigue ahí.
// - Si está lleno, sale la pantalla verde con su puesto en la cola, que se actualiza sola cada pocos
//   segundos; cuando le toca, la página aparece sin tener que hacer nada.
// - Si el servidor tarda muchísimo en contestar (web saturada), lo explica y vuelve a intentarlo solo.
// - Al llegar a «Mi reserva» (reserva terminada) deja su sitio libre para la siguiente persona.
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTextos } from "./Idioma";

// Páginas con cola
const VIGILADAS = [/^\/inicio$/, /^\/reserva(\/.*)?$/];
const CLAVE = "lilium-cola-dentro"; // cuándo se entró por última vez (para no esperar al recargar)
const RECIENTE_MS = 150 * 1000;
const CADA_ESPERANDO = 8000; // cada cuánto pregunta quien espera
const CADA_DENTRO = 60000; // cada cuánto avisa quien está dentro
const PACIENCIA_MS = 12000; // si el servidor tarda más que esto, la web está saturada

const TEXTOS = {
  es: {
    comprobando: "Un momento…",
    etiqueta: "SALA DE ESPERA",
    titulo: "Hay mucha gente reservando a la vez",
    tuPuesto: "Tu puesto en la cola",
    delante: (n) => (n === 0 ? "¡Te toca enseguida!" : n === 1 ? "1 persona delante de ti" : `${n} personas delante de ti`),
    nota: "Te guardamos el sitio: la página se abrirá sola cuando te toque. Puedes cambiar de pestaña, pero no cierres esta.",
    lentaTitulo: "La web va un poco lenta",
    lentaTexto: "Hay muchísima gente entrando a la vez. Lo volvemos a intentar solos en unos segundos: no cierres esta pestaña.",
    pestana: (n) => `(${n}) Sala de espera · Lilium`,
  },
  en: {
    comprobando: "One moment…",
    etiqueta: "WAITING ROOM",
    titulo: "Lots of people are booking right now",
    tuPuesto: "Your place in the queue",
    delante: (n) => (n === 0 ? "You're up next!" : n === 1 ? "1 person ahead of you" : `${n} people ahead of you`),
    nota: "We're holding your place: the page will open by itself when it's your turn. You can switch tabs, but don't close this one.",
    lentaTitulo: "The site is a little slow",
    lentaTexto: "Loads of people are coming in at once. We'll try again by ourselves in a few seconds: don't close this tab.",
    pestana: (n) => `(${n}) Waiting room · Lilium`,
  },
};

/** Pregunta al servidor. Devuelve { dentro } , { puesto, delante, enCola } o { lenta: true } */
async function preguntar() {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), PACIENCIA_MS);
  try {
    const res = await fetch("/api/cola", { method: "POST", signal: control.signal });
    if (res.status === 503) return { lenta: true }; // la base de datos no da abasto
    const r = await res.json().catch(() => ({}));
    // Cualquier otro fallo de la cola no debe dejar a nadie fuera: se entra
    return r.ok ? r : { dentro: true };
  } catch {
    return { lenta: true }; // no contestó a tiempo (o se cortó la conexión)
  } finally {
    clearTimeout(reloj);
  }
}

function recordar(valor) {
  try {
    if (valor) sessionStorage.setItem(CLAVE, String(Date.now()));
    else sessionStorage.removeItem(CLAVE);
  } catch {}
}

function entroHacePoco() {
  try {
    return Date.now() - Number(sessionStorage.getItem(CLAVE) || 0) < RECIENTE_MS;
  } catch {
    return false;
  }
}

export default function SalaEspera({ children }) {
  const ruta = usePathname();
  const vigilada = VIGILADAS.some((r) => r.test(ruta));
  const [info, setInfo] = useState(null); // null = comprobando
  const primero = useRef(null); // personas delante la primera vez (para la barra de avance)
  const t = useTextos(TEXTOS);

  // Preguntar a la cola mientras se esté en una página vigilada
  useEffect(() => {
    if (!vigilada) return;
    let parado = false;
    let reloj;
    async function vuelta() {
      // Con la pestaña escondida, quien está dentro no avisa (así, si la deja olvidada, libera su sitio)
      if (document.hidden && entroHacePoco()) return (reloj = setTimeout(vuelta, CADA_DENTRO));
      const r = await preguntar();
      if (parado) return;
      if (r.dentro) recordar(true);
      if (!r.dentro && !r.lenta && primero.current === null) primero.current = r.delante;
      // Si ya estaba dentro y el servidor solo tarda, se queda dentro (no se le saca a media reserva)
      setInfo((antes) => (r.lenta && antes?.dentro ? antes : r));
      reloj = setTimeout(vuelta, r.dentro ? CADA_DENTRO : CADA_ESPERANDO);
    }
    // Si acaba de estar dentro (recarga o vuelve de otra página), entra ya y se comprueba por detrás
    if (entroHacePoco()) setInfo({ dentro: true });
    vuelta();
    // Al volver a la pestaña, se pregunta enseguida
    const alVolver = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(reloj);
      vuelta();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      parado = true;
      clearTimeout(reloj);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [vigilada]);

  // Reserva terminada: deja el sitio libre para la siguiente persona de la cola
  useEffect(() => {
    if (ruta !== "/mi-reserva" || !entroHacePoco()) return;
    recordar(false);
    fetch("/api/cola", { method: "DELETE", keepalive: true }).catch(() => {});
  }, [ruta]);

  // En la pestaña del navegador se ve el puesto (por si la persona está en otra pestaña)
  const enCola = vigilada && info && !info.dentro && !info.lenta;
  useEffect(() => {
    if (!enCola) return;
    const antes = document.title;
    document.title = t.pestana(info.puesto);
    return () => {
      document.title = antes;
    };
  }, [enCola, info, t]);

  if (!vigilada || info?.dentro) return children;

  // Barra: cuánto ha avanzado desde que llegó (0 = recién llegada, 1 = le toca)
  const avance = enCola && primero.current ? 1 - info.delante / primero.current : 0;

  return (
    <div className={`cola${info ? "" : " cola--comprobando"}`} role="status" aria-live="polite">
      <img className="cola__lirio" src="/assets/img/icono-lirio.webp" width="99" height="80" alt="" />
      <img className="cola__logo" src="/assets/img/logo-lilium.webp" width="198" height="118" alt="Lilium" />

      {!info && <p className="cola__texto">{t.comprobando}</p>}

      {enCola && (
        <>
          <p className="cola__etiqueta">{t.etiqueta}</p>
          <h1 className="cola__titulo">{t.titulo}</h1>
          <p className="cola__puesto-etiqueta">{t.tuPuesto}</p>
          <p className="cola__puesto">{info.puesto}</p>
          <span className="cola__barra" aria-hidden="true">
            <span style={{ transform: `scaleX(${Math.max(0.04, avance)})` }} />
          </span>
          <p className="cola__delante">{t.delante(info.delante)}</p>
          <p className="cola__texto">{t.nota}</p>
        </>
      )}

      {info?.lenta && (
        <>
          <h1 className="cola__titulo">{t.lentaTitulo}</h1>
          <span className="cola__barra cola__barra--espera" aria-hidden="true"><span /></span>
          <p className="cola__texto">{t.lentaTexto}</p>
        </>
      )}
    </div>
  );
}
