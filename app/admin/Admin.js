"use client";
// Página del equipo (/admin).
// 1) Sin la llave: tarjeta para entrar con el correo del equipo (lilium@esada.es) y la contraseña,
//    o con otro correo de la lista ADMIN_CORREOS de Vercel y un código que le llega por correo.
// 2) Con la llave: el panel del día del retiro → plazas, y cada sala con sus grupos y personas.
//    En cada persona: «¿Ha venido?» (Sí / No, lo marca el equipo en la puerta) y «¿Ha valorado?»
//    (se apunta solo cuando rellena el cuestionario; si no, al día siguiente le llega un correo).
//    El «Sí» de «¿Ha venido?» se marca solo al escanear su QR en la puerta (con la hora); en las salas con
//    hueco (y en los turnos vacíos), «+ Añadir integrante» para quien llega sin reserva.
// Antes de la apertura (30 de octubre), la llave también sirve para ver y probar la web.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import NavReserva from "@/components/NavReserva";
import PiePagina from "@/components/PiePagina";
import { api } from "@/lib/borrador";
import { useEspera } from "@/lib/useEspera";
import { ADMIN_CORREO, APERTURA, EVENTO, MAX_PERSONAS, ORIGENES, esProfesorado, plazaProfeGuardada } from "@/lib/config";
import { useTextos } from "@/components/Idioma";

