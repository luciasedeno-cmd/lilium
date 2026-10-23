"use client";
// Paso 1 · Integrantes del grupo
import { useEffect, useState } from "react";
import Link from "next/link";
import NavReserva from "@/components/NavReserva";
import Cargando from "@/components/Cargando";
import PasoCabecera from "@/components/PasoCabecera";
import { leerBorrador, guardarBorrador } from "@/lib/borrador";
import { useSesion } from "@/lib/useSesion";
import { fotoDe } from "@/lib/fotos";

const CORREO_VALIDO = /^[a-z0-9._-]+@alumnado\.esada\.es$/i;
const MAX_PERSONAS = 6;
const MIN_SALA_NUEVA = 3;

export default function Integrantes() {
  const { email: lider, error: errorSesion } = useSesion("reserva");
  const [integrantes, setIntegrantes] = useState([]);
  const [campo, setCampo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => setIntegrantes(leerBorrador().integrantes || []), []);

  const actualizar = (lista) => {
    setIntegrantes(lista);
    guardarBorrador({ integrantes: lista });
  };

  const total = integrantes.length + 1;
  const vacios = total < MIN_SALA_NUEVA ? MIN_SALA_NUEVA - total : total < MAX_PERSONAS ? 1 : 0;

  function anadir(e) {
    e.preventDefault();
    const correo = campo.trim().toLowerCase();
    let mensaje = "";
    if (!CORREO_VALIDO.test(correo)) mensaje = "El correo debe ser nombreapellido@alumnado.esada.es";
    else if (correo === lider || integrantes.includes(correo)) mensaje = "Ese correo ya está en el grupo.";
    else if (total >= MAX_PERSONAS) mensaje = "Máximo 6 personas por turno.";
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
        <PasoCabecera paso={1} atras="/inicio" />

        <section className="integrantes-intro">
          <h1 className="titular">¿Quién asistirá al prado?</h1>
          <p>Escribe los correos de todos los integrantes para que reciban la confirmación en su bandeja de entrada.</p>
        </section>

        <div className="grupo-resumen">
          <div className="grupo-resumen__fondo" />
          <div className="grupo-resumen__huecos">
            <img src="/assets/img/avatar-lider.png" width="94" height="94" alt="" style={{ left: 10 }} />
            {integrantes.map((c, i) => (
              <img key={c} src={fotoDe(i + 1)} width="94" height="94" alt="" style={{ left: 10 + 74 * (i + 1) }} />
            ))}
            {Array.from({ length: vacios }, (_, i) => (
              <img key={`hueco-${i}`} className="hueco" src="/assets/svg/hueco-integrante.svg" width="114" height="114" alt="" style={{ left: 74 * (total + i) }} />
            ))}
          </div>
          <p className="grupo-resumen__contador" aria-live="polite"><b>{total}</b>/6</p>
        </div>

        <section className="integrantes" aria-label="Integrantes del grupo">
          <ul className="integrantes__lista">
            <li className="integrante">
              <img src="/assets/img/avatar-lider.png" width="94" height="94" alt="" />
              <div className="integrante__datos">
                <p className="integrante__nombre">Tú (líder)</p>
                <p className="integrante__correo">{lider}</p>
              </div>
            </li>
            {integrantes.map((correo, i) => (
              <li className="integrante" key={correo}>
                <img src={fotoDe(i + 1)} width="94" height="94" alt="" />
                <div className="integrante__datos">
                  <p className="integrante__nombre">Integrante {i + 2}</p>
                  <p className="integrante__correo">{correo}</p>
                </div>
                <button className="integrante__quitar" type="button" aria-label={`Quitar a ${correo}`}
                  onClick={() => actualizar(integrantes.filter((x) => x !== correo))}>Quitar</button>
              </li>
            ))}
          </ul>

          <img className="integrantes__linea" src="/assets/svg/linea-trazo.svg" width="702" height="1" alt="" />

          <form className="integrantes__form" onSubmit={anadir} noValidate>
            <label className="visually-hidden" htmlFor="correo-integrante">Correo del integrante</label>
            <input className="campo" id="correo-integrante" type="email" autoComplete="off" aria-describedby="integrante-error"
              placeholder={total >= MAX_PERSONAS ? "Grupo completo" : "E-mail"} disabled={total >= MAX_PERSONAS}
              value={campo} onChange={(e) => setCampo(e.target.value)} aria-invalid={error ? "true" : undefined} />
            <button className="boton-mas" type="submit" aria-label="Añadir integrante" disabled={total >= MAX_PERSONAS}>
              <img src="/assets/svg/icono-mas.svg" width="29" height="29" alt="" />
            </button>
          </form>
          <p className="error" id="integrante-error" role="alert">{error}</p>
        </section>

        <p className="aviso">
          <b>Mínimo 3 personas para abrir sala nueva.</b>
          Con 1 o 2 personas, únete a un grupo en formación para completar la hermandad.
        </p>

        <Link className="boton integrantes-continuar" href="/reserva/hora">
          {total >= MIN_SALA_NUEVA ? "Continuar y abrir sala nueva →" : "Continuar y unirme a un grupo →"}
        </Link>
      </main>
    </>
  );
}
