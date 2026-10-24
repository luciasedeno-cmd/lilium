"use client";
// Mi reserva (Figma: PAG RESERVA - INTEGRANTES B): «Tu reserva» con la entrada, «Mi equipo» y «Antes de venir…».
// La persona líder puede editar el grupo: quitar (✕) y añadir integrantes, y luego «Guardar cambios».
import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import NavReserva from "@/components/NavReserva";
import Cargando from "@/components/Cargando";
import PiePagina from "@/components/PiePagina";
import { api } from "@/lib/borrador";
import { useSesion } from "@/lib/useSesion";
import { iconosDe } from "@/lib/fotos";
import { EVENTO, MIN_SALA_NUEVA, MAX_PERSONAS, CORREO_VALIDO, CONTACTO } from "@/lib/config";

const fechaHora = (d) =>
  new Date(d).toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

// Número corto de la reserva para el título (las 6 primeras letras de su identificador)
const numeroDe = (id) => String(id).replace(/-/g, "").slice(0, 6).toUpperCase();

function Avisos() {
  const q = useSearchParams();
  if (q.get("nueva")) return <p className="aviso-ok" role="status">Reserva creada. Hemos enviado un correo a cada integrante para que confirme su plaza, y a ti tu entrada.</p>;
  if (q.get("confirmado")) return <p className="aviso-ok" role="status">¡Plaza confirmada! Te hemos enviado la entrada por correo.</p>;
  if (q.get("fallidos")) return <p className="aviso-error" role="alert">Reserva creada, pero no pudimos enviar el correo a: {q.get("fallidos")}. Avísales de que entren en la web con su correo para confirmar.</p>;
  return null;
}