const TEXTOS = {
  es: {
    etiqueta: "EQUIPO LILIUM", titulo: "Solo para el equipo",
    intro: "Escribe tu correo. Con el del equipo (lilium@esada.es) se pide la contraseña; con el tuyo, si tienes acceso, te llega un código.",
    codigo: "Código de 6 cifras", pedirCodigo: "Enviarme un código", otroCorreo: "Usar otro correo", demo: "Código de prueba:",
    pistaCorreo: "tu correo (por ejemplo, lilium@esada.es)", pistaClave: "contraseña del equipo", pistaCodigo: "******",
    reenviar: "Reenviar código", reenviarEn: (n) => `Podrás pedir otro código en ${n} s`,
    codigoEnviado: (c) => `Si ${c} tiene acceso al panel, le acabamos de enviar un correo con el asunto «Código para el panel del equipo de Lilium». Escribe aquí ese código (caduca en 10 minutos).`,
    correo: "Tu correo", clave: "Contraseña", comprobando: "Comprobando…", entrar: "Entrar",
    entrando: "Entrando en el panel…", cargandoPanel: "Cargando el panel…", reintentar: "Reintentar",
    sinPanel: (m) => `Has entrado bien, pero el panel no ha cargado: ${m}`,
    volver: "← Volver a la web", falta: "Escribe el correo y la contraseña.",
    panelEtiqueta: "ADMIN", panelTitulo: "Panel del retiro",
    plazas: "Plazas totales", ocupadas: "Reservadas", libres: "Libres", confirmadas: "Confirmadas",
    asistieron: "Han venido", valoraron: "Han valorado", grupos: "grupos",
    buscar: "Buscar por correo…", actualizar: "Actualizar", salir: "Salir", probar: "Probar la web", irWeb: "Ir a la web",
    sinReservas: "Todavía no hay ninguna reserva.", sinResultados: "Ningún correo coincide con la búsqueda.",
    salasVacias: (n) => (n === 1 ? "1 turno sin reservas" : `${n} turnos sin reservas`),
    cola: (c) => `Sala de espera ahora mismo: ${c.dentro} ${c.dentro === 1 ? "persona" : "personas"} en la web y ${c.esperando} en la cola (caben ${c.aforo} a la vez).`,
    salaSinNombre: "Sin nombre", erasmus: "Erasmus", grupo: (n) => `Grupo ${n}`, notas: "Anotaciones",
    sinDueno: "Palabras de la frase que no tiene nadie (dádselas el día del retiro):",
    noVinieron: "Palabras de quien no ha venido (dádselas al grupo):", palabraTitulo: "Su palabra de la frase secreta",
    persona: "Persona", estado: "Estado", vino: "¿Ha venido?", valoro: "¿Ha valorado?",
    lider: "Líder", confirmada: "Confirmada", pendiente: "Sin confirmar", enPuerta: "✓ En la puerta",
    aLas: (h) => `a las ${h}`, turnosVacios: "Turnos sin reservas", profesorado: "Profesorado", plazaProfe: "1 plaza guardada para profesorado", correo: "Correo", plazasCorto: "plazas",
    sinEscanear: "— Sin escanear", noVino: "✕ No vino", marcarSi: "Marcar que ha venido", marcarNo: "Marcar que no ha venido",
    si: "Sí", no: "No", valorado: "Sí", noValorado: "Todavía no", correoEnviado: "Correo enviado",
    errorGuardar: "No se ha podido guardar. Inténtalo de nuevo.",
    leyenda: "«¿Ha venido?» se marca «Sí» solo al escanear el QR de su entrada en la puerta (con este panel abierto en el móvil); también se puede marcar a mano. «¿Ha valorado?» se marca sola cuando la persona rellena el cuestionario (QR de la sala). Si no lo hace, al día siguiente del retiro le llega un correo pidiéndoselo.",
    // Borrar reservas de prueba (solo antes de la apertura)
    borrarTitulo: "Borrar reservas de prueba",
    borrarTexto: "Antes de abrir la web, vacía todas las reservas de prueba para empezar de cero. Los turnos se quedan igual. Este recuadro desaparece solo el 30 de octubre a las 12:00.",
    borrarBoton: "Borrar reservas de prueba",
    borrarAviso: (n) => `Vas a borrar ${n === 1 ? "1 persona apuntada" : `${n} personas apuntadas`}, todas las reservas, la lista de espera y los nombres de equipo. No se puede deshacer.`,
    borrarCuestionario: "Borrar también las respuestas del cuestionario",
    borrarEscribe: "Para confirmar, escribe BORRAR en mayúsculas:",
    borrarSi: "Sí, borrar todo", borrando: "Borrando…", borrarNo: "Cancelar",
    borrado: (n, r) => `Listo: se han borrado ${n === 1 ? "1 persona" : `${n} personas`} de las reservas${r ? ` y ${r === 1 ? "1 respuesta" : `${r} respuestas`} del cuestionario` : ""}. La web está vacía para la apertura.`,
    // Valoraciones (respuestas del cuestionario)
    verLlegadas: (a, n) => `${a} de ${n} han llegado`,
    verAnadir: (h) => `+ Añadir integrante (${h} ${h === 1 ? "plaza libre" : "plazas libres"})`,
    verPista: "correo de quien llega sin reserva", verGuardar: "Añadir", verCancelar: "Cancelar", verAnadiendo: "Añadiendo…",
    verNotaAnadir: "Queda con la plaza confirmada y la asistencia marcada.",
    valTitulo: "Valoraciones", valCargando: "Cargando las valoraciones…",
    valIntro: "Respuestas del cuestionario de después de la experiencia. Son anónimas: no se sabe quién ha contestado qué.",
    valNinguna: "Todavía no ha respondido nadie al cuestionario.",
    valRespuestas: (n) => (n === 1 ? "1 respuesta" : `${n} respuestas`), valMedia: "Media",
    valDescargar: "Descargar respuestas (Excel)", valError: "No se han podido cargar las valoraciones.",
    valPersonas: (n) => (n === 1 ? "1 persona" : `${n} personas`),
    preguntas: { general: "Experiencia en general", ambientacion: "Ambientación y decoración", dificultad: "Dificultad de las pruebas",
      originalidad: "Originalidad de las pruebas", inmersion: "Inmersión en la historia", duracion: "Duración" },
    escalas: { dificultad: "1 = muy fácil · 5 = muy difícil", duracion: "1 = muy corta · 3 = genial · 5 = muy larga" },
    columnas: { creada: "Fecha", idioma: "Idioma", turno: "Turno", origen: "Cómo se enteró", comentario: "Notas" },
    notasTitulo: "Notas", notasNinguna: "Todavía nadie ha dejado una nota (son opcionales).",
    notasCuenta: (n) => (n === 1 ? "1 persona ha dejado una nota" : `${n} personas han dejado una nota`),
    datoCategoria: "eligieron esta", origenes: { instagram: "Instagram", amigas: "Amigas o clase", carteles: "Carteles en ESADA", correo: "Correo de ESADA", otro: "Otro" },
    mediaGeneral: "Media general", deCinco: "de 5", mediaNota: "Media de las 4 preguntas de estrellas",
    mediasTitulo: "La media de cada pregunta", mediasNota: "Dificultad y duración van aparte: ahí más alto no es mejor.",
    tarjetasTitulo: "Pregunta a pregunta", preguntaDe: (i, n) => `Pregunta ${i} de ${n}`,
    anterior: "Pregunta anterior", siguiente: "Pregunta siguiente", irA: (i) => `Ir a la pregunta ${i}`,
    repartoTitulo: "Cuántas personas eligieron cada nota", repartoOpciones: "Cuántas personas eligieron cada opción", masElegida: "la más elegida",
    datoEstrellas: "dieron 5 ★", datoDificultad: "la vieron difícil (4–5)", datoDuracion: "dijeron «genial» (3)",
    textoPregunta: { turno: "¿En qué turno has estado?", origen: "¿Cómo te enteraste de Lilium?", general: "¿Cuánto te ha gustado la experiencia en general?", ambientacion: "¿Cómo valorarías la ambientación y la decoración?",
      dificultad: "¿Qué te ha parecido la dificultad de las pruebas?", originalidad: "¿Cómo valorarías la originalidad de las pruebas?",
      inmersion: "¿Cómo valorarías la inmersión y la sensación de estar dentro de la historia?", duracion: "¿Qué te ha parecido la duración de la experiencia?" },
  },
  en: {
    etiqueta: "LILIUM TEAM", titulo: "Team only",
    intro: "Type your email. The team one (lilium@esada.es) asks for the password; with yours, if you have access, you'll get a code.",
    codigo: "6-digit code", pedirCodigo: "Send me a code", otroCorreo: "Use another email", demo: "Test code:",
    pistaCorreo: "your email (for example, lilium@esada.es)", pistaClave: "team password", pistaCodigo: "******",
    reenviar: "Resend code", reenviarEn: (n) => `You can ask for another code in ${n} s`,
    codigoEnviado: (c) => `If ${c} has access to the dashboard, we've just sent it an email with the subject “Código para el panel del equipo de Lilium”. Type that code here (it expires in 10 minutes).`,
    correo: "Your email", clave: "Password", comprobando: "Checking…", entrar: "Sign in",
    entrando: "Opening the dashboard…", cargandoPanel: "Loading the dashboard…", reintentar: "Try again",
    sinPanel: (m) => `You're signed in, but the dashboard didn't load: ${m}`,
    volver: "← Back to the website", falta: "Type the email and the password.",
    panelEtiqueta: "ADMIN", panelTitulo: "Retreat dashboard",
    plazas: "Total places", ocupadas: "Booked", libres: "Free", confirmadas: "Confirmed",
    asistieron: "Attended", valoraron: "Rated", grupos: "groups",
    buscar: "Search by email…", actualizar: "Refresh", salir: "Sign out", probar: "Try the website", irWeb: "Go to the website",
    sinReservas: "There are no bookings yet.", sinResultados: "No email matches your search.",
    salasVacias: (n) => (n === 1 ? "1 session without bookings" : `${n} sessions without bookings`),
    cola: (c) => `Waiting room right now: ${c.dentro} ${c.dentro === 1 ? "person" : "people"} on the site and ${c.esperando} in the queue (${c.aforo} fit at once).`,
    salaSinNombre: "No name", erasmus: "Erasmus", grupo: (n) => `Group ${n}`, notas: "Notes",
    sinDueno: "Words of the phrase nobody has (hand them out on the day):",
    noVinieron: "Words of people who didn't come (give them to the group):", palabraTitulo: "Their word of the secret phrase",
    persona: "Person", estado: "Status", vino: "Attended?", valoro: "Rated?",
    lider: "Leader", confirmada: "Confirmed", pendiente: "Not confirmed", enPuerta: "✓ At the door",
    aLas: (h) => `at ${h}`, turnosVacios: "Sessions without bookings", profesorado: "Teaching staff", plazaProfe: "1 place kept for teaching staff", correo: "Email", plazasCorto: "places",
    sinEscanear: "— Not scanned", noVino: "✕ Didn't come", marcarSi: "Mark as attended", marcarNo: "Mark as not attended",
    si: "Yes", no: "No", valorado: "Yes", noValorado: "Not yet", correoEnviado: "Email sent",
    errorGuardar: "Couldn't save. Try again.",
    leyenda: "“Attended?” is set to “Yes” automatically when their ticket QR is scanned at the door (with this dashboard open on the phone); it can also be ticked by hand. “Rated?” is ticked automatically when the person fills in the questionnaire (QR in the room). If they don't, they get an email the day after the retreat asking them to.",
    borrarTitulo: "Delete test bookings",
    borrarTexto: "Before opening the website, empty all test bookings to start from scratch. Sessions stay the same. This box disappears on 30 October at 12:00.",
    borrarBoton: "Delete test bookings",
    borrarAviso: (n) => `You're about to delete ${n === 1 ? "1 booked person" : `${n} booked people`}, every booking, the waiting list and team names. This can't be undone.`,
    borrarCuestionario: "Also delete the questionnaire answers",
    borrarEscribe: "To confirm, type BORRAR in capitals:",
    borrarSi: "Yes, delete everything", borrando: "Deleting…", borrarNo: "Cancel",
    borrado: (n, r) => `Done: ${n === 1 ? "1 person" : `${n} people`} removed from bookings${r ? ` and ${r === 1 ? "1 answer" : `${r} answers`} from the questionnaire` : ""}. The website is empty for the opening.`,
    verLlegadas: (a, n) => `${a} of ${n} have arrived`,
    verAnadir: (h) => `+ Add member (${h} ${h === 1 ? "place" : "places"} free)`,
    verPista: "email of the person without a booking", verGuardar: "Add", verCancelar: "Cancel", verAnadiendo: "Adding…",
    verNotaAnadir: "Their place is confirmed and their attendance ticked.",
    valTitulo: "Ratings", valCargando: "Loading the ratings…",
    valIntro: "Answers to the after-experience questionnaire. They're anonymous: there's no way to know who answered what.",
    valNinguna: "Nobody has answered the questionnaire yet.",
    valRespuestas: (n) => (n === 1 ? "1 answer" : `${n} answers`), valMedia: "Average",
    valDescargar: "Download answers (Excel)", valError: "Couldn't load the ratings.",
    valPersonas: (n) => (n === 1 ? "1 person" : `${n} people`),
    preguntas: { general: "Overall experience", ambientacion: "Atmosphere and set design", dificultad: "Difficulty of the challenges",
      originalidad: "Originality of the challenges", inmersion: "Immersion in the story", duracion: "Length" },
    escalas: { dificultad: "1 = very easy · 5 = very hard", duracion: "1 = too short · 3 = just right · 5 = too long" },
    columnas: { creada: "Date", idioma: "Language", turno: "Session", origen: "How they heard", comentario: "Notes" },
    notasTitulo: "Notes", notasNinguna: "Nobody has left a note yet (they're optional).",
    notasCuenta: (n) => (n === 1 ? "1 person left a note" : `${n} people left a note`),
    datoCategoria: "chose this", origenes: { instagram: "Instagram", amigas: "Friends or classmates", carteles: "Posters at ESADA", correo: "ESADA email", otro: "Other" },
    mediaGeneral: "Overall average", deCinco: "out of 5", mediaNota: "Average of the 4 star questions",
    mediasTitulo: "Average of each question", mediasNota: "Difficulty and length are shown apart: higher isn't better there.",
    tarjetasTitulo: "Question by question", preguntaDe: (i, n) => `Question ${i} of ${n}`,
    anterior: "Previous question", siguiente: "Next question", irA: (i) => `Go to question ${i}`,
    repartoTitulo: "How many people chose each rating", repartoOpciones: "How many people chose each option", masElegida: "most chosen",
    datoEstrellas: "gave 5 ★", datoDificultad: "found it hard (4–5)", datoDuracion: "said “just right” (3)",
    textoPregunta: { turno: "Which session were you in?", origen: "How did you hear about Lilium?", general: "How much did you enjoy the experience overall?", ambientacion: "How would you rate the atmosphere and the set design?",
      dificultad: "How difficult were the challenges?", originalidad: "How would you rate the originality of the challenges?",
      inmersion: "How would you rate the immersion and the feeling of being inside the story?", duracion: "What did you think of the length of the experience?" },
  },
};

