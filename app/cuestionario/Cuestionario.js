"use client";
// Cuestionario de Lilium (sistema de diseño «Lilium DEFINITIVO» + la estética de la Home).
// Para que no sea monótono, cada pregunta es una sección a todo lo ancho con su propio fondo
// (crema, cuadro, granate, verde, albaricoque…) y un número romano grande, como los fragmentos.
// Al responder, la página baja sola a la siguiente pregunta. Abajo, un contador fijo dice cuántas faltan.
// Las 7 preguntas son obligatorias (también el comentario). Al enviar se guarda en la tabla
// «cuestionario» de Supabase y se pasa a /cuestionario/enviado.
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NavReserva from "@/components/NavReserva";
import PiePagina from "@/components/PiePagina";
import { useIdioma } from "@/components/Idioma";
import { api } from "@/lib/borrador";

const TEXTOS = {
  es: {
    etiqueta: "TU OPINIÓN", titulo: "Cuestionario",
    intro: "Acabas de salir del retiro. Antes de que se desvanezca el recuerdo, cuéntanos cómo lo has vivido. Es anónimo y no lleva más de un minuto.",
    empezar: "Empezar",
    preguntas: {
      general: "¿Cuánto te ha gustado la experiencia en general?",
      ambientacion: "¿Cómo valorarías la ambientación y la decoración?",
      dificultad: "¿Qué te ha parecido la dificultad de las pruebas?",
      originalidad: "¿Cómo valorarías la originalidad de las pruebas?",
      inmersion: "¿Cómo valorarías la inmersión y la sensación de estar dentro de la historia?",
      duracion: "¿Qué te ha parecido la duración de la experiencia?",
      comentario: "Para terminar, ¿qué es lo que más recordarás de Lilium?",
    },
    flores: (n) => `${n} de 5 flores`,
    valoraciones: ["", "Nada", "Poco", "Bien", "Mucho", "¡Me ha encantado!"],
    dificultadEtiquetas: { 0: "Muy fácil", 5: "Muy difícil" },
    duracionEtiquetas: { 0: "Muy corta", 3: "Genial", 5: "Muy larga" },
    comentarioPista: "Un momento, una prueba, algo que mejorarías…",
    enviar: "Enviar respuestas", enviando: "Enviando…",
    progreso: (n, total) => `${n} de ${total} respondidas`,
    faltan: (n) => (n === 1 ? "Falta 1 pregunta por responder." : `Faltan ${n} preguntas por responder.`),
  },
  en: {
    etiqueta: "YOUR OPINION", titulo: "Questionnaire",
    intro: "You've just left the retreat. Before the memory fades, tell us how you lived it. It's anonymous and takes less than a minute.",
    empezar: "Start",
    preguntas: {
      general: "How much did you enjoy the experience overall?",
      ambientacion: "How would you rate the setting and the decoration?",
      dificultad: "How difficult were the challenges?",
      originalidad: "How would you rate the originality of the challenges?",
      inmersion: "How would you rate the immersion and the feeling of being inside the story?",
      duracion: "What did you think of the length of the experience?",
      comentario: "To finish, what will you remember most about Lilium?",
    },
    flores: (n) => `${n} out of 5 flowers`,
    valoraciones: ["", "Not at all", "A little", "Good", "A lot", "I loved it!"],
    dificultadEtiquetas: { 0: "Very easy", 5: "Very hard" },
    duracionEtiquetas: { 0: "Too short", 3: "Just right", 5: "Too long" },
    comentarioPista: "A moment, a challenge, something you'd improve…",
    enviar: "Send answers", enviando: "Sending…",
    progreso: (n, total) => `${n} of ${total} answered`,
    faltan: (n) => (n === 1 ? "1 question left to answer." : `${n} questions left to answer.`),
  },
};

