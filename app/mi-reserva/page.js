"use client";
// Mi reserva (Figma: PAG RESERVA - INTEGRANTES B): «Tu reserva» con la entrada, «Mi equipo» y «Antes de venir…».
// La persona líder puede editar el grupo: quitar (✕) y añadir integrantes, y luego «Guardar cambios».
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import NavReserva from "@/components/NavReserva";
import Cargando from "@/components/Cargando";
import PiePagina from "@/components/PiePagina";
import { IconoCheck, IconoCruz } from "@/components/Iconos";
import { api } from "@/lib/borrador";
import { useSesion } from "@/lib/useSesion";
import { iconosDe } from "@/lib/fotos";
import { eventoEn, MIN_SALA_NUEVA, MAX_PERSONAS, CORREO_VALIDO, CONTACTO, esProfesorado } from "@/lib/config";
import { huecoPara } from "@/lib/turnos";
import { useIdioma } from "@/components/Idioma";
import { fechaHora } from "@/lib/idioma";


// Número corto de la reserva para el título (las 6 primeras letras de su identificador)

const TEXTOS = {
  es: {
    avisoNueva: "Reserva creada. Hemos enviado un correo a cada integrante para que confirme su plaza, y a ti tu entrada.",
    popTitulo: "Antes de irte", popTexto: "no olvides decirle a tus compañeros que confirmen su asistencia, si no perderán su hueco.",
    popBoton: "Entendido", popCerrar: "Cerrar",
    avisoConfirmado: "¡Plaza confirmada! Te hemos enviado la entrada por correo.",
    avisoFallidos: (c) => `Reserva creada, pero no pudimos enviar el correo a: ${c}. Avísales de que entren en la web con su correo para confirmar.`,
    preguntaGrupo: "¿Anular tu reserva? Se cancelará tu plaza y la de las personas que apuntaste tú (les avisaremos por correo). El resto de la sala mantiene la suya. No se puede deshacer.",
    preguntaPlaza: "¿Cancelar tu plaza? El resto del grupo mantiene la suya.",
    correoMal: "El correo debe ser nombreapellido@alumnado.esada.es", repetido: "Ese correo ya está en el grupo.",
    noCaben: `En vuestro turno ya no caben más personas (máximo ${MAX_PERSONAS}).`,
    guardadoFallidos: (c) => `Cambios guardados, pero no pudimos enviar la invitación a: ${c}. Avísales de que entren en la web con su correo.`,
    guardadoInvitados: "Cambios guardados. Hemos enviado la invitación a las personas nuevas: tienen 48 h para confirmar.", guardado: "Cambios guardados.",
    cargando: "Cargando tu reserva…", nuevo: "Nuevo · recibirá la invitación al guardar", seQuitara: "Se quitará del grupo al guardar",
    profesorado: "Profesorado", lider: "Líder", invitado: "Invitado", apuntadoPor: (c) => `Apuntado por ${c}`, porSuCuenta: "Reservó por su cuenta", confirmado: "Confirmado", pendienteHasta: (f) => `Pendiente (hasta el ${f})`,
    miReserva: "Mi reserva", numero: "Nº", tuReserva: "Tu reserva", qrAlt: "QR de tu entrada: enséñalo en la puerta",
    sinQr: "Tu entrada (el código QR) aparecerá aquí cuando confirmes tu plaza desde el enlace de tu correo.",
    pendiente: "Pendiente de confirmación", confirmada: "Confirmada", llegad: "llegad 15 min antes", soloErasmus: "Solo Erasmus",
    cambiarHora: "Cambiar de hora", fragmento: "Tu fragmento secreto",
    fragmentoAyuda: "Cada persona de vuestra sala tiene una palabra distinta de una frase de seis (I a VI). Es solo tuya y no cambia. Juntadlas en orden con vuestro grupo y decidle a la guía lo que habéis descubierto.",
    hermandad: "Vuestra hermandad", formacion: "Grupo en formación", sala: "Sala", personas: "personas",
    editar: "Editar reserva", anular: "Anular reserva", cancelarPlaza: "Cancelar mi plaza", cancelarAsistencia: "Cancelar solo mi asistencia",
    miEquipo: "Mi equipo", anadirIntegrante: "+ Añadir integrante", tu: "(tú)", noQuitar: "No quitar a", quitar: "Quitar a",
    correoNuevo: "Correo de la persona que quieres añadir", anadir: "Añadir",
    quedan: (n) => `${n === 1 ? "Queda" : "Quedan"} ${n} ${n === 1 ? "plaza" : "plazas"} en vuestro turno. Mínimo ${MIN_SALA_NUEVA} y máximo ${MAX_PERSONAS} personas.`,
    guardando: "Guardando…", guardar: "Guardar cambios", cancelarCambios: "Cancelar cambios",
    cambioTexto: `Solo te mueves tú; tu grupo se queda en su turno. Puedes unirte a un grupo en formación con hueco (para abrir una sala libre hacen falta ${MIN_SALA_NUEVA} personas).`,
    quedanN: (n) => `quedan ${n}`, salaLibre: "sala libre", completo: "completo", cerrar: "Cerrar",
    antes: "Antes de venir…", puntualidad: "Puntualidad", puntualidadTexto: "Llegad 15 minutos antes. Si llegáis tarde, se descuenta del tiempo de la sala.",
    accesibilidad: "Revisar accesibilidad", accesibilidadTexto: "Hay luces y efectos. Si tienes alguna necesidad de movilidad o sensibilidad a luz o sonido, escríbenos antes.",
    dudas: "¿Dudas o problemas?", escribenos: "Escríbenos a", faq: "Preguntas frecuentes", salir: "Cerrar sesión",
  },
  en: {
    avisoNueva: "Booking created. We've emailed each member so they can confirm their place, and sent you your ticket.",
    popTitulo: "Before you go", popTexto: "don't forget to tell your teammates to confirm they're coming, or they'll lose their place.",
    popBoton: "Got it", popCerrar: "Close",
    avisoConfirmado: "Place confirmed! We've emailed you your ticket.",
    avisoFallidos: (c) => `Booking created, but we couldn't send the email to: ${c}. Tell them to sign in to the website with their email to confirm.`,
    preguntaGrupo: "Cancel your booking? Your place and those of the people you added will be cancelled (we'll email them). Everyone else in the room keeps theirs. This can't be undone.",
    preguntaPlaza: "Cancel your place? The rest of the group keeps theirs.",
    correoMal: "The email must be nameSurname@alumnado.esada.es", repetido: "That email is already in the group.",
    noCaben: `No more people fit in your session (maximum ${MAX_PERSONAS}).`,
    guardadoFallidos: (c) => `Changes saved, but we couldn't send the invitation to: ${c}. Tell them to sign in to the website with their email.`,
    guardadoInvitados: "Changes saved. We've sent the invitation to the new people: they have 48 h to confirm.", guardado: "Changes saved.",
    cargando: "Loading your booking…", nuevo: "New · will get the invitation when you save", seQuitara: "Will be removed from the group when you save",
    profesorado: "Teaching staff", lider: "Leader", invitado: "Guest", apuntadoPor: (c) => `Added by ${c}`, porSuCuenta: "Booked on their own", confirmado: "Confirmed", pendienteHasta: (f) => `Pending (until ${f})`,
    miReserva: "My booking", numero: "No.", tuReserva: "Your booking", qrAlt: "Your ticket's QR: show it at the door",
    sinQr: "Your ticket (the QR code) will appear here once you confirm your place from the link in your email.",
    pendiente: "Pending confirmation", confirmada: "Confirmed", llegad: "arrive 15 min early", soloErasmus: "Erasmus only",
    cambiarHora: "Change time", fragmento: "Your secret fragment",
    fragmentoAyuda: "Each person in your room has a different word from a six-word phrase (I to VI). It's yours alone and won't change. Put them together in order with your group and tell the guide what you discovered.",
    hermandad: "Your circle", formacion: "Group forming", sala: "Room", personas: "people",
    editar: "Edit booking", anular: "Cancel booking", cancelarPlaza: "Cancel my place", cancelarAsistencia: "Cancel only my attendance",
    miEquipo: "My team", anadirIntegrante: "+ Add member", tu: "(you)", noQuitar: "Don't remove", quitar: "Remove",
    correoNuevo: "Email of the person you want to add", anadir: "Add",
    quedan: (n) => `${n} ${n === 1 ? "place" : "places"} left in your session. Minimum ${MIN_SALA_NUEVA} and maximum ${MAX_PERSONAS} people.`,
    guardando: "Saving…", guardar: "Save changes", cancelarCambios: "Cancel changes",
    cambioTexto: `Only you move; your group stays in its session. You can join a forming group with space (opening an empty room needs ${MIN_SALA_NUEVA} people).`,
    quedanN: (n) => `${n} left`, salaLibre: "empty room", completo: "full", cerrar: "Close",
    antes: "Before you come…", puntualidad: "Punctuality", puntualidadTexto: "Arrive 15 minutes early. If you're late, it comes off your time in the room.",
    accesibilidad: "Check accessibility", accesibilidadTexto: "There are lights and effects. If you have any mobility needs or sensitivity to light or sound, write to us beforehand.",
    dudas: "Questions or problems?", escribenos: "Write to us at", faq: "Frequently asked questions", salir: "Sign out",
  },
};