// Cada cuánto se vuelve a pedir la lista (así todo el equipo ve lo que marcan las demás)
const REFRESCO_MS = 30000;

export default function Admin() {
  const t = useTextos(TEXTOS);
  const [estado, setEstado] = useState("cargando"); // cargando | fuera | dentro
  const [datos, setDatos] = useState(null);
  const [aviso, setAviso] = useState("");

  // Pide los datos del panel. Devuelve la respuesta para que quien llama sepa si ha ido bien.
  //  · Sin llave (no ha entrado): se enseña el formulario para entrar.
  //  · Otro fallo (servidor lento, sin conexión…): si ya se veía el panel, se queda; si no, el
  //    formulario lo explica con un mensaje (antes se quedaba callado y parecía que no dejaba entrar).
  const cargar = useCallback(async () => {
    const r = await api("/api/admin/panel");
    if (r.ok) {
      setDatos(r);
      setEstado("dentro");
    } else {
      const sinLlave = /equipo/.test(r.mensaje || "");
      setEstado((e) => (e === "dentro" && !sinLlave ? e : "fuera"));
    }
    return r;
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (estado !== "dentro") return;
    const id = setInterval(cargar, REFRESCO_MS);
    return () => clearInterval(id);
  }, [estado, cargar]);

  async function salir() {
    await api("/api/acceso/admin", { metodo: "DELETE" });
    setDatos(null);
    setEstado("fuera");
  }

  // Marca «¿Ha venido?» al momento en pantalla y lo guarda; si falla, lo deja como estaba
  async function marcar(email, valor) {
    const antes = datos;
    setDatos((d) => cambiarPersona(d, email, { asistio: valor }));
    const r = await api("/api/admin/asistencia", { metodo: "POST", datos: { email, asistio: valor } });
    if (!r.ok) {
      setDatos(antes);
      setAviso(r.mensaje || t.errorGuardar);
    } else setAviso("");
  }

  if (estado === "cargando") {
    return (
      <main className="previa">
        <p className="previa__cargando" role="status">{t.cargandoPanel}</p>
      </main>
    );
  }
  if (estado === "fuera") return <Entrar t={t} alEntrar={cargar} />;
  return <Panel t={t} datos={datos} aviso={aviso} marcar={marcar} actualizar={cargar} salir={salir} />;
}

/** Copia de los datos con una persona cambiada */
function cambiarPersona(datos, email, cambios) {
  return {
    ...datos,
    salas: datos.salas.map((s) => ({
      ...s,
      grupos: s.grupos.map((g) => ({ ...g, personas: g.personas.map((p) => (p.email === email ? { ...p, ...cambios } : p)) })),
    })),
    totales: (() => {
      const todas = datos.salas.flatMap((s) => s.grupos.flatMap((g) => g.personas.map((p) => (p.email === email ? { ...p, ...cambios } : p))));
      return { ...datos.totales, asistieron: todas.filter((p) => p.asistio === true).length };
    })(),
  };
}

