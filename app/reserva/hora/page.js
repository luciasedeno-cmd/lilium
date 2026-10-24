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
import { eventoEn, MIN_SALA_NUEVA, MAX_PERSONAS } from "@/lib/config";
import { useIdioma } from "@/components/Idioma";
import PiePagina from "@/components/PiePagina";
import RetratosPaso from "@/components/RetratosPaso";

const TEXTOS = {
  es: {
    completo: "Este turno está completo.", minimo: `Necesitáis al menos ${MIN_SALA_NUEVA} personas para abrir una sala libre.`, sinHueco: "En este turno no queda hueco para todo el grupo.",
    libre: "Sala libre", llena: "Sala llena", formacion: "En formación", soloErasmus: "Solo Erasmus",
    plazas: (h, o) => `Quedan ${h} plazas. ${o} inscritos`, sinPlazas: (o) => `No quedan plazas. ${o} inscritos.`, perfecto: "Perfecto para",
    avisaremos: "✓ Te avisaremos por correo si se libera una plaza.", avisame: "Avísame si se libera una plaza",
    elige: "Elige un turno para continuar.", titulo: "¿Cuándo empieza vuestro retiro?", etiqueta: "ELEGIR HORA", unicoDia: "único día",
    sois: (n) => (n === 1 ? "Eres 1." : `Sois ${n}.`), podeis: "Podéis abrir una sala libre o uniros a un grupo con hueco.",
    mostramos: "Te mostramos los grupos en formación con hueco para vosotros.", editar: "Editar",
    soloMostrando: "Mostrando solo turnos Erasmus.", verTodos: "Ver todos los turnos", cargando: "Cargando turnos…", disponibles: "Turnos disponibles",
    primeros: "¡Sois los primeros en este turno! Poned nombre al equipo (opcional)", ejemplo: "Ej.: Las Hijas del Solsticio", continuar: "Continuar y confirmar →",
  },
  en: {
    completo: "This session is full.", minimo: `You need at least ${MIN_SALA_NUEVA} people to open a free room.`, sinHueco: "There isn't room for your whole group in this session.",
    libre: "Free room", llena: "Room full", formacion: "Group forming", soloErasmus: "Erasmus only",
    plazas: (h, o) => `${h} places left. ${o} signed up`, sinPlazas: (o) => `No places left. ${o} signed up.`, perfecto: "Perfect for",
    avisaremos: "✓ We'll email you if a place opens up.", avisame: "Notify me if a place opens up",
    elige: "Choose a session to continue.", titulo: "When does your retreat begin?", etiqueta: "CHOOSE A TIME", unicoDia: "one day only",
    sois: (n) => (n === 1 ? "You're 1." : `You're ${n}.`), podeis: "You can open a free room or join a group with space.",
    mostramos: "We're showing you the forming groups with space for you.", editar: "Edit",
    soloMostrando: "Showing Erasmus sessions only.", verTodos: "See all sessions", cargando: "Loading sessions…", disponibles: "Available sessions",
    primeros: "You're the first in this session! Name your team (optional)", ejemplo: "E.g.: The Daughters of the Solstice", continuar: "Continue and confirm →",
  },
};

/** ¿Puede este grupo elegir el turno? Devuelve null si sí, o el motivo si no. */
function motivoBloqueo(turno, total, t = TEXTOS.es) {
  if (turno.estado === "completo") return t.completo;
  if (turno.estado === "libre" && total < MIN_SALA_NUEVA) return t.minimo;
  if (turno.hueco < total) return t.sinHueco;
  return null;
}

