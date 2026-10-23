"use client";
// Paso 3 · Revisar y crear la reserva
import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavReserva from "@/components/NavReserva";
import PasoCabecera from "@/components/PasoCabecera";
import { leerBorrador, borrarBorrador, api } from "@/lib/borrador";
import { useSesion } from "@/lib/useSesion";
import { fotoDe } from "@/lib/fotos";
import { EVENTO, HORAS_CONFIRMACION } from "@/lib/config";

const Separador = () => <img className="separador" src="/assets/svg/linea-discontinua.svg" width="720" height="1" alt="" />;

export default function Confirmacion() {
  const lider = useSesion("reserva");
  const router = useRouter();
  const [borrador, setBorrador] = useState(null);
  const [turno, setTurno] = useState(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const b = leerBorrador();
    if (!b.turnoId) return router.replace("/reserva/hora");
    setBorrador(b);
    api("/api/turnos").then((r) => {
      const t = r.ok && r.turnos.find((x) => x.id === b.turnoId);
      if (!t) return router.replace("/reserva/hora");
      setTurno(t);
    });
  }, [router]);

  if (!lider || !borrador || !turno) return <NavReserva />;

  const miembros = [lider, ...(borrador.integrantes || [])];
  const nueva = turno.estado === "libre";
  const equipo = nueva ? (borrador.equipo || "").trim() || "Sin nombre (podéis ponerlo luego)" : turno.equipo || "—";

  async function reservar() {
    setEnviando(true);
    setError("");
    const res = await api("/api/reservas", {
      metodo: "POST",
      datos: { otros: borrador.integrantes || [], turnoId: turno.id, equipo: borrador.equipo || "" },
    });
    setEnviando(false);
    if (!res.ok) return setError(res.mensaje);
    borrarBorrador();
    router.replace(res.fallidos?.length ? `/mi-reserva?fallidos=${encodeURIComponent(res.fallidos.join(","))}` : "/mi-reserva?nueva=1");
  }

  return (
    <>
      <NavReserva />
      <main>
        <PasoCabecera paso={3} atras="/reserva/hora" />

        <div className="columna">
          <header className="confirmacion-encabezado">
            <p className="etiqueta">CONFIRMACIÓN</p>
            <h1 className="titular">Revisión de la sala</h1>
          </header>

          <section className="tarjeta turno" aria-labelledby="turno-titulo">
            <h2 id="turno-titulo">Turno</h2>
            <dl className="datos">
              <div className="datos__fila"><dt>Día</dt><dd>{EVENTO.fechaTexto}</dd></div>
              <Separador />
              <div className="datos__fila"><dt>Hora</dt><dd>{turno.inicio}-{turno.fin}</dd></div>
              <Separador />
              <div className="datos__fila"><dt>Lugar</dt><dd>{EVENTO.lugar}</dd></div>
              <Separador />
              <div className="datos__fila"><dt>Equipo</dt><dd>{equipo}</dd></div>
              <Separador />
              <div className="datos__fila"><dt>Tipo</dt><dd>{nueva ? "Nueva sala" : `Grupo en formación (${turno.ocupadas} + ${miembros.length})`}</dd></div>
              <Separador />
              <div className="datos__fila"><dt>Estado</dt><dd><span className="chip">Pendiente de confirmación</span></dd></div>
            </dl>
          </section>

          <section className="tarjeta equipo" aria-labelledby="equipo-titulo">
            <div className="equipo__cabecera">
              <h2 id="equipo-titulo">Integrantes ({miembros.length})</h2>
              <div className="avatares">
                {miembros.map((m, i) => <img key={m} src={fotoDe(i)} width="51" height="51" alt="" />)}
              </div>
            </div>
            <ul className="equipo__lista">
              {miembros.map((m, i) => (
                <Fragment key={m}>
                  <li>
                    <div className="miembro">
                      <img src={fotoDe(i)} width="51" height="51" alt="" />
                      <div>
                        <p className="miembro__correo">{m}</p>
                        <p className="miembro__estado">{i === 0 ? "Líder · Confirmado automáticamente" : "Recibirá correo de confirmación"}</p>
                      </div>
                    </div>
                    <Separador />
                  </li>
                </Fragment>
              ))}
            </ul>
          </section>

          <p className="nota-plazo">
            Cada integrante tendrá <b>{HORAS_CONFIRMACION} h</b> para confirmar desde su correo. Quien no confirme a tiempo perderá su plaza; la reserva sigue para quienes hayan confirmado.
          </p>

          <button className="boton confirmar" type="button" onClick={reservar} disabled={enviando}>
            {enviando ? "Reservando…" : "Confirmar reserva →"}
          </button>
          <p className="error error--centro" role="alert">{error}</p>
        </div>
      </main>
    </>
  );
}
