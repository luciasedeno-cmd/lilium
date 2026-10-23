// Lilium · Parámetros del evento y de las reservas (editables)

export const EVENTO = {
  // Día del escape room (un único día)
  fecha: "2026-11-20",
  fechaTexto: "Viernes, 20 de noviembre",
  lugar: "ESADA · Sala polivalente (planta baja)",
};

// Apertura de las reservas: hasta entonces la portada muestra la cuenta atrás
export const APERTURA = new Date("2026-10-30T00:00:00+01:00");

export const MIN_SALA_NUEVA = 3;
export const MAX_PERSONAS = 6;
export const HORAS_CONFIRMACION = 48;
export const HORAS_RECORDATORIO = 12; // aviso cuando quedan estas horas del plazo

export const DOMINIO = "alumnado.esada.es";
export const CORREO_VALIDO = /^[a-z0-9._-]+@alumnado\.esada\.es$/i;

export const CONTACTO = "lilium@esada.es";

// Correos que pueden entrar y reservar antes de la apertura, para probar la web.
// Se pueden añadir más sin tocar el código con la variable CORREOS_PRUEBA (separados por comas).
const CORREOS_PRUEBA = ["luciasedeno@alumnado.esada.es"];

export function normalizarCorreo(correo) {
  return String(correo || "").trim().toLowerCase();
}

function esCorreoDePrueba(correo) {
  const extra = String(process.env.CORREOS_PRUEBA || "").split(",").map(normalizarCorreo).filter(Boolean);
  return [...CORREOS_PRUEBA, ...extra].includes(normalizarCorreo(correo));
}

/**
 * Antes de la apertura solo pueden reservar los correos de prueba,
 * o cualquiera si se activa PERMITIR_ANTES_DE_APERTURA.
 */
export function reservasAbiertas(correo) {
  return (
    Date.now() >= APERTURA.getTime() ||
    process.env.PERMITIR_ANTES_DE_APERTURA === "true" ||
    (correo !== undefined && esCorreoDePrueba(correo))
  );
}
