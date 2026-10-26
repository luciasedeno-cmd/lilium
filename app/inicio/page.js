// Home de Lilium (textos en español e inglés, según el idioma elegido arriba)
import Link from "next/link";
import { eventoEn } from "@/lib/config";
import { idiomaActual } from "@/lib/idiomaServidor";
import HomeHeader from "@/components/home/HomeHeader";
import ComoReservar from "@/components/home/ComoReservar";
import CarruselPasos from "@/components/home/CarruselPasos";
import Faq from "@/components/home/Faq";
import ErasmusBanner from "@/components/ErasmusBanner";
import BotonErasmus from "@/components/home/BotonErasmus";
import PiePagina from "@/components/PiePagina";
import Animaciones from "@/components/home/Animaciones";
import RetratoOjos from "@/components/home/RetratoOjos";
import PantallaCarga from "@/components/PantallaCarga";

export const metadata = {
  title: "Lilium · Escape Room ESADA",
  description: "Lilium, el escape room de ESADA: cinco guías, un destino.",
};

const TEXTOS = {
  es: {
    lineas: ["Cinco guías", "Un destino"],
    reservar: "Reserva ahora",
    retratoAlt: "Retrato de una joven de la hermandad",
    historiaTitulo: "¿Qué es Lilium?",
    historia: [
      "Dicen que algunos caminos están destinados a cruzarse. El de ellas lo hizo sin aviso: cinco desconocidas que se reconocieron al instante. A la luz de las velas unieron sus energías y nació Lilium.",
      "Un libro antiguo y una noche de luna llena lo cambiaron todo. Ahora ha llegado el momento de abrir el círculo.",
      "Este retiro es para ti, para soltar el cansancio de tantas entregas y liberar lo que pesa. Solo tienes que entrar: ellas se encargan del resto.",
    ],
    ritualTitulo: "¿Qué necesita el retiro?",
    cuadros: [
      { alt: "Mujer escribiendo una carta", titulo: "Correo de ESADA", texto: "Todas las personas del grupo necesitan su correo nombreapellido@alumnado.esada.es." },
      { alt: "Grupo de personas reunidas", titulo: "De 3 a 6 personas", texto: "Hacen falta 3 para abrir una sala nueva. Máximo 6 por turno" },
      { alt: "Retrato de una dama con abanico", titulo: "Confirmar en 48 h", texto: "Cada integrante confirma desde su correo. Llegad 15 minutos antes de vuestra hora" },
    ],
    mapaAlt: "Mapa antiguo",
    cuando: "Cuándo",
    cuandoNota: "Un único día · experiencias de 45 minutos",
    donde: "Dónde",
    erasmusTitulo: "¿Erasmus?",
    erasmusTexto: "Hay turnos solo Erasmus y toda la experiencia está disponible en inglés.",
    finalEtiqueta: "EL PRADO TE ESPERA",
    finalTitulo: "¿Te atreves a cruzar?",
    finalTexto: "Las plazas son pocas y el círculo solo se abre un día. Reúne a tu hermandad y elige vuestra hora.",
  },
  en: {
    lineas: ["Five guides", "One destiny"],
    reservar: "Book now",
    retratoAlt: "Portrait of a young woman of the sisterhood",
    historiaTitulo: "What is Lilium?",
    historia: [
      "They say some paths are meant to cross. Theirs did without warning: five strangers who recognised each other at once. By candlelight they joined their energies, and Lilium was born.",
      "An old book and a full-moon night changed everything. Now the time has come to open the circle.",
      "This retreat is for you: to shake off the weariness of so many deadlines and let go of what weighs you down. All you have to do is step inside; they will take care of the rest.",
    ],
    ritualTitulo: "What does the retreat need?",
    cuadros: [
      { alt: "Woman writing a letter", titulo: "ESADA email", texto: "Everyone in the group needs their nameSurname@alumnado.esada.es email." },
      { alt: "Group of people gathered together", titulo: "3 to 6 people", texto: "You need 3 to open a new room. Maximum 6 per session" },
      { alt: "Portrait of a lady with a fan", titulo: "Confirm within 48 h", texto: "Each member confirms from their email. Arrive 15 minutes before your time" },
    ],
    mapaAlt: "Old map",
    cuando: "When",
    cuandoNota: "One single day · 45-minute experiences",
    donde: "Where",
    erasmusTitulo: "Erasmus?",
    erasmusTexto: "There are Erasmus-only sessions and the whole experience is available in English.",
    finalEtiqueta: "THE MEADOW AWAITS",
    finalTitulo: "Dare to cross?",
    finalTexto: "Places are few and the circle opens for just one day. Gather your sisterhood and choose your time.",
  },
};

const IMAGENES = ["ritual-correo.webp", "ritual-personas.webp", "ritual-confirmar.webp"];

