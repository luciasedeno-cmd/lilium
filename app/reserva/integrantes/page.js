"use client";
// Paso 1 · Integrantes del grupo (Figma «PAG RESERVA - INTEGRANTES» y «… A»).
// Al principio solo se ve la persona que ha entrado (líder) con un «+». Cada vez que se pulsa el «+»
// aparece una fila con un hueco para el correo de otra persona y una ✕ para quitarla.
// Al pulsar «Continuar» se comprueban los correos y se pasa a elegir la hora.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NavReserva from "@/components/NavReserva";
import Cargando from "@/components/Cargando";
import PasoCabecera from "@/components/PasoCabecera";
import { leerBorrador, guardarBorrador } from "@/lib/borrador";
import { useSesion } from "@/lib/useSesion";
import PiePagina from "@/components/PiePagina";
import { useTextos } from "@/components/Idioma";
import RetratosPaso from "@/components/RetratosPaso";
import { IconoCruz, IconoMas } from "@/components/Iconos";

// Aquí solo se mira que tenga forma de correo: el servidor comprueba que sea de ESADA
// (o de las personas autorizadas por el equipo, como el profesor)
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PERSONAS = 6;
const MIN_SALA_NUEVA = 3;

const TEXTOS = {
  es: {
    titulo: "¿Quién asistirá al prado?", intro: "Escribe los correos de todos los integrantes para que reciban la confirmación en su bandeja de entrada.",
    integrantes: "Integrantes del grupo", tuLider: "Tú (líder)", integrante: "Integrante", quitar: "Quitar a", quitarBoton: "Quitar",
    correoIntegrante: "Correo del integrante", completo: "Grupo completo", anadir: "Añadir integrante", personas: "personas",
    correoMal: "El correo debe ser nombreapellido@alumnado.esada.es", repetido: "Ese correo ya está en el grupo.", maximo: "Máximo 6 personas por turno.",
    avisoTitulo: "Mínimo 3 personas para abrir sala nueva.", avisoTexto: "Con 1 o 2 personas, únete a un grupo en formación para completar la hermandad.",
    abrirSala: "Continuar y abrir sala nueva →", unirme: "Continuar y unirme a un grupo →",
    pista: "nombreapellido@alumnado.esada.es", hueco: "Hay un correo sin escribir: rellénalo o quítalo con la ✕.",
  },
  en: {
    titulo: "Who will come to the meadow?", intro: "Write the emails of all the members so they receive the confirmation in their inbox.",
    integrantes: "Group members", tuLider: "You (leader)", integrante: "Member", quitar: "Remove", quitarBoton: "Remove",
    correoIntegrante: "Member's email", completo: "Group full", anadir: "Add member", personas: "people",
    correoMal: "The email must be nameSurname@alumnado.esada.es", repetido: "That email is already in the group.", maximo: "Maximum 6 people per session.",
    avisoTitulo: "Minimum 3 people to open a new room.", avisoTexto: "With 1 or 2 people, join a group being formed to complete the sisterhood.",
    abrirSala: "Continue and open a new room →", unirme: "Continue and join a group →",
    pista: "namesurname@alumnado.esada.es", hueco: "There's an empty email: fill it in or remove it with the ✕.",
  },
};