// Orden de las preguntas, su tipo y el «tema» (fondo) de su sección.
// Temas: crema · cuadro (pintura oscura) · granate · verde · albaricoque · arco (grabado)
const PREGUNTAS = [
  { clave: "general", tipo: "flores", tema: "crema", romano: "I" },
  { clave: "ambientacion", tipo: "flores", tema: "cuadro", romano: "II" },
  { clave: "dificultad", tipo: "escala", tema: "granate", romano: "III", etiquetas: "dificultadEtiquetas" },
  { clave: "originalidad", tipo: "flores", tema: "albaricoque", romano: "IV" },
  { clave: "inmersion", tipo: "flores", tema: "verde", romano: "V" },
  { clave: "duracion", tipo: "escala", tema: "crema", romano: "VI", etiquetas: "duracionEtiquetas" },
  { clave: "comentario", tipo: "texto", tema: "arco", romano: "VII" },
];
const OSCUROS = ["cuadro", "granate", "verde"];

// Flor de cinco pétalos (se rellena cuando está elegida)
function Flor() {
  return (
    <svg className="cues-flor__svg" viewBox="0 0 32 32" aria-hidden="true">
      {[0, 72, 144, 216, 288].map((giro) => (
        <ellipse key={giro} cx="16" cy="8.5" rx="4.6" ry="7" transform={`rotate(${giro} 16 16)`} />
      ))}
      <circle className="cues-flor__centro" cx="16" cy="16" r="3.4" />
    </svg>
  );
}

// Pregunta con 5 flores; debajo se lee qué significa la flor elegida
function PreguntaFlores({ clave, valor, alElegir, t }) {
  // «encima» es la flor sobre la que está el ratón, para ver cómo quedaría antes de pulsar
  const [encima, setEncima] = useState(0);
  const mostrado = encima || valor || 0;
  return (
    <>
      <div className="cues-flores" onMouseLeave={() => setEncima(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={`cues-flor ${n <= mostrado ? "is-llena" : ""}`} onMouseEnter={() => setEncima(n)}>
            <input type="radio" name={clave} value={n} required checked={valor === n} onChange={() => alElegir(n)} />
            <Flor />
            <span className="visually-hidden">{t.flores(n)}</span>
          </label>
        ))}
      </div>
      <p className="cues-flores__texto" aria-hidden="true">{t.valoraciones[mostrado]}</p>
    </>
  );
}

// Pregunta con escala de 0 a 5 y palabras debajo de algunos números
function PreguntaEscala({ clave, valor, alElegir, etiquetas }) {
  return (
    <div className="cues-escala">
      {[0, 1, 2, 3, 4, 5].map((n) => (
        <label key={n} className={`cues-escala__opcion ${valor === n ? "is-elegida" : ""}`}>
          <input type="radio" name={clave} value={n} required checked={valor === n} onChange={() => alElegir(n)} />
          <span className="cues-escala__numero">{n}</span>
          <span className="cues-escala__palabra">{etiquetas[n] || ""}</span>
        </label>
      ))}
    </div>
  );
}

