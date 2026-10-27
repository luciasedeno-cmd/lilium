"use client";
// Cuestionario de Lilium (Figma «PAG ENCUESTA», sistema de diseño «Lilium DEFINITIVO»).
// Un cuadro del retiro a todo lo alto de fondo y, encima, una tarjeta de cristal por pregunta:
// 4 se valoran con estrellas (1 a 5) y 2 con una escala de 0 a 5. Todas son obligatorias.
// Al responder, la página baja sola a la siguiente. Al enviar se guarda en la tabla «cuestionario»
// de Supabase y se pasa a /cuestionario/enviado.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NavReserva from "@/components/NavReserva";
import PiePagina from "@/components/PiePagina";
import { useIdioma } from "@/components/Idioma";
import { api } from "@/lib/borrador";
import { CORREO_VALIDO } from "@/lib/config";

const TEXTOS = {
  es: {
    etiqueta: "Tu opinión nos importa", titulo: "Cuestionario",
    intro: "Acabas de salir del retiro. Antes de que se desvanezca el recuerdo, cuéntanos cómo lo has vivido. Es anónimo y no lleva más de un minuto.",
    preguntas: {
      general: "¿Cuánto te ha gustado la experiencia en general?",
      ambientacion: "¿Cómo valorarías la ambientación y la decoración?",
      dificultad: "¿Qué te ha parecido la dificultad de las pruebas?",
      originalidad: "¿Cómo valorarías la originalidad de las pruebas?",
      inmersion: "¿Cómo valorarías la inmersión y la sensación de estar dentro de la historia?",
      duracion: "¿Qué te ha parecido la duración de la experiencia?",
    },
    estrellas: (n) => (n === 1 ? "1 estrella" : `${n} estrellas`),
    correoTitulo: "Tu correo de ESADA",
    correoNota: "Solo para saber que ya has respondido (y no escribirte para pedírtelo). Tus respuestas son anónimas.",
    correoMal: "Escribe tu correo de ESADA (nombreapellido@alumnado.esada.es).",
    dificultadEtiquetas: { 0: "Muy fácil", 5: "Muy difícil" },
    duracionEtiquetas: { 0: "Muy corta", 3: "Genial", 5: "Muy larga" },
    enviar: "Enviar encuesta", enviando: "Enviando…",
    faltan: (n) => (n === 1 ? "Falta 1 pregunta por responder." : `Faltan ${n} preguntas por responder.`),
  },
  en: {
    etiqueta: "Your opinion matters", titulo: "Questionnaire",
    intro: "You've just left the retreat. Before the memory fades, tell us what it was like for you. It's anonymous and takes less than a minute.",
    preguntas: {
      general: "How much did you enjoy the experience overall?",
      ambientacion: "How would you rate the atmosphere and the set design?",
      dificultad: "How difficult were the challenges?",
      originalidad: "How would you rate the originality of the challenges?",
      inmersion: "How would you rate the immersion and the feeling of being inside the story?",
      duracion: "What did you think of the length of the experience?",
    },
    estrellas: (n) => (n === 1 ? "1 star" : `${n} stars`),
    correoTitulo: "Your ESADA email",
    correoNota: "Only so we know you've answered (and don't write to ask you). Your answers are anonymous.",
    correoMal: "Type your ESADA email (nameSurname@alumnado.esada.es).",
    dificultadEtiquetas: { 0: "Very easy", 5: "Very hard" },
    duracionEtiquetas: { 0: "Too short", 3: "Just right", 5: "Too long" },
    enviar: "Send survey", enviando: "Sending…",
    faltan: (n) => (n === 1 ? "1 question left to answer." : `${n} questions left to answer.`),
  },
};

// Orden de las preguntas y su tipo («estrellas» de 1 a 5 o «escala» de 0 a 5)
const PREGUNTAS = [
  { clave: "general", tipo: "estrellas" },
  { clave: "ambientacion", tipo: "estrellas" },
  { clave: "dificultad", tipo: "escala", etiquetas: "dificultadEtiquetas" },
  { clave: "originalidad", tipo: "estrellas" },
  { clave: "inmersion", tipo: "estrellas" },
  { clave: "duracion", tipo: "escala", etiquetas: "duracionEtiquetas" },
];

// Estrella de cinco puntas con el contorno crema (se rellena cuando está elegida)
function Estrella() {
  return (
    <svg className="cues-estrella__svg" width="44" height="42" viewBox="0 0 44 42" aria-hidden="true">
      <path d="M22 2.5l5.9 12.3 13.5 1.8-9.9 9.3 2.5 13.4L22 32.8 10 39.3l2.5-13.4-9.9-9.3 13.5-1.8z" />
    </svg>
  );
}

