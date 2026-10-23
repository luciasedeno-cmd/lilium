// Home de Lilium
import Link from "next/link";
import { EVENTO, CONTACTO } from "@/lib/config";
import HomeHeader from "@/components/home/HomeHeader";
import CarruselPasos from "@/components/home/CarruselPasos";
import Faq from "@/components/home/Faq";

export const metadata = {
  title: "Lilium · Escape Room ESADA",
  description: "Lilium, el escape room de ESADA: cinco guías, un destino.",
};

const CUADROS = [
  { img: "ritual-correo.png", alt: "Mujer escribiendo una carta", titulo: "Correo de ESADA", texto: "Todas las personas del grupo necesitan su correo nombreapellido@alumnado.esada.es." },
  { img: "ritual-personas.png", alt: "Grupo de personas reunidas", titulo: "De 3 a 6 personas", texto: "Hacen falta 3 para abrir una sala nueva. Máximo 6 por turno" },
  { img: "ritual-confirmar.png", alt: "Retrato de una dama con abanico", titulo: "Confirmar en 48 h", texto: "Cada integrante confirma desde su correo. Llegad 15 minutos antes de vuestra hora" },
];

export default function Inicio() {
  return (
    <>
      <HomeHeader />

      <main>
        {/* Home */}
        <section className="hero">
          <h1 className="hero__titulo">
            <span className="hero__linea hero__linea--1">Cinco guías</span>
            <span className="hero__linea hero__linea--2">Un destino</span>
          </h1>
          <Link className="boton-reserva hero__boton" href="/reserva/integrantes">Reserva ahora</Link>
        </section>

        {/* Historia: ¿Qué es Lilium? */}
        <section className="historia" id="paraiso">
          <img className="encaje encaje--arriba" src="/assets/svg/banner-encaje.svg" width="1612" height="176" alt="" />

          <div className="historia__contenido">
            <div className="retrato">
              <img className="retrato__marco" src="/assets/img/marco-retrato.png" alt="" />
              <img className="retrato__foto" src="/assets/img/retrato.png" width="348" height="509" alt="Retrato de una joven de la hermandad" />
            </div>

            <div className="historia__texto">
              <h2 className="historia__titulo">¿Qué es Lilium?</h2>
              <div className="historia__parrafos">
                <p>Dicen que algunos caminos están destinados a cruzarse. El de ellas lo hizo sin aviso: cinco desconocidas que se reconocieron al instante. A la luz de las velas unieron sus energías y nació Lilium.</p>
                <p>Un libro antiguo y una noche de luna llena lo cambiaron todo. Ahora ha llegado el momento de abrir el círculo.</p>
                <p>Este retiro es para ti, para soltar el cansancio de tantas entregas y liberar lo que pesa. Solo tienes que entrar: ellas se encargan del resto.</p>
              </div>
            </div>
          </div>

          <img className="encaje encaje--abajo" src="/assets/svg/banner-encaje-reserva.svg" width="1612" height="176" alt="" />
        </section>

        {/* ¿Cómo reservar? */}
        <section className="como-reservar" id="como-funciona">
          <h2 className="como-reservar__titulo">¿Cómo reservar?</h2>
          <p className="como-reservar__subtitulo">Cinco sencillos pasos para completar la inscripción</p>
          <img className="como-reservar__bolitas" src="/assets/svg/bolitas-indicador.svg" width="316" height="12" alt="" />
        </section>

        {/* Cómo funciona (carrusel de 5 pasos) */}
        <CarruselPasos />

        {/* ¿Qué necesita el ritual? */}
        <section className="ritual">
          <h2 className="ritual__titulo">¿Qué necesita el ritual?</h2>
          <div className="ritual__cuadros">
            {CUADROS.map((c, i) => (
              <article className={`cuadro cuadro--${i + 1}`} key={c.img}>
                <div className="polaroid">
                  <img src={`/assets/img/${c.img}`} alt={c.alt} />
                </div>
                <div className="cuadro__texto">
                  <h3>{c.titulo}</h3>
                  <p>{c.texto}</p>
                </div>
              </article>
            ))}
          </div>
          <img className="encaje encaje--ritual" src="/assets/svg/banner-encaje-2.svg" width="1612" height="176" alt="" />
        </section>

        {/* Cuándo y dónde */}
        <section className="ubicacion">
          <img className="ubicacion__mapa" src="/assets/img/mapa.jpg" alt="Mapa antiguo" />
          <div className="ubicacion__dato ubicacion__dato--cuando">
            <h2><img src="/assets/svg/pin.svg" width="28" height="28" alt="" />Cuándo</h2>
            <p>{EVENTO.fechaTexto}</p>
            <p><i>Un único día · experiencias de 45 minutos</i></p>
          </div>
          <div className="ubicacion__dato ubicacion__dato--donde">
            <h2><img src="/assets/svg/pin.svg" width="28" height="28" alt="" />Dónde</h2>
            <p>{EVENTO.lugar}</p>
          </div>
        </section>

        {/* ¿Eres Erasmus? */}
        <section className="erasmus">
          <h2 className="erasmus__titulo">¿Eres Erasmus?</h2>
          <p className="erasmus__texto">Hay turnos solo Erasmus y toda la experiencia está disponible en inglés.</p>
        </section>

        {/* Preguntas frecuentes */}
        <Faq />

        {/* CTA invitación */}
        <section className="cta" aria-label="Invitación">
          <img src="/assets/img/cta-invitacion.jpg" alt="" />
        </section>
      </main>

      <footer className="footer">
        <p>Lilium · Escape Room ESADA · 2026</p>
        <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a>
        <Link href="/terminos">Términos y Condiciones</Link>
        <a href="#">Aviso Legal</a>
      </footer>
    </>
  );
}
