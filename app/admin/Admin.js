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
import { iconosDe } from "@/lib/fotos";
import { ADMIN_CORREO, APERTURA, EVENTO, MAX_PERSONAS } from "@/lib/config";
import { useTextos } from "@/components/Idioma";

const TEXTOS = {
  es: {
    etiqueta: "EQUIPO LILIUM", titulo: "Solo para el equipo",
    intro: "Escribe tu correo. Con el del equipo (lilium@esada.es) se pide la contraseña; con el tuyo, si tienes acceso, te llega un código.",
    codigo: "Código de 6 cifras", pedirCodigo: "Enviarme un código", otroCorreo: "Usar otro correo", demo: "Código de prueba:",
    codigoEnviado: (c) => `Si ${c} tiene acceso al panel, le acabamos de enviar un código. Escríbelo aquí (caduca en 10 minutos).`,
    correo: "Tu correo", clave: "Contraseña", comprobando: "Comprobando…", entrar: "Entrar",
    volver: "← Volver a la web", falta: "Escribe el correo y la contraseña.",
    panelEtiqueta: "ADMIN", panelTitulo: "Panel del retiro",
    plazas: "Plazas totales", ocupadas: "Reservadas", libres: "Libres", confirmadas: "Confirmadas",
    asistieron: "Han venido", valoraron: "Han valorado", grupos: "grupos",
    buscar: "Buscar por correo…", actualizar: "Actualizar", salir: "Salir", probar: "Probar la web",
    sinReservas: "Todavía no hay ninguna reserva.", sinResultados: "Ningún correo coincide con la búsqueda.",
    salasVacias: (n) => (n === 1 ? "1 turno sin reservas" : `${n} turnos sin reservas`),
    salaSinNombre: "Sin nombre", erasmus: "Erasmus", grupo: (n) => `Grupo ${n}`, notas: "Anotaciones",
    persona: "Persona", estado: "Estado", vino: "¿Ha venido?", valoro: "¿Ha valorado?",
    lider: "Líder", confirmada: "Confirmada", pendiente: "Sin confirmar",
    si: "Sí", no: "No", valorado: "Sí", noValorado: "Todavía no", correoEnviado: "Correo enviado",
    errorGuardar: "No se ha podido guardar. Inténtalo de nuevo.",
    leyenda: "«¿Ha valorado?» se marca sola cuando la persona rellena el cuestionario (QR de la sala). Si no lo hace, al día siguiente del retiro le llega un correo pidiéndoselo.",
  },
  en: {
    etiqueta: "LILIUM TEAM", titulo: "Team only",
    intro: "Type your email. The team one (lilium@esada.es) asks for the password; with yours, if you have access, you'll get a code.",
    codigo: "6-digit code", pedirCodigo: "Send me a code", otroCorreo: "Use another email", demo: "Test code:",
    codigoEnviado: (c) => `If ${c} has access to the dashboard, we've just sent it a code. Type it here (it expires in 10 minutes).`,
    correo: "Your email", clave: "Password", comprobando: "Checking…", entrar: "Sign in",
    volver: "← Back to the website", falta: "Type the email and the password.",
    panelEtiqueta: "ADMIN", panelTitulo: "Retreat dashboard",
    plazas: "Total places", ocupadas: "Booked", libres: "Free", confirmadas: "Confirmed",
    asistieron: "Attended", valoraron: "Rated", grupos: "groups",
    buscar: "Search by email…", actualizar: "Refresh", salir: "Sign out", probar: "Try the website",
    sinReservas: "There are no bookings yet.", sinResultados: "No email matches your search.",
    salasVacias: (n) => (n === 1 ? "1 session without bookings" : `${n} sessions without bookings`),
    salaSinNombre: "No name", erasmus: "Erasmus", grupo: (n) => `Group ${n}`, notas: "Notes",
    persona: "Person", estado: "Status", vino: "Attended?", valoro: "Rated?",
    lider: "Leader", confirmada: "Confirmed", pendiente: "Not confirmed",
    si: "Yes", no: "No", valorado: "Yes", noValorado: "Not yet", correoEnviado: "Email sent",
    errorGuardar: "Couldn't save. Try again.",
    leyenda: "“Rated?” is ticked automatically when the person fills in the questionnaire (QR in the room). If they don't, they get an email the day after the retreat asking them to.",
  },
};

