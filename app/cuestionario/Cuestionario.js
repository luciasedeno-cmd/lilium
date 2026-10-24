"use client";
// Cuestionario de Lilium (sistema de diseño «Lilium DEFINITIVO»).
// 6 preguntas obligatorias: 4 se valoran con flores (1 a 5) y 2 con una escala de 0 a 5.
// Cada respuesta es un botón de opción (radio) escondido, así funciona también con el teclado.
// Al enviar se guarda en la tabla «cuestionario» de Supabase (anónimo) y se recuerda en este navegador.
import { useEffect, useState } from "react";
import Link from "next/link";
import NavReserva from "@/components/NavReserva";
import PiePagina from "@/components/PiePagina";
import { useIdioma } from "@/components/Idioma";
import { api } from "@/lib/borrador";

const YA_RESPONDIDO = "lilium_cuestionario_enviado";

const TEXTOS = {
  es: {
    etiqueta: "TU OPINIÓN", titulo: "Cuestionario",
    intro: "Gracias por entrar en Lilium. Cuéntanos qué te ha parecido: son seis preguntas y menos de un minuto. Es anónimo.",
    preguntas: {
      general: "¿Cuánto te ha gustado la experiencia en general?",
      ambientacion: "¿Cómo valorarías la ambientación y la decoración?",
      dificultad: "¿Qué te ha parecido la dificultad de las pruebas?",
      originalidad: "¿Cómo valorarías la originalidad de las pruebas?",
      inmersion: "¿Cómo valorarías la inmersión y la sensación de estar dentro de la historia?",
      duracion: "¿Qué te ha parecido la duración de la experiencia?",
    },
    flores: (n) => `${n} de 5 flores`,
    dificultadEtiquetas: { 0: "Muy fácil", 5: "Muy difícil" },
    duracionEtiquetas: { 0: "Muy corta", 3: "Genial", 5: "Muy larga" },
    comentario: "¿Quieres contarnos algo más? (opcional)",
    comentarioPista: "Lo que más te ha gustado, lo que mejorarías…",
    enviar: "Enviar respuestas", enviando: "Enviando…",
    faltan: (n) => (n === 1 ? "Falta 1 pregunta por responder." : `Faltan ${n} preguntas por responder.`),
    graciasTitulo: "¡Gracias!",
    graciasTexto: "Hemos recibido tus respuestas. Nos ayudan a que Lilium sea cada vez mejor.",
    otraVez: "Responder otra vez",
    volver: "Volver a la web",
  },
  en: {
    etiqueta: "YOUR OPINION", titulo: "Questionnaire",
    intro: "Thank you for stepping into Lilium. Tell us what you thought: six questions, less than a minute. It's anonymous.",
    preguntas: {
      general: "How much did you enjoy the experience overall?",
      ambientacion: "How would you rate the setting and the decoration?",
      dificultad: "How difficult were the challenges?",
      originalidad: "How would you rate the originality of the challenges?",
      inmersion: "How would you rate the immersion and the feeling of being inside the story?",
      duracion: "What did you think of the length of the experience?",
    },
    flores: (n) => `${n} out of 5 flowers`,
    dificultadEtiquetas: { 0: "Very easy", 5: "Very hard" },
    duracionEtiquetas: { 0: "Too short", 3: "Just right", 5: "Too long" },
    comentario: "Anything else you'd like to tell us? (optional)",
    comentarioPista: "What you liked most, what you'd improve…",
    enviar: "Send answers", enviando: "Sending…",
    faltan: (n) => (n === 1 ? "1 question left to answer." : `${n} questions left to answer.`),
    graciasTitulo: "Thank you!",
    graciasTexto: "We've received your answers. They help us make Lilium better and better.",
    otraVez: "Answer again",
    volver: "Back to the website",
  },
};

// Orden de las preguntas y su tipo («flores» de 1 a 5 o «escala» de 0 a 5)
const PREGUNTAS = [
  { clave: "general", tipo: "flores" },
  { clave: "ambientacion", tipo: "flores" },
  { clave: "dificultad", tipo: "escala", etiquetas: "dificultadEtiquetas" },
  { clave: "originalidad", tipo: "flores" },
  { clave: "inmersion", tipo: "flores" },
  { clave: "duracion", tipo: "escala", etiquetas: "duracionEtiquetas" },
];

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

// Pregunta con 5 flores
function PreguntaFlores({ clave, valor, alElegir, t }) {
  // «encima» es la flor sobre la que está el ratón, para ver cómo quedaría antes de pulsar
  const [encima, setEncima] = useState(0);
  const mostrado = encima || valor || 0;
  return (
    <div className="cues-flores" onMouseLeave={() => setEncima(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className={`cues-flor ${n <= mostrado ? "is-llena" : ""}`} onMouseEnter={() => setEncima(n)}>
          <input type="radio" name={clave} value={n} checked={valor === n} onChange={() => alElegir(n)} />
          <Flor />
          <span className="visually-hidden">{t.flores(n)}</span>
        </label>
      ))}
    </div>
  );
}

