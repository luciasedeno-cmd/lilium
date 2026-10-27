// Lilium · Envío de correos con Gmail (contraseña de aplicación) mediante Nodemailer
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import { EVENTO, CONTACTO, HORAS_CONFIRMACION } from "./config";

let transporte = null;

function configurado() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function obtenerTransporte() {
  if (!transporte) {
    transporte = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      // Si Gmail tarda, mejor avisar que dejar la página esperando
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
    });
  }
  return transporte;
}

/** URL pública de la web, para los enlaces de los correos. */
export function urlSitio() {
  if (process.env.SITIO_URL) return process.env.SITIO_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

/**
 * Envía un correo. Sin credenciales de Gmail, en desarrollo se muestra en la consola
 * y en producción se lanza un error.
 */
export async function enviar({ para, asunto, html, adjuntos = [] }) {
  if (!configurado()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Faltan GMAIL_USER y GMAIL_APP_PASSWORD para enviar correos.");
    }
    console.log(`\n[correo simulado] Para: ${para}\nAsunto: ${asunto}\n${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}\n`);
    // Para ver cómo queda: con CORREOS_CARPETA, cada correo simulado se guarda también como página .html
    if (process.env.CORREOS_CARPETA) {
      const { writeFileSync } = await import("node:fs");
      writeFileSync(`${process.env.CORREOS_CARPETA}/${Date.now()}-${para.split("@")[0]}.html`, html);
    }
    return;
  }
  await obtenerTransporte().sendMail({
    from: `"Lilium · Escape Room ESADA" <${process.env.GMAIL_USER}>`,
    replyTo: CONTACTO,
    to: para,
    subject: asunto,
    html,
    attachments: adjuntos,
  });
}

/* ---------- Plantillas ---------- */
// Todos los correos tienen la estética del correo de recordatorio del equipo: fondo verde con lirios
// en relieve, tarjeta blanca redondeada, el lirio arriba, el texto centrado en letra Baskerville,
// un pequeño adorno y la firma «Lilium» abajo. Las imágenes están en public/assets/correo.
// (Los programas de correo no entienden CSS moderno: por eso todo va con tablas y estilos dentro de cada etiqueta.)

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const LETRA = "Baskerville,'Baskervville','Libre Baskerville',Georgia,'Times New Roman',serif";
const TINTA = "#1d1d1b";
const parrafo = (html) => `<p style="margin:0 0 26px;font-family:${LETRA};font-size:19px;line-height:1.45;color:${TINTA}">${html}</p>`;

/**
 * Estructura común de todos los correos.
 * @param resumen  texto que se ve junto al asunto en la bandeja de entrada (no aparece dentro del correo)
 * @param cuerpo   el contenido (párrafos, datos de la sesión, botón…)
 */