function Avisos({ t }) {
  const q = useSearchParams();
  if (q.get("nueva")) return <p className="aviso-ok" role="status">{t.avisoNueva}</p>;
  if (q.get("confirmado")) return <p className="aviso-ok" role="status">{t.avisoConfirmado}</p>;
  if (q.get("fallidos")) return <p className="aviso-error" role="alert">{t.avisoFallidos(q.get("fallidos"))}</p>;
  return null;
}

/**
 * Pop-up «Antes de irte…» (naranja de Lilium): sale al terminar la reserva (al llegar con ?nueva o ?fallidos)
 * si quien reservó tiene gente suya sin confirmar, para que les avise de que confirmen en 48 h.
 * Al cerrarlo se apunta en el navegador (sessionStorage) para no repetirlo si se recarga la página.
 */
const CLAVE_POP = "lilium-pop-confirmar";
function PopupConfirmar({ t, hayPendientes }) {
  const q = useSearchParams();
  const recienReservada = Boolean(q.get("nueva") || q.get("fallidos"));
  const [abierto, setAbierto] = useState(false);
  const boton = useRef(null);

  useEffect(() => {
    if (!recienReservada || !hayPendientes) return;
    let visto = false;
    try { visto = sessionStorage.getItem(CLAVE_POP) === "1"; } catch {}
    if (visto) return;
    const espera = setTimeout(() => setAbierto(true), 500); // deja ver primero la página
    return () => clearTimeout(espera);
  }, [recienReservada, hayPendientes]);

  useEffect(() => {
    if (!abierto) return;
    boton.current?.focus();
    const conTecla = (e) => e.key === "Escape" && cerrar();
    document.addEventListener("keydown", conTecla);
    return () => document.removeEventListener("keydown", conTecla);
  }, [abierto]);

  function cerrar() {
    try { sessionStorage.setItem(CLAVE_POP, "1"); } catch {}
    setAbierto(false);
  }

  if (!abierto) return null;
  return (
    <div className="pop-confirmar" onClick={(e) => e.target === e.currentTarget && cerrar()}>
      <div className="pop-confirmar__caja" role="alertdialog" aria-modal="true" aria-labelledby="pop-confirmar-titulo" aria-describedby="pop-confirmar-texto">
        <button className="pop-confirmar__cerrar" type="button" aria-label={t.popCerrar} onClick={cerrar}>×</button>
        <img className="pop-confirmar__lirio" src="/assets/img/icono-lirio.webp" width="99" height="79" alt="" />
        <h2 id="pop-confirmar-titulo" className="pop-confirmar__titulo">{t.popTitulo}…</h2>
        <p id="pop-confirmar-texto" className="pop-confirmar__texto">{t.popTexto}</p>
        <button ref={boton} type="button" className="pop-confirmar__boton" onClick={cerrar}>{t.popBoton}</button>
      </div>
    </div>
  );
}

