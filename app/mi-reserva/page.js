"use client";
// Mi reserva: turno, integrantes, entrada digital y gestión (cambiar hora, cancelar)
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NavReserva from "@/components/NavReserva";
import { api } from "@/lib/borrador";
import { useSesion } from "@/lib/useSesion";
import { fotoDe } from "@/lib/fotos";
import { EVENTO, MIN_SALA_NUEVA } from "@/lib/config";

const Separador = () => <img className="separador" src="/assets/svg/linea-discontinua.svg" width="720" height="1" alt="" />;

const fechaHora = (d) =>
  new Date(d).toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

function Avisos() {
  const q = useSearchParams();
  if (q.get("nueva")) return <p className="aviso-ok" role="status">Reserva creada. Hemos enviado un correo a cada integrante para que confirme su plaza, y a ti tu entrada.</p>;
  if (q.get("confirmado")) return <p className="aviso-ok" role="status">¡Plaza confirmada! Te hemos enviado la entrada por correo.</p>;
  if (q.get("fallidos")) return <p className="aviso-error" role="alert">Reserva creada, pero no pudimos enviar el correo a: {q.get("fallidos")}. Avísales de que entren en la web con su correo para confirmar.</p>;
  return null;
}

function MiReservaContenido() {
  const email = useSesion("mi-reserva");
  const router = useRouter();
  const [reserva, setReserva] = useState(null);
  const [error, setError] = useState("");
  const [cambiando, setCambiando] = useState(null); // lista de turnos al cambiar de hora
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    const r = await api("/api/mi-reserva");
    if (!r.ok) return setError(r.mensaje);
    if (!r.reserva) return router.replace("/reserva/integrantes");
    setReserva(r.reserva);
  }, [router]);

  useEffect(() => {
    if (email) cargar();
  }, [email, cargar]);

  async function cancelar(grupo) {
    const pregunta = grupo
      ? "¿Cancelar la reserva de TODO el grupo? Avisaremos por correo al resto. No se puede deshacer."
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

  if (!email || !reserva) {
    return (<><NavReserva /><main><div className="columna"><p className="error error--centro" role="alert">{error}</p></div></main></>);
  }

  const { turno, miembros, yo, lider } = reserva;
  const esLider = lider === yo.email;
  const pendientes = miembros.filter((m) => !m.confirmado).length;

  return (
    <>
      <NavReserva />
      <main>
        <div className="columna">
          <header className="mi-reserva-encabezado">
            <p className="etiqueta">MI RESERVA</p>
            <h1 className="titular">{turno.equipo || "Vuestra hermandad"}</h1>
          </header>

          <Avisos />

          <section className="tarjeta turno" aria-labelledby="turno-titulo">
            <h2 id="turno-titulo">Turno</h2>
            <dl className="datos">
              <div className="datos__fila"><dt>Día</dt><dd>{EVENTO.fechaTexto}</dd></div>
              <Separador />
              <div className="datos__fila"><dt>Hora</dt><dd>{turno.inicio}-{turno.fin} · llegad 10 min antes</dd></div>
              <Separador />
              <div className="datos__fila"><dt>Lugar</dt><dd>{EVENTO.lugar}</dd></div>
              <Separador />
              <div className="datos__fila"><dt>Tipo</dt><dd>{turno.ocupadas < MIN_SALA_NUEVA ? "Grupo en formación" : "Sala"} · {turno.ocupadas}/6 personas{turno.erasmus ? " · Solo Erasmus" : ""}</dd></div>
              <Separador />
              <div className="datos__fila"><dt>Estado</dt><dd><span className="chip">{pendientes ? "Pendiente de confirmación" : "Confirmada"}</span></dd></div>
            </dl>
            {pendientes > 0 && (
              <p className="nota-plazo">Faltan {pendientes} {pendientes === 1 ? "persona" : "personas"} por confirmar. El plazo acaba el <b>{fechaHora(reserva.limite)}</b>; quien no confirme perderá su plaza.</p>
            )}
          </section>

          <section className="tarjeta equipo" aria-labelledby="equipo-titulo">
            <div className="equipo__cabecera">
              <h2 id="equipo-titulo">Integrantes</h2>
              <div className="avatares">
                {miembros.map((m, i) => <img key={m.email} src={fotoDe(i)} width="51" height="51" alt="" />)}
              </div>
            </div>
            <ul className="equipo__lista">
              {miembros.map((m, i) => (
                <li key={m.email}>
                  <div className="miembro">
                    <img src={fotoDe(i)} width="51" height="51" alt="" />
                    <div>
                      <p className="miembro__correo">{m.email}{m.email === yo.email ? " (tú)" : ""}</p>
                      <p className="miembro__estado">
                        {m.email === lider ? "Líder · " : ""}{m.confirmado ? "Confirmado" : "Pendiente: recibirá correo de confirmación"}
                      </p>
                    </div>
                  </div>
                  <Separador />
                </li>
              ))}
            </ul>
          </section>

          <section className="tarjeta entrada" aria-labelledby="entrada-titulo">
            <h2 id="entrada-titulo">Tu entrada</h2>
            {yo.confirmado && reserva.qr ? (
              <div className="entrada__contenido">
                <img className="entrada__qr" src={reserva.qr} width="200" height="200" alt="QR de tu entrada" />
                <p>Enséñalo en la puerta el {EVENTO.fechaTexto.toLowerCase()} a las {turno.inicio}. También te lo hemos enviado por correo.</p>
              </div>
            ) : (
              <p>Tu entrada aparecerá aquí cuando confirmes tu plaza desde el enlace de tu correo.</p>
            )}
          </section>

          <section className="gestion" aria-label="Gestionar reserva">
            <button className="boton boton--claro" type="button" onClick={abrirCambio} disabled={ocupado}>Cambiar de hora</button>
            <button className="boton boton--claro" type="button" onClick={() => cancelar(false)} disabled={ocupado}>Cancelar mi asistencia</button>
            {esLider && <button className="boton boton--claro" type="button" onClick={() => cancelar(true)} disabled={ocupado}>Cancelar la reserva del grupo</button>}
            <button className="gestion__salir" type="button" onClick={salir}>Cerrar sesión</button>
          </section>
          <p className="error error--centro" role="alert">{error}</p>

          {cambiando && (
            <section className="tarjeta cambio-hora" aria-labelledby="cambio-titulo">
              <h2 id="cambio-titulo">Cambiar de hora</h2>
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
              <button type="button" className="gestion__salir" onClick={() => setCambiando(null)}>Cerrar</button>
            </section>
          )}
        </div>
      </main>
    </>
  );
}

export default function MiReserva() {
  return (
    <Suspense fallback={<NavReserva />}>
      <MiReservaContenido />
    </Suspense>
  );
}
