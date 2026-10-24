"use client";
// Paso 1 · Integrantes del grupo
import { useEffect, useState } from "react";
import Link from "next/link";
import NavReserva from "@/components/NavReserva";
import Cargando from "@/components/Cargando";
import PasoCabecera from "@/components/PasoCabecera";
import { leerBorrador, guardarBorrador } from "@/lib/borrador";
import { useSesion } from "@/lib/useSesion";
import { iconosDe } from "@/lib/fotos";
import PiePagina from "@/components/PiePagina";
import { useTextos } from "@/components/Idioma";

const CORREO_VALIDO = /^[a-z0-9._-]+@alumnado\.esada\.es$/i;
const MAX_PERSONAS = 6;
const MIN_SALA_NUEVA = 3;

const TEXTOS = {
  es: {
    titulo: "¿Quién asistirá al prado?", intro: "Escribe los correos de todos los integrantes para que reciban la confirmación en su bandeja de entrada.",
    integrantes: "Integrantes del grupo", tuLider: "Tú (líder)", integrante: "Integrante", quitar: "Quitar a", quitarBoton: "Quitar",
    correoIntegrante: "Correo del integrante", completo: "Grupo completo", anadir: "Añadir integrante",
    correoMal: "El correo debe ser nombreapellido@alumnado.esada.es", repetido: "Ese correo ya está en el grupo.", maximo: "Máximo 6 personas por turno.",
    avisoTitulo: "Mínimo 3 personas para abrir sala nueva.", avisoTexto: "Con 1 o 2 personas, únete a un grupo en formación para completar la hermandad.",
    abrirSala: "Continuar y abrir sala nueva →", unirme: "Continuar y unirme a un grupo →",
  },
  en: {
    titulo: "Who will come to the meadow?", intro: "Write the emails of all the members so they receive the confirmation in their inbox.",
    integrantes: "Group members", tuLider: "You (leader)", integrante: "Member", quitar: "Remove", quitarBoton: "Remove",
    correoIntegrante: "Member's email", completo: "Group full", anadir: "Add member",
    correoMal: "The email must be nameSurname@alumnado.esada.es", repetido: "That email is already in the group.", maximo: "Maximum 6 people per session.",
    avisoTitulo: "Minimum 3 people to open a new room.", avisoTexto: "With 1 or 2 people, join a group being formed to complete the sisterhood.",
    abrirSala: "Continue and open a new room →", unirme: "Continue and join a group →",
  },
};

export default function Integrantes() {
  const { email: lider, error: errorSesion } = useSesion("reserva");
  const t = useTextos(TEXTOS);
  const [integrantes, setIntegrantes] = useState([]);
  const [campo, setCampo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => setIntegrantes(leerBorrador().integrantes || []), []);

  const actualizar = (lista) => {
    setIntegrantes(lista);
    guardarBorrador({ integrantes: lista });
  };

  const total = integrantes.length + 1;
  const iconos = iconosDe([lider, ...integrantes]); // icono de perfil de cada persona (el primero es el líder)
  const vacios = total < MIN_SALA_NUEVA ? MIN_SALA_NUEVA - total : total < MAX_PERSONAS ? 1 : 0;

  function anadir(e) {
    e.preventDefault();
    const correo = campo.trim().toLowerCase();
    let mensaje = "";
    if (!CORREO_VALIDO.test(correo)) mensaje = t.correoMal;
    else if (correo === lider || integrantes.includes(correo)) mensaje = t.repetido;
    else if (total >= MAX_PERSONAS) mensaje = t.maximo;
    setError(mensaje);
    if (mensaje) return;
    actualizar([...integrantes, correo]);
    setCampo("");
  }

  if (!lider) return <Cargando error={errorSesion} />;

  return (
    <>
      <NavReserva />
      <main>
        <PasoCabecera paso={1} />

        <section className="integrantes-intro">
          <h1 className="titular">{t.titulo}</h1>
          <p>{t.intro}</p>
        </section>

        <div className="grupo-resumen">
          <div className="grupo-resumen__fondo" />
          <div className="grupo-resumen__huecos">
            <img src={iconos[0]} width="94" height="94" alt="" style={{ left: 10 }} />
            {integrantes.map((c, i) => (
              <img key={c} src={iconos[i + 1]} width="94" height="94" alt="" style={{ left: 10 + 74 * (i + 1) }} />
            ))}
            {Array.from({ length: vacios }, (_, i) => (
              <img key={`hueco-${i}`} className="hueco" src="/assets/svg/hueco-integrante.svg" width="114" height="114" alt="" style={{ left: 74 * (total + i) }} />
            ))}
          </div>
          <p className="grupo-resumen__contador" aria-live="polite"><b>{total}</b>/6</p>
        </div>

        <section className="integrantes" aria-label={t.integrantes}>
          <ul className="integrantes__lista">
            <li className="integrante">
              <img src={iconos[0]} width="94" height="94" alt="" />
              <div className="integrante__datos">
                <p className="integrante__nombre">{t.tuLider}</p>
                <p className="integrante__correo">{lider}</p>
              </div>
            </li>
            {integrantes.map((correo, i) => (
              <li className="integrante" key={correo}>
                <img src={iconos[i + 1]} width="94" height="94" alt="" />
                <div className="integrante__datos">
                  <p className="integrante__nombre">{t.integrante} {i + 2}</p>
                  <p className="integrante__correo">{correo}</p>
                </div>
                <button className="integrante__quitar" type="button" aria-label={`${t.quitar} ${correo}`}
                  onClick={() => actualizar(integrantes.filter((x) => x !== correo))}>{t.quitarBoton}</button>
              </li>
            ))}
          </ul>

          <img className="integrantes__linea" src="/assets/svg/linea-trazo.svg" width="702" height="1" alt="" />

          <form className="integrantes__form" onSubmit={anadir} noValidate>
            <label className="visually-hidden" htmlFor="correo-integrante">{t.correoIntegrante}</label>
            <input className="campo" id="correo-integrante" type="email" autoComplete="off" aria-describedby="integrante-error"
              placeholder={total >= MAX_PERSONAS ? t.completo : "E-mail"} disabled={total >= MAX_PERSONAS}
              value={campo} onChange={(e) => setCampo(e.target.value)} aria-invalid={error ? "true" : undefined} />
            <button className="boton-mas" type="submit" aria-label={t.anadir} disabled={total >= MAX_PERSONAS}>
              <img src="/assets/svg/icono-mas.svg" width="29" height="29" alt="" />
            </button>
          </form>
          <p className="error" id="integrante-error" role="alert">{error}</p>
        </section>

        <p className="aviso">
          <b>{t.avisoTitulo}</b>
          {t.avisoTexto}
        </p>

        <Link className="boton integrantes-continuar" href="/reserva/hora">
          {total >= MIN_SALA_NUEVA ? t.abrirSala : t.unirme}
        </Link>
      </main>
      <PiePagina />
    </>
  );
}