function MiReservaContenido() {
  const { email, error: errorSesion } = useSesion("mi-reserva");
  const { idioma } = useIdioma();
  const t = TEXTOS[idioma];
  const evento = eventoEn(idioma);
  const router = useRouter();
  const [reserva, setReserva] = useState(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [cambiando, setCambiando] = useState(null); // lista de turnos al cambiar de hora
  const [ocupado, setOcupado] = useState(false);
  // Modo editar (quien reservó, solo con su gente): a quién se quita y a quién se añade antes de «Guardar cambios»
  const [editando, setEditando] = useState(false);
  const [quitar, setQuitar] = useState([]);
  const [anadir, setAnadir] = useState([]);
  const [campo, setCampo] = useState("");
  const [mostrarCampo, setMostrarCampo] = useState(false);

  const cargar = useCallback(async () => {
    const r = await api("/api/mi-reserva");
    if (!r.ok) return setError(r.mensaje);
    if (!r.reserva) return router.replace("/inicio");
    setReserva(r.reserva);
  }, [router]);

  useEffect(() => {
    if (email) cargar();
  }, [email, cargar]);

  async function cancelar(grupo) {
    const pregunta = grupo ? t.preguntaGrupo : t.preguntaPlaza;
    if (!window.confirm(pregunta)) return;
    setOcupado(true);
    const r = await api("/api/mi-reserva/cancelar", { metodo: "POST", datos: { grupo } });
    setOcupado(false);
    if (!r.ok) return setError(r.mensaje);
    router.replace("/inicio");
  }

  async function abrirCambio() {
    const r = await api("/api/turnos");
    if (!r.ok) return setError(r.mensaje);
    setCambiando(r.turnos.filter((t) => t.id !== reserva.turno.id));
  }

  async function moverA(turnoId) {
    setOcupado(true);
    const r = await api("/api/mi-reserva/cambiar-hora", { metodo: "POST", datos: { turnoId } });
    setOcupado(false);
    if (!r.ok) return setError(r.mensaje);
    setCambiando(null);
    setError("");
    cargar();
  }

  async function salir() {
    await api("/api/sesion", { metodo: "DELETE" });
    router.replace("/inicio");
  }

  // ----- Editar a mi gente (quien reservó) -----
  function empezarEdicion() {
    setEditando(true);
    setQuitar([]);
    setAnadir([]);
    setCampo("");
    setMostrarCampo(false);
    setError("");
    setAviso("");
  }

  function cancelarEdicion() {
    setEditando(false);
    setError("");
  }

  // Marca o desmarca a alguien para quitarlo (no se borra hasta «Guardar cambios»)
  const alternarQuitar = (correo) =>
    setQuitar((lista) => (lista.includes(correo) ? lista.filter((c) => c !== correo) : [...lista, correo]));

  function anadirCorreo(e) {
    e.preventDefault();
    const correo = campo.trim().toLowerCase();
    const enGrupo = reserva.miembros.some((m) => m.email === correo) && !quitar.includes(correo);
    let mensaje = "";
    if (!CORREO_VALIDO.test(correo)) mensaje = t.correoMal;
    else if (enGrupo || anadir.includes(correo)) mensaje = t.repetido;
    else if (hueco <= 0) mensaje = t.noCaben;
    setError(mensaje);
    if (mensaje) return;
    setAnadir([...anadir, correo]);
    setCampo("");
  }

  async function guardar() {
    setOcupado(true);
    const r = await api("/api/mi-reserva/integrantes", { metodo: "POST", datos: { anadir, quitar } });
    setOcupado(false);
    if (!r.ok) return setError(r.mensaje);
    setAviso(r.fallidos?.length ? t.guardadoFallidos(r.fallidos.join(", ")) : anadir.length ? t.guardadoInvitados : t.guardado);
    // Se vacía la lista de cambios: a partir de ahora manda lo que dice el servidor
    setEditando(false);
    setQuitar([]);
    setAnadir([]);
    setError("");
    cargar();
  }

  if (!email || !reserva) return <Cargando error={errorSesion || error} texto={t.cargando} />;

  const { turno, miembros, yo, lider } = reserva;
  // Quien reservó ella misma (la líder o alguien que se unió después) gestiona SOLO a la gente que apuntó:
  // puede editar a esas personas y anular su reserva; las apuntadas por otras personas no tienen ✕.
  const gestiona = Boolean(yo.responsable);
  const esMia = (m) => m.nuevo || (m.apuntadoPor === yo.email && m.email !== yo.email);
  const pendientes = miembros.filter((m) => !m.confirmado).length;
  // Plazas libres en el turno para añadir alumnado, teniendo en cuenta los cambios sin guardar
  // (hasta el 2 de noviembre a las 12:00, si no hay profesorado en la sala, una plaza está guardada para él)
  const soyProfe = esProfesorado(yo.email);
  const hueco = huecoPara({ ocupadas: turno.ocupadas, profe: miembros.some((m) => esProfesorado(m.email)) }, false) + quitar.length - anadir.length;
  const lista = [...miembros.map((m) => ({ ...m, nuevo: false })), ...anadir.map((c) => ({ email: c, confirmado: false, nuevo: true }))];
  // Toda la gente de la sala está en un solo grupo (lib/reservas.js), así que aquí sale todo el equipo
  const iconos = iconosDe(lista.map((m) => m.email)); // icono de perfil de cada persona
  const [iconoEquipo] = iconosDe([`equipo-${turno.id}`]);
  const hayCambios = quitar.length > 0 || anadir.length > 0;

  const estadoDe = (m) => {
    if (m.nuevo) return t.nuevo;
    if (quitar.includes(m.email)) return t.seQuitara;
    // Líder (quien abrió la sala); quien reservó por su cuenta; o «Invitado» (y, si no lo apunté yo, quién lo apuntó)
    let papel = m.email === lider ? t.lider : m.apuntadoPor === m.email ? t.porSuCuenta : t.invitado;
    if (esProfesorado(m.email)) papel = m.email === lider ? `${t.lider} · ${t.profesorado}` : t.profesorado; // indicador de profesorado
    if (m.email !== lider && m.apuntadoPor && m.apuntadoPor !== m.email && m.apuntadoPor !== yo.email && m.apuntadoPor !== lider) {
      papel = `${papel} · ${t.apuntadoPor(m.apuntadoPor)}`;
    }
    return m.confirmado ? `${papel} · ${t.confirmado}` : `${papel} · ${t.pendienteHasta(fechaHora(m.limite, idioma))}`;
  };

  return (
    <>
      <NavReserva />
      <main className="mi-reserva" data-fondo="oscuro">
        <header className="mi-reserva__cabecera" data-principal>
          <p className="mi-reserva__etiqueta">{t.miReserva}</p>
          {/* Nombre que se le puso al grupo (si no tiene, «Vuestra hermandad») */}
          <h1 className="mi-reserva__titulo">{turno.equipo || t.hermandad}</h1>
        </header>

        {/* Al terminar la reserva: recordatorio para que su gente confirme */}
        <PopupConfirmar t={t} hayPendientes={miembros.some((m) => esMia(m) && !m.confirmado)} />

        <div className="mi-reserva__avisos">
          <Avisos t={t} />
          {aviso && <p className="aviso-ok" role="status">{aviso}</p>}
        </div>

        <div className="mi-reserva__rejilla">
          {/* ---------- Tu reserva: entrada, estado, día y hora ---------- */}
          <section className="mr-tarjeta mr-entrada" aria-labelledby="entrada-titulo">
            <h2 id="entrada-titulo" className="mr-tarjeta__titulo">{t.tuReserva}</h2>
            {yo.confirmado && reserva.qr ? (
              <img className="mr-entrada__qr" src={reserva.qr} width="203" height="203" alt={t.qrAlt} />
            ) : (
              <p className="mr-entrada__sin-qr">{t.sinQr}</p>
            )}
            <span className="mr-estado">{pendientes ? t.pendiente : t.confirmada}</span>
            <p className="mr-entrada__dato">{evento.fechaTexto}</p>
            <p className="mr-entrada__dato">{turno.inicio}—{turno.fin}</p>
            <p className="mr-entrada__nota">{evento.lugar} · {t.llegad}{turno.erasmus ? ` · ${t.soloErasmus}` : ""}</p>
            <button className="mr-enlace" type="button" onClick={abrirCambio} disabled={ocupado}>{t.cambiarHora}</button>

            {yo.confirmado && reserva.fragmentos?.length > 0 && (
              <div className="fragmento">
                <p className="fragmento__titulo">{t.fragmento}</p>
                <p className="fragmento__palabras">
                  {reserva.fragmentos.map((f) => (
                    <span key={f.numero} className="fragmento__palabra"><small>{f.numero}</small> {f.palabra}</span>
                  ))}
                </p>
                <p className="fragmento__ayuda">{t.fragmentoAyuda}</p>
              </div>
            )}
          </section>

          {/* ---------- Mi equipo ---------- */}
          <section className="mr-tarjeta mr-equipo" aria-labelledby="equipo-titulo">
            <div className="mr-equipo__sala">
              <img className="mr-equipo__icono" src={iconoEquipo} width="250" height="250" alt="" />
              <p className="mr-equipo__nombre">{turno.equipo ? `“${turno.equipo}”` : t.hermandad}</p>
              <p className="mr-equipo__tipo">{turno.ocupadas < MIN_SALA_NUEVA ? t.formacion : t.sala} · {turno.ocupadas}/{MAX_PERSONAS} {t.personas}</p>
              {/* El profesorado reserva solo su plaza: no tiene gente que editar */}
              {gestiona && !editando && !soyProfe && (
                <button className="mr-boton mr-boton--lleno" type="button" onClick={empezarEdicion} disabled={ocupado}>{t.editar}</button>
              )}
              {gestiona ? (
                <button className="mr-boton" type="button" onClick={() => cancelar(true)} disabled={ocupado}>{t.anular}</button>
              ) : (
                <button className="mr-boton" type="button" onClick={() => cancelar(false)} disabled={ocupado}>{t.cancelarPlaza}</button>
              )}
              {gestiona && <button className="mr-enlace" type="button" onClick={() => cancelar(false)} disabled={ocupado}>{t.cancelarAsistencia}</button>}
            </div>

            <div className="mr-equipo__lista">
              <div className="mr-equipo__cabecera">
                <h2 id="equipo-titulo" className="mr-tarjeta__titulo">{t.miEquipo}</h2>
                {editando && hueco > 0 && !mostrarCampo && (
                  <button className="mr-chip" type="button" onClick={() => setMostrarCampo(true)}>{t.anadirIntegrante}</button>
                )}
              </div>

              <ul className="mr-miembros">
                {lista.map((m, i) => {
                  const quitado = quitar.includes(m.email);
                  return (
                    <li key={m.email} className={`mr-miembro${quitado ? " is-quitado" : ""}${m.nuevo ? " is-nuevo" : ""}`}>
                      <img src={iconos[i]} width="51" height="51" alt="" />
                      <div className="mr-miembro__datos">
                        <p className="mr-miembro__correo">{m.email}{m.email === yo.email ? ` ${t.tu}` : ""}</p>
                        <p className="mr-miembro__estado">{estadoDe(m)}</p>
                      </div>
                      <div className="mr-miembro__acciones">
                        {m.confirmado && !quitado && <span className="mr-icono mr-icono--si" role="img" aria-label={t.confirmado}><IconoCheck /></span>}
                        {/* La ✕ solo aparece al editar, y solo en las personas que apuntaste tú */}
                        {editando && esMia(m) && (
                          <button type="button" className={`mr-icono mr-icono--quitar${quitado ? " is-deshacer" : ""}`}
                            aria-label={quitado ? `${t.noQuitar} ${m.email}` : `${t.quitar} ${m.email}`}
                            onClick={() => (m.nuevo ? setAnadir(anadir.filter((c) => c !== m.email)) : alternarQuitar(m.email))}>
                            <IconoCruz />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {editando && mostrarCampo && hueco > 0 && (
                <form className="mr-anadir" onSubmit={anadirCorreo}>
                  <label className="visually-hidden" htmlFor="nuevo-integrante">{t.correoNuevo}</label>
                  <input className="campo" id="nuevo-integrante" type="email" placeholder="nombreapellido@alumnado.esada.es"
                    value={campo} onChange={(e) => setCampo(e.target.value)} autoFocus />
                  <button className="mr-boton mr-boton--lleno" type="submit">{t.anadir}</button>
                </form>
              )}

              <p className="mr-equipo__plazas">
                {t.quedan(Math.max(0, hueco))}
              </p>

              {editando && (
                <div className="mr-equipo__botones">
                  <button className="mr-boton mr-boton--lleno" type="button" onClick={guardar} disabled={ocupado || !hayCambios}>
                    {ocupado ? t.guardando : t.guardar}
                  </button>
                  <button className="mr-boton mr-boton--claro" type="button" onClick={cancelarEdicion} disabled={ocupado}>{t.cancelarCambios}</button>
                </div>
              )}
              <p className="error error--centro" role="alert">{error}</p>
            </div>
          </section>

          {/* ---------- Cambiar de hora (se abre desde «Tu reserva») ---------- */}
          {cambiando && (
            <section className="mr-tarjeta mr-cambio" aria-labelledby="cambio-titulo">
              <h2 id="cambio-titulo" className="mr-tarjeta__titulo">{t.cambiarHora}</h2>
              <p>{t.cambioTexto}</p>
              <ul className="cambio-hora__lista">
                {cambiando.map((x) => {
                  // `x.hueco` ya cuenta la plaza del profesorado; el profesorado también puede pasar a una sala vacía
                  const posible = (x.estado === "formacion" || (soyProfe && x.estado === "libre")) && x.hueco >= 1;
                  return (
                    <li key={x.id}>
                      <button type="button" className="chip" disabled={!posible || ocupado} onClick={() => moverA(x.id)}>
                        {x.inicio}-{x.fin} · {x.estado === "formacion" ? t.quedanN(x.hueco) : x.estado === "libre" ? t.salaLibre : t.completo}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button type="button" className="mr-enlace" onClick={() => setCambiando(null)}>{t.cerrar}</button>
            </section>
          )}

          {/* ---------- Antes de venir… ---------- */}
          <section className="mr-tarjeta mr-antes" aria-labelledby="antes-titulo">
            <h2 id="antes-titulo" className="mr-tarjeta__titulo">{t.antes}</h2>
            <ul className="mr-antes__lista">
              <li>
                <img src="/assets/img/perfiles/aire-5.svg" width="51" height="51" alt="" />
                <div>
                  <p className="mr-antes__titulo">{t.puntualidad}</p>
                  <p>{t.puntualidadTexto}</p>
                </div>
              </li>
              <li>
                <img src="/assets/img/perfiles/agua-5.svg" width="51" height="51" alt="" />
                <div>
                  <p className="mr-antes__titulo">{t.accesibilidad}</p>
                  <p>{t.accesibilidadTexto}</p>
                </div>
              </li>
              <li>
                <img src="/assets/img/perfiles/eter-5.svg" width="51" height="51" alt="" />
                <div>
                  <p className="mr-antes__titulo">{t.dudas}</p>
                  <p>{t.escribenos} <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a> · <Link href="/inicio#faq">{t.faq}</Link></p>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <button className="mr-salir" type="button" onClick={salir}>{t.salir}</button>
      </main>
      <PiePagina />
    </>
  );
}

export default function MiReserva() {
  return (
    <Suspense fallback={<Cargando />}>
      <MiReservaContenido />
    </Suspense>
  );
}
