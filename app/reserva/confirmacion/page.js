"use client";
// Paso 3 · Revisar y crear la reserva
import { useEffect, useState } from "react";
import Link from "next/link";
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
    vuestraSala: "Vuestra sala", editar: "Editar", casiListo: "Ya casi está: revisad que todo esté bien antes de confirmar.",
  },
  en: {
    sinNombre: "No name (you can add one later)", aceptar: "To book you must accept the Terms and Conditions.",
    etiqueta: "CONFIRMATION", titulo: "Review your room", turno: "Session", dia: "Day", hora: "Time", lugar: "Place", equipo: "Team",
    tipo: "Type", nueva: "New room", formacion: "Group forming", estado: "Status", pendiente: "Pending confirmation",
    integrantes: "Members", liderAuto: "Leader · Confirmed automatically", recibira: "Will receive a confirmation email",
    plazo1: "Each member will have", plazo2: "to confirm from their email. Anyone who doesn't confirm in time loses their place; the booking stays for those who have confirmed.",
    reservando: "Booking…", confirmar: "Confirm booking →",
    vuestraSala: "Your room", editar: "Edit", casiListo: "Almost there: check everything is right before confirming.",
  },
};


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
      <main className="paso paso--confirmacion">
        <PasoCabecera paso={3} />

        <div className="conf">
          <header className="conf__encabezado">
            <p className="etiqueta">{t.etiqueta}</p>
            <h1 className="titular">{t.titulo}</h1>
            <p className="conf__intro">{t.casiListo}</p>
          </header>

          <div className="conf__rejilla">
            {/* Billete con los datos del turno */}
            <section className="conf-billete" aria-labelledby="turno-titulo">
              <div className="conf-tarjeta__cabecera">
                <h2 id="turno-titulo">{t.turno}</h2>
                <Link className="conf-editar" href="/reserva/hora">{t.editar}</Link>
              </div>
              <div className="conf-billete__cuerpo">
                <img className="conf-billete__lirio" src="/assets/img/icono-lirio.png" width="56" height="45" alt="" />
                <p className="conf-billete__etiqueta">{t.vuestraSala}</p>
                <p className="conf-billete__equipo">{equipo}</p>
                <p className="conf-billete__hora">{turno.inicio}<span>–</span>{turno.fin}</p>
                <p className="conf-billete__dia">{evento.fechaTexto}</p>
                <p className="conf-billete__lugar">{evento.lugar}</p>
                <div className="conf-billete__chips">
                  <span className="chip">{nueva ? t.nueva : `${t.formacion} (${turno.ocupadas} + ${miembros.length})`}</span>
                  <span className="chip chip--pendiente">{t.pendiente}</span>
                </div>
              </div>
            </section>

            {/* Integrantes */}
            <section className="conf-equipo" aria-labelledby="equipo-titulo">
              <div className="conf-tarjeta__cabecera">
                <h2 id="equipo-titulo">{t.integrantes} <span>({miembros.length})</span></h2>
                <Link className="conf-editar" href="/reserva/integrantes">{t.editar}</Link>
              </div>
              <ul className="conf-equipo__lista">
                {miembros.map((m, i) => (
                  <li key={m}>
                    <img src={iconos[i]} width="46" height="46" alt="" />
                    <div>
                      <p className="conf-equipo__correo">{m}</p>
                      <p className={`conf-equipo__estado${i === 0 ? " is-lider" : ""}`}>{i === 0 ? t.liderAuto : t.recibira}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="conf__cierre">
            <p className="conf__plazo">
              <span className="conf__reloj" aria-hidden="true">⏳</span>
              <span>{t.plazo1} <b>{HORAS_CONFIRMACION} h</b> {t.plazo2}</span>
            </p>

            <AceptarTerminos aceptado={aceptado} onCambiar={(v) => { setAceptado(v); if (v) setError(""); }} />

            <button className="boton confirmar" type="button" onClick={reservar} disabled={enviando} aria-disabled={aceptado ? undefined : "true"}>
              {enviando ? t.reservando : t.confirmar}
            </button>
            <p className="error error--centro" role="alert">{error}</p>
          </div>
        </div>
      </main>
      <PiePagina />
    </>
  );
}