/* ---------- Entrar ---------- */
// Con lilium@esada.es se pide la contraseña. Con cualquier otro correo del equipo (lista ADMIN_CORREOS
// de Vercel) no hay contraseña: le llega un código de 6 cifras al correo y lo escribe aquí.
function Entrar({ t, alEntrar }) {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [codigo, setCodigo] = useState("");
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [demo, setDemo] = useState(""); // solo en pruebas en el ordenador
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [entrando, setEntrando] = useState(false); // ya ha entrado y se está cargando el panel
  const [dentroSinPanel, setDentroSinPanel] = useState(false); // entró, pero el panel falló: botón «Reintentar»
  const [espera, empezarEspera] = useEspera(); // segundos para poder pedir otro código
  const conClave = correo.trim().toLowerCase() === ADMIN_CORREO;

  async function entrar(e) {
    e.preventDefault();
    setError("");
    if (!correo.trim()) return setError(t.falta);

    // 1) Correo del equipo con contraseña
    if (conClave) {
      if (!clave) return setError(t.falta);
      setEnviando(true);
      const res = await api("/api/acceso/admin", { metodo: "POST", datos: { email: correo.trim(), clave } });
      if (!res.ok) {
        setEnviando(false);
        return setError(res.mensaje);
      }
      return abrirPanel();
    }

    // 2) Otro correo: primero se pide el código…
    if (!codigoEnviado) return pedirCodigo();
    // …y luego se comprueba
    setEnviando(true);
    const res = await api("/api/acceso/admin/verificar", { metodo: "POST", datos: { email: correo.trim(), codigo: codigo.trim() } });
    if (!res.ok) {
      setEnviando(false);
      return setError(res.mensaje);
    }
    return abrirPanel();
  }

  // La contraseña (o el código) es correcta: se cargan los datos del panel. Mientras, el botón dice
  // «Entrando en el panel…»; si fallan, se explica y se puede reintentar sin volver a escribir nada.
  async function abrirPanel() {
    setEntrando(true);
    setError("");
    const r = await alEntrar();
    setEnviando(false);
    setEntrando(false);
    if (!r.ok) {
      setDentroSinPanel(true);
      setError(t.sinPanel(r.mensaje || t.errorGuardar));
    }
  }

  async function pedirCodigo() {
    if (espera > 0) return;
    setEnviando(true);
    const res = await api("/api/acceso/admin/codigo", { metodo: "POST", datos: { email: correo.trim() } });
    setEnviando(false);
    if (!res.ok) return setError(res.mensaje);
    setError("");
    setCodigoEnviado(true);
    empezarEspera(10);
    if (res.codigoDemo) setDemo(res.codigoDemo);
  }

  return (
    <main className="previa">
      <section className="acceso previa__tarjeta" aria-labelledby="previa-titulo">
        <img className="previa__logo" src="/assets/img/logo-lilium.webp" width="198" height="118" alt="Lilium" />
        <p className="acceso__etiqueta">{t.etiqueta}</p>
        <h1 className="acceso__titulo" id="previa-titulo">{t.titulo}</h1>
        <p className="acceso__intro">{codigoEnviado ? t.codigoEnviado(correo.trim()) : t.intro}</p>
        <form onSubmit={entrar} noValidate>
          <label htmlFor="admin-correo">{t.correo}</label>
          <input className="campo" id="admin-correo" type="email" autoComplete="username" placeholder={t.pistaCorreo}
            value={correo} disabled={codigoEnviado} onChange={(e) => setCorreo(e.target.value)} />
          {conClave && (
            <>
              <label htmlFor="admin-clave">{t.clave}</label>
              <input className="campo" id="admin-clave" type="password" autoComplete="current-password" placeholder={t.pistaClave}
                value={clave} onChange={(e) => setClave(e.target.value)} aria-describedby="admin-error" />
            </>
          )}
          {codigoEnviado && (
            <>
              <label htmlFor="admin-codigo">{t.codigo}</label>
              <input className="campo campo--codigo" id="admin-codigo" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder={t.pistaCodigo}
                value={codigo} onChange={(e) => setCodigo(e.target.value)} aria-describedby="admin-error" />
              {demo && <p className="acceso__demo">{t.demo} {demo}</p>}
            </>
          )}
          <p className="error" id="admin-error" role="alert">{error}</p>
          {dentroSinPanel ? (
            <button className="boton" type="button" disabled={enviando} onClick={() => { setEnviando(true); abrirPanel(); }}>
              {enviando ? t.entrando : t.reintentar}
            </button>
          ) : (
            <button className="boton" type="submit" disabled={enviando}>
              {entrando ? t.entrando : enviando ? t.comprobando : conClave || codigoEnviado ? t.entrar : t.pedirCodigo}
            </button>
          )}
        </form>
        {codigoEnviado ? (
          <p className="previa__enlaces">
            <button type="button" className="previa__volver" onClick={pedirCodigo} disabled={espera > 0} aria-live="polite">
              {espera > 0 ? t.reenviarEn(espera) : t.reenviar}
            </button>
            <button type="button" className="previa__volver" onClick={() => { setCodigoEnviado(false); setCodigo(""); setDemo(""); }}>{t.otroCorreo}</button>
          </p>
        ) : (
          <Link className="previa__volver" href="/">{t.volver}</Link>
        )}
      </section>
    </main>
  );
}

