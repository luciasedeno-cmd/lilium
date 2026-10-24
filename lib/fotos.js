// Lilium · Iconos de perfil (carpeta public/assets/img/perfiles): 10 símbolos × 6 colores.
// A cada persona le toca uno «al azar» según su correo: parece aleatorio, pero es siempre
// el mismo para esa persona en todas las páginas. Dentro de un grupo no se repiten ni el símbolo ni el color.

const SIMBOLOS = ["flor-explosion", "lirios", "flor-mariposa", "flor-mariposa-grande", "agua", "eter", "fuego", "tierra", "aire", "lilith"];
const COLORES = 6; // cada símbolo tiene las versiones 1 a 6 (un color cada una)

/** Convierte un texto (el correo) en un número que siempre es el mismo para ese texto */
function numeroDe(texto) {
  let n = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    n ^= texto.charCodeAt(i);
    n = Math.imul(n, 16777619);
  }
  // Mezcla final para que textos casi iguales den números muy distintos
  n ^= n >>> 16;
  n = Math.imul(n, 2246822507);
  n ^= n >>> 13;
  n = Math.imul(n, 3266489909);
  n ^= n >>> 16;
  return n >>> 0; // número positivo
}

/**
 * Iconos para una lista de personas (en el mismo orden).
 * `claves` son sus correos; si no se conocen (turnos de otros grupos), cualquier texto fijo.
 */
export function iconosDe(claves) {
  const usados = new Set(); // símbolos ya repartidos en el grupo
  const coloresUsados = new Set();
  return claves.map((clave) => {
    const n = numeroDe(String(clave || "").toLowerCase());
    let simbolo = n % SIMBOLOS.length;
    // Si ese símbolo ya lo tiene alguien del grupo, se pasa al siguiente libre
    while (usados.has(simbolo) && usados.size < SIMBOLOS.length) simbolo = (simbolo + 1) % SIMBOLOS.length;
    usados.add(simbolo);
    let color = Math.floor(n / SIMBOLOS.length) % COLORES;
    while (coloresUsados.has(color) && coloresUsados.size < COLORES) color = (color + 1) % COLORES;
    coloresUsados.add(color);
    return `/assets/img/perfiles/${SIMBOLOS[simbolo]}-${color + 1}.svg`;
  });
}