export default async function Inicio() {
  const idioma = await idiomaActual();
  const t = TEXTOS[idioma];
  const evento = eventoEn(idioma);

  return (
    <>
      {/* Pantalla de carga (la primera vez en cada visita) */}
      <PantallaCarga />
      <HomeHeader />

      <main>
        {/* Portada */}
        <section className="hero" data-fondo="oscuro" data-principal data-salida>
          {/* El cuadro va en una capa aparte para que se mueva más despacio (parallax) */}
          <div className="hero__fondo" data-parallax="0.35" aria-hidden="true" />
          <h1 className="hero__titulo">
            <span className="hero__linea hero__linea--1">{t.lineas[0]}</span>
            <span className="hero__linea hero__linea--2">{t.lineas[1]}</span>
          </h1>
          <Link className="boton-reserva hero__boton" href="/reserva/integrantes">{t.reservar}</Link>
        </section>

        {/* Historia: ¿Qué es Lilium? */}
        <section className="historia" id="paraiso">
          {/* Unión con la portada: un encaje verde que sube sobre el cuadro al bajar (sin línea entre las dos) */}
          <div className="union union--verde" aria-hidden="true" />

          <div className="historia__contenido">
            <div className="retrato" data-revelar="izquierda" data-parallax="-0.06">
              <img loading="lazy" decoding="async" className="retrato__marco" src="/assets/img/marco-retrato.webp" alt="" />
              {/* Los ojos siguen al ratón (o miran hacia donde se toca en el móvil) */}
              <RetratoOjos alt={t.retratoAlt} />
            </div>

            <div className="historia__texto">
              <h2 className="historia__titulo" data-revelar="derecha">{t.historiaTitulo}</h2>
              <div className="historia__parrafos">
                {t.historia.map((p, i) => (
                  <p key={i} data-revelar="arriba" style={{ "--retardo": `${0.15 + i * 0.12}s` }}>{p}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Encaje del color de «¿Cómo reservar?»: cambia de crema a terracota junto con la sección */}
          <div className="encaje encaje--abajo encaje--como" aria-hidden="true" />
        </section>

        {/* ¿Cómo reservar? + carrusel de los 5 pasos: al bajar, el fondo pasa de crema a terracota */}
        <ComoReservar>
          <CarruselPasos />
        </ComoReservar>

        {/* ¿Qué necesita el retiro? */}
        <section className="ritual">
          {/* Unión con «¿Cómo reservar?»: el encaje del color del ritual sube y tapa el corte */}
          <div className="union union--crudo" aria-hidden="true" />
          <h2 className="ritual__titulo" data-revelar="escala">{t.ritualTitulo}</h2>
          <div className="ritual__cuadros">
            {t.cuadros.map((c, i) => (
              <article
                className={`cuadro cuadro--${i + 1}`}
                key={IMAGENES[i]}
                data-revelar="arriba"
                data-parallax={["-0.04", "0.05", "-0.02"][i]}
                style={{ "--retardo": `${i * 0.15}s` }}
              >
                <div className="polaroid">
                  <img loading="lazy" decoding="async" src={`/assets/img/${IMAGENES[i]}`} alt={c.alt} />
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
        <section className="ubicacion" data-fondo="claro">
          <img loading="lazy" decoding="async" className="ubicacion__mapa" src="/assets/img/mapa-ancho.webp" width="1440" height="551" alt={t.mapaAlt} data-escala="1.08" />
          <div className="ubicacion__dato ubicacion__dato--cuando" data-revelar="derecha">
            <h2><span className="ubicacion__pin" aria-hidden="true" />{t.cuando}</h2>
            <p>{evento.fechaTexto}</p>
            <p><i>{t.cuandoNota}</i></p>
          </div>
          <div className="ubicacion__dato ubicacion__dato--donde" data-revelar="izquierda" style={{ "--retardo": "0.15s" }}>
            <h2><span className="ubicacion__pin" aria-hidden="true" />{t.donde}</h2>
            <p>{evento.lugar}</p>
          </div>
        </section>

        {/* ¿Erasmus? (fondo: el arco con estatuas) */}
        <section className="erasmus" id="erasmus" data-fondo="oscuro">
          {/* Unión con el mapa */}
          <div className="union union--terracota" aria-hidden="true" />
          <img loading="lazy" decoding="async" className="erasmus__lirio" src="/assets/img/icono-lirio.webp" width="99" height="79" alt="" data-revelar="girar" />
          <h2 className="erasmus__titulo" data-revelar="escala" style={{ "--retardo": "0.1s" }}>{t.erasmusTitulo}</h2>
          <p className="erasmus__texto" data-revelar="arriba" style={{ "--retardo": "0.2s" }}>{t.erasmusTexto}</p>
          <div data-revelar="arriba" style={{ "--retardo": "0.3s" }}>
            <BotonErasmus />
          </div>
          <img className="encaje encaje--abajo" src="/assets/svg/banner-encaje-terracota.svg" width="1612" height="176" alt="" />
        </section>

        {/* Preguntas frecuentes */}
        <Faq />

        {/* Llamada final sobre el paisaje: invita a reservar */}
        <section className="cta" aria-labelledby="cta-titulo" data-fondo="claro">
          <img className="encaje encaje--arriba" src="/assets/svg/banner-encaje.svg" width="1612" height="176" alt="" />
          {/* El paisaje se mueve más despacio y se va acercando al bajar */}
          <div className="cta__marco" aria-hidden="true">
            <img loading="lazy" decoding="async" className="cta__paisaje" src="/assets/img/final-paisaje.webp" width="1440" height="494" alt="" data-parallax="0.18" />
          </div>
          <div className="cta__contenido">
            <img loading="lazy" decoding="async" className="cta__lirio" src="/assets/img/icono-lirio.webp" width="99" height="79" alt="" data-revelar="girar" />
            <p className="cta__etiqueta" data-revelar="arriba" style={{ "--retardo": "0.1s" }}>{t.finalEtiqueta}</p>
            <h2 className="cta__titulo" id="cta-titulo" data-revelar="escala" style={{ "--retardo": "0.2s" }}>{t.finalTitulo}</h2>
            <p className="cta__texto" data-revelar="arriba" style={{ "--retardo": "0.3s" }}>{t.finalTexto}</p>
            <div data-revelar="arriba" style={{ "--retardo": "0.4s" }}>
              <Link className="boton-reserva cta__boton" href="/reserva/integrantes">{t.reservar}</Link>
            </div>
          </div>
        </section>
      </main>

      <PiePagina />

      {/* Animaciones al bajar (aparecer, parallax…) */}
      <Animaciones />

      {/* Pop-up Erasmus: solo aquí, y solo la primera vez */}
      <ErasmusBanner />
    </>
  );
}
