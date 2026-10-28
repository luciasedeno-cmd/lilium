// Lilium · Cuentas sobre los turnos que se pueden hacer en el navegador (sin base de datos).
import { MIN_SALA_NUEVA, MAX_PERSONAS } from "./config";

/** «libre» (nadie), «formacion» (con gente y hueco) o «completo» */
export function estadoTurno(ocupadas) {
  if (ocupadas === 0) return "libre";
  if (ocupadas >= MAX_PERSONAS) return "completo";
  return "formacion";
}

/** ¿Cabe un grupo de n personas en este turno? (sala vacía: hacen falta al menos 3) */
export function cabe(turno, n) {
  if (turno.ocupadas === 0) return n >= MIN_SALA_NUEVA && n <= MAX_PERSONAS;
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
export function turnoCercano(turnos, perdido, n) {
  const opciones = turnos.filter((x) => x.id !== perdido.id && cabe(x, n));
  const mismoTipo = opciones.filter((x) => Boolean(x.erasmus) === Boolean(perdido.erasmus));
  const lista = mismoTipo.length ? mismoTipo : opciones;
  const distancia = (x) => Math.abs(minutos(x.inicio) - minutos(perdido.inicio));
  return [...lista].sort((a, b) => distancia(a) - distancia(b) || minutos(a.inicio) - minutos(b.inicio))[0] || null;
}
