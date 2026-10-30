// POST /api/cuestionario · { general, ambientacion, dificultad, originalidad, inmersion, duracion, turno, origen, token? | email?, idioma? }
// Guarda una respuesta del cuestionario de después de la experiencia (página /cuestionario).
// Las respuestas se guardan SIN el correo (son anónimas). Aparte, solo se apunta QUE esa persona ha
// respondido (miembros.valorado_en), para el panel del equipo y para no mandarle el correo «¿nos valoras?».
// Se la reconoce por su enlace personal del correo (token) o por el correo de ESADA que escribe.
import { db } from "@/lib/db";
import { asegurarEsquema } from "@/lib/esquema";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";
import { marcarValorado, turnosCuestionario } from "@/lib/retiro";
import { CORREO_VALIDO, DOMINIO, ORIGENES, normalizarCorreo } from "@/lib/config";

// Cada pregunta y sus valores permitidos: flores de 1 a 5, escalas de 1 a 5 (antes de 0 a 5)
const PREGUNTAS = {
  general: [1, 5],
  ambientacion: [1, 5],
  dificultad: [1, 5],
  originalidad: [1, 5],
  inmersion: [1, 5],
  duracion: [1, 5],
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
  // Notas: comentario libre y opcional de la última tarjeta («¿Quieres contarnos algo más?»)
  const comentario = String(datos.comentario || "").trim().slice(0, 1000) || null;
  const idioma = datos.idioma === "en" ? "en" : "es";
  // ¿Quién responde? Con el enlace del correo ya se sabe; si no, hace falta su correo de ESADA
  const token = typeof datos.token === "string" && datos.token.length > 10 ? datos.token : null;
  const email = token ? null : normalizarCorreo(datos.email);
  if (!token && !CORREO_VALIDO.test(email || "")) return error(`Escribe tu correo de ESADA (nombreapellido@${DOMINIO} o, si eres profesorado, nombre@esada.es).`);

  // Cómo se enteró de Lilium: una de las opciones de la lista
  const origen = ORIGENES.includes(datos.origen) ? datos.origen : null;
  if (!origen) return error("Responde a todas las preguntas, por favor.");
  // En qué turno estuvo: tiene que ser uno de los turnos del día (si no hay turnos, la pregunta no sale)
  const { turnos } = await turnosCuestionario(null);
  const turno = turnos.some((t) => t.etiqueta === datos.turno) ? datos.turno : null;
  if (turnos.length > 0 && !turno) return error("Responde a todas las preguntas, por favor.");

  const sql = db();
  await asegurarEsquema(sql);
  await sql`
    insert into cuestionario (general, ambientacion, dificultad, originalidad, inmersion, duracion, comentario, idioma, turno, origen)
    values (${valores.general}, ${valores.ambientacion}, ${valores.dificultad}, ${valores.originalidad},
            ${valores.inmersion}, ${valores.duracion}, ${comentario}, ${idioma}, ${turno}, ${origen})`;
  await marcarValorado({ token, email });
  return ok();
});
