// Aviso Legal de Lilium: riesgos de la actividad, salud, normas de seguridad y aceptación.
// Se llega desde «Aviso Legal» en el pie de todas las páginas.
// Los textos están abajo, en AVISO (español) y AVISO_EN (inglés). Cada sección tiene:
//   titulo, intro (párrafo de arriba), puntos (la lista) y cierre (párrafos de debajo, opcional).
// En los puntos, «fuerte» es lo que sale en negrita al principio (puede faltar).
import Link from "next/link";
import NavReserva from "@/components/NavReserva";
import PiePagina from "@/components/PiePagina";
import { CONTACTO } from "@/lib/config";
import { idiomaActual } from "@/lib/idiomaServidor";

export const metadata = { title: "Aviso Legal · Lilium" };

const AVISO = {
  etiqueta: "LEGAL",
  titulo: "Aviso Legal",
  destacado: "Lee atentamente la siguiente información antes de reservar y participar en la actividad.",
  entrada:
    "La actividad de escape room incluye elementos ambientales, sensoriales y físicos que pueden implicar determinados riesgos. Al realizar la reserva y participar en la experiencia, cada participante declara haber sido informado de las siguientes condiciones:",
  secciones: [
    {
      titulo: "Características de la actividad y riesgos asociados",
      intro: "Durante el desarrollo de la experiencia podrán utilizarse los siguientes elementos y efectos:",
      puntos: [
        { fuerte: "Objetos de cristal", texto: "presencia y manipulación de elementos de cristal que podrían provocar cortes o lesiones en caso de rotura, golpe o uso inadecuado." },
        { fuerte: "Iluminación reducida y efectos luminosos", texto: "espacios con poca iluminación, cambios de intensidad lumínica, luces intermitentes u otros efectos visuales que pueden causar desorientación o molestias." },
        { fuerte: "Especias y sustancias aromáticas", texto: "presencia de especias y otros elementos aromáticos que pueden provocar reacciones alérgicas o molestias en personas sensibles. Estos elementos no están destinados a ser ingeridos." },
        { fuerte: "Obstáculos y desplazamientos", texto: "posibilidad de tropiezos, golpes, choques contra objetos o elementos del entorno, pérdida de equilibrio y caídas accidentales." },
        { fuerte: "Sustos y estímulos inesperados", texto: "sonidos, efectos ambientales, apariciones y otros estímulos repentinos que pueden causar sobresaltos, ansiedad, estrés o reacciones involuntarias." },
      ],
    },
    {
      titulo: "Personas con condiciones de salud específicas",
      intro: "Por las características de la actividad, se recomienda especial precaución y valoración previa de la conveniencia de participar a las personas que presenten alguna de las siguientes condiciones:",
      puntos: [
        { fuerte: "Fotosensibilidad o epilepsia fotosensible", texto: "debido a la posible presencia de luces intermitentes, destellos o cambios de iluminación." },
        { fuerte: "Embarazo", texto: "por los posibles riesgos asociados a tropiezos, golpes, caídas, sobresaltos y desplazamientos en condiciones de baja iluminación." },
        { fuerte: "Enfermedades cardíacas o cardiovasculares", texto: "debido a los posibles efectos de los sustos, el estrés o las emociones intensas." },
        { fuerte: "Alergias o hipersensibilidad", texto: "a especias, aromas u otras sustancias que puedan estar presentes durante la experiencia." },
      ],
      cierre: [
        "Si tienes alguna de estas condiciones o dudas sobre tu seguridad, te recomendamos consultar previamente con un profesional sanitario y contactar con la organización antes de realizar la reserva. La participación deberá ajustarse a las indicaciones de seguridad aplicables a la actividad.",
      ],
    },
    {
      titulo: "Normas de seguridad y comportamiento",
      intro: "Durante la experiencia, los participantes deberán:",
      puntos: [
        { texto: "Seguir en todo momento las instrucciones del personal responsable." },
        { texto: "Actuar con precaución, especialmente en zonas con poca iluminación." },
        { texto: "Evitar correr, empujar, forcejear o realizar movimientos bruscos." },
        { texto: "No golpear, lanzar ni utilizar de forma inadecuada los objetos y elementos de la instalación." },
        { texto: "Comunicar inmediatamente al personal cualquier incidencia, malestar físico o situación que pueda comprometer la seguridad." },
      ],
      cierre: [
        "Si durante la actividad un participante siente malestar, mareo, ansiedad o cualquier otra circunstancia que afecte a su seguridad, deberá comunicarlo al personal para que pueda valorar la interrupción de la experiencia y prestar la asistencia que corresponda.",
      ],
    },
    {
      titulo: "Declaración de información y aceptación",
      intro: "Al marcar la casilla de aceptación antes de completar la reserva, declaro que:",
      puntos: [
        { texto: "He leído y comprendido las advertencias anteriores." },
        { texto: "Soy consciente de las características de la experiencia y de los riesgos razonablemente previsibles asociados a su desarrollo." },
        { texto: "Me comprometo a respetar las normas de seguridad y las instrucciones del personal." },
        { texto: "Me comprometo a comunicar a la organización cualquier circunstancia relevante que pueda afectar a mi seguridad o a la de los demás participantes." },
      ],
      cierre: [
        "Entiendo que la participación es voluntaria y que puedo solicitar información adicional antes de iniciar la actividad.",
        "La organización de Lilium no será responsable de los accidentes o daños derivados del uso inadecuado de los elementos e instalaciones, del incumplimiento de las normas de seguridad o de la participación sin tener en cuenta las advertencias previamente comunicadas.",
      ],
    },
  ],
  dudas: "¿Dudas? Escríbenos a",
  volver: "← Volver al inicio",
};