export default function Integrantes() {
  const router = useRouter();
  const { email: lider, error: errorSesion } = useSesion("reserva");
  const t = useTextos(TEXTOS);
  // Una fila por cada «+» pulsado: { id, correo } (el id sirve para que React no confunda las filas)
  const [filas, setFilas] = useState([]);
  const [error, setError] = useState("");
  const [malas, setMalas] = useState([]); // ids de las filas con algún problema
  const siguienteId = useRef(0);
  const nuevaFila = (correo = "") => ({ id: siguienteId.current++, correo });
  const ultimaAnadida = useRef(null);

  // Si ya había empezado (volviendo atrás desde la hora), se recuperan los correos
  useEffect(() => setFilas((leerBorrador().integrantes || []).map((c) => nuevaFila(c))), []);

  // El cursor va solo al hueco recién añadido
  useEffect(() => {
    if (ultimaAnadida.current !== null) document.getElementById(`integrante-${ultimaAnadida.current}`)?.focus();
    ultimaAnadida.current = null;
  }, [filas]);

  const correos = filas.map((f) => f.correo.trim().toLowerCase()).filter(Boolean);
  const total = correos.length + 1;

  // Guarda en el borrador solo los correos bien escritos (los usa el paso 3)
  function cambiar(nuevas) {
    setFilas(nuevas);
    setError("");
    setMalas([]);
    const buenos = [...new Set(nuevas.map((f) => f.correo.trim().toLowerCase()).filter((c) => CORREO_VALIDO.test(c) && c !== lider))];
    guardarBorrador({ integrantes: buenos });
  }

  function anadir() {
    if (filas.length + 1 >= MAX_PERSONAS) return setError(t.maximo);
    const fila = nuevaFila();
    ultimaAnadida.current = fila.id;
    cambiar([...filas, fila]);
  }

  // Antes de seguir: cada correo escrito tiene que estar bien y sin repetir; los huecos vacíos, fuera
  function continuar() {
    const vistos = new Set([lider]);
    for (const f of filas) {
      const c = f.correo.trim().toLowerCase();
      let mensaje = "";
      if (!c) mensaje = t.hueco;
      else if (!CORREO_VALIDO.test(c)) mensaje = t.correoMal;
      else if (vistos.has(c)) mensaje = t.repetido;
      vistos.add(c);
      if (mensaje) {
        setError(mensaje);
        setMalas([f.id]);
        return document.getElementById(`integrante-${f.id}`)?.focus();
      }
    }
    guardarBorrador({ integrantes: correos });
    router.push("/reserva/hora");
  }

  if (!lider) return <Cargando error={errorSesion} />;

  return (
    <>
      <NavReserva />
      <main className="paso paso--integrantes">
        <RetratosPaso />
        <PasoCabecera paso={1} />

        <section className="integrantes-intro">
          <h1 className="titular">{t.titulo}</h1>
          <p>{t.intro}</p>
        </section>

        <section className="int-grupo" aria-label={t.integrantes}>
          {/* Tú (líder) con el «+» para añadir a otra persona */}
          <div className="int-grupo__cabecera">
            <div className="int-lider">
              <span className="int-lider__icono" aria-hidden="true">
                <img src="/assets/img/icono-lirio.webp" width="99" height="80" alt="" />
              </span>
              <div>
                <p className="int-lider__nombre">{t.tuLider}</p>
                <p className="int-lider__correo">{lider}</p>
              </div>
            </div>
            <button className="boton-mas int-mas" type="button" onClick={anadir} aria-label={t.anadir} disabled={filas.length + 1 >= MAX_PERSONAS}>
              <IconoMas />
            </button>
          </div>

          {/* Un hueco por cada persona añadida */}
          {filas.length > 0 && (
            <ul className="int-huecos">
              {filas.map((f, i) => (
                <li className="int-hueco" key={f.id}>
                  <label className="visually-hidden" htmlFor={`integrante-${f.id}`}>{`${t.correoIntegrante} ${i + 1}`}</label>
                  <input
                    className="campo int-hueco__campo"
                    id={`integrante-${f.id}`}
                    type="email"
                    autoComplete="off"
                    placeholder={t.pista}
                    value={f.correo}
                    aria-invalid={malas.includes(f.id) ? "true" : undefined}
                    aria-describedby="integrante-error"
                    onChange={(e) => cambiar(filas.map((x) => (x.id === f.id ? { ...x, correo: e.target.value } : x)))}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), anadir())}
                  />
                  <button className="int-quitar" type="button" aria-label={`${t.quitar} ${f.correo || `${t.integrante} ${i + 1}`}`}
                    onClick={() => cambiar(filas.filter((x) => x.id !== f.id))}>
                    <IconoCruz tamano={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="error int-error" id="integrante-error" role="alert">{error}</p>
        </section>

        <button className="boton integrantes-continuar" type="button" onClick={continuar}>
          {total >= MIN_SALA_NUEVA ? t.abrirSala : t.unirme}
        </button>

        <p className="int-aviso">
          <b>{t.avisoTitulo}</b>
          <span>{t.avisoTexto}</span>
        </p>
      </main>
      <PiePagina />
    </>
  );
}
