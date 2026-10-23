// Página del enlace del correo de invitación: confirmar la plaza
import NavReserva from "@/components/NavReserva";
import BotonConfirmar from "@/components/BotonConfirmar";
import { miembroPorToken, reservaDe } from "@/lib/reservas";
import { conDb } from "@/lib/db";
import { EVENTO } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Confirmar plaza · Lilium", robots: { index: false } };

export default async function Confirmar({ params }) {
  const { token } = await params;
  const { miembro, reserva } = await conDb(async () => {
    const m = await miembroPorToken(token);
    return { miembro: m, reserva: m ? await reservaDe(m.email) : null };
  });

  return (
    <>
      <NavReserva />
      <main>
        <section className="acceso">
          <p className="acceso__etiqueta">CONFIRMAR PLAZA</p>
          {!reserva ? (
            <>
              <h1 className="acceso__titulo">Enlace no válido</h1>
              <p className="acceso__intro">Puede que el plazo de 48 horas haya terminado o que la reserva se haya cancelado. Puedes volver a reservar con tu correo.</p>
              <a className="boton" href="/acceso">Ir a reservar</a>
            </>
          ) : (
            <>
              <h1 className="acceso__titulo">Te esperan en el prado</h1>
              <p className="acceso__intro">
                <b>{reserva.lider}</b> te ha añadido a su grupo{reserva.turno.equipo ? <> «{reserva.turno.equipo}»</> : null}:{" "}
                {EVENTO.fechaTexto}, de {reserva.turno.inicio} a {reserva.turno.fin}, en {EVENTO.lugar}.
              </p>
              {miembro.confirmado ? (
                <>
                  <p className="acceso__intro">Ya habías confirmado tu plaza.</p>
                  <BotonConfirmar token={token} texto="Ver mi reserva" />
                </>
              ) : (
                <BotonConfirmar token={token} texto="Confirmar mi asistencia" />
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}
