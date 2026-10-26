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
 * UNA PALABRA POR PERSONA, y siempre la misma.
 * Cada sala tiene su orden de reparto (al azar, pero fijo para esa sala). La primera persona que entra
 * se queda con la primera palabra de ese orden, la segunda con la segunda… hasta 6 (las 6 palabras).
 * Quien ya tiene palabra la conserva aunque entre o salga gente; si alguien se va, su palabra queda
 * libre para la siguiente persona que entre.
 * @param turnoId  la sala (turno)
 * @param personas [{ email, fragmento }] en el orden en que entraron (fragmento = 0-5 o null si aún no tiene)
 * @returns { correo: número de palabra (0-5) } — con todas las personas de la sala
 */
export function asignarFragmentos(turnoId, personas) {
  const orden = mezclar(turnoId);
  const asignado = {};
  const usados = new Set();
  // 1) Se respetan las palabras que ya tenía cada cual (si dos tuvieran la misma, se la queda la que entró antes)
  for (const p of personas) {
    const f = p.fragmento;
    if (Number.isInteger(f) && f >= 0 && f < FRAGMENTOS.length && !usados.has(f)) {
      asignado[p.email] = f;
      usados.add(f);
    }
  }
  // 2) Quien no tiene palabra recibe la siguiente libre del orden de la sala
  for (const p of personas) {
    if (p.email in asignado) continue;
    const libre = orden.find((i) => !usados.has(i));
    if (libre === undefined) break; // ya están las 6 repartidas (no debería pasar: máximo 6 por sala)
    asignado[p.email] = libre;
    usados.add(libre);
  }
  return asignado;
}

/** Palabras de una sala que todavía no tiene nadie (con menos de 6 personas) */
export function fragmentosLibres(usados) {
  const tienen = new Set(usados);
  return FRAGMENTOS.filter((_, i) => !tienen.has(i));
}