/* ---------- Panel ---------- */
function Panel({ t, datos, aviso, marcar, actualizar, salir }) {
  const [busca, setBusca] = useState("");
  const { totales } = datos;
  const antesDeAbrir = Date.now() < APERTURA.getTime();

  // Solo las salas con gente; con la búsqueda, solo las personas cuyo correo coincide
  const salas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return datos.salas
      .filter((s) => s.ocupadas > 0)
      .map((s) => ({
        ...s,
        grupos: s.grupos
          .map((g) => ({ ...g, personas: q ? g.personas.filter((p) => p.email.includes(q)) : g.personas }))
          .filter((g) => g.personas.length > 0),
      }))
      .filter((s) => s.grupos.length > 0);
  }, [datos, busca]);
  const vacias = datos.salas.filter((s) => s.ocupadas === 0).length;
  const lleno = totales.plazas ? Math.round((totales.ocupadas / totales.plazas) * 100) : 0;

  return (
    <>
      <NavReserva />
      <main className="panel">
        <header className="panel__cabecera">
          <p className="panel__etiqueta">{t.panelEtiqueta} · {EVENTO.fechaTexto}</p>
          <h1 className="panel__titulo">{t.panelTitulo}</h1>
          <div className="panel__acciones">
            <button type="button" className="ll-btn ll-btn--md ll-btn--secondary" onClick={actualizar}>{t.actualizar}</button>
            {/* Ir a la web: si ya hay sesión (entró con su código) va directa al inicio; si no, middleware la manda a /acceso */}
            <a className="ll-btn ll-btn--md ll-btn--secondary" href="/inicio">{antesDeAbrir ? t.probar : t.irWeb}</a>
            <button type="button" className="ll-btn ll-btn--md ll-btn--primary" onClick={salir}>{t.salir}</button>
          </div>
        </header>

        {/* Plazas y totales */}
        <section className="panel__totales" aria-label={t.plazas}>
          <Cifra etiqueta={t.plazas} valor={totales.plazas} />
          <Cifra etiqueta={t.ocupadas} valor={totales.ocupadas} nota={`${totales.grupos} ${t.grupos}`} destacada />
          <Cifra etiqueta={t.libres} valor={totales.libres} />
          <Cifra etiqueta={t.confirmadas} valor={totales.confirmadas} />
          <Cifra etiqueta={t.asistieron} valor={totales.asistieron} />
          <Cifra etiqueta={t.valoraron} valor={totales.valoraron} />
        </section>
        <div className="panel__barra" role="img" aria-label={`${lleno} %`}>
          <span style={{ width: `${lleno}%` }} />
        </div>

        <div className="panel__buscar">
          <input className="panel__busqueda" type="search" placeholder={t.buscar} value={busca} onChange={(e) => setBusca(e.target.value)} />
          {vacias > 0 && <p className="panel__vacias">{t.salasVacias(vacias)}</p>}
          {datos.cola?.aforo > 0 && <p className="panel__vacias">{t.cola(datos.cola)}</p>}
        </div>
        <p className="panel__aviso" role="status" aria-live="polite">{aviso}</p>

        {salas.length === 0 && <p className="panel__nada">{busca ? t.sinResultados : t.sinReservas}</p>}

        <div className="panel__salas">
          {salas.map((s) => (
            <section className="sv" key={s.id} aria-labelledby={`sala-${s.id}`}>
              {/* Cabecera granate: hora, nombre del grupo, plazas y cuántas han llegado */}
              <header className="sv__cabeza">
                <h2 id={`sala-${s.id}`} className="sv__titulo">
                  {s.inicio}–{s.fin} · “{s.equipo || t.salaSinNombre}”
                  {s.erasmus && <span className="sv__badge">{t.erasmus}</span>}
                </h2>
                <p className="sv__cuenta">
                  {t.verLlegadas(s.grupos.flatMap((g) => g.personas).filter((p) => p.asistio === true).length, s.ocupadas)}
                  <span> · {s.ocupadas}/{MAX_PERSONAS} {t.plazasCorto}</span>
                  {/* Hasta el 2 de noviembre a las 12:00, si nadie del profesorado ha entrado, su plaza sigue guardada */}
                  {plazaProfeGuardada() && s.ocupadas < MAX_PERSONAS && !s.grupos.some((g) => g.personas.some((p) => esProfesorado(p.email))) && (
                    <span> · {t.plazaProfe}</span>
                  )}
                </p>
              </header>

              {s.grupos.map((g, n) => (
                <Grupo key={g.id} t={t} grupo={g} numero={s.grupos.length > 1 ? n + 1 : null} marcar={marcar} />
              ))}
              <div className="sv__pie">
              {/* Quien está marcado como «No ha venido»: su palabra falta en la sala */}
              {(() => {
                const faltan = s.grupos.flatMap((g) => g.personas).filter((p) => p.asistio === false && p.fragmento).map((p) => p.fragmento);
                return faltan.length > 0 && (
                  <p className="panel-sala__fragmentos">
                    {t.noVinieron}{" "}
                    {faltan.map((f) => <b key={f.numero}>{f.numero} {f.palabra}</b>).reduce((a, b) => [a, " · ", b])}
                  </p>
                );
              })()}
              {/* Con menos de 6 personas, alguna palabra de la frase secreta se queda sin dueño */}
              {s.sinDueno?.length > 0 && (
                <p className="panel-sala__fragmentos">
                  {t.sinDueno}{" "}
                  {s.sinDueno.map((f) => <b key={f.numero}>{f.numero} {f.palabra}</b>).reduce((a, b) => [a, " · ", b])}
                </p>
              )}
              {/* Alguien llega sin reserva y queda sitio: se apunta aquí */}
              {s.ocupadas < MAX_PERSONAS && !busca && (
                <AnadirIntegrante t={t} sala={s} hueco={MAX_PERSONAS - s.ocupadas} alCambiar={actualizar} />
              )}
              </div>
            </section>
          ))}
        </div>

        {/* Turnos sin nadie: también se puede apuntar ahí a quien llega sin reserva */}
        {!busca && vacias > 0 && (
          <section className="panel-vacias" aria-labelledby="panel-vacias-titulo">
            <h2 id="panel-vacias-titulo" className="panel-vacias__titulo">{t.turnosVacios}</h2>
            {datos.salas.filter((s) => s.ocupadas === 0).map((s) => (
              <div key={s.id} className="panel-vacias__fila">
                <span className="panel-vacias__hora">{s.inicio}–{s.fin}{s.erasmus && <span className="ll-badge">{t.erasmus}</span>}</span>
                <AnadirIntegrante t={t} sala={s} hueco={MAX_PERSONAS} alCambiar={actualizar} />
              </div>
            ))}
          </section>
        )}

        <p className="panel__leyenda">{t.leyenda}</p>

        {/* Respuestas del cuestionario: medias, reparto y descarga */}
        <Valoraciones t={t} />

        {/* Solo antes de la apertura: vaciar las reservas de prueba */}
        {antesDeAbrir && <BorrarPruebas t={t} personas={totales.ocupadas} alBorrar={actualizar} />}
      </main>
      <PiePagina />
    </>
  );
}

/**
 * Recuadro «Borrar reservas de prueba» (solo se enseña antes de la apertura; el servidor también lo comprueba).
 * Pide confirmación en dos pasos: pulsar el botón y luego escribir BORRAR.
 */
function BorrarPruebas({ t, personas, alBorrar }) {
  const [abierto, setAbierto] = useState(false);
  const [palabra, setPalabra] = useState("");
  const [cuestionario, setCuestionario] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [fallo, setFallo] = useState("");

  function cerrar() {
    setAbierto(false);
    setPalabra("");
    setCuestionario(false);
    setFallo("");
  }

  async function borrar(e) {
    e.preventDefault();
    if (palabra !== "BORRAR") return;
    setBorrando(true);
    const r = await api("/api/admin/borrar-pruebas", { metodo: "POST", datos: { confirmacion: palabra, cuestionario } });
    setBorrando(false);
    if (!r.ok) return setFallo(r.mensaje || t.errorGuardar);
    cerrar();
    setMensaje(t.borrado(r.personas, r.respuestas));
    alBorrar(); // se vuelve a pedir la lista: ya sale vacía
  }

  return (
    <section className="panel-borrar" aria-labelledby="borrar-titulo">
      <h2 id="borrar-titulo" className="panel-borrar__titulo">{t.borrarTitulo}</h2>
      <p className="panel-borrar__texto">{t.borrarTexto}</p>
      {mensaje && <p className="panel-borrar__hecho" role="status">{mensaje}</p>}

      {!abierto ? (
        <button className="ll-btn ll-btn--md ll-btn--secondary panel-borrar__boton" type="button" onClick={() => { setMensaje(""); setAbierto(true); }}>
          {t.borrarBoton}
        </button>
      ) : (
        <form className="panel-borrar__confirmar" onSubmit={borrar}>
          <p className="panel-borrar__aviso">{t.borrarAviso(personas)}</p>
          <label className="panel-borrar__casilla">
            <input type="checkbox" checked={cuestionario} onChange={(e) => setCuestionario(e.target.checked)} />
            {t.borrarCuestionario}
          </label>
          <label className="panel-borrar__escribe" htmlFor="borrar-palabra">{t.borrarEscribe}</label>
          <input id="borrar-palabra" className="panel__busqueda" value={palabra} onChange={(e) => setPalabra(e.target.value)}
            autoComplete="off" placeholder="BORRAR" autoFocus />
          <div className="panel-borrar__botones">
            <button className="ll-btn ll-btn--md ll-btn--primary panel-borrar__peligro" type="submit" disabled={palabra !== "BORRAR" || borrando}>
              {borrando ? t.borrando : t.borrarSi}
            </button>
            <button className="ll-btn ll-btn--md ll-btn--secondary" type="button" onClick={cerrar} disabled={borrando}>{t.borrarNo}</button>
          </div>
          {fallo && <p className="panel__aviso" role="alert">{fallo}</p>}
        </form>
      )}
    </section>
  );
}

