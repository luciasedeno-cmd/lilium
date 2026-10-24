"use client";
// Paso 3 · Revisión de la sala (Figma «PAG RESERVA - REVISION», sistema de diseño «Lilium DEFINITIVO»).
// Tres columnas: emblema del equipo | la sala, fecha y hora, tu equipo y anotaciones | resumen burdeos con el botón.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NavReserva from "@/components/NavReserva";
import Cargando from "@/components/Cargando";
import PasoCabecera from "@/components/PasoCabecera";
import PiePagina from "@/components/PiePagina";
import { IconoCheck, IconoCruz } from "@/components/Iconos";
import { leerBorrador, guardarBorrador, borrarBorrador, api } from "@/lib/borrador";
import { useSesion } from "@/lib/useSesion";
import { iconosDe } from "@/lib/fotos";
import { EVENTO, eventoEn, HORAS_CONFIRMACION, MIN_SALA_NUEVA, MAX_PERSONAS } from "@/lib/config";
import { useIdioma } from "@/components/Idioma";

const TEXTOS = {
  es: {
    etiqueta: "CONFIRMACIÓN", titulo: "Revisión de la sala",
    sinNombre: "Vuestra hermandad", editarReserva: "Editar reserva", anularReserva: "Anular reserva",
    preguntaAnular: "¿Seguro que quieres empezar de cero? Se borrará el grupo y la hora que has elegido.",
    laSala: "La sala", experiencia: "Lilium · El retiro",
    sinopsis: "Cinco guías os esperan en el prado para un ritual de 45 minutos. Entrad con la mente abierta: el resto lo descubriréis dentro.",
    minutos: "45 min", personas: `${MIN_SALA_NUEVA}–${MAX_PERSONAS} personas`, erasmus: "Solo Erasmus", verMas: "Ver más sobre la experiencia",
    fechaHora: "Fecha y hora", dia: "Día", hora: "Hora", llegada: "Llegada", antes: "15 min antes", lugar: "Lugar",
    tuEquipo: "Tu equipo", liderConfirmado: "Líder · Confirmado", invitado: "Invitado · Recibirá correo para confirmar",
    quitar: "Quitar a", confirmado: "Confirmado",
    anotaciones: "Anotaciones", notasPista: "¿Algo que debamos saber? (opcional)",
    resumen: "Resumen", sala: "Sala", fecha: "Fecha",
    terminos1: "Acepto los", terminosEnlace: "términos y condiciones", terminos2: "y la política de privacidad",
    normas: "He leído las normas de la sala (incluido el aviso de luces y efectos)",
    confirmar: "Confirmar reserva", reservando: "Reservando…",
    despues: "¿Qué pasa después?",
    pasos: [
      "Recibes un correo con tu entrada y el código QR.",
      "Tu equipo recibe la invitación para confirmar su plaza.",
      `Cada persona tiene ${HORAS_CONFIRMACION} h para confirmar; quien no lo haga pierde su plaza.`,
    ],
    faltaAceptar: "Para reservar tienes que marcar las dos casillas.",
    noValido: (n) => n < MIN_SALA_NUEVA
      ? `Para abrir una sala libre hacen falta al menos ${MIN_SALA_NUEVA} personas. Añade a alguien o elige otro turno.`
      : "En ese turno ya no cabe todo el grupo. Elige otro turno.",
    volverHora: "Elegir otro turno",
  },
  en: {
    etiqueta: "CONFIRMATION", titulo: "Review your room",
    sinNombre: "Your sisterhood", editarReserva: "Edit booking", anularReserva: "Cancel booking",
    preguntaAnular: "Are you sure you want to start again? Your group and chosen time will be cleared.",
    laSala: "The room", experiencia: "Lilium · The retreat",
    sinopsis: "Five guides await you in the meadow for a 45-minute ritual. Come with an open mind: you'll discover the rest inside.",
    minutos: "45 min", personas: `${MIN_SALA_NUEVA}–${MAX_PERSONAS} people`, erasmus: "Erasmus only", verMas: "Learn more about the experience",
    fechaHora: "Date and time", dia: "Day", hora: "Time", llegada: "Arrival", antes: "15 min early", lugar: "Place",
    tuEquipo: "Your team", liderConfirmado: "Leader · Confirmed", invitado: "Guest · Will get an email to confirm",
    quitar: "Remove", confirmado: "Confirmed",
    anotaciones: "Notes", notasPista: "Anything we should know? (optional)",
    resumen: "Summary", sala: "Room", fecha: "Date",
    terminos1: "I accept the", terminosEnlace: "terms and conditions", terminos2: "and the privacy policy",
    normas: "I have read the room rules (including the lights and effects warning)",
    confirmar: "Confirm booking", reservando: "Booking…",
    despues: "What happens next?",
    pasos: [
      "You get an email with your ticket and the QR code.",
      "Your team gets the invitation to confirm their place.",
      `Everyone has ${HORAS_CONFIRMACION} h to confirm; anyone who doesn't loses their place.`,
    ],
    faltaAceptar: "To book you must tick both boxes.",
    noValido: (n) => n < MIN_SALA_NUEVA
      ? `Opening a free room needs at least ${MIN_SALA_NUEVA} people. Add someone or choose another session.`
      : "Your whole group no longer fits in that session. Choose another one.",
    volverHora: "Choose another session",
  },
};

