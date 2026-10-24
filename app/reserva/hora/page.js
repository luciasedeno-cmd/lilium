"use client";
// Paso 2 · Elegir turno
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavReserva from "@/components/NavReserva";
import Cargando from "@/components/Cargando";
import PasoCabecera from "@/components/PasoCabecera";
import { leerBorrador, guardarBorrador, api } from "@/lib/borrador";
import { useSesion } from "@/lib/useSesion";
import { iconosDe } from "@/lib/fotos";
import { EVENTO, MIN_SALA_NUEVA, MAX_PERSONAS } from "@/lib/config";

/** ¿Puede este grupo elegir el turno? Devuelve null si sí, o el motivo si no. */
function motivoBloqueo(turno, total) {
  if (turno.estado === "completo") return "Este turno está completo.";
  if (turno.estado === "libre" && total < MIN_SALA_NUEVA) return `Necesitáis al menos ${MIN_SALA_NUEVA} personas para abrir una sala libre.`;
  if (turno.hueco < total) return "En este turno no queda hueco para todo el grupo.";
  return null;
}

function Sala({ turno, total, escogida, onElegir, onEsperar }) {
  const bloqueo = motivoBloqueo(turno, total);
  const libre = turno.estado === "libre";
  // Turno lleno (o sin hueco para todo el grupo): se puede pedir aviso si se libera una plaza
  const sinHueco = bloqueo && !(libre && total < MIN_SALA_NUEVA);
  const clases = ["sala", escogida && "is-escogida", bloqueo && (libre ? "is-bloqueada" : "is-llena")].filter(Boolean).join(" ");
  const elegir = () => onElegir(turno, bloqueo);

  // La tarjeta es el «botón» de elegir; el aviso de lista de espera va fuera de ella para poder pulsarlo aunque esté llena
  return (
    <li className="sala-envoltorio" role="none">
    <div className={clases} role="radio" aria-checked={escogida} aria-disabled={bloqueo ? "true" : undefined} tabIndex={0}
      onClick={elegir} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); elegir(); } }}>
      <p className="sala__hora">{turno.inicio}-{turno.fin}</p>
      <p className="sala__nombre">{turno.equipo ? `“${turno.equipo}”` : ""}</p>
      <div className="sala__chips">
        <span className="chip">{libre ? "Sala Libre" : turno.estado === "completo" ? "Completo" : "En formación"}</span>
        {turno.erasmus && <span className="chip"><img src="/assets/svg/icono-mundo.svg" width="15" height="15" alt="" />Solo Erasmus</span>}
      </div>
      <div className="sala__pie">
        <div className="avatares">
          {libre ? (
            <>
              <img src="/assets/img/hueco-vacio.png" width="51" height="51" alt="" />
              <img src="/assets/img/hueco-vacio.png" width="51" height="51" alt="" />
              <img src="/assets/svg/hueco-mas.svg" width="51" height="51" alt="" />
            </>
          ) : (
            // De otros grupos no se enseñan los correos: los iconos salen del número de turno
            iconosDe(Array.from({ length: turno.ocupadas }, (_, i) => `turno-${turno.id}-${i}`)).map((src, i) => <img key={i} src={src} width="51" height="51" alt="" />)
          )}
        </div>
        <p className="sala__plazas">
          {libre ? `Quedan ${MAX_PERSONAS} plazas. 0 inscritos` : `Quedan ${turno.hueco} plazas. ${turno.ocupadas} inscritos`}
        </p>
        {turno.estado !== "completo" && (
          <span className="chip">{libre ? `Perfecto para ${MIN_SALA_NUEVA}-${MAX_PERSONAS}` : `Perfecto para ${turno.hueco === 1 ? "1" : `1-${turno.hueco}`}`}</span>
        )}
      </div>
      {bloqueo ? (
        <img className="sala__candado" src="/assets/svg/icono-candado.svg" width="24.5" height="29.36" alt={bloqueo} />
      ) : (
        <span className="sala__elegir" aria-hidden="true">
          <img className="base" src="/assets/svg/sala-base.svg" width="42" height="42" alt="" />
          <img className="escogida" src="/assets/svg/sala-escogida.svg" width="42" height="42" alt="" />
        </span>
      )}
    </div>
      {sinHueco && (
        <div className="sala__espera">
          {turno.en_espera ? (
            <p role="status">✓ Te avisaremos por correo si se libera una plaza.</p>
          ) : (
            <button type="button" className="chip sala__avisame" onClick={() => onEsperar(turno)}>Avísame si se libera una plaza</button>
          )}
        </div>
      )}
    </li>
  );
}