// Las 6 preguntas del cuestionario, en el mismo orden que en /cuestionario.
// «estrellas» van de 1 a 5; «escala» también de 1 a 5 (antes de 0 a 5; en la escala, más alto no es «mejor»).
// «dato»: el porcentaje destacado de su tarjeta (qué notas cuentan).
const PREGUNTAS = [
  { clave: "general", desde: 1, dato: [5] },
  { clave: "ambientacion", desde: 1, dato: [5] },
  { clave: "dificultad", desde: 1, escala: true, dato: [4, 5] },
  { clave: "originalidad", desde: 1, dato: [5] },
  { clave: "inmersion", desde: 1, dato: [5] },
  { clave: "duracion", desde: 1, escala: true, dato: [3] },
];

const coma = (x) => x.toFixed(1).replace(".", ","); // 4.6 → «4,6»
const porcentaje = (parte, total) => (total ? Math.round((parte / total) * 100) : 0);

/** Todo lo que se enseña de una pregunta: media, cuántas eligieron cada nota y su dato destacado */
function resumenPregunta(p, respuestas) {
  const valores = respuestas.map((r) => r[p.clave]);
  const n = valores.length;
  const numeros = Array.from({ length: 6 - p.desde }, (_, i) => 5 - i).filter((x) => x >= p.desde); // 5…1 o 5…0
  const cuentas = Object.fromEntries(numeros.map((x) => [x, valores.filter((v) => v === x).length]));
  const maximo = Math.max(...Object.values(cuentas));
  const masElegida = numeros.reduce((a, b) => (cuentas[b] > cuentas[a] ? b : a));
  return {
    n,
    media: valores.reduce((a, b) => a + b, 0) / n,
    numeros,
    cuentas,
    maximo,
    masElegida,
    dato: porcentaje(valores.filter((v) => p.dato.includes(v)).length, n),
  };
}

// Preguntas con botones (no son notas): en qué turno estuvo y cómo se enteró de Lilium.
// Solo cuentan las respuestas que las tienen (las primeras respuestas, de antes de añadirlas, no).
const minutos = (etiqueta) => {
  const [h, m] = String(etiqueta).split(/[:–]/).map(Number);
  return h * 60 + (m || 0);
};

/** Cuántas personas eligieron cada opción de una pregunta con botones */
function resumenCategoria(clave, respuestas) {
  const valores = respuestas.map((r) => r[clave]).filter(Boolean);
  const numeros = clave === "origen" ? ORIGENES : [...new Set(valores)].sort((a, b) => minutos(a) - minutos(b));
  const cuentas = Object.fromEntries(numeros.map((x) => [x, valores.filter((v) => v === x).length]));
  const maximo = Math.max(0, ...Object.values(cuentas));
  const masElegida = numeros.length ? numeros.reduce((a, b) => (cuentas[b] > cuentas[a] ? b : a)) : null;
  return { clave, categoria: true, n: valores.length, numeros, cuentas, maximo, masElegida, dato: porcentaje(cuentas[masElegida] || 0, valores.length) };
}

/**
 * Apartado «Valoraciones» del panel (solo admins). De arriba abajo:
 *  1) Media general (de las 4 preguntas de estrellas) en un anillo que se llena según la nota.
 *  2) Gráfica de barras con la media de cada pregunta (dificultad y duración aparte, más suaves).
 *  3) Una tarjeta por pregunta con todo el detalle; se pasan con las flechas, los puntos o deslizando el dedo.
 * Arriba, el botón para descargar todas las respuestas en un archivo que abre Excel.
 * Pide los datos a /api/admin/valoraciones (solo con la llave del equipo) y los refresca cada 30 s.
 */
