// POST /api/cuestionario · { general, ambientacion, dificultad, originalidad, inmersion, duracion, comentario?, idioma? }
// Guarda una respuesta anónima del cuestionario de después de la experiencia (página /cuestionario).
import { db } from "@/lib/db";
import { asegurarEsquema } from "@/lib/esquema";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";

// Cada pregunta y sus valores permitidos: flores de 1 a 5, escalas de 0 a 5
const PREGUNTAS = {
  general: [1, 5],
  ambientacion: [1, 5],
  dificultad: [0, 5],
  originalidad: [1, 5],
  inmersion: [1, 5],
  duracion: [0, 5],
};

export const POST = manejar(async (req) => {
  const datos = await leerJson(req);

  // Todas las preguntas son obligatorias y deben ser un número entero dentro de su escala
  const valores = {};
  for (const [clave, [min, max]] of Object.entries(PREGUNTAS)) {
    const n = Number(datos[clave]);
    if (!Number.isInteger(n) || n < min || n > max) return error("Responde a todas las preguntas, por favor.");
    valores[clave] = n;
  }
  // Comentario libre (la página actual no lo pide; la columna se queda por si se vuelve a usar)
  const comentario = String(datos.comentario || "").trim().slice(0, 1000) || null;
  const idioma = datos.idioma === "en" ? "en" : "es";

  const sql = db();
  await asegurarEsquema(sql);
  await sql`
    insert into cuestionario (general, ambientacion, dificultad, originalidad, inmersion, duracion, comentario, idioma)
    values (${valores.general}, ${valores.ambientacion}, ${valores.dificultad}, ${valores.originalidad},
            ${valores.inmersion}, ${valores.duracion}, ${comentario}, ${idioma})`;
  return ok();
});