// Cada cuánto se vuelve a pedir la lista (así todo el equipo ve lo que marcan las demás)
const REFRESCO_MS = 30000;

export default function Admin() {
  const t = useTextos(TEXTOS);
  const [estado, setEstado] = useState("cargando"); // cargando | fuera | dentro
  const [datos, setDatos] = useState(null);
  const [aviso, setAviso] = useState("");

  const cargar = useCallback(async () => {
    const r = await api("/api/admin/panel");
    if (r.ok) {
      setDatos(r);
      setEstado("dentro");
    } else {
      setEstado((e) => (e === "dentro" && r.mensaje && !/equipo/.test(r.mensaje) ? e : "fuera"));
    }
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

  if (estado === "cargando") return <main className="previa" />;
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
      setEnviando(false);
      return res.ok ? alEntrar() : setError(res.mensaje);
    }

    // 2) Otro correo: primero se pide el código…
    setEnviando(true);
    if (!codigoEnviado) {
      const res = await api("/api/acceso/admin/codigo", { metodo: "POST", datos: { email: correo.trim() } });
      setEnviando(false);
      if (!res.ok) return setError(res.mensaje);
      setCodigoEnviado(true);
      if (res.codigoDemo) setDemo(res.codigoDemo);
      return;
    }
    // …y luego se comprueba
    const res = await api("/api/acceso/admin/verificar", { metodo: "POST", datos: { email: correo.trim(), codigo: codigo.trim() } });
    setEnviando(false);
    return res.ok ? alEntrar() : setError(res.mensaje);
  }

  return (
    <main className="previa">
      <section className="acceso previa__tarjeta" aria-labelledby="previa-titulo">
        <img className="previa__logo" src="/assets/img/logo-lilium.png" width="198" height="118" alt="Lilium" />
        <p className="acceso__etiqueta">{t.etiqueta}</p>
        <h1 className="acceso__titulo" id="previa-titulo">{t.titulo}</h1>
        <p className="acceso__intro">{codigoEnviado ? t.codigoEnviado(correo.trim()) : t.intro}</p>
        <form onSubmit={entrar} noValidate>
          <label htmlFor="admin-correo">{t.correo}</label>
          <input className="campo" id="admin-correo" type="email" autoComplete="username" placeholder="E-mail"
            value={correo} disabled={codigoEnviado} onChange={(e) => setCorreo(e.target.value)} />
          {conClave && (
            <>
              <label htmlFor="admin-clave">{t.clave}</label>
              <input className="campo" id="admin-clave" type="password" autoComplete="current-password" placeholder={t.clave}
                value={clave} onChange={(e) => setClave(e.target.value)} aria-describedby="admin-error" />
            </>
          )}
          {codigoEnviado && (
            <>
              <label htmlFor="admin-codigo">{t.codigo}</label>
              <input className="campo" id="admin-codigo" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000"
                value={codigo} onChange={(e) => setCodigo(e.target.value)} aria-describedby="admin-error" />
              {demo && <p className="acceso__demo">{t.demo} {demo}</p>}
            </>
          )}
          <p className="error" id="admin-error" role="alert">{error}</p>
          <button className="boton" type="submit" disabled={enviando}>
            {enviando ? t.comprobando : conClave || codigoEnviado ? t.entrar : t.pedirCodigo}
          </button>
        </form>
        {codigoEnviado ? (
          <button type="button" className="previa__volver" onClick={() => { setCodigoEnviado(false); setCodigo(""); setDemo(""); }}>{t.otroCorreo}</button>
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
            {antesDeAbrir && <Link className="ll-btn ll-btn--md ll-btn--secondary" href="/acceso">{t.probar}</Link>}
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
            </section>
          ))}
        </div>

        <p className="panel__leyenda">{t.leyenda}</p>
      </main>
      <PiePagina />
    </>
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