function Valoraciones({ t }) {
  const [respuestas, setRespuestas] = useState(null); // null = cargando
  const [fallo, setFallo] = useState("");

  useEffect(() => {
    let vivo = true;
    async function cargar() {
      const r = await api("/api/admin/valoraciones");
      if (!vivo) return;
      if (r.ok) {
        setRespuestas(r.respuestas);
        setFallo("");
      } else setFallo(r.mensaje || t.valError);
    }
    cargar();
    const id = setInterval(cargar, REFRESCO_MS);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, [t]);

  const n = respuestas?.length || 0;
  const resumenes = useMemo(() => (n ? PREGUNTAS.map((p) => ({ ...p, ...resumenPregunta(p, respuestas) })) : []), [respuestas, n]);
  const estrellas = resumenes.filter((p) => !p.escala);
  const mediaGeneral = estrellas.length ? estrellas.reduce((a, p) => a + p.media, 0) / estrellas.length : 0;
  // Tarjetas del carrusel: primero el turno, luego las 6 notas y al final cómo se enteraron (si hay datos)
  const tarjetas = useMemo(() => {
    if (!n) return [];
    const [turno, origen] = ["turno", "origen"].map((c) => resumenCategoria(c, respuestas));
    return [turno, ...resumenes, origen].filter((p) => p.n > 0);
  }, [respuestas, resumenes, n]);

  // Descarga: un archivo .csv (tabla de texto que abre Excel o Google Sheets) con una fila por respuesta
  function descargar() {
    const cabecera = [t.columnas.creada, t.columnas.turno, ...PREGUNTAS.map((p) => t.preguntas[p.clave]), t.columnas.origen, t.columnas.idioma, t.columnas.comentario];
    const filas = respuestas.map((r) => [
      new Date(r.creada).toLocaleString("es-ES", { timeZone: "Europe/Madrid" }),
      r.turno || "",
      ...PREGUNTAS.map((p) => r[p.clave]),
      r.origen ? t.origenes[r.origen] || r.origen : "",
      r.idioma || "",
      r.comentario || "",
    ]);
    // Punto y coma entre columnas y la marca «﻿» al principio: así Excel en español lo abre bien, con tildes
    const texto = "﻿" + [cabecera, ...filas].map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(new Blob([texto], { type: "text/csv;charset=utf-8" }));
    enlace.download = `valoraciones-lilium-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  }

  return (
    <section className="panel-val" aria-labelledby="val-titulo">
      <header className="panel-val__cabecera">
        <div>
          <h2 id="val-titulo" className="panel-val__titulo">{t.valTitulo}</h2>
          <p className="panel-val__intro">{t.valIntro}</p>
        </div>
        {n > 0 && (
          <div className="panel-val__acciones">
            <p className="panel-val__total">{t.valRespuestas(n)}</p>
            <button type="button" className="ll-btn ll-btn--md ll-btn--secondary" onClick={descargar}>{t.valDescargar}</button>
          </div>
        )}
      </header>

      {fallo && <p className="panel__aviso" role="alert">{fallo}</p>}
      {!respuestas && !fallo && <p className="panel-val__nada" role="status">{t.valCargando}</p>}
      {respuestas && n === 0 && <p className="panel-val__nada">{t.valNinguna}</p>}

      {n > 0 && (
        <>
          <div className="panel-val__resumen">
            {/* 1) Media general en un anillo */}
            <div className="panel-val__bloque panel-val__bloque--media">
              <p className="panel-val__etiqueta">{t.mediaGeneral}</p>
              <Anillo valor={mediaGeneral} texto={coma(mediaGeneral)} sub={`${t.deCinco} ★`} />
              <Estrellas valor={mediaGeneral} />
              <p className="panel-val__nota">{t.mediaNota}</p>
            </div>

            {/* 2) Gráfica: la media de cada pregunta */}
            <div className="panel-val__bloque">
              <p className="panel-val__etiqueta">{t.mediasTitulo}</p>
              <ul className="panel-val__medias">
                {/* Primero las 4 de estrellas y, separadas, dificultad y duración */}
                {[...estrellas, ...resumenes.filter((p) => p.escala)].map((p, i, lista) => (
                  <li key={p.clave} className={p.escala ? "es-escala" : undefined} style={p.escala && !lista[i - 1]?.escala ? { marginTop: 10 } : undefined}>
                    <span className="panel-val__nombre">
                      {t.preguntas[p.clave]}
                      {p.escala && <small> · {t.escalas[p.clave]}</small>}
                    </span>
                    <span className="panel-val__pista"><span style={{ width: `${(p.media / 5) * 100}%` }} /></span>
                    <b>{coma(p.media)}</b>
                  </li>
                ))}
              </ul>
              <p className="panel-val__nota">{t.mediasNota}</p>
            </div>
          </div>

          {/* 3) Tarjetas, una por pregunta */}
          <p className="panel-val__etiqueta panel-val__etiqueta--tarjetas">{t.tarjetasTitulo}</p>
          <Tarjetas t={t} resumenes={tarjetas} />

          {/* 4) Notas: lo que escribieron en «¿Quieres contarnos algo más?» (opcional), las más nuevas primero */}
          <Notas t={t} respuestas={respuestas} />
        </>
      )}
    </section>
  );
}

/** Notas libres del cuestionario: tarjetitas con el texto, la fecha y el turno (son anónimas) */
function Notas({ t, respuestas }) {
  const notas = respuestas.filter((r) => r.comentario && r.comentario.trim()).slice().reverse();
  return (
    <div className="panel-notas">
      <p className="panel-val__etiqueta">{t.notasTitulo} · {notas.length ? t.notasCuenta(notas.length) : t.notasNinguna}</p>
      {notas.length > 0 && (
        <ul className="panel-notas__lista">
          {notas.map((r, i) => (
            <li key={i} className="panel-notas__nota">
              <p className="panel-notas__texto">“{r.comentario}”</p>
              <p className="panel-notas__datos">
                {new Date(r.creada).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" })}
                {r.turno && <> · {r.turno}</>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Anillo que se llena según la nota (de 0 a 5), con el número en el centro */
function Anillo({ valor, texto, sub }) {
  const radio = 52;
  const vuelta = 2 * Math.PI * radio;
  return (
    <div className="panel-val__anillo" role="img" aria-label={`${texto} ${sub}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="panel-val__anillo-fondo" cx="60" cy="60" r={radio} />
        <circle className="panel-val__anillo-lleno" cx="60" cy="60" r={radio}
          strokeDasharray={vuelta} strokeDashoffset={vuelta * (1 - Math.min(1, valor / 5))} />
      </svg>
      <p><b>{texto}</b><span>{sub}</span></p>
    </div>
  );
}

/** Cinco estrellas rellenas según la nota (también medias estrellas) */
function Estrellas({ valor }) {
  return (
    <p className="panel-val__estrellas" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ "--lleno": `${Math.max(0, Math.min(1, valor - i + 1)) * 100}%` }}>★</span>
      ))}
    </p>
  );
}

/**
 * Carrusel de tarjetas: una por pregunta. Se pasan con ← →, con los puntos o deslizando el dedo.
 * Las tarjetas van en una «tira» que se desplaza de lado (translateX) con una transición suave.
 */
