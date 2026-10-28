// Página que abre el QR de la entrada.
// - En el móvil de alguien del equipo (con la llave del panel /admin): se apunta sola la asistencia de esa
//   persona y se ve su ficha en grande (verde = registrada ahora, naranja = ya se había escaneado), con «Deshacer».
// - En cualquier otro móvil (por ejemplo, la propia persona): solo dice si la entrada es válida, como antes.
import { miembroPorToken, reservaDe } from "@/lib/reservas";
import { registrarEntrada } from "@/lib/retiro";
import { conLlavePrevia } from "@/lib/previaServidor";
import { conDb } from "@/lib/db";
import { EVENTO } from "@/lib/config";
import EntradaEquipo from "./EntradaEquipo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Entrada · Lilium", robots: { index: false } };

export default async function Entrada({ params }) {
  const { token } = await params;

  // Móvil del equipo: se registra la asistencia al abrir la página
  if (await conLlavePrevia()) {
    const r = await conDb(() => registrarEntrada(token));
    const hora = r.persona?.asistio_en
      ? new Date(r.persona.asistio_en).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" })
      : null;
    return (
      <EntradaEquipo estado={r.estado} email={r.persona?.email || null} hora={hora}
        turno={r.persona ? `${EVENTO.fechaTexto} · ${r.persona.inicio}–${r.persona.fin}` : null}
        equipo={r.persona?.equipo || null} llegadas={r.llegadas ?? null} total={r.total ?? null} />
    );
  }

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