// Pregunta con 5 estrellas
function PreguntaEstrellas({ clave, valor, alElegir, t }) {
  // «encima» es la estrella sobre la que está el ratón, para ver cómo quedaría antes de pulsar
  const [encima, setEncima] = useState(0);
  const mostrado = encima || valor || 0;
  return (
    <div className="cues-estrellas" onMouseLeave={() => setEncima(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className={`cues-estrella ${n <= mostrado ? "is-llena" : ""}`} onMouseEnter={() => setEncima(n)}>
          <input type="radio" name={clave} value={n} required checked={valor === n} onChange={() => alElegir(n)} />
          <Estrella />
          <span className="visually-hidden">{t.estrellas(n)}</span>
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
  const tarjetas = useRef({});
  // Quién responde: con el enlace personal del correo (?t=…) ya se sabe; si no (QR de la sala), se pide el correo
  const [token, setToken] = useState(null);
  const [correo, setCorreo] = useState("");
  const [correoFalta, setCorreoFalta] = useState(false);

  useEffect(() => {
    const enlace = new URLSearchParams(window.location.search).get("t");
    if (enlace) return setToken(enlace);
    // Si ya había entrado en la web con su correo, se rellena solo
    api("/api/sesion").then((r) => r?.email && setCorreo((c) => c || r.email));
  }, []);

  const pendientes = PREGUNTAS.filter((p) => respuestas[p.clave] === undefined);

  // Baja suavemente hasta una pregunta
  function irA(clave) {
    tarjetas.current[clave]?.scrollIntoView({ behavior: "smooth", block: "center" });
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
    if (!token && !CORREO_VALIDO.test(correo.trim())) {
      setCorreoFalta(true);
      setMensaje(t.correoMal);
      return tarjetas.current.correo?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (pendientes.length > 0) {
      setMarcadas(true);
      setMensaje(t.faltan(pendientes.length));
      return irA(pendientes[0].clave);
    }
    setEnviando(true);
    const r = await api("/api/cuestionario", { metodo: "POST", datos: { ...respuestas, idioma, token, email: token ? undefined : correo.trim() } });
    if (!r.ok) {
      setEnviando(false);
      return setMensaje(r.mensaje);
    }
    router.push("/cuestionario/enviado");
  }

  return (
    <>
      <NavReserva />
      <main className="cues" data-fondo="oscuro">
        <header className="cues__encabezado" data-principal>
          <p className="cues__etiqueta">{t.etiqueta}</p>
          <h1 className="cues__titulo">{t.titulo}</h1>
          <p className="cues__intro">{t.intro}</p>
        </header>

        <form className="cues__formulario" onSubmit={enviar} noValidate>
          {/* Correo de ESADA (no sale si se llega desde el enlace del correo) */}
          {!token && (
            <section ref={(el) => (tarjetas.current.correo = el)} className={`cues-tarjeta cues-tarjeta--correo ${correoFalta && !CORREO_VALIDO.test(correo.trim()) ? "is-falta" : ""}`}>
              <label className="cues-tarjeta__titulo" htmlFor="cues-correo">{t.correoTitulo}</label>
              <input
                id="cues-correo"
                className="cues-correo"
                type="email"
                autoComplete="email"
                placeholder="nombreapellido@alumnado.esada.es"
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value);
                  setMensaje("");
                }}
              />
              <p className="cues-correo__nota">{t.correoNota}</p>
            </section>
          )}
          {PREGUNTAS.map((p, i) => (
            <section
              key={p.clave}
              ref={(el) => (tarjetas.current[p.clave] = el)}
              className={`cues-tarjeta ${marcadas && respuestas[p.clave] === undefined ? "is-falta" : ""}`}
              role="group"
              aria-labelledby={`pregunta-${p.clave}`}
            >
              <h2 className="cues-tarjeta__titulo" id={`pregunta-${p.clave}`}>
                <span className="visually-hidden">{i + 1}. </span>
                {t.preguntas[p.clave]}
              </h2>
              {p.tipo === "estrellas" ? (
                <PreguntaEstrellas clave={p.clave} valor={respuestas[p.clave]} alElegir={(n) => elegir(i, n)} t={t} />
              ) : (
                <PreguntaEscala clave={p.clave} valor={respuestas[p.clave]} alElegir={(n) => elegir(i, n)} etiquetas={t[p.etiquetas]} />
              )}
            </section>
          ))}

          <div className="cues__enviar">
            <button type="submit" className="cues__boton" disabled={enviando}>
              {enviando ? t.enviando : t.enviar}
            </button>
            <p className="cues__mensaje" role="status" aria-live="polite">{mensaje}</p>
          </div>
        </form>
      </main>
      <PiePagina />
    </>
  );
}
