// Lilium · Parámetros del evento y de las reservas (editables)

export const EVENTO = {
  // Día del escape room (un único día)
  fecha: "2026-11-06",
  fechaTexto: "Viernes, 6 de noviembre",
  lugar: "Calle Trinidad, 4, Centro, 18001 Granada",
  // Así se escribe la fecha en los correos (como en el diseño del correo de recordatorio)
  fechaCorreo: "viernes, 6 de noviembre de 2026",
  // Los mismos datos en inglés (cuando la web está en EN)
  en: { fechaTexto: "Friday, 6 November", lugar: "Calle Trinidad, 4, Centro, 18001 Granada" },
};

/** Día y lugar del evento en el idioma de la web */
export const eventoEn = (idioma) => (idioma === "en" ? EVENTO.en : EVENTO);

// Apertura de las reservas: hasta entonces la portada muestra la cuenta atrás
export const APERTURA = new Date("2026-10-30T00:00:00+01:00");

export const MIN_SALA_NUEVA = 3;
export const MAX_PERSONAS = 6;
export const HORAS_CONFIRMACION = 48;
export const HORAS_RECORDATORIO = 12; // aviso cuando quedan estas horas del plazo

export const DOMINIO = "alumnado.esada.es";
export const CORREO_VALIDO = /^[a-z0-9._-]+@alumnado\.esada\.es$/i;

export const CONTACTO = "lilium@esada.es";

// Página del equipo (botón «Admin» de la cuenta atrás): con este correo y la contraseña de Vercel
// (ADMIN_CLAVE) se recibe la «llave de pruebas» para ver y probar la web antes de la apertura.
export const ADMIN_CORREO = "lilium@esada.es";

/**
 * Otros correos que pueden entrar al panel del equipo SIN contraseña (con un código que les llega por correo).
 * Se ponen en Vercel, en la variable ADMIN_CORREOS, separados por comas (no hace falta tocar el código).
 * Solo se puede usar en el servidor.
 */
export function esCorreoAdmin(correo) {
  const lista = String(process.env.ADMIN_CORREOS || "").split(",").map(normalizarCorreo).filter(Boolean);
  return Boolean(correo) && lista.includes(normalizarCorreo(correo));
}

// Correos que pueden entrar y reservar antes de la apertura, para probar la web.
// Se pueden añadir más sin tocar el código con la variable CORREOS_PRUEBA (separados por comas).
const CORREOS_PRUEBA = [
  "luciasedeno@alumnado.esada.es",
  "nataliapeinado@alumnado.esada.es",
  "mariaortiz@alumnado.esada.es",
];

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