// Versión en inglés (la misma información)
const AVISO_EN = {
  etiqueta: "LEGAL",
  titulo: "Legal Notice",
  destacado: "Please read the following information carefully before booking and taking part in the activity.",
  entrada:
    "The escape room activity includes environmental, sensory and physical elements that may involve certain risks. By booking and taking part in the experience, each participant declares that they have been informed of the following conditions:",
  secciones: [
    {
      titulo: "Features of the activity and associated risks",
      intro: "The following elements and effects may be used during the experience:",
      puntos: [
        { fuerte: "Glass objects", texto: "glass items are present and handled, and could cause cuts or injuries if broken, knocked or misused." },
        { fuerte: "Low lighting and light effects", texto: "dimly lit spaces, changes in light intensity, flashing lights or other visual effects that may cause disorientation or discomfort." },
        { fuerte: "Spices and aromatic substances", texto: "spices and other aromatic elements that may cause allergic reactions or discomfort in sensitive people. These elements are not meant to be eaten." },
        { fuerte: "Obstacles and moving around", texto: "possible trips, knocks, bumping into objects or parts of the set, loss of balance and accidental falls." },
        { fuerte: "Scares and unexpected stimuli", texto: "sounds, ambient effects, apparitions and other sudden stimuli that may cause startle, anxiety, stress or involuntary reactions." },
      ],
    },
    {
      titulo: "People with specific health conditions",
      intro: "Because of the nature of the activity, we recommend special caution, and thinking beforehand about whether to take part, for people with any of the following conditions:",
      puntos: [
        { fuerte: "Photosensitivity or photosensitive epilepsy", texto: "because of the possible use of flashing lights, flashes or lighting changes." },
        { fuerte: "Pregnancy", texto: "because of the possible risks of trips, knocks, falls, scares and moving around in low light." },
        { fuerte: "Heart or cardiovascular conditions", texto: "because of the possible effects of scares, stress or intense emotions." },
        { fuerte: "Allergies or hypersensitivity", texto: "to spices, scents or other substances that may be present during the experience." },
      ],
      cierre: [
        "If you have any of these conditions or doubts about your safety, we recommend consulting a healthcare professional first and contacting the organisers before booking. Participation must follow the safety guidelines that apply to the activity.",
      ],
    },
    {
      titulo: "Safety and behaviour rules",
      intro: "During the experience, participants must:",
      puntos: [
        { texto: "Follow the instructions of the staff in charge at all times." },
        { texto: "Act with care, especially in dimly lit areas." },
        { texto: "Avoid running, pushing, struggling or making sudden movements." },
        { texto: "Not hit, throw or misuse the objects and elements of the set." },
        { texto: "Immediately tell the staff about any incident, physical discomfort or situation that could put safety at risk." },
      ],
      cierre: [
        "If during the activity a participant feels unwell, dizzy, anxious or experiences any other circumstance that affects their safety, they must tell the staff so they can consider stopping the experience and provide the appropriate assistance.",
      ],
    },
    {
      titulo: "Declaration and acceptance",
      intro: "By ticking the acceptance box before completing the booking, I declare that:",
      puntos: [
        { texto: "I have read and understood the warnings above." },
        { texto: "I am aware of the features of the experience and of the reasonably foreseeable risks involved." },
        { texto: "I agree to follow the safety rules and the staff's instructions." },
        { texto: "I agree to tell the organisers about any relevant circumstance that could affect my safety or that of the other participants." },
      ],
      cierre: [
        "I understand that participation is voluntary and that I may ask for more information before the activity starts.",
        "The Lilium organisers will not be responsible for accidents or damage resulting from misuse of the elements and facilities, failure to follow the safety rules, or taking part without taking into account the warnings previously given.",
      ],
    },
  ],
  dudas: "Questions? Write to us at",
  volver: "← Back to home",
};

export default async function AvisoLegal() {
  const t = (await idiomaActual()) === "en" ? AVISO_EN : AVISO;
  return (
    <>
      <NavReserva />
      <main>
        <article className="columna terminos aviso">
          <p className="etiqueta">{t.etiqueta}</p>
          <h1 className="titular">{t.titulo}</h1>

          {/* Recuadro de arriba: lo más importante */}
          <div className="terminos__aviso aviso__entrada">
            <p className="aviso__destacado">{t.destacado}</p>
            <p>{t.entrada}</p>
          </div>

          {/* Las 4 secciones numeradas, cada una en su tarjeta */}
          {t.secciones.map((s, i) => (
            <section key={i} className="aviso__seccion" aria-labelledby={`aviso-${i + 1}`}>
              <h2 id={`aviso-${i + 1}`}>
                <span className="aviso__numero" aria-hidden="true">{i + 1}</span>
                {s.titulo}
              </h2>
              <p>{s.intro}</p>
              <ul className="aviso__lista">
                {s.puntos.map((p, j) => (
                  <li key={j}>
                    {p.fuerte && <strong>{p.fuerte}: </strong>}
                    {p.texto}
                  </li>
                ))}
              </ul>
              {s.cierre?.map((c, j) => <p key={j} className="aviso__cierre">{c}</p>)}
            </section>
          ))}

          <p className="terminos__contacto">{t.dudas} <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a>.</p>
          <p><Link href="/inicio">{t.volver}</Link></p>
        </article>
      </main>
      <PiePagina />
    </>
  );
}