function plantilla(resumen, cuerpo) {
  const img = `${urlSitio()}/assets/correo`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:#292f20">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(resumen)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" background="${img}/fondo.jpg" style="background:#292f20 url('${img}/fondo.jpg') center top / cover repeat">
    <tr><td align="center" style="padding:48px 14px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:36px">
        <tr><td align="center" style="padding:44px 34px 40px;text-align:center">
          <img src="${img}/lirio.png" width="80" height="63" alt="" style="display:block;margin:0 auto 34px;border:0">
          ${cuerpo}
          <img src="${img}/adorno.png" width="22" height="22" alt="" style="display:block;margin:8px auto 26px;border:0">
          <img src="${img}/logo.png" width="200" height="119" alt="Lilium" style="display:block;margin:0 auto;border:0">
        </td></tr>
      </table>
      <p style="margin:20px 0 0;font-family:${LETRA};font-size:13px;color:#e8e4d6">¿Dudas? Escríbenos a <a href="mailto:${CONTACTO}" style="color:#ffffff">${CONTACTO}</a></p>
    </td></tr>
  </table>
</body></html>`;
}

/** Botón (verde oscuro, como el fondo del correo) */
const boton = (texto, href) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:4px auto 30px"><tr><td style="background:#292f20;border-radius:999px">
    <a href="${href}" style="display:inline-block;padding:15px 34px;font-family:${LETRA};font-size:18px;color:#ffffff;text-decoration:none;border-radius:999px">${texto}</a>
  </td></tr></table>`;

/** «Esta es tu sesión agendada»: fecha, hora, lugar (y equipo), una línea por dato, como en el diseño */
const datosTurno = (turno, equipo) => parrafo(
  `Fecha: ${EVENTO.fechaCorreo}.<br>Hora: ${esc(turno.inicio)}–${esc(turno.fin)}.<br>Lugar: ${EVENTO.lugar}, ESADA.` +
  (equipo ? `<br>Equipo: ${esc(equipo)}.` : "")
);

const fechaHora = (d) =>
  new Date(d).toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

export function correoCodigo(para, codigo) {
  return enviar({
    para,
    asunto: `Tu código de acceso a Lilium: ${codigo}`,
    html: plantilla(`Tu código es ${codigo}`, `
      ${parrafo("Hola.")}
      ${parrafo("Antes de adentrarte al retiro, necesitamos saber que eres tú. Este es tu código de acceso:")}
      <p style="margin:0 0 26px;font-family:${LETRA};font-size:42px;letter-spacing:.3em;color:${TINTA}">${codigo}</p>
      ${parrafo("Caduca en 10 minutos. Si no lo has pedido tú, puedes ignorar este correo.")}
      ${parrafo("Respira. Te esperamos.")}`),
  });
}

/** Código para entrar al panel del equipo (/admin), con un asunto distinto para no confundirlo con el de reservar */
export function correoCodigoAdmin(para, codigo) {
  return enviar({
    para,
    asunto: `Código para el panel del equipo de Lilium: ${codigo}`,
    html: plantilla(`Tu código para el panel es ${codigo}`, `
      ${parrafo("Hola.")}
      ${parrafo("Este es tu código para entrar al <b>panel del equipo</b> (lilium.esada.es/admin):")}
      <p style="margin:0 0 26px;font-family:${LETRA};font-size:42px;letter-spacing:.3em;color:${TINTA}">${codigo}</p>
      ${parrafo("Caduca en 10 minutos. Si no lo has pedido tú, puedes ignorar este correo.")}`),
  });
}

export function correoInvitacion({ para, lider, turno, equipo, enlace, limite }) {
  return enviar({
    para,
    asunto: `${lider} te ha invitado a Lilium. Confirma tu plaza`,
    html: plantilla("Te esperan en el prado. Confirma tu plaza.", `
      ${parrafo("Hola.")}
      ${parrafo(`<b>${esc(lider)}</b> te ha invitado a formar parte de su grupo para vivir Lilium: un tiempo para ti, para desconectar del estrés y abrirte a nuevas experiencias.`)}
      ${parrafo("Esta es la sesión que os espera:")}
      ${datosTurno(turno, equipo)}
      ${parrafo(`Tienes <b>${HORAS_CONFIRMACION} horas</b> para confirmar tu plaza (hasta el ${fechaHora(limite)}). Si no lo haces, la perderás.`)}
      ${boton("Confirmar mi asistencia", enlace)}
      ${parrafo("Nos vemos muy pronto.")}`),
  });
}

/** Aviso de que se acaba el plazo de 48 h para confirmar */
export function correoRecordatorio({ para, turno, equipo, enlace, limite }) {
  return enviar({
    para,
    asunto: "Te quedan pocas horas para confirmar tu plaza en Lilium",
    html: plantilla("Tu plaza en Lilium sigue esperándote.", `
      ${parrafo("Hola.")}
      ${parrafo(`Tu grupo te espera, pero aún no has confirmado tu plaza. El plazo acaba el <b>${fechaHora(limite)}</b>.`)}
      ${datosTurno(turno, equipo)}
      ${boton("Confirmar mi asistencia", enlace)}
      ${parrafo("Si no confirmas a tiempo, la plaza quedará libre para otra persona.")}`),
  });
}

/** Bloque del fragmento secreto (palabras con su número romano) */
function bloqueFragmentos(fragmentos = []) {
  if (!fragmentos.length) return "";
  const palabras = fragmentos
    .map((f) => `<span style="display:inline-block;margin:0 10px;white-space:nowrap"><sup style="font-size:13px;letter-spacing:.05em">${f.numero}</sup>&nbsp;<span style="font-size:28px;letter-spacing:.12em">${esc(f.palabra)}</span></span>`)
    .join("");
  return `
    <div style="margin:0 0 26px;padding:22px 0 0;border-top:1px solid #d9d4c7;font-family:${LETRA};color:${TINTA}">
      <p style="margin:0 0 10px;font-size:13px;letter-spacing:.14em;text-transform:uppercase">Tu fragmento secreto</p>
      <p style="margin:0">${palabras}</p>
      <p style="margin:14px 0 0;font-size:15px;line-height:1.45;color:#4c4b44">Cada persona de vuestra sala tiene una palabra distinta de una frase de seis (I a VI). Es solo tuya y no cambia. Juntadlas en orden con vuestro grupo y decidle a la guía lo que habéis descubierto.</p>
    </div>`;
}

/** Entrada digital con QR (al confirmar, o al líder al crear la reserva). Al final, su fragmento secreto. */
export async function correoEntrada({ para, turno, equipo, enlaceEntrada, enlaceReserva, fragmentos = [] }) {
  const qr = await QRCode.toBuffer(enlaceEntrada, { width: 360, margin: 1, color: { dark: "#1d1d1b", light: "#ffffff" } });
  return enviar({
    para,
    asunto: "Tu entrada para Lilium",
    html: plantilla("Tu plaza está confirmada. Aquí tienes tu entrada.", `
      ${parrafo("Hola.")}
      ${parrafo("Tu plaza está confirmada. Enseña este código en la puerta:")}
      <img src="cid:qr-entrada" width="200" height="200" alt="QR de tu entrada" style="display:block;margin:0 auto 26px;border:0">
      ${parrafo("Esta es tu sesión agendada:")}
      ${datosTurno(turno, equipo)}
      ${parrafo("Recomendamos llegar unos 10-15 minutos antes y acudir con la mente abierta y disposición para participar.")}
      ${boton("Ver mi reserva", enlaceReserva)}
      ${bloqueFragmentos(fragmentos)}
      ${parrafo("Nos vemos muy pronto.")}`),
    adjuntos: [{ filename: "entrada-lilium.png", content: qr, cid: "qr-entrada" }],
  });
}

/** Recordatorio del día antes (texto del diseño del equipo) */
export function correoRecordatorioDia({ para, turno }) {
  return enviar({
    para,
    asunto: "Mañana te esperamos en Lilium",
    html: plantilla("Nuestro encuentro está cada vez más cerca.", `
      ${parrafo("Hola.")}
      ${parrafo("Esperamos que estés preparado/a para dedicarte un tiempo a ti, a desconectarte del estrés y abrirte a nuevas experiencias.")}
      ${parrafo("Queremos recordarte que nuestro encuentro está cada vez más cerca. Pronto tendrás la oportunidad de detenerte, escuchar, observar y descubrir lo que tus guías tenemos preparado para ti y tus acompañantes.")}
      ${parrafo("Esta es tu sesión agendada:")}
      ${datosTurno(turno)}
      ${parrafo("Recomendamos llegar unos 10-15 minutos antes y acudir con la mente abierta y disposición para participar.")}
      ${parrafo("Cada experiencia tiene un propósito, aunque no siempre sea evidente desde el principio.")}
      ${parrafo("Respira. Relájate. Llega a la paz.")}
      ${parrafo("Nos vemos muy pronto.")}`),
  });
}

/** El día después: a quien vino y aún no ha rellenado el cuestionario */
export function correoValoracion({ para, enlace }) {
  return enviar({
    para,
    asunto: "¿Qué te pareció Lilium?",
    html: plantilla("Cuéntanos cómo viviste el retiro.", `
      ${parrafo("Hola.")}
      ${parrafo("Gracias por dejarte guiar. Esperamos que tu paso por el retiro te haya dejado un momento de calma y algo en lo que pensar.")}
      ${parrafo("¿Te ha gustado la experiencia? Nos encantaría saberlo. Son seis preguntas y no lleva más de un minuto.")}
      ${boton("Valorar la experiencia", enlace)}
      ${parrafo("Tus respuestas nos ayudan a que Lilium florezca un poco más para quienes vengan detrás.")}
      ${parrafo("Con cariño, tus guías.")}`),
  });
}

export function correoCancelacion({ para, turno, motivo }) {
  return enviar({
    para,
    asunto: "Tu reserva en Lilium se ha cancelado",
    html: plantilla("Tu reserva se ha cancelado.", `
      ${parrafo("Hola.")}
      ${parrafo(esc(motivo))}
      ${parrafo(`La sesión era: ${EVENTO.fechaCorreo}, de ${esc(turno.inicio)} a ${esc(turno.fin)}.`)}
      ${parrafo("Si quieres, aún puedes buscar otra hora.")}
      ${boton("Volver a reservar", `${urlSitio()}/acceso`)}`),
  });
}

/** Aviso a quien estaba en la lista de espera: se ha liberado una plaza. */
export function correoPlazaLibre({ para, turno, hueco }) {
  return enviar({
    para,
    asunto: `Se ha liberado una plaza en Lilium a las ${turno.inicio}`,
    html: plantilla("Se ha abierto un hueco en el prado.", `
      ${parrafo("Hola.")}
      ${parrafo(`Nos pediste que te avisáramos: en la sesión de <b>${esc(turno.inicio)}–${esc(turno.fin)}</b> (${EVENTO.fechaCorreo}) ${hueco === 1 ? "ha quedado <b>1 plaza libre</b>" : `han quedado <b>${hueco} plazas libres</b>`}.`)}
      ${parrafo("Las plazas son para quien llegue primero, así que no tardes.")}
      ${boton("Reservar ahora", `${urlSitio()}/acceso`)}`),
  });
}