export default function Cuestionario() {
  const router = useRouter();
  const { idioma } = useIdioma();
  const t = TEXTOS[idioma] || TEXTOS.es;
  const [respuestas, setRespuestas] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [marcadas, setMarcadas] = useState(false); // tras intentar enviar, se señalan las que faltan
  const secciones = useRef({});

  const respondida = (p) => (p.tipo === "texto" ? String(respuestas[p.clave] || "").trim() !== "" : respuestas[p.clave] !== undefined);
  const hechas = PREGUNTAS.filter(respondida).length;

  // Baja suavemente hasta una pregunta
  function irA(clave) {
    secciones.current[clave]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function elegir(i, n) {
    const p = PREGUNTAS[i];
    setRespuestas((r) => ({ ...r, [p.clave]: n }));
    setMensaje("");
    // Si era la primera vez que la respondía, se pasa sola a la siguiente
    if (respuestas[p.clave] === undefined && PREGUNTAS[i + 1]) setTimeout(() => irA(PREGUNTAS[i + 1].clave), 450);
  }

  async function enviar(e) {
    e.preventDefault();
    const pendientes = PREGUNTAS.filter((p) => !respondida(p));
    if (pendientes.length > 0) {
      setMarcadas(true);
      setMensaje(t.faltan(pendientes.length));
      return irA(pendientes[0].clave);
    }
    setEnviando(true);
    const r = await api("/api/cuestionario", { metodo: "POST", datos: { ...respuestas, idioma } });
    if (!r.ok) {
      setEnviando(false);
      return setMensaje(r.mensaje);
    }
    router.push("/cuestionario/enviado");
  }

  return (
    <>
      <NavReserva />
      <main className="cues">
        {/* Portada con el cuadro del retiro, como la de la Home */}
        <section className="cues-portada" data-fondo="oscuro" data-principal>
          <div className="cues-portada__contenido">
            <p className="cues__etiqueta">{t.etiqueta}</p>
            <h1 className="cues__titulo">{t.titulo}</h1>
            <p className="cues-portada__intro">{t.intro}</p>
            <button type="button" className="ll-btn ll-btn--lg cues-portada__boton" onClick={() => irA(PREGUNTAS[0].clave)}>
              {t.empezar}
            </button>
          </div>
        </section>

        <form onSubmit={enviar} noValidate>
          {PREGUNTAS.map((p, i) => {
            const falta = marcadas && !respondida(p);
            return (
              <section
                key={p.clave}
                ref={(el) => (secciones.current[p.clave] = el)}
                className={`cues-pregunta cues-pregunta--${p.tema} ${respondida(p) ? "is-respondida" : ""} ${falta ? "is-falta" : ""}`}
                data-fondo={OSCUROS.includes(p.tema) ? "oscuro" : "claro"}
              >
                {/* El encaje crema cuelga sobre la portada, como en la Home */}
                {i === 0 && <img className="encaje encaje--arriba" src="/assets/svg/banner-encaje.svg" width="1612" height="176" alt="" />}
                <div className="cues-pregunta__caja" role="group" aria-labelledby={`pregunta-${p.clave}`}>
                  <h2 className="cues-pregunta__titulo" id={`pregunta-${p.clave}`}>
                    <span className="cues-pregunta__romano" aria-hidden="true">{p.romano}</span>
                    <span className="visually-hidden">{i + 1}. </span>
                    {t.preguntas[p.clave]}
                  </h2>
                  {p.tipo === "flores" && <PreguntaFlores clave={p.clave} valor={respuestas[p.clave]} alElegir={(n) => elegir(i, n)} t={t} />}
                  {p.tipo === "escala" && (
                    <PreguntaEscala clave={p.clave} valor={respuestas[p.clave]} alElegir={(n) => elegir(i, n)} etiquetas={t[p.etiquetas]} />
                  )}
                  {p.tipo === "texto" && (
                    <>
                      <textarea
                        className="cues-comentario"
                        rows={5}
                        maxLength={1000}
                        required
                        aria-labelledby={`pregunta-${p.clave}`}
                        value={respuestas[p.clave] || ""}
                        placeholder={t.comentarioPista}
                        onChange={(e) => {
                          setRespuestas((r) => ({ ...r, comentario: e.target.value }));
                          setMensaje("");
                        }}
                      />
                      <div className="cues__enviar">
                        <button type="submit" className="ll-btn ll-btn--lg ll-btn--primary ll-btn--full" disabled={enviando}>
                          {enviando ? t.enviando : t.enviar}
                        </button>
                        <p className="cues__mensaje" role="status" aria-live="polite">{mensaje}</p>
                      </div>
                    </>
                  )}
                </div>
              </section>
            );
          })}
        </form>

        {/* Contador fijo abajo: una flor por pregunta (las respondidas, rellenas) */}
        <div className={`cues-progreso ${hechas === PREGUNTAS.length ? "is-completo" : ""}`} aria-live="polite">
          <div className="cues-progreso__flores" aria-hidden="true">
            {PREGUNTAS.map((p) => (
              <button key={p.clave} type="button" tabIndex={-1} className={`cues-progreso__punto ${respondida(p) ? "is-hecha" : ""}`} onClick={() => irA(p.clave)}>
                <Flor />
              </button>
            ))}
          </div>
          <span>{t.progreso(hechas, PREGUNTAS.length)}</span>
        </div>
      </main>
      <PiePagina />
    </>
  );
}
