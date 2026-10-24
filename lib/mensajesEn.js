// Lilium · Traducción al inglés de los mensajes que manda el servidor (errores y avisos).
// El servidor siempre responde en español; si la web está en inglés, se traducen aquí antes de enseñarlos.
// Para añadir uno: [/texto en español/, "texto en inglés"] ($1, $2… son las partes que cambian, como un correo).
const MENSAJES = [
  [/^Código incorrecto\. Revísalo o pide uno nuevo\.$/, "Wrong code. Check it or ask for a new one."],
  [/^Demasiados intentos\. Pide un código nuevo\.$/, "Too many attempts. Ask for a new code."],
  [/^El código ha caducado\. Pide uno nuevo\.$/, "The code has expired. Ask for a new one."],
  [/^Pide primero un código\.$/, "Ask for a code first."],
  [/^Espera (\d+) s para pedir otro código\.$/, "Wait $1 s before asking for another code."],
  [/^Usa tu correo institucional: (.+)$/, "Use your university email: $1"],
  [/^No hemos podido enviar el correo con el código\..*$/, "We couldn't send the email with the code. Try again in a minute."],
  [/^Las reservas abren el 30 de octubre\.$/, "Bookings open on 30 October."],
  [/^La web abre el 30 de octubre\.$/, "The website opens on 30 October."],
  [/^Tu sesión ha caducado\. Vuelve a entrar con tu correo\.$/, "Your session has expired. Sign in again with your email."],
  [/^Entra con tu correo para ver tu reserva\.$/, "Sign in with your email to see your booking."],
  [/^No tienes ninguna reserva\.$/, "You don't have a booking."],
  [/^Datos no válidos\.$/, "Invalid data."],
  [/^Responde a todas las preguntas, por favor\.$/, "Please answer all the questions."],
  [/^Ese turno no existe\.$/, "That session doesn't exist."],
  [/^Ese turno ya no tiene hueco\.$/, "That session has no space left."],
  [/^Ya estás en ese turno\.$/, "You're already in that session."],
  [/^Hay correos repetidos en el grupo\.$/, "There are repeated emails in the group."],
  [/^Máximo (\d+) personas por turno\.$/, "Maximum $1 people per session."],
  [/^Necesitáis al menos (\d+) personas para abrir una sala libre\.$/, "You need at least $1 people to open a free room."],
  [/^En ese turno ya no queda hueco para todo el grupo\. Elige otro\.$/, "There's no longer room for the whole group in that session. Choose another."],
  [/^(\S+) no es un correo válido \((.+)\)\.$/, "$1 is not a valid email ($2)."],
  [/^(\S+) ya está en otra reserva\. Cada correo solo puede estar en una\.$/, "$1 is already in another booking. Each email can only be in one."],
  [/^(\S+) no está en tu grupo\.$/, "$1 is not in your group."],
  [/^(\S+) ya está en tu grupo\.$/, "$1 is already in your group."],
  [/^En vuestro turno solo caben (\d+) personas: podéis añadir (\d+) como mucho\.$/, "Only $1 people fit in your session: you can add $2 at most."],
  [/^Solo la persona líder puede cambiar el grupo\.$/, "Only the leader can change the group."],
  [/^Solo la persona líder puede cancelar la reserva del grupo\.$/, "Only the leader can cancel the group's booking."],
  [/^No puedes quitarte a ti: usa «Cancelar solo mi asistencia»\.$/, "You can't remove yourself: use “Cancel only my attendance”."],
  [/^Para reservar tienes que aceptar los Términos y Condiciones\.$/, "To book you must accept the Terms and Conditions."],
  [/^Para confirmar tu plaza tienes que aceptar los Términos y Condiciones\.$/, "To confirm your place you must accept the Terms and Conditions."],
  [/^Este enlace ya no es válido.*$/, "This link is no longer valid: the 48-hour deadline may have ended or the booking may have been cancelled."],
  [/^Correo o contraseña incorrectos\.$/, "Wrong email or password."],
  [/^Demasiados intentos\. Espera 15 minutos y vuelve a probar\.$/, "Too many attempts. Wait 15 minutes and try again."],
  [/^No se puede conectar con la base de datos.*$/, "We can't reach the database right now. Try again in a moment."],
  [/^Algo ha fallado en el servidor.*$/, "Something went wrong on the server. Try again in a few minutes."],
  [/^El servidor ha respondido con un error \((\d+)\)\..*$/, "The server replied with an error ($1). Try again in a few minutes."],
  [/^El servidor está tardando demasiado\..*$/, "The server is taking too long. Reload the page."],
  [/^No hay conexión\..*$/, "No connection. Check your internet and try again."],
];

export function traducirMensaje(mensaje) {
  if (!mensaje) return mensaje;
  for (const [patron, ingles] of MENSAJES) {
    if (patron.test(mensaje)) return mensaje.replace(patron, ingles);
  }
  return mensaje; // si no está en la lista, se deja en español
}
