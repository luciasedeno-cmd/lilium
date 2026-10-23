// Página que abre el QR de la entrada: el equipo de la puerta comprueba si es válida
import { miembroPorToken, reservaDe } from "@/lib/reservas";
import { conDb } from "@/lib/db";
import { EVENTO } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Entrada · Lilium", robots: { index: false } };

export default async function Entrada({ params }) {
  const { token } = await params;
  const { miembro, reserva } = await conDb(async () => {
    const m = await miembroPorToken(token);
    return { miembro: m, reserva: m ? await reservaDe(m.email) : null };
  });
  const valida = Boolean(reserva && miembro.confirmado);

  return (
    <main>
      <section className={`acceso entrada-puerta ${valida ? "is-valida" : "is-no-valida"}`}>
        <p className="acceso__etiqueta">ENTRADA LILIUM</p>
        <h1 className="acceso__titulo">{valida ? "Entrada válida" : "Entrada no válida"}</h1>
        {reserva ? (
          <dl className="datos">
            <div className="datos__fila"><dt>Correo</dt><dd>{miembro.email}</dd></div>
            <div className="datos__fila"><dt>Turno</dt><dd>{EVENTO.fechaTexto} · {reserva.turno.inicio}-{reserva.turno.fin}</dd></div>
            <div className="datos__fila"><dt>Equipo</dt><dd>{reserva.turno.equipo || "—"}</dd></div>
            <div className="datos__fila"><dt>Estado</dt><dd>{miembro.confirmado ? "Confirmada" : "Sin confirmar"}</dd></div>
          </dl>
        ) : (
          <p className="acceso__intro">Esta entrada no existe o la reserva se ha cancelado.</p>
        )}
      </section>
    </main>
  );
}
