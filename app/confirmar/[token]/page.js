// Página del enlace del correo de invitación: confirmar la plaza
import NavReserva from "@/components/NavReserva";
import PiePagina from "@/components/PiePagina";
import BotonConfirmar from "@/components/BotonConfirmar";
import { miembroPorToken, reservaDe } from "@/lib/reservas";
import { conDb } from "@/lib/db";
import { eventoEn } from "@/lib/config";
import { idiomaActual } from "@/lib/idiomaServidor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Confirmar plaza · Lilium", robots: { index: false } };

const TEXTOS = {
  es: {
    etiqueta: "CONFIRMAR PLAZA", noValido: "Enlace no válido",
    noValidoTexto: "Puede que el plazo de 48 horas haya terminado o que la reserva se haya cancelado. Puedes volver a reservar con tu correo.",
    irReservar: "Ir a reservar", titulo: "Te esperan en el prado", teHaAnadido: "te ha añadido a su grupo", de: "de", a: "a", en: "en",
    yaConfirmada: "Ya habías confirmado tu plaza.",
  },
  en: {
    etiqueta: "CONFIRM YOUR PLACE", noValido: "Invalid link",
    noValidoTexto: "The 48-hour deadline may have ended or the booking may have been cancelled. You can book again with your email.",
    irReservar: "Go to booking", titulo: "They await you in the meadow", teHaAnadido: "has added you to their group", de: "from", a: "to", en: "at",
    yaConfirmada: "You had already confirmed your place.",
  },
};

export default async function Confirmar({ params }) {
  const { token } = await params;
  const idioma = await idiomaActual();
  const t = TEXTOS[idioma];
  const evento = eventoEn(idioma);
  const { miembro, reserva } = await conDb(async () => {
    const m = await miembroPorToken(token);
    return { miembro: m, reserva: m ? await reservaDe(m.email) : null };
  });

  return (
    <>
      <NavReserva />
      <main>
        <section className="acceso">
          <p className="acceso__etiqueta">{t.etiqueta}</p>
          {!reserva ? (
            <>
              <h1 className="acceso__titulo">{t.noValido}</h1>
              <p className="acceso__intro">{t.noValidoTexto}</p>
              <a className="boton" href="/acceso">{t.irReservar}</a>
            </>
          ) : (
            <>
              <h1 className="acceso__titulo">{t.titulo}</h1>
              <p className="acceso__intro">
                <b>{reserva.lider}</b> {t.teHaAnadido}{reserva.turno.equipo ? <> «{reserva.turno.equipo}»</> : null}:{" "}
                {evento.fechaTexto}, {t.de} {reserva.turno.inicio} {t.a} {reserva.turno.fin}, {t.en} {evento.lugar}.
              </p>
              {miembro.confirmado ? (
                <>
                  <p className="acceso__intro">{t.yaConfirmada}</p>
                  <BotonConfirmar token={token} texto={{ es: "Ver mi reserva", en: "See my booking" }} pedirTerminos={false} />
                </>
              ) : (
                <BotonConfirmar token={token} texto={{ es: "Confirmar mi asistencia", en: "Confirm my attendance" }} />
              )}
            </>
          )}
        </section>
      </main>
      <PiePagina />
    </>
  );
}