function MiReservaContenido() {
  const { email, error: errorSesion } = useSesion("mi-reserva");
  const router = useRouter();
  const [reserva, setReserva] = useState(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [cambiando, setCambiando] = useState(null); // lista de turnos al cambiar de hora
  const [ocupado, setOcupado] = useState(false);
  // Modo editar (solo líder): a quién se quita y a quién se añade antes de «Guardar cambios»
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
    const pregunta = grupo
      ? "¿Anular la reserva de TODO el grupo? Avisaremos por correo al resto. No se puede deshacer."
      : "¿Cancelar tu plaza? El resto del grupo mantiene la suya.";
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

  // ----- Editar el grupo (líder) -----
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
    if (!CORREO_VALIDO.test(correo)) mensaje = "El correo debe ser nombreapellido@alumnado.esada.es";
    else if (enGrupo || anadir.includes(correo)) mensaje = "Ese correo ya está en el grupo.";
    else if (hueco <= 0) mensaje = `En vuestro turno ya no caben más personas (máximo ${MAX_PERSONAS}).`;
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
    setAviso(r.fallidos?.length
      ? `Cambios guardados, pero no pudimos enviar la invitación a: ${r.fallidos.join(", ")}. Avísales de que entren en la web con su correo.`
      : anadir.length ? "Cambios guardados. Hemos enviado la invitación a las personas nuevas: tienen 48 h para confirmar." : "Cambios guardados.");
    // Se vacía la lista de cambios: a partir de ahora manda lo que dice el servidor
    setEditando(false);
    setQuitar([]);
    setAnadir([]);
    setError("");
    cargar();
  }

  if (!email || !reserva) return <Cargando error={errorSesion || error} texto="Cargando tu reserva…" />;

  const { turno, miembros, yo, lider } = reserva;
  const esLider = lider === yo.email;
  const pendientes = miembros.filter((m) => !m.confirmado).length;
  // Plazas libres en el turno teniendo en cuenta los cambios sin guardar
  const hueco = MAX_PERSONAS - turno.ocupadas + quitar.length - anadir.length;
  const lista = [...miembros.map((m) => ({ ...m, nuevo: false })), ...anadir.map((c) => ({ email: c, confirmado: false, nuevo: true }))];
  const iconos = iconosDe(lista.map((m) => m.email)); // icono de perfil de cada persona
  const [iconoEquipo] = iconosDe([`equipo-${turno.id}`]);
  const hayCambios = quitar.length > 0 || anadir.length > 0;

  const estadoDe = (m) => {
    if (m.nuevo) return "Nuevo · recibirá la invitación al guardar";
    if (quitar.includes(m.email)) return "Se quitará del grupo al guardar";
    const papel = m.email === lider ? "Líder" : "Invitado";
    return m.confirmado ? `${papel} · Confirmado` : `${papel} · Pendiente (hasta el ${fechaHora(m.limite)})`;
  };

  return (
    <>
      <NavReserva />
      <main className="mi-reserva">
        <header className="mi-reserva__cabecera">
          <p className="mi-reserva__etiqueta">Mi reserva</p>
          <h1 className="mi-reserva__titulo">Nº {numeroDe(reserva.id)}</h1>
        </header>

        <div className="mi-reserva__avisos">
          <Avisos />
          {aviso && <p className="aviso-ok" role="status">{aviso}</p>}
        </div>

        <div className="mi-reserva__rejilla">
          {/* ---------- Tu reserva: entrada, estado, día y hora ---------- */}
          <section className="mr-tarjeta mr-entrada" aria-labelledby="entrada-titulo">
            <h2 id="entrada-titulo" className="mr-tarjeta__titulo">Tu reserva</h2>
            {yo.confirmado && reserva.qr ? (
              <img className="mr-entrada__qr" src={reserva.qr} width="203" height="203" alt="QR de tu entrada: enséñalo en la puerta" />
            ) : (
              <p className="mr-entrada__sin-qr">Tu entrada (el código QR) aparecerá aquí cuando confirmes tu plaza desde el enlace de tu correo.</p>
            )}
            <span className="mr-estado">{pendientes ? "Pendiente de confirmación" : "Confirmada"}</span>
            <p className="mr-entrada__dato">{EVENTO.fechaTexto}</p>
            <p className="mr-entrada__dato">{turno.inicio}—{turno.fin}</p>
            <p className="mr-entrada__nota">{EVENTO.lugar} · llegad 15 min antes{turno.erasmus ? " · Solo Erasmus" : ""}</p>
            <button className="mr-enlace" type="button" onClick={abrirCambio} disabled={ocupado}>Cambiar de hora</button>

            {yo.confirmado && reserva.fragmentos?.length > 0 && (
              <div className="fragmento">
                <p className="fragmento__titulo">Tu fragmento secreto</p>
                <p className="fragmento__palabras">
                  {reserva.fragmentos.map((f) => (
                    <span key={f.numero} className="fragmento__palabra"><small>{f.numero}</small> {f.palabra}</span>
                  ))}
                </p>
                <p className="fragmento__ayuda">Cada persona de vuestra sala tiene una parte distinta. Juntadlas en orden (I a VI) antes del día y decidle a la guía lo que habéis descubierto. Si se une más gente a vuestra sala, el reparto puede cambiar: aquí lo verás siempre al día.</p>
              </div>
            )}
          </section>

          {/* ---------- Mi equipo ---------- */}
          <section className="mr-tarjeta mr-equipo" aria-labelledby="equipo-titulo">
            <div className="mr-equipo__sala">
              <img className="mr-equipo__icono" src={iconoEquipo} width="250" height="250" alt="" />
              <p className="mr-equipo__nombre">{turno.equipo ? `“${turno.equipo}”` : "Vuestra hermandad"}</p>
              <p className="mr-equipo__tipo">{turno.ocupadas < MIN_SALA_NUEVA ? "Grupo en formación" : "Sala"} · {turno.ocupadas}/{MAX_PERSONAS} personas</p>
              {esLider && !editando && (
                <button className="mr-boton mr-boton--lleno" type="button" onClick={empezarEdicion} disabled={ocupado}>Editar reserva</button>
              )}
              {esLider ? (
                <button className="mr-boton" type="button" onClick={() => cancelar(true)} disabled={ocupado}>Anular reserva</button>
              ) : (
                <button className="mr-boton" type="button" onClick={() => cancelar(false)} disabled={ocupado}>Cancelar mi plaza</button>
              )}
              {esLider && <button className="mr-enlace" type="button" onClick={() => cancelar(false)} disabled={ocupado}>Cancelar solo mi asistencia</button>}
            </div>

            <div className="mr-equipo__lista">
              <div className="mr-equipo__cabecera">
                <h2 id="equipo-titulo" className="mr-tarjeta__titulo">Mi equipo</h2>
                {editando && hueco > 0 && !mostrarCampo && (
                  <button className="mr-chip" type="button" onClick={() => setMostrarCampo(true)}>+ Añadir integrante</button>
                )}
              </div>

              <ul className="mr-miembros">
                {lista.map((m, i) => {
                  const quitado = quitar.includes(m.email);
                  return (
                    <li key={m.email} className={`mr-miembro${quitado ? " is-quitado" : ""}${m.nuevo ? " is-nuevo" : ""}`}>
                      <img src={iconos[i]} width="51" height="51" alt="" />
                      <div className="mr-miembro__datos">
                        <p className="mr-miembro__correo">{m.email}{m.email === yo.email ? " (tú)" : ""}</p>
                        <p className="mr-miembro__estado">{estadoDe(m)}</p>
                      </div>
                      <div className="mr-miembro__acciones">
                        {m.confirmado && !quitado && <span className="mr-icono mr-icono--si" role="img" aria-label="Confirmado" />}
                        {/* La ✕ solo aparece al editar, y nunca en la fila de la persona líder */}
                        {editando && m.email !== lider && (
                          <button type="button" className={`mr-icono mr-icono--quitar${quitado ? " is-deshacer" : ""}`}
                            aria-label={quitado ? `No quitar a ${m.email}` : `Quitar a ${m.email}`}
                            onClick={() => (m.nuevo ? setAnadir(anadir.filter((c) => c !== m.email)) : alternarQuitar(m.email))} />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {editando && mostrarCampo && hueco > 0 && (
                <form className="mr-anadir" onSubmit={anadirCorreo}>
                  <label className="visually-hidden" htmlFor="nuevo-integrante">Correo de la persona que quieres añadir</label>
                  <input className="campo" id="nuevo-integrante" type="email" placeholder="nombreapellido@alumnado.esada.es"
                    value={campo} onChange={(e) => setCampo(e.target.value)} autoFocus />
                  <button className="mr-boton mr-boton--lleno" type="submit">Añadir</button>
                </form>
              )}

              <p className="mr-equipo__plazas">
                Quedan {Math.max(0, hueco)} {hueco === 1 ? "plaza" : "plazas"} en vuestro turno. Mínimo {MIN_SALA_NUEVA} y máximo {MAX_PERSONAS} personas.
              </p>

              {editando && (
                <div className="mr-equipo__botones">
                  <button className="mr-boton mr-boton--lleno" type="button" onClick={guardar} disabled={ocupado || !hayCambios}>
                    {ocupado ? "Guardando…" : "Guardar cambios"}
                  </button>
                  <button className="mr-boton mr-boton--claro" type="button" onClick={cancelarEdicion} disabled={ocupado}>Cancelar cambios</button>
                </div>
              )}
              <p className="error error--centro" role="alert">{error}</p>
            </div>
          </section>

          {/* ---------- Cambiar de hora (se abre desde «Tu reserva») ---------- */}
          {cambiando && (
            <section className="mr-tarjeta mr-cambio" aria-labelledby="cambio-titulo">
              <h2 id="cambio-titulo" className="mr-tarjeta__titulo">Cambiar de hora</h2>
              <p>Solo te mueves tú; tu grupo se queda en su turno. Puedes unirte a un grupo en formación con hueco (para abrir una sala libre hacen falta {MIN_SALA_NUEVA} personas).</p>
              <ul className="cambio-hora__lista">
                {cambiando.map((t) => {
                  const posible = t.estado === "formacion" && t.hueco >= 1;
                  return (
                    <li key={t.id}>
                      <button type="button" className="chip" disabled={!posible || ocupado} onClick={() => moverA(t.id)}>
                        {t.inicio}-{t.fin} · {t.estado === "formacion" ? `quedan ${t.hueco}` : t.estado === "libre" ? "sala libre" : "completo"}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button type="button" className="mr-enlace" onClick={() => setCambiando(null)}>Cerrar</button>
            </section>
          )}

          {/* ---------- Antes de venir… ---------- */}
          <section className="mr-tarjeta mr-antes" aria-labelledby="antes-titulo">
            <h2 id="antes-titulo" className="mr-tarjeta__titulo">Antes de venir…</h2>
            <ul className="mr-antes__lista">
              <li>
                <img src="/assets/img/perfiles/aire-5.svg" width="51" height="51" alt="" />
                <div>
                  <p className="mr-antes__titulo">Puntualidad</p>
                  <p>Llegad 15 minutos antes. Si llegáis tarde, se descuenta del tiempo de la sala.</p>
                </div>
              </li>
              <li>
                <img src="/assets/img/perfiles/agua-5.svg" width="51" height="51" alt="" />
                <div>
                  <p className="mr-antes__titulo">Revisar accesibilidad</p>
                  <p>Hay luces y efectos. Si tienes alguna necesidad de movilidad o sensibilidad a luz o sonido, escríbenos antes.</p>
                </div>
              </li>
              <li>
                <img src="/assets/img/perfiles/eter-5.svg" width="51" height="51" alt="" />
                <div>
                  <p className="mr-antes__titulo">¿Dudas o problemas?</p>
                  <p>Escríbenos a <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a> · <Link href="/inicio#faq">Preguntas frecuentes</Link></p>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <button className="mr-salir" type="button" onClick={salir}>Cerrar sesión</button>
      </main>
      <PiePagina />
    </>
  );
}

export default function MiReserva() {
  return (
    <Suspense fallback={<Cargando texto="Cargando tu reserva…" />}>
      <MiReservaContenido />
    </Suspense>
  );
}
