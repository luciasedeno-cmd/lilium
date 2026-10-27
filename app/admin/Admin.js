"use client";
// Página del equipo (/admin).
// 1) Sin la llave: tarjeta para entrar con el correo del equipo (lilium@esada.es) y la contraseña,
//    o con otro correo de la lista ADMIN_CORREOS de Vercel y un código que le llega por correo.
// 2) Con la llave: el panel del día del retiro → plazas, y cada sala con sus grupos y personas.
//    En cada persona: «¿Ha venido?» (Sí / No, lo marca el equipo en la puerta) y «¿Ha valorado?»
//    (se apunta solo cuando rellena el cuestionario; si no, al día siguiente le llega un correo).
// Antes de la apertura (30 de octubre), la llave también sirve para ver y probar la web.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import NavReserva from "@/components/NavReserva";
import PiePagina from "@/components/PiePagina";
import { api } from "@/lib/borrador";
import { useEspera } from "@/lib/useEspera";
import { iconosDe } from "@/lib/fotos";
import { ADMIN_CORREO, APERTURA, EVENTO, MAX_PERSONAS } from "@/lib/config";
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
    salaSinNombre: "Sin nombre", erasmus: "Erasmus", grupo: (n) => `Grupo ${n}`, notas: "Anotaciones",
    sinDueno: "Palabras de la frase que no tiene nadie (dádselas el día del retiro):",
    noVinieron: "Palabras de quien no ha venido (dádselas al grupo):", palabraTitulo: "Su palabra de la frase secreta",
    persona: "Persona", estado: "Estado", vino: "¿Ha venido?", valoro: "¿Ha valorado?",
    lider: "Líder", confirmada: "Confirmada", pendiente: "Sin confirmar",
    si: "Sí", no: "No", valorado: "Sí", noValorado: "Todavía no", correoEnviado: "Correo enviado",
    errorGuardar: "No se ha podido guardar. Inténtalo de nuevo.",
    leyenda: "«¿Ha valorado?» se marca sola cuando la persona rellena el cuestionario (QR de la sala). Si no lo hace, al día siguiente del retiro le llega un correo pidiéndoselo.",
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
    valTitulo: "Valoraciones", valCargando: "Cargando las valoraciones…",
    valIntro: "Respuestas del cuestionario de después de la experiencia. Son anónimas: no se sabe quién ha contestado qué.",
    valNinguna: "Todavía no ha respondido nadie al cuestionario.",
    valRespuestas: (n) => (n === 1 ? "1 respuesta" : `${n} respuestas`), valMedia: "Media",
    valDescargar: "Descargar respuestas (Excel)", valError: "No se han podido cargar las valoraciones.",
    valPersonas: (n) => (n === 1 ? "1 persona" : `${n} personas`),
    preguntas: { general: "Experiencia en general", ambientacion: "Ambientación y decoración", dificultad: "Dificultad de las pruebas",
      originalidad: "Originalidad de las pruebas", inmersion: "Inmersión en la historia", duracion: "Duración" },
    escalas: { dificultad: "0 = muy fácil · 5 = muy difícil", duracion: "0 = muy corta · 3 = genial · 5 = muy larga" },
    columnas: { creada: "Fecha", idioma: "Idioma" },
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
    salaSinNombre: "No name", erasmus: "Erasmus", grupo: (n) => `Group ${n}`, notas: "Notes",
    sinDueno: "Words of the phrase nobody has (hand them out on the day):",
    noVinieron: "Words of people who didn't come (give them to the group):", palabraTitulo: "Their word of the secret phrase",
    persona: "Person", estado: "Status", vino: "Attended?", valoro: "Rated?",
    lider: "Leader", confirmada: "Confirmed", pendiente: "Not confirmed",
    si: "Yes", no: "No", valorado: "Yes", noValorado: "Not yet", correoEnviado: "Email sent",
    errorGuardar: "Couldn't save. Try again.",
    leyenda: "“Rated?” is ticked automatically when the person fills in the questionnaire (QR in the room). If they don't, they get an email the day after the retreat asking them to.",
    borrarTitulo: "Delete test bookings",
    borrarTexto: "Before opening the website, empty all test bookings to start from scratch. Sessions stay the same. This box disappears on 30 October at 12:00.",
    borrarBoton: "Delete test bookings",
    borrarAviso: (n) => `You're about to delete ${n === 1 ? "1 booked person" : `${n} booked people`}, every booking, the waiting list and team names. This can't be undone.`,
    borrarCuestionario: "Also delete the questionnaire answers",
    borrarEscribe: "To confirm, type BORRAR in capitals:",
    borrarSi: "Yes, delete everything", borrando: "Deleting…", borrarNo: "Cancel",
    borrado: (n, r) => `Done: ${n === 1 ? "1 person" : `${n} people`} removed from bookings${r ? ` and ${r === 1 ? "1 answer" : `${r} answers`} from the questionnaire` : ""}. The website is empty for the opening.`,
    valTitulo: "Ratings", valCargando: "Loading the ratings…",
    valIntro: "Answers to the after-experience questionnaire. They're anonymous: there's no way to know who answered what.",
    valNinguna: "Nobody has answered the questionnaire yet.",
    valRespuestas: (n) => (n === 1 ? "1 answer" : `${n} answers`), valMedia: "Average",
    valDescargar: "Download answers (Excel)", valError: "Couldn't load the ratings.",
    valPersonas: (n) => (n === 1 ? "1 person" : `${n} people`),
    preguntas: { general: "Overall experience", ambientacion: "Atmosphere and set design", dificultad: "Difficulty of the challenges",
      originalidad: "Originality of the challenges", inmersion: "Immersion in the story", duracion: "Length" },
    escalas: { dificultad: "0 = very easy · 5 = very hard", duracion: "0 = too short · 3 = just right · 5 = too long" },
    columnas: { creada: "Date", idioma: "Language" },
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
        </div>
        <p className="panel__aviso" role="status" aria-live="polite">{aviso}</p>

        {salas.length === 0 && <p className="panel__nada">{busca ? t.sinResultados : t.sinReservas}</p>}

        <div className="panel__salas">
          {salas.map((s) => (
            <section className="panel-sala" key={s.id} aria-labelledby={`sala-${s.id}`}>
              <header className="panel-sala__cabecera">
                <h2 id={`sala-${s.id}`}>
                  <span className="panel-sala__hora">{s.inicio}–{s.fin}</span>
                  <span className="panel-sala__equipo">{s.equipo || t.salaSinNombre}</span>
                </h2>
                <p className="panel-sala__plazas">
                  {s.erasmus && <span className="ll-badge">{t.erasmus}</span>}
                  <b>{s.ocupadas}</b>/{MAX_PERSONAS}
                </p>
              </header>

              {s.grupos.map((g, n) => (
                <Grupo key={g.id} t={t} grupo={g} numero={s.grupos.length > 1 ? n + 1 : null} marcar={marcar} />
              ))}
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
            </section>
          ))}
        </div>

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
// «estrellas» van de 1 a 5; «escala» de 0 a 5 (en la escala, más alto no es «mejor»).
const PREGUNTAS = [
  { clave: "general", desde: 1 },
  { clave: "ambientacion", desde: 1 },
  { clave: "dificultad", desde: 0, escala: true },
  { clave: "originalidad", desde: 1 },
  { clave: "inmersion", desde: 1 },
  { clave: "duracion", desde: 0, escala: true },
];

