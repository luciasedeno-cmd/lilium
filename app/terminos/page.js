// Términos y Condiciones de Lilium (incluye el aviso de luces y efectos).
// ⚠️ TEXTO PROVISIONAL: revisadlo y cambiad lo que haga falta. Cada <p> es un párrafo y cada <li> un punto de lista.
import Link from "next/link";
import NavReserva from "@/components/NavReserva";
import { EVENTO, CONTACTO, MIN_SALA_NUEVA, MAX_PERSONAS, HORAS_CONFIRMACION } from "@/lib/config";

export const metadata = { title: "Términos y Condiciones · Lilium" };

export default function Terminos() {
  return (
    <>
      <NavReserva />
      <main>
        <article className="columna terminos">
          <p className="etiqueta">LEGAL</p>
          <h1 className="titular">Términos y Condiciones</h1>

          <section aria-labelledby="t-aviso" className="terminos__aviso">
            <h2 id="t-aviso">Aviso de luces y efectos</h2>
            <p>Lilium es una experiencia inmersiva. Dentro de la sala puede haber:</p>
            <ul>
              <li>Luces intermitentes o estroboscópicas y cambios bruscos de luz.</li>
              <li>Momentos de penumbra u oscuridad.</li>
              <li>Sonidos fuertes o repentinos.</li>
              <li>Humo o niebla artificial.</li>
              <li>Espacios reducidos y objetos de atrezo por el suelo.</li>
            </ul>
            <p>Si tienes fotosensibilidad, epilepsia, claustrofobia o cualquier otra sensibilidad, escríbenos antes a <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a> y adaptaremos lo que podamos.</p>
          </section>

          <section aria-labelledby="t-reservas">
            <h2 id="t-reservas">Reservas</h2>
            <ul>
              <li>Solo puede reservar el alumnado de ESADA con su correo institucional (@alumnado.esada.es).</li>
              <li>Cada turno es para un grupo de {MIN_SALA_NUEVA} a {MAX_PERSONAS} personas. Con menos de {MIN_SALA_NUEVA}, os unimos a un grupo que se esté formando.</li>
              <li>Cada correo solo puede estar en una reserva.</li>
              <li>Cada integrante tiene {HORAS_CONFIRMACION} horas para confirmar su plaza desde el enlace de su correo. Quien no confirme a tiempo pierde su plaza.</li>
              <li>Puedes cambiar de hora o cancelar desde «Mi reserva». Si haces la reserva, también puedes cancelar la de todo el grupo.</li>
            </ul>
          </section>

          <section aria-labelledby="t-dia">
            <h2 id="t-dia">El día de la experiencia</h2>
            <ul>
              <li>{EVENTO.fechaTexto}, en {EVENTO.lugar}.</li>
              <li>Llegad 15 minutos antes de vuestra hora. Si llegáis tarde, el tiempo de juego no se alarga.</li>
              <li>Enseñad vuestra entrada digital (el QR) en la puerta.</li>
              <li>Seguid en todo momento las indicaciones de la guía.</li>
              <li>Tratad con cuidado el decorado y los objetos: no hace falta forzar nada para resolver el juego.</li>
              <li>La organización no se hace cargo de los objetos personales que se pierdan.</li>
            </ul>
          </section>

          <section aria-labelledby="t-datos">
            <h2 id="t-datos">Tus datos</h2>
            <p>Solo usamos tu correo para gestionar tu reserva y enviarte los avisos de Lilium (código de acceso, confirmación, entrada y recordatorios). No lo compartimos con nadie y lo borraremos cuando termine el evento.</p>
          </section>

          <p className="terminos__contacto">¿Dudas? Escríbenos a <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a>.</p>
          <p><Link href="/inicio">← Volver al inicio</Link></p>
        </article>
      </main>
    </>
  );
}