// Pregunta con escala de 0 a 5 y palabras debajo de algunos números
function PreguntaEscala({ clave, valor, alElegir, etiquetas }) {
  return (
    <div className="cues-escala">
      {[0, 1, 2, 3, 4, 5].map((n) => (
        <label key={n} className={`cues-escala__opcion ${valor === n ? "is-elegida" : ""}`}>
          <input type="radio" name={clave} value={n} checked={valor === n} onChange={() => alElegir(n)} />
          <span className="cues-escala__numero">{n}</span>
          <span className="cues-escala__palabra">{etiquetas[n] || ""}</span>
        </label>
      ))}
    </div>
  );
}

export default function Cuestionario() {
  const { idioma } = useIdioma();
  const t = TEXTOS[idioma] || TEXTOS.es;
  const [respuestas, setRespuestas] = useState({});
  const [comentario, setComentario] = useState("");
  const [estado, setEstado] = useState("rellenando"); // rellenando | enviando | enviado
  const [mensaje, setMensaje] = useState("");

  // Si ya respondió desde este navegador, se enseña directamente el «¡Gracias!»
  useEffect(() => {
    try {
      if (localStorage.getItem(YA_RESPONDIDO)) setEstado("enviado");
    } catch {}
  }, []);

  const faltan = PREGUNTAS.filter((p) => respuestas[p.clave] === undefined).length;

  function elegir(clave, n) {
    setRespuestas((r) => ({ ...r, [clave]: n }));
    setMensaje("");
  }

  async function enviar(e) {
    e.preventDefault();
    if (faltan > 0) return setMensaje(t.faltan(faltan));
    setEstado("enviando");
    const r = await api("/api/cuestionario", { metodo: "POST", datos: { ...respuestas, comentario, idioma } });
    if (!r.ok) {
      setEstado("rellenando");
      return setMensaje(r.mensaje);
    }
    try {
      localStorage.setItem(YA_RESPONDIDO, "1");
    } catch {}
    setEstado("enviado");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function otraVez() {
    try {
      localStorage.removeItem(YA_RESPONDIDO);
    } catch {}
    setRespuestas({});
    setComentario("");
    setEstado("rellenando");
  }

  return (
    <>
      <NavReserva />
      <main className="cues">
        <header className="cues__encabezado" data-principal>
          <h1 className="cues__titulo">{estado === "enviado" ? t.graciasTitulo : t.titulo}</h1>
          <p className="cues__etiqueta">{t.etiqueta}</p>
        </header>

        {estado === "enviado" ? (
          <section className="cues-gracias">
            <p>{t.graciasTexto}</p>
            <div className="cues-gracias__botones">
              <Link href="/" className="ll-btn ll-btn--lg ll-btn--primary">{t.volver}</Link>
              <button type="button" className="ll-btn ll-btn--md ll-btn--secondary" onClick={otraVez}>{t.otraVez}</button>
            </div>
          </section>
        ) : (
          <form className="cues__formulario" onSubmit={enviar} noValidate>
            <p className="cues__intro">{t.intro}</p>

            {PREGUNTAS.map((p, i) => (
              <fieldset key={p.clave} className={`cues-pregunta ${respuestas[p.clave] !== undefined ? "is-respondida" : ""}`}>
                <legend className="cues-pregunta__titulo">
                  <span className="cues-pregunta__numero">{i + 1}</span>
                  {t.preguntas[p.clave]}
                </legend>
                {p.tipo === "flores" ? (
                  <PreguntaFlores clave={p.clave} valor={respuestas[p.clave]} alElegir={(n) => elegir(p.clave, n)} t={t} />
                ) : (
                  <PreguntaEscala clave={p.clave} valor={respuestas[p.clave]} alElegir={(n) => elegir(p.clave, n)} etiquetas={t[p.etiquetas]} />
                )}
              </fieldset>
            ))}

            <label className="cues-pregunta cues-comentario">
              <span className="cues-pregunta__titulo">{t.comentario}</span>
              <textarea
                className="rev-notas"
                rows={4}
                maxLength={1000}
                value={comentario}
                placeholder={t.comentarioPista}
                onChange={(e) => setComentario(e.target.value)}
              />
            </label>

            <div className="cues__enviar">
              <button type="submit" className="ll-btn ll-btn--lg ll-btn--primary ll-btn--full" disabled={estado === "enviando"}>
                {estado === "enviando" ? t.enviando : t.enviar}
              </button>
              <p className="cues__mensaje" role="status" aria-live="polite">{mensaje}</p>
            </div>
          </form>
        )}
      </main>
      <PiePagina />
    </>
  );
}
