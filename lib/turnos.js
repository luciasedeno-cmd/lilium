// Lilium · Cuentas sobre los turnos que se pueden hacer en el navegador (sin base de datos).
import { MIN_SALA_NUEVA, MAX_PERSONAS, plazaProfeGuardada } from "./config";

/** «libre» (nadie), «formacion» (con gente y hueco) o «completo» */
export function estadoTurno(ocupadas) {
  if (ocupadas === 0) return "libre";
  if (ocupadas >= MAX_PERSONAS) return "completo";
  return "formacion";
}

/**
 * Plazas libres de un turno PARA QUIEN MIRA (alumnado o profesorado).
 * `turno.ocupadas` = personas apuntadas; `turno.profe` = ya hay alguien del profesorado en la sala.
 * Mientras la plaza del profesorado siga guardada (hasta el 2 de noviembre a las 12:00) y nadie del
 * profesorado la haya cogido, el alumnado solo puede llenar 5 de las 6 plazas, y el profesorado
 * solo puede coger esa plaza (si ya hay un profesor en la sala, no queda otra para profesorado).
 */
export function huecoPara(turno, profesorado, ahora = Date.now()) {
  const libres = Math.max(0, MAX_PERSONAS - turno.ocupadas);
  if (!plazaProfeGuardada(ahora)) return libres; // ya liberada: todas las plazas para cualquiera
  if (profesorado) return turno.profe ? 0 : Math.min(1, libres);
  return turno.profe ? libres : Math.max(0, libres - 1);
}

/** ¿Está guardada ahora mismo la plaza del profesorado en este turno? (para enseñarlo en la tarjeta) */
export function plazaProfeEnTurno(turno, ahora = Date.now()) {
  return plazaProfeGuardada(ahora) && !turno.profe && turno.ocupadas < MAX_PERSONAS;
}

/**
 * ¿Cabe un grupo de n personas en este turno? (`turno.hueco` ya es el de quien mira)
 * Sala vacía: el alumnado necesita al menos 3; el profesorado puede abrirla solo.
 */
export function cabe(turno, n, profesorado = false) {
  if (turno.ocupadas === 0 && !profesorado) return n >= MIN_SALA_NUEVA && n <= turno.hueco;
  return turno.hueco >= n;
}

/** «11:30» → 690 (minutos desde medianoche) */
const minutos = (hora) => {
  const [h, m] = String(hora).split(":").map(Number);
  return h * 60 + (m || 0);
};

/**
 * El turno con sitio para el grupo más cercano en el tiempo al que se ha perdido.
 * Se prefiere uno del mismo tipo (Erasmus o no); si no hay, cualquiera. Si empatan, el más temprano.
 * Devuelve null si no queda ninguno.
 */
export function turnoCercano(turnos, perdido, n, profesorado = false) {
  const opciones = turnos.filter((x) => x.id !== perdido.id && cabe(x, n, profesorado));
  const mismoTipo = opciones.filter((x) => Boolean(x.erasmus) === Boolean(perdido.erasmus));
  const lista = mismoTipo.length ? mismoTipo : opciones;
  const distancia = (x) => Math.abs(minutos(x.inicio) - minutos(perdido.inicio));
  return [...lista].sort((a, b) => distancia(a) - distancia(b) || minutos(a.inicio) - minutos(b.inicio))[0] || null;
}
