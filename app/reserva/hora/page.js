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
import { IconoCheck } from "@/components/Iconos";

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
    filtros: "Filtrar turnos", fTodos: "Todos", fHueco: "Con hueco para vosotros", fErasmus: "Solo Erasmus",
    ninguno: "No hay turnos con este filtro. Prueba con «Todos».", de: "de", libres: "libres", elegido: "Turno elegido",
  },
  en: {
    completo: "This session is full.", minimo: `You need at least ${MIN_SALA_NUEVA} people to open an empty room.`, sinHueco: "There isn't room for your whole group in this session.",
    libre: "Empty room", llena: "Room full", formacion: "Group forming", soloErasmus: "Erasmus only",
    plazas: (h, o) => `${h} places left. ${o} signed up`, sinPlazas: (o) => `No places left. ${o} signed up.`, perfecto: "Perfect for",
    avisaremos: "✓ We'll email you if a place opens up.", avisame: "Notify me if a place opens up",
    elige: "Choose a session to continue.", titulo: "When does your retreat begin?", etiqueta: "CHOOSE A TIME", unicoDia: "one day only",
    sois: (n) => (n === 1 ? "It's just you." : `There are ${n} of you.`), podeis: "You can open an empty room or join a group with space.",
    mostramos: "Here are the groups still forming that have space for you.", editar: "Edit",
    soloMostrando: "Showing Erasmus sessions only.", verTodos: "See all sessions", cargando: "Loading sessions…", disponibles: "Available sessions",
    primeros: "You're the first in this session! Name your team (optional)", ejemplo: "E.g.: The Daughters of the Solstice", continuar: "Continue and confirm →",
    filtros: "Filter sessions", fTodos: "All", fHueco: "With space for you", fErasmus: "Erasmus only",
    ninguno: "No sessions match this filter. Try “All”.", de: "of", libres: "free", elegido: "Chosen session",
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
  const llena = turno.estado === "completo";
  // Turno lleno (o sin hueco para todo el grupo): se puede pedir aviso si se libera una plaza
  const sinHueco = bloqueo && !(libre && total < MIN_SALA_NUEVA);
  const clases = ["sala", escogida && "is-escogida", bloqueo && (libre ? "is-bloqueada" : "is-llena")].filter(Boolean).join(" ");
  const elegir = () => onElegir(turno, bloqueo);
  // De otros grupos no se enseñan los correos: los iconos salen del número de turno
  const iconos = iconosDe(Array.from({ length: turno.ocupadas }, (_, i) => `turno-${turno.id}-${i}`));
  const estado = libre ? "libre" : llena ? "llena" : "formacion";

  // La tarjeta es el «botón» de elegir; el aviso de lista de espera va fuera de ella para poder pulsarlo aunque esté llena
  return (
    <li className="sala-envoltorio" role="none">
      <div className={clases} role="radio" aria-checked={escogida} aria-disabled={bloqueo ? "true" : undefined} tabIndex={0}
        onClick={elegir} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); elegir(); } }}>
        <div className="sala__cabeza">
          <p className="sala__hora">{turno.inicio}<span className="sala__guion">–</span>{turno.fin}</p>
          {bloqueo ? (
            <img className="sala__candado" src="/assets/svg/icono-candado.svg" width="22" height="26" alt={bloqueo} />
          ) : (
            <span className="sala__marca" aria-hidden="true">{escogida && <IconoCheck />}</span>
          )}
        </div>

        <div className="sala__chips">
          <span className={`chip chip--estado chip--${estado}`}>{libre ? t.libre : llena ? t.llena : t.formacion}</span>
          {turno.erasmus && <span className="chip"><img src="/assets/svg/icono-mundo.svg" width="15" height="15" alt="" />{t.soloErasmus}</span>}
        </div>
        {turno.equipo && <p className="sala__nombre">“{turno.equipo}”</p>}

        {/* Las 6 plazas del turno: ocupadas (con icono) y libres (círculo vacío) */}
        <div className="sala__plazas-fila">
          <div className="sala__asientos" aria-hidden="true">
            {Array.from({ length: MAX_PERSONAS }, (_, i) =>
              i < turno.ocupadas ? <img key={i} src={iconos[i]} width="30" height="30" alt="" /> : <span key={i} className="sala__asiento" />
            )}
          </div>
          <p className="sala__plazas">
            {llena ? t.sinPlazas(turno.ocupadas) : <><b>{turno.hueco}</b> {t.de} {MAX_PERSONAS} {t.libres}</>}
          </p>
        </div>
        {!llena && (
          <p className="sala__perfecto">{t.perfecto} {libre ? `${MIN_SALA_NUEVA}-${MAX_PERSONAS}` : turno.hueco === 1 ? "1" : `1-${turno.hueco}`}</p>
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
  // Filtro de arriba: todos, solo los que tienen hueco para el grupo, o solo Erasmus
  const filtro = borrador.soloErasmus ? "erasmus" : borrador.filtro || "todos";
  const cambiarFiltro = (f) => actualizar({ filtro: f, soloErasmus: f === "erasmus" });
  const visibles = (turnos || []).filter((x) =>
    filtro === "erasmus" ? x.erasmus : filtro === "hueco" ? !motivoBloqueo(x, total) : true
  );
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
        <PasoCabecera paso={2} />

        <div className="columna">
          {/* Como en el diseño: primero el título grande y debajo «ELEGIR HORA» */}
          <header className="hora-encabezado">
            <h1 className="titular">{t.titulo}</h1>
            <p className="etiqueta">{t.etiqueta}</p>
          </header>

          {/* Día y tamaño del grupo, en una sola franja */}
          <div className="hora-info">
            <p className="hora-info__dia">
              <img src="/assets/svg/icono-calendario.svg" width="20" height="22" alt="" />
              {evento.fechaTexto} · {t.unicoDia}
            </p>
            <p className="hora-info__grupo">
              <img src="/assets/svg/icono-personas.svg" width="26" height="24" alt="" />
              <span>
                <b>{t.sois(total)}</b> {total >= MIN_SALA_NUEVA ? t.podeis : t.mostramos}{" "}
                <Link href="/reserva/integrantes">{t.editar}</Link>
              </span>
            </p>
          </div>

          {/* Filtros (como pestañas) */}
          <div className="hora-filtros" role="group" aria-label={t.filtros}>
            {[["todos", t.fTodos], ["hueco", t.fHueco], ["erasmus", t.fErasmus]].map(([clave, texto]) => (
              <button key={clave} type="button" aria-pressed={filtro === clave} onClick={() => cambiarFiltro(clave)}>
                {clave === "erasmus" && <img src="/assets/svg/icono-mundo.svg" width="15" height="15" alt="" />}
                {texto}
              </button>
            ))}
          </div>

          {turnos === null && !error && <p className="cargando">{t.cargando}</p>}

          {turnos !== null && visibles.length === 0 && <p className="hora-vacio">{t.ninguno}</p>}

          <ul className="salas" role="radiogroup" aria-label={t.disponibles}>
            {visibles.map((x) => (
              <Sala key={x.id} turno={x} total={total} escogida={escogido?.id === x.id} onElegir={elegir} onEsperar={esperar} />
            ))}
          </ul>

          {escogido?.estado === "libre" && (
            <div className="hora-equipo">
              <img src="/assets/img/icono-lirio.webp" width="50" height="40" alt="" />
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