/**
 * Apartado «Valoraciones»: cuántas respuestas hay, la media de cada pregunta, cuántas personas
 * eligieron cada número (barras) y un botón para descargarlas todas en un archivo que abre Excel.
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
  const coma = (x) => x.toFixed(1).replace(".", ","); // 4.6 → «4,6»

  // Descarga: un archivo .csv (tabla de texto que abre Excel o Google Sheets) con una fila por respuesta
  function descargar() {
    const cabecera = [t.columnas.creada, ...PREGUNTAS.map((p) => t.preguntas[p.clave]), t.columnas.idioma];
    const filas = respuestas.map((r) => [
      new Date(r.creada).toLocaleString("es-ES", { timeZone: "Europe/Madrid" }),
      ...PREGUNTAS.map((p) => r[p.clave]),
      r.idioma || "",
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
        <div className="panel-val__preguntas">
          {PREGUNTAS.map((p) => {
            const valores = respuestas.map((r) => r[p.clave]);
            const media = valores.reduce((a, b) => a + b, 0) / n;
            const numeros = Array.from({ length: 6 - p.desde }, (_, i) => p.desde + i); // 1…5 o 0…5
            const cuenta = (x) => valores.filter((v) => v === x).length;
            const maximo = Math.max(...numeros.map(cuenta));
            return (
              <article className="panel-val__pregunta" key={p.clave}>
                <h3>{t.preguntas[p.clave]}</h3>
                <p className="panel-val__media">
                  {!p.escala && <span className="panel-val__estrella" aria-hidden="true">★ </span>}
                  {coma(media)}
                  <small> / 5 · {t.valMedia}</small>
                </p>
                {p.escala && <p className="panel-val__escala">{t.escalas[p.clave]}</p>}
                {/* Reparto: una barra por número, más larga cuanta más gente lo eligió */}
                <ul className="panel-val__reparto">
                  {numeros.map((x) => (
                    <li key={x} title={t.valPersonas(cuenta(x))}>
                      <span className="panel-val__num">{p.escala ? x : `${x}★`}</span>
                      <span className="panel-val__barra">
                        <span style={{ width: maximo ? `${(cuenta(x) / maximo) * 100}%` : 0 }} />
                      </span>
                      <span className="panel-val__cuenta">{cuenta(x)}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </section>
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
  const iconos = iconosDe(grupo.personas.map((p) => p.email));
  return (
    <div className="panel-grupo">
      {numero && <p className="panel-grupo__titulo">{t.grupo(numero)}</p>}
      <table className="panel-tabla">
        <thead>
          <tr>
            <th scope="col">{t.persona}</th>
            <th scope="col">{t.estado}</th>
            <th scope="col">{t.vino}</th>
            <th scope="col">{t.valoro}</th>
          </tr>
        </thead>
        <tbody>
          {grupo.personas.map((p, i) => (
            <tr key={p.email}>
              <td className="panel-tabla__persona" data-titulo={t.persona}>
                <img src={iconos[i]} width="36" height="36" alt="" />
                <span>{p.email}</span>
                {/* Su palabra de la frase secreta (solo se ve aquí, en el panel del equipo) */}
                {p.fragmento && (
                  <span className="panel-palabra" title={t.palabraTitulo}>
                    <small>{p.fragmento.numero}</small> {p.fragmento.palabra}
                  </span>
                )}
              </td>
              <td data-titulo={t.estado}>
                <span className={`panel-estado${p.confirmado ? " is-ok" : ""}`}>
                  {p.lider ? t.lider : p.confirmado ? t.confirmada : t.pendiente}
                </span>
              </td>
              <td data-titulo={t.vino}>
                {/* Sí / No: pulsar la opción elegida otra vez la quita */}
                <div className="panel-vino" role="group" aria-label={`${t.vino} ${p.email}`}>
                  <button type="button" className={`panel-vino__si${p.asistio === true ? " is-elegido" : ""}`} aria-pressed={p.asistio === true}
                    onClick={() => marcar(p.email, p.asistio === true ? null : true)}>{t.si}</button>
                  <button type="button" className={`panel-vino__no${p.asistio === false ? " is-elegido" : ""}`} aria-pressed={p.asistio === false}
                    onClick={() => marcar(p.email, p.asistio === false ? null : false)}>{t.no}</button>
                </div>
              </td>
              <td data-titulo={t.valoro}>
                <span className={`panel-valoro${p.valorado ? " is-ok" : ""}`}>
                  {p.valorado ? `✓ ${t.valorado}` : p.avisoValoracion ? t.correoEnviado : t.noValorado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {grupo.notas && <p className="panel-grupo__notas"><b>{t.notas}:</b> {grupo.notas}</p>}
    </div>
  );
}