function Tarjetas({ t, resumenes }) {
  const [actual, setActual] = useState(0);
  const total = resumenes.length;
  const ir = (i) => setActual((i + total) % total); // al pasar de la última vuelve a la primera
  const toque = useMemo(() => ({ x: null }), []);

  return (
    <div className="panel-val__carrusel">
      <button type="button" className="panel-val__flecha" aria-label={t.anterior} onClick={() => ir(actual - 1)}>←</button>
      <div className="panel-val__ventana"
        onTouchStart={(e) => (toque.x = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (toque.x === null) return;
          const dx = e.changedTouches[0].clientX - toque.x;
          if (Math.abs(dx) > 50) ir(actual + (dx < 0 ? 1 : -1));
          toque.x = null;
        }}>
        <div className="panel-val__tira" style={{ translate: `${-actual * 100}% 0` }}>
          {resumenes.map((p, i) => (
            <article className="panel-val__tarjeta" key={p.clave} aria-hidden={i !== actual} inert={i !== actual}>
              <div className="panel-val__tarjeta-texto">
                <p className="panel-val__etiqueta">{t.preguntaDe(i + 1, total)}</p>
                <h3>{t.textoPregunta[p.clave]}</h3>
                {p.categoria ? (
                  // Pregunta con botones: en grande, la opción más elegida
                  <p className="panel-val__media panel-val__media--texto">{nombreOpcion(t, p.clave, p.masElegida)}</p>
                ) : (
                  <p className="panel-val__media">
                    {!p.escala && <span className="panel-val__estrella" aria-hidden="true">★ </span>}
                    {coma(p.media)}<small> / 5</small>
                  </p>
                )}
                {p.escala && <p className="panel-val__nota">{t.escalas[p.clave]}</p>}
                {p.categoria ? (
                  <div className="panel-val__datos panel-val__datos--dos">
                    <p><b>{p.n}</b>{t.valRespuestas(p.n).replace(/^\d+\s/, "")}</p>
                    <p><b>{p.dato} %</b>{t.datoCategoria}</p>
                  </div>
                ) : (
                  <div className="panel-val__datos">
                    <p><b>{p.n}</b>{t.valRespuestas(p.n).replace(/^\d+\s/, "")}</p>
                    <p><b>{p.escala ? p.masElegida : `${p.masElegida} ★`}</b>{t.masElegida}</p>
                    <p>
                      <b>{p.dato} %</b>
                      {p.clave === "dificultad" ? t.datoDificultad : p.clave === "duracion" ? t.datoDuracion : t.datoEstrellas}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <p className="panel-val__etiqueta">{p.categoria ? t.repartoOpciones : t.repartoTitulo}</p>
                <ul className={`panel-val__reparto${p.categoria ? " panel-val__reparto--texto" : ""}`}>
                  {p.numeros.map((x) => (
                    <li key={x}>
                      <span className="panel-val__num">{p.categoria ? nombreOpcion(t, p.clave, x) : p.escala ? x : `${x} ★`}</span>
                      <span className="panel-val__pista"><span style={{ width: p.maximo ? `${(p.cuentas[x] / p.maximo) * 100}%` : 0 }} /></span>
                      <span className="panel-val__cuenta">{p.cuentas[x]} · {porcentaje(p.cuentas[x], p.n)} %</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
      <button type="button" className="panel-val__flecha" aria-label={t.siguiente} onClick={() => ir(actual + 1)}>→</button>
      <div className="panel-val__puntos">
        {resumenes.map((p, i) => (
          <button type="button" key={p.clave} className={i === actual ? "is-actual" : undefined}
            aria-label={t.irA(i + 1)} aria-current={i === actual ? "true" : undefined} onClick={() => setActual(i)} />
        ))}
      </div>
    </div>
  );
}

/** Texto de una opción de las preguntas con botones (el turno ya es su hora) */
function nombreOpcion(t, clave, valor) {
  return clave === "origen" ? t.origenes[valor] || valor : valor;
}

/** Hora en España de una fecha: «10:47» */
const horaEspana = (fecha) =>
  new Date(fecha).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

/**
 * «+ Añadir integrante (N plazas libres)»: el día del retiro, apunta en una sala con hueco a alguien que
 * llega sin reserva (/api/admin/integrante). Queda con la plaza confirmada y la asistencia marcada.
 */
function AnadirIntegrante({ t, sala, hueco, alCambiar }) {
  const [abierto, setAbierto] = useState(false); // ¿se ve el campo para escribir el correo?
  const [correo, setCorreo] = useState("");
  const [fallo, setFallo] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function anadir(e) {
    e.preventDefault();
    setEnviando(true);
    setFallo("");
    const r = await api("/api/admin/integrante", { metodo: "POST", datos: { turnoId: sala.id, email: correo } });
    setEnviando(false);
    if (!r.ok) return setFallo(r.mensaje);
    setCorreo("");
    setAbierto(false);
    alCambiar(); // se vuelven a pedir los datos del panel
  }

  if (!abierto) {
    return <button type="button" className="panel-anadir__boton" onClick={() => setAbierto(true)}>{t.verAnadir(hueco)}</button>;
  }
  return (
    <form className="panel-anadir" onSubmit={anadir}>
      <input className="panel__busqueda" type="email" required autoFocus placeholder={t.verPista} value={correo}
        onChange={(e) => setCorreo(e.target.value)} aria-label={t.verPista} />
      <button type="submit" className="ll-btn ll-btn--md ll-btn--primary" disabled={enviando}>{enviando ? t.verAnadiendo : t.verGuardar}</button>
      <button type="button" className="ll-btn ll-btn--md ll-btn--secondary" onClick={() => { setAbierto(false); setFallo(""); }}>{t.verCancelar}</button>
      <p className="panel-anadir__nota">{fallo ? <b role="alert">{fallo}</b> : t.verNotaAnadir}</p>
    </form>
  );
}

function Cifra({ etiqueta, valor, nota, destacada }) {
  return (
    <div className={`panel-cifra${destacada ? " panel-cifra--destacada" : ""}`}>
      <p className="panel-cifra__valor">{valor}</p>
      <p className="panel-cifra__etiqueta">{etiqueta}</p>
      {nota && <p className="panel-cifra__nota">{nota}</p>}
    </div>
  );
}

function Grupo({ t, grupo, numero, marcar }) {
  return (
    <div className="sv__grupo">
      {numero && <p className="sv__grupo-titulo">{t.grupo(numero)}</p>}
      <div className="sv__tabla" role="table">
        <div className="sv__fila sv__fila--titulos" role="row">
          <span role="columnheader">{t.correo}</span>
          <span role="columnheader">{t.estado}</span>
          <span role="columnheader">{t.vino}</span>
          <span role="columnheader">{t.valoro}</span>
        </div>
        {grupo.personas.map((p) => (
          <div key={p.email} className="sv__fila" role="row">
            <span role="cell" className="sv__persona">
              <span className="sv__correo">{p.email}</span>
              <span className="sv__extra">
                {p.lider && <b className="sv__lider">{t.lider}</b>}
                {esProfesorado(p.email) && <b className="sv__profe">{t.profesorado}</b>}
                {/* Su palabra de la frase secreta (solo se ve aquí, en el panel del equipo) */}
                {p.fragmento && (
                  <span className="panel-palabra" title={t.palabraTitulo}>
                    <small>{p.fragmento.numero}</small> {p.fragmento.palabra}
                  </span>
                )}
              </span>
            </span>

            {/* ¿Confirmó su plaza desde el correo? (o la apuntó el equipo en la puerta) */}
            <span role="cell" data-titulo={t.estado}>
              <span className={`panel-chip ${p.confirmado ? "panel-chip--si" : "panel-chip--pendiente"}`}>
                {p.puerta ? t.enPuerta : p.confirmado ? `✓ ${t.confirmada}` : t.pendiente}
              </span>
            </span>

            {/* ¿Ha venido? Se pone en «✓» solo al escanear su QR; ✓ / ✕ para marcarlo a mano (pulsar otra vez lo quita) */}
            <span role="cell" data-titulo={t.vino} className="sv__vino">
              <span className={`panel-chip ${p.asistio === true ? "panel-chip--si" : "panel-chip--no"}`}>
                {p.asistio === true ? `✓ ${p.asistioEn ? horaEspana(p.asistioEn) : t.si}` : p.asistio === false ? t.noVino : t.sinEscanear}
              </span>
              <span className="sv__marcar" role="group" aria-label={`${t.vino} ${p.email}`}>
                <button type="button" className={`sv__boton sv__boton--si${p.asistio === true ? " is-elegido" : ""}`} aria-pressed={p.asistio === true}
                  title={t.marcarSi} aria-label={t.marcarSi} onClick={() => marcar(p.email, p.asistio === true ? null : true)}>✓</button>
                <button type="button" className={`sv__boton sv__boton--no${p.asistio === false ? " is-elegido" : ""}`} aria-pressed={p.asistio === false}
                  title={t.marcarNo} aria-label={t.marcarNo} onClick={() => marcar(p.email, p.asistio === false ? null : false)}>✕</button>
              </span>
            </span>

            <span role="cell" data-titulo={t.valoro}>
              <span className={`panel-chip ${p.valorado ? "panel-chip--si" : p.avisoValoracion ? "panel-chip--pendiente" : "panel-chip--gris"}`}>
                {p.valorado ? `✓ ${t.valorado}` : p.avisoValoracion ? t.correoEnviado : t.noValorado}
              </span>
            </span>
          </div>
        ))}
      </div>
      {grupo.notas && <p className="sv__notas"><b>{t.notas}:</b> {grupo.notas}</p>}
    </div>
  );
}