function Sala({ turno, total, escogida, onElegir, onEsperar }) {
  const t = TEXTOS[useIdioma().idioma];
  const bloqueo = motivoBloqueo(turno, total, t);
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
        <span className="chip">{libre ? t.libre : turno.estado === "completo" ? t.llena : t.formacion}</span>
        {turno.erasmus && <span className="chip"><img src="/assets/svg/icono-mundo.svg" width="15" height="15" alt="" />{t.soloErasmus}</span>}
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
          {libre ? t.plazas(MAX_PERSONAS, 0) : turno.hueco === 0 ? t.sinPlazas(turno.ocupadas) : t.plazas(turno.hueco, turno.ocupadas)}
        </p>
        {turno.estado !== "completo" && (
          <span className="chip">{t.perfecto} {libre ? `${MIN_SALA_NUEVA}-${MAX_PERSONAS}` : turno.hueco === 1 ? "1" : `1-${turno.hueco}`}</span>
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
            <p role="status">{t.avisaremos}</p>
          ) : (
            <button type="button" className="chip sala__avisame" onClick={() => onEsperar(turno)}>{t.avisame}</button>
          )}
        </div>
      )}
    </li>
  );
}

export default function Hora() {
  const { email: lider, error: errorSesion } = useSesion("reserva");
  const { idioma } = useIdioma();
  const t = TEXTOS[idioma];
  const evento = eventoEn(idioma);
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
  const visibles = (turnos || []).filter((x) => !soloErasmus || x.erasmus);
  const escogido = (turnos || []).find((x) => x.id === borrador.turnoId && !motivoBloqueo(x, total));

  // «Avísame si se libera una plaza»: apunta a la persona en la lista de espera de ese turno
  async function esperar(turno) {
    const r = await api("/api/espera", { metodo: "POST", datos: { turnoId: turno.id } });
    if (!r.ok) return setError(r.mensaje);
    setError("");
    setTurnos((lista) => lista.map((x) => (x.id === turno.id ? { ...x, en_espera: true } : x)));
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
    if (!escogido) return setError(t.elige);
    router.push("/reserva/confirmacion");
  }

  if (!lider) return <Cargando error={errorSesion} />;

  return (
    <>
      <NavReserva />
      <main className="paso paso--hora">
        <RetratosPaso />
        <PasoCabecera paso={2} />

        <div className="columna">
          {/* Como en el diseño: primero el título grande y debajo «ELEGIR HORA» */}
          <header className="hora-encabezado">
            <h1 className="titular">{t.titulo}</h1>
            <p className="etiqueta">{t.etiqueta}</p>
          </header>

          <p className="dia">
            <img src="/assets/svg/icono-calendario.svg" width="20" height="22" alt="" />
            {evento.fechaTexto} · {t.unicoDia}
          </p>

          <p className="eres">
            <img src="/assets/svg/icono-personas.svg" width="28" height="25.64" alt="" />
            <span>
              <b>{t.sois(total)}</b>{" "}
              {total >= MIN_SALA_NUEVA ? t.podeis : t.mostramos}{" "}
              <Link href="/reserva/integrantes">{t.editar}</Link>
            </span>
          </p>

          {soloErasmus && (
            <p className="filtro-erasmus">
              {t.soloMostrando} <button type="button" onClick={() => actualizar({ soloErasmus: false })}>{t.verTodos}</button>
            </p>
          )}

          {turnos === null && !error && <p className="cargando">{t.cargando}</p>}

          <ul className="salas" role="radiogroup" aria-label={t.disponibles}>
            {visibles.map((x) => (
              <Sala key={x.id} turno={x} total={total} escogida={escogido?.id === x.id} onElegir={elegir} onEsperar={esperar} />
            ))}
          </ul>

          {escogido?.estado === "libre" && (
            <div className="hora-equipo">
              <label htmlFor="equipo">{t.primeros}</label>
              <input className="campo" id="equipo" maxLength={40} placeholder={t.ejemplo}
                value={borrador.equipo || ""} onChange={(e) => actualizar({ equipo: e.target.value })} />
            </div>
          )}

          <a className="boton hora-continuar" href="/reserva/confirmacion" ref={botonContinuar} onClick={continuar} aria-disabled={escogido ? undefined : "true"}>
            {t.continuar}
          </a>
          <p className="error" role="alert">{error}</p>
        </div>
      </main>
      <PiePagina />
    </>
  );
}