export default function Hora() {
  const { email: lider, error: errorSesion } = useSesion("reserva");
  const router = useRouter();
  const [turnos, setTurnos] = useState(null);
  const [borrador, setBorrador] = useState({});
  const [error, setError] = useState("");
  const botonContinuar = useRef(null);
  const [recienElegido, setRecienElegido] = useState(0); // cambia en cada clic para bajar hasta el botón

  useEffect(() => {
    setBorrador(leerBorrador());
    api("/api/turnos").then((r) => (r.ok ? setTurnos(r.turnos) : setError(r.mensaje)));
  }, []);

  const actualizar = (cambios) => setBorrador(guardarBorrador(cambios));
  const total = (borrador.integrantes || []).length + 1;
  const soloErasmus = Boolean(borrador.soloErasmus);
  const visibles = (turnos || []).filter((t) => !soloErasmus || t.erasmus);
  const escogido = (turnos || []).find((t) => t.id === borrador.turnoId && !motivoBloqueo(t, total));

  // «Avísame si se libera una plaza»: apunta a la persona en la lista de espera de ese turno
  async function esperar(turno) {
    const r = await api("/api/espera", { metodo: "POST", datos: { turnoId: turno.id } });
    if (!r.ok) return setError(r.mensaje);
    setError("");
    setTurnos((lista) => lista.map((t) => (t.id === turno.id ? { ...t, en_espera: true } : t)));
  }

  function elegir(turno, bloqueo) {
    if (bloqueo) return setError(bloqueo);
    setError("");
    actualizar({ turnoId: turno.id });
    setRecienElegido((n) => n + 1);
  }

  // Al elegir un turno, la página baja sola hasta el botón «Continuar» (después de pintarse,
  // por si aparece el recuadro del nombre del equipo encima del botón)
  useEffect(() => {
    if (!recienElegido || !botonContinuar.current) return;
    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    botonContinuar.current.scrollIntoView({ behavior: suave ? "smooth" : "auto", block: "center" });
  }, [recienElegido]);

  function continuar(e) {
    e.preventDefault();
    if (!escogido) return setError("Elige un turno para continuar.");
    router.push("/reserva/confirmacion");
  }

  if (!lider) return <Cargando error={errorSesion} />;

  return (
    <>
      <NavReserva />
      <main>
        <PasoCabecera paso={2} atras="/reserva/integrantes" />

        <div className="columna">
          <header className="hora-encabezado">
            <p className="etiqueta">ELEGIR HORA</p>
            <h1 className="titular">¿Cuándo empieza vuestro retiro?</h1>
          </header>

          <p className="dia">
            <img src="/assets/svg/icono-calendario.svg" width="20" height="22" alt="" />
            {EVENTO.fechaTexto} · único día
          </p>

          <p className="eres">
            <img src="/assets/svg/icono-personas.svg" width="28" height="25.64" alt="" />
            <span>
              <b>{total === 1 ? "Eres 1." : `Sois ${total}.`}</b>{" "}
              {total >= MIN_SALA_NUEVA ? "Podéis abrir una sala libre o uniros a un grupo con hueco." : "Te mostramos los grupos en formación con hueco para vosotros."}{" "}
              <Link href="/reserva/integrantes">Editar</Link>
            </span>
          </p>

          {soloErasmus && (
            <p className="filtro-erasmus">
              Mostrando solo turnos Erasmus. <button type="button" onClick={() => actualizar({ soloErasmus: false })}>Ver todos los turnos</button>
            </p>
          )}

          {turnos === null && !error && <p className="cargando">Cargando turnos…</p>}

          <ul className="salas" role="radiogroup" aria-label="Turnos disponibles">
            {visibles.map((t) => (
              <Sala key={t.id} turno={t} total={total} escogida={escogido?.id === t.id} onElegir={elegir} onEsperar={esperar} />
            ))}
          </ul>

          {escogido?.estado === "libre" && (
            <div className="hora-equipo">
              <label htmlFor="equipo">¡Sois los primeros en este turno! Poned nombre al equipo (opcional)</label>
              <input className="campo" id="equipo" maxLength={40} placeholder="Ej.: Las Hijas del Solsticio"
                value={borrador.equipo || ""} onChange={(e) => actualizar({ equipo: e.target.value })} />
            </div>
          )}

          <a className="boton hora-continuar" href="/reserva/confirmacion" ref={botonContinuar} onClick={continuar} aria-disabled={escogido ? undefined : "true"}>
            Continuar y confirmar →
          </a>
          <p className="error" role="alert">{error}</p>
        </div>
      </main>
    </>
  );
}
