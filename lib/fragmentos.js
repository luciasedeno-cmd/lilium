// Lilium · Fragmentos de la frase secreta que aparecen al final de cada entrada.
// Juntos forman: «Dos rostros, un espíritu: elegid bien.»
// Cada palabra lleva su número romano para que el grupo pueda ordenarlas.
export const FRAGMENTOS = [
  { numero: "I", palabra: "DOS" },
  { numero: "II", palabra: "ROSTROS" },
  { numero: "III", palabra: "UN" },
  { numero: "IV", palabra: "ESPÍRITU" },
  { numero: "V", palabra: "ELEGID" },
  { numero: "VI", palabra: "BIEN" },
];

// Mezcla las 6 palabras siempre igual para una misma sala (así el reparto es al azar,
// pero no cambia cada vez que alguien mira su entrada)
function mezclar(semilla) {
  const orden = FRAGMENTOS.map((_, i) => i);
  let x = (Number(semilla) * 2654435761) % 4294967296 || 1;
  for (let i = orden.length - 1; i > 0; i--) {
    x = (x * 1103515245 + 12345) % 2147483648;
    const j = x % (i + 1);
    [orden[i], orden[j]] = [orden[j], orden[i]];
  }
  return orden;
}

/**
 * Reparte las 6 palabras entre las personas de una sala.
 * Con 6 personas, una palabra cada una; con menos, a algunas les tocan dos,
 * para que entre todas siempre esté la frase completa.
 * @param turnoId  la sala (turno)
 * @param personas correos de la sala, en el orden en que entraron
 * @returns { correo: [fragmentos] }
 */
export function repartirFragmentos(turnoId, personas) {
  const reparto = Object.fromEntries(personas.map((p) => [p, []]));
  if (!personas.length) return reparto;
  mezclar(turnoId).forEach((indice, k) => reparto[personas[k % personas.length]].push(FRAGMENTOS[indice]));
  // Cada persona ve sus palabras en orden (I, II, III…)
  for (const p of personas) reparto[p].sort((a, b) => FRAGMENTOS.indexOf(a) - FRAGMENTOS.indexOf(b));
  return reparto;
}
