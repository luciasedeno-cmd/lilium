// Lilium · Nombres al azar para el equipo (si nadie le pone nombre a la sala).
// Se juntan dos trozos: «La Orden» + «del Lirio Dormido» → «La Orden del Lirio Dormido».
// Sin palabras de un solo género (reserva gente de cualquier género) y sin «ritual».
const PARTES = {
  es: {
    inicio: ["La Hermandad", "El Círculo", "La Orden", "El Clan", "La Logia", "La Estirpe", "El Coro", "La Guardia"],
    final: [
      "del Lirio Dormido", "de la Luna Llena", "del Prado Eterno", "de los Dos Rostros", "del Solsticio",
      "de la Rosa Velada", "del Bosque en Calma", "de la Niebla", "del Espejo Roto", "de la Última Flor",
      "de las Siete Lunas", "del Jardín Secreto", "del Ojo que Todo lo Ve", "de la Mariposa Blanca",
    ],
  },
  en: {
    inicio: ["The Circle", "The Order", "The Clan", "The Lodge", "The Lineage", "The Choir", "The Guard", "The Keepers"],
    final: [
      "of the Sleeping Lily", "of the Full Moon", "of the Endless Meadow", "of the Two Faces", "of the Solstice",
      "of the Veiled Rose", "of the Quiet Forest", "of the Mist", "of the Broken Mirror", "of the Last Flower",
      "of the Seven Moons", "of the Secret Garden", "of the All-Seeing Eye", "of the White Butterfly",
    ],
  },
};

const alAzar = (lista) => lista[Math.floor(Math.random() * lista.length)];

/** Un nombre de equipo al azar (en español o en inglés). Si se pasa `distintoDe`, no lo repite. */
export function nombreAlAzar(idioma = "es", distintoDe = "") {
  const p = PARTES[idioma === "en" ? "en" : "es"];
  let nombre;
  do nombre = `${alAzar(p.inicio)} ${alAzar(p.final)}`;
  while (nombre === distintoDe);
  return nombre;
}
