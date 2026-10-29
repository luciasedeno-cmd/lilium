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
// 30 de octubre a las 12:00 (hora de España; ese día ya es horario de invierno, +01:00).
// A esa hora la web se abre sola: la cuenta atrás pasa a la página de acceso y desaparece la «puerta».
export const APERTURA = new Date("2026-10-30T12:00:00+01:00");

export const MIN_SALA_NUEVA = 3;
export const MAX_PERSONAS = 6;
// Turnos quitados (por su hora de inicio). Se borran solos de la base de datos si nadie ha reservado en
// ellos; si alguien ya tenía plaza, el turno se queda para esa gente pero ya no se ofrece a nadie más.
export const TURNOS_QUITADOS = ["9:00"];
export const HORAS_CONFIRMACION = 48;
// Recordatorio «confirma tu plaza antes de perderla»: el día antes de que caduque. La revisión de Vercel
// pasa una vez al día, así que se avisa cuando quedan 36 h o menos: a cada persona le toca en la pasada
// en que le quedan entre 12 y 36 h (siempre tiene, como poco, medio día para confirmar).
export const HORAS_RECORDATORIO = 36;

export const DOMINIO = "alumnado.esada.es";
// Correos de ESADA que pueden entrar: alumnado (@alumnado.esada.es) y profesorado (@esada.es)
export const CORREO_VALIDO = /^[a-z0-9._-]+@(alumnado\.)?esada\.es$/i;

// ---------- Profesorado ----------
// Quien entra con un correo @esada.es es profesorado (menos la cuenta del equipo, lilium@esada.es).
// En cada sala hay 1 plaza guardada para profesorado hasta LIBERA_PLAZA_PROFE; si para entonces no la ha
// cogido ningún profesor, se libera para el alumnado. El profesorado reserva solo su propia plaza y puede
// abrir una sala vacía él solo (sin el mínimo de 3). Las cuentas están en lib/turnos.js (huecoPara).
export const DOMINIO_PROFESORADO = "esada.es";
export const LIBERA_PLAZA_PROFE = new Date("2026-11-02T12:00:00+01:00"); // lunes 2 de noviembre, 12:00

/** ¿Es un correo de profesorado? (@esada.es, sin contar la cuenta del equipo) */
export function esProfesorado(correo) {
  const c = normalizarCorreo(correo);
  return /^[a-z0-9._-]+@esada\.es$/.test(c) && c !== ADMIN_CORREO;
}

/** ¿Sigue guardada la plaza del profesorado en las salas? (hasta el 2 de noviembre a las 12:00) */
export function plazaProfeGuardada(ahora = Date.now()) {
  return ahora < LIBERA_PLAZA_PROFE.getTime();
}

/** Respuestas de «¿Cómo te enteraste de Lilium?» en el cuestionario (los textos están en cada página) */
export const ORIGENES = ["instagram", "amigas", "carteles", "correo", "otro"];

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

/**
 * ¿Puede este correo entrar y reservar? Los del alumnado y el profesorado de ESADA y, como excepción, los de la lista
 * ADMIN_CORREOS de Vercel (por ejemplo, el profesor, aunque su correo no sea @alumnado.esada.es).
 * Solo se puede usar en el servidor (el navegador no ve la lista).
 */
export function correoPermitido(correo) {
  return CORREO_VALIDO.test(normalizarCorreo(correo)) || esCorreoAdmin(correo);
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