/** «11:00» → «10:45» (la llegada es 15 minutos antes) */
function quinceAntes(hora) {
  const [h, m] = String(hora).split(":").map(Number);
  const total = h * 60 + m - 15;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default function Confirmacion() {
  const { email: lider, error: errorSesion } = useSesion("reserva");
  const { idioma } = useIdioma();
  const t = TEXTOS[idioma];
  const evento = eventoEn(idioma);
  const router = useRouter();
  const [borrador, setBorrador] = useState(null);
  const [turno, setTurno] = useState(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [terminos, setTerminos] = useState(false);
  const [normas, setNormas] = useState(false);

  useEffect(() => {
    const b = leerBorrador();
    if (!b.turnoId) return router.replace("/reserva/hora");
    setBorrador(b);
    api("/api/turnos").then((r) => {
      const x = r.ok && r.turnos.find((y) => y.id === b.turnoId);
      if (!r.ok) return setError(r.mensaje);
      if (!x) return router.replace("/reserva/hora");
      setTurno(x);
    });
  }, [router]);

  if (!lider || !borrador || !turno) return <Cargando error={errorSesion || error} />;

  const actualizar = (cambios) => setBorrador(guardarBorrador(cambios));
  const otros = borrador.integrantes || [];
  const miembros = [lider, ...otros];
  const iconos = iconosDe(miembros); // icono de perfil de cada persona
  const nueva = turno.estado === "libre";
  const equipo = nueva ? (borrador.equipo || "").trim() || t.sinNombre : turno.equipo || t.sinNombre;
  // ¿Sigue valiendo el turno con el grupo actual? (se puede quitar gente desde aquí)
  const valido = nueva ? miembros.length >= MIN_SALA_NUEVA : turno.hueco >= miembros.length;
  const aceptado = terminos && normas;
  // Fecha corta para el resumen: «vie, 20 nov» / «Fri 20 Nov»
  const fechaCorta = new Date(`${EVENTO.fecha}T12:00:00`).toLocaleDateString(idioma === "en" ? "en-GB" : "es-ES", { weekday: "short", day: "numeric", month: "short" });

  async function reservar() {
    if (!valido) return setError(t.noValido(miembros.length));
    if (!aceptado) return setError(t.faltaAceptar);
    setEnviando(true);
    setError("");
    const res = await api("/api/reservas", {
      metodo: "POST",
      datos: { otros, turnoId: turno.id, equipo: borrador.equipo || "", notas: borrador.notas || "", aceptaTerminos: true },
    });
    setEnviando(false);
    if (!res.ok) return setError(res.mensaje);
    borrarBorrador();
    router.replace(res.fallidos?.length ? `/mi-reserva?fallidos=${encodeURIComponent(res.fallidos.join(","))}` : "/mi-reserva?nueva=1");
  }

  function anular() {
    if (!window.confirm(t.preguntaAnular)) return;
    borrarBorrador();
    router.push("/inicio");
  }

  return (
    <>
      <NavReserva />
      <main className="paso rev">
        <PasoCabecera paso={3} />

        <header className="rev__encabezado">
          <h1 className="rev__titulo">{t.titulo}</h1>
          <p className="rev__etiqueta">{t.etiqueta}</p>
        </header>

        <div className="rev__rejilla">
          {/* ---------- Columna 1: emblema del equipo ---------- */}
          <aside className="rev-emblema">
            <span className="rev-emblema__circulo" aria-hidden="true">{equipo.trim().charAt(0)}</span>
            <p className="rev-emblema__nombre">“{equipo}”</p>
            <Link className="ll-btn ll-btn--md ll-btn--primary" href="/reserva/integrantes">{t.editarReserva}</Link>
            <button className="ll-btn ll-btn--md ll-btn--secondary" type="button" onClick={anular}>{t.anularReserva}</button>
          </aside>

          {/* ---------- Columna 2: la sala, fecha y hora, equipo, anotaciones ---------- */}
          <div className="rev-detalle">
            <section aria-labelledby="rev-sala">
              <h2 className="rev-seccion" id="rev-sala">{t.laSala}</h2>
              <p className="rev-sala__nombre">{t.experiencia}</p>
              <p className="rev-sala__sinopsis">{t.sinopsis}</p>
              <div className="rev-sala__badges">
                <span className="ll-badge">{t.minutos}</span>
                <span className="ll-badge">{t.personas}</span>
                {turno.erasmus && <span className="ll-badge">{t.erasmus}</span>}
              </div>
              <Link className="rev-sala__mas" href="/inicio#paraiso">{t.verMas}</Link>
            </section>

            <section aria-labelledby="rev-fecha">
              <h2 className="rev-seccion" id="rev-fecha">{t.fechaHora}</h2>
              <dl className="ll-rows rev-filas">
                <div className="ll-row"><dt>{t.dia}</dt><dd>{evento.fechaTexto}</dd></div>
                <div className="ll-row"><dt>{t.hora}</dt><dd>{turno.inicio}–{turno.fin}</dd></div>
                <div className="ll-row rev-filas__llegada"><dt>{t.llegada}</dt><dd>{quinceAntes(turno.inicio)} · {t.antes}</dd></div>
                <div className="ll-row"><dt>{t.lugar}</dt><dd>{evento.lugar}</dd></div>
              </dl>
            </section>

            <section aria-labelledby="rev-equipo">
              <h2 className="rev-seccion" id="rev-equipo">{t.tuEquipo}</h2>
              <ul className="rev-equipo">
                {miembros.map((m, i) => (
                  <li className="ll-member" key={m}>
                    <img className="ll-avatar" src={iconos[i]} width="48" height="48" alt="" />
                    <div className="ll-member__text">
                      <p className="ll-member__email">{m}</p>
                      <p className="ll-member__meta">{i === 0 ? t.liderConfirmado : t.invitado}</p>
                    </div>
                    <div className="ll-member__actions">
                      {i === 0 ? (
                        <span className="ll-icon-btn ll-icon-btn--confirm rev-icono" role="img" aria-label={t.confirmado}><IconoCheck /></span>
                      ) : (
                        <button className="ll-icon-btn ll-icon-btn--remove rev-icono" type="button" aria-label={`${t.quitar} ${m}`}
                          onClick={() => actualizar({ integrantes: otros.filter((x) => x !== m) })}>
                          <IconoCruz tamano={14} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="rev-notas">
              <h2 className="rev-seccion" id="rev-notas">{t.anotaciones}</h2>
              <label className="visually-hidden" htmlFor="rev-notas-campo">{t.notasPista}</label>
              <textarea className="rev-notas" id="rev-notas-campo" rows={3} maxLength={500} placeholder={t.notasPista}
                value={borrador.notas || ""} onChange={(e) => actualizar({ notas: e.target.value })} />
            </section>
          </div>

          {/* ---------- Columna 3: resumen y botón ---------- */}
          <aside className="rev-resumen" aria-labelledby="rev-resumen-titulo">
            <h2 className="rev-resumen__titulo" id="rev-resumen-titulo">{t.resumen}</h2>
            <dl className="rev-resumen__filas">
              <div><dt>{t.sala}</dt><dd>{equipo}</dd></div>
              <div><dt>{t.fecha}</dt><dd>{fechaCorta}</dd></div>
              <div><dt>{t.hora}</dt><dd>{turno.inicio}–{turno.fin}</dd></div>
            </dl>

            <label className="rev-casilla">
              <input type="checkbox" checked={terminos} onChange={(e) => { setTerminos(e.target.checked); setError(""); }} />
              <span>{t.terminos1} <a href="/terminos" target="_blank" rel="noopener">{t.terminosEnlace}</a> {t.terminos2}</span>
            </label>
            <label className="rev-casilla">
              <input type="checkbox" checked={normas} onChange={(e) => { setNormas(e.target.checked); setError(""); }} />
              <span>{t.normas}</span>
            </label>

            <button className="ll-btn ll-btn--md ll-btn--full rev-resumen__boton confirmar" type="button" onClick={reservar}
              disabled={enviando} aria-disabled={aceptado && valido ? undefined : "true"}>
              {enviando ? t.reservando : t.confirmar}
            </button>
            <p className="rev-resumen__error" role="alert">
              {error}
              {!valido && !error && t.noValido(miembros.length)}
              {!valido && <> <Link href="/reserva/hora">{t.volverHora}</Link></>}
            </p>

            <p className="rev-resumen__despues">{t.despues}</p>
            <ol className="rev-resumen__pasos">
              {t.pasos.map((p) => <li key={p}>{p}</li>)}
            </ol>
          </aside>
        </div>
      </main>
      <PiePagina />
    </>
  );
}
