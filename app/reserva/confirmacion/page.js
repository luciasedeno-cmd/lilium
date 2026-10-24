"use client";
// Paso 3 · Revisar y crear la reserva
import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavReserva from "@/components/NavReserva";
import Cargando from "@/components/Cargando";
import AceptarTerminos from "@/components/AceptarTerminos";
import PasoCabecera from "@/components/PasoCabecera";
import { leerBorrador, borrarBorrador, api } from "@/lib/borrador";
import { useSesion } from "@/lib/useSesion";
import { iconosDe } from "@/lib/fotos";
import { eventoEn, HORAS_CONFIRMACION } from "@/lib/config";
import { useIdioma } from "@/components/Idioma";
import PiePagina from "@/components/PiePagina";

const TEXTOS = {
  es: {
    sinNombre: "Sin nombre (podéis ponerlo luego)", aceptar: "Para reservar tienes que aceptar los Términos y Condiciones.",
    etiqueta: "CONFIRMACIÓN", titulo: "Revisión de la sala", turno: "Turno", dia: "Día", hora: "Hora", lugar: "Lugar", equipo: "Equipo",
    tipo: "Tipo", nueva: "Nueva sala", formacion: "Grupo en formación", estado: "Estado", pendiente: "Pendiente de confirmación",
    integrantes: "Integrantes", liderAuto: "Líder · Confirmado automáticamente", recibira: "Recibirá correo de confirmación",
    plazo1: "Cada integrante tendrá", plazo2: "para confirmar desde su correo. Quien no confirme a tiempo perderá su plaza; la reserva sigue para quienes hayan confirmado.",
    reservando: "Reservando…", confirmar: "Confirmar reserva →",
  },
  en: {
    sinNombre: "No name (you can add one later)", aceptar: "To book you must accept the Terms and Conditions.",
    etiqueta: "CONFIRMATION", titulo: "Review your room", turno: "Session", dia: "Day", hora: "Time", lugar: "Place", equipo: "Team",
    tipo: "Type", nueva: "New room", formacion: "Group forming", estado: "Status", pendiente: "Pending confirmation",
    integrantes: "Members", liderAuto: "Leader · Confirmed automatically", recibira: "Will receive a confirmation email",
    plazo1: "Each member will have", plazo2: "to confirm from their email. Anyone who doesn't confirm in time loses their place; the booking stays for those who have confirmed.",
    reservando: "Booking…", confirmar: "Confirm booking →",
  },
};

const Separador = () => <img className="separador" src="/assets/svg/linea-discontinua.svg" width="720" height="1" alt="" />;

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
  const [aceptado, setAceptado] = useState(false);

  useEffect(() => {
    const b = leerBorrador();
    if (!b.turnoId) return router.replace("/reserva/hora");
    setBorrador(b);
    api("/api/turnos").then((r) => {
      const t = r.ok && r.turnos.find((x) => x.id === b.turnoId);
      if (!r.ok) return setError(r.mensaje);
      if (!t) return router.replace("/reserva/hora");
      setTurno(t);
    });
  }, [router]);

  if (!lider || !borrador || !turno) return <Cargando error={errorSesion || error} />;

  const miembros = [lider, ...(borrador.integrantes || [])];
  const iconos = iconosDe(miembros); // icono de perfil de cada persona
  const nueva = turno.estado === "libre";
  const equipo = nueva ? (borrador.equipo || "").trim() || t.sinNombre : turno.equipo || "—";

  async function reservar() {
    if (!aceptado) return setError(t.aceptar);
    setEnviando(true);
    setError("");
    const res = await api("/api/reservas", {
      metodo: "POST",
      datos: { otros: borrador.integrantes || [], turnoId: turno.id, equipo: borrador.equipo || "", aceptaTerminos: aceptado },
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
        <PasoCabecera paso={3} />

        <div className="columna">
          <header className="confirmacion-encabezado">
            <p className="etiqueta">{t.etiqueta}</p>
            <h1 className="titular">{t.titulo}</h1>
          </header>

          <section className="tarjeta turno" aria-labelledby="turno-titulo">
            <h2 id="turno-titulo">{t.turno}</h2>
            <dl className="datos">
              <div className="datos__fila"><dt>{t.dia}</dt><dd>{evento.fechaTexto}</dd></div>
              <Separador />
              <div className="datos__fila"><dt>{t.hora}</dt><dd>{turno.inicio}-{turno.fin}</dd></div>
              <Separador />
              <div className="datos__fila"><dt>{t.lugar}</dt><dd>{evento.lugar}</dd></div>
              <Separador />
              <div className="datos__fila"><dt>{t.equipo}</dt><dd>{equipo}</dd></div>
              <Separador />
              <div className="datos__fila"><dt>{t.tipo}</dt><dd>{nueva ? t.nueva : `${t.formacion} (${turno.ocupadas} + ${miembros.length})`}</dd></div>
              <Separador />
              <div className="datos__fila"><dt>{t.estado}</dt><dd><span className="chip">{t.pendiente}</span></dd></div>
            </dl>
          </section>

          <section className="tarjeta equipo" aria-labelledby="equipo-titulo">
            <div className="equipo__cabecera">
              <h2 id="equipo-titulo">{t.integrantes} ({miembros.length})</h2>
              <div className="avatares">
                {miembros.map((m, i) => <img key={m} src={iconos[i]} width="51" height="51" alt="" />)}
              </div>
            </div>
            <ul className="equipo__lista">
              {miembros.map((m, i) => (
                <Fragment key={m}>
                  <li>
                    <div className="miembro">
                      <img src={iconos[i]} width="51" height="51" alt="" />
                      <div>
                        <p className="miembro__correo">{m}</p>
                        <p className="miembro__estado">{i === 0 ? t.liderAuto : t.recibira}</p>
                      </div>
                    </div>
                    <Separador />
                  </li>
                </Fragment>
              ))}
            </ul>
          </section>

          <p className="nota-plazo">
            {t.plazo1} <b>{HORAS_CONFIRMACION} h</b> {t.plazo2}
          </p>

          <AceptarTerminos aceptado={aceptado} onCambiar={(v) => { setAceptado(v); if (v) setError(""); }} />

          <button className="boton confirmar" type="button" onClick={reservar} disabled={enviando} aria-disabled={aceptado ? undefined : "true"}>
            {enviando ? t.reservando : t.confirmar}
          </button>
          <p className="error error--centro" role="alert">{error}</p>
        </div>
      </main>
      <PiePagina />
    </>
  );
}
