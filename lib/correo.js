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

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function plantilla(titulo, cuerpo) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#fff5e6;padding:24px 12px;font-family:Georgia,'Times New Roman',serif;color:#732f23">
  <div style="max-width:560px;margin:0 auto;background:#fffaf2;border-radius:15px;padding:32px 28px">
    <p style="margin:0 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase">Lilium · Escape Room ESADA</p>
    <h1 style="margin:0 0 20px;font-size:28px;font-weight:normal;font-style:italic">${titulo}</h1>
    ${cuerpo}
    <p style="margin:28px 0 0;font-size:13px;color:#4c4b44">¿Dudas? Escríbenos a <a href="mailto:${CONTACTO}" style="color:#732f23">${CONTACTO}</a>.</p>
  </div></body></html>`;
}

const boton = (texto, href) =>
  `<p style="text-align:center;margin:26px 0"><a href="${href}" style="display:inline-block;background:#732f23;color:#f5f5f5;text-decoration:none;padding:16px 30px;border-radius:10px;font-size:20px;font-weight:bold">${texto}</a></p>`;

const datosTurno = (turno, equipo) => `
  <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:15px;margin:8px 0 4px">
    <tr><td style="padding:8px 0;border-bottom:1px dashed #732f23">Día</td><td style="padding:8px 0;border-bottom:1px dashed #732f23;text-align:right"><b>${EVENTO.fechaTexto}</b></td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px dashed #732f23">Hora</td><td style="padding:8px 0;border-bottom:1px dashed #732f23;text-align:right"><b>${esc(turno.inicio)}-${esc(turno.fin)}</b></td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px dashed #732f23">Lugar</td><td style="padding:8px 0;border-bottom:1px dashed #732f23;text-align:right"><b>${EVENTO.lugar}</b></td></tr>
    ${equipo ? `<tr><td style="padding:8px 0">Equipo</td><td style="padding:8px 0;text-align:right"><b>${esc(equipo)}</b></td></tr>` : ""}
  </table>`;

const fechaHora = (d) =>
  new Date(d).toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

export function correoCodigo(para, codigo) {
  return enviar({
    para,
    asunto: `Tu código de acceso a Lilium: ${codigo}`,
    html: plantilla("Antes de entrar al prado…", `
      <p style="font-size:18px;line-height:1.4">Este es tu código para entrar en Lilium. Caduca en 10 minutos.</p>
      <p style="text-align:center;font-family:Arial,sans-serif;font-size:40px;letter-spacing:.3em;font-weight:bold;margin:24px 0">${codigo}</p>
      <p style="font-size:15px;color:#4c4b44">Si no lo has pedido tú, ignora este correo.</p>`),
  });
}

export function correoInvitacion({ para, lider, turno, equipo, enlace, limite }) {
  return enviar({
    para,
    asunto: `${lider} te ha invitado a Lilium. Confirma tu plaza`,
    html: plantilla("Te esperan en el prado", `
      <p style="font-size:18px;line-height:1.4"><b>${esc(lider)}</b> te ha añadido a su grupo para el escape room Lilium.</p>
      ${datosTurno(turno, equipo)}
      <p style="font-size:18px;line-height:1.4">Tienes <b>${HORAS_CONFIRMACION} horas</b> para confirmar tu plaza (hasta el ${fechaHora(limite)}). Si no confirmas, la perderás.</p>
      ${boton("Confirmar mi asistencia", enlace)}`),
  });
}

export function correoRecordatorio({ para, turno, equipo, enlace, limite }) {
  return enviar({
    para,
    asunto: "Te quedan pocas horas para confirmar tu plaza en Lilium",
    html: plantilla("El sol empieza a bajar…", `
      <p style="font-size:18px;line-height:1.4">Aún no has confirmado tu plaza. El plazo acaba el <b>${fechaHora(limite)}</b>. Tu grupo te espera.</p>
      ${datosTurno(turno, equipo)}
      ${boton("Confirmar mi asistencia", enlace)}`),
  });
}

/** Entrada digital con QR (al confirmar, o al líder al crear la reserva). */
export async function correoEntrada({ para, turno, equipo, enlaceEntrada, enlaceReserva }) {
  const qr = await QRCode.toBuffer(enlaceEntrada, { width: 360, margin: 1, color: { dark: "#292f20", light: "#fffaf2" } });
  return enviar({
    para,
    asunto: "Tu entrada para Lilium",
    html: plantilla("Tu entrada digital", `
      <p style="font-size:18px;line-height:1.4">Tu plaza está confirmada. Enseña este QR en la puerta y llegad 15 minutos antes de vuestra hora.</p>
      <p style="text-align:center;margin:20px 0"><img src="cid:qr-entrada" width="220" height="220" alt="QR de tu entrada" style="border-radius:10px"></p>
      ${datosTurno(turno, equipo)}
      ${boton("Ver mi reserva", enlaceReserva)}`),
    adjuntos: [{ filename: "entrada-lilium.png", content: qr, cid: "qr-entrada" }],
  });
}

export function correoCancelacion({ para, turno, motivo }) {
  return enviar({
    para,
    asunto: "Tu reserva en Lilium se ha cancelado",
    html: plantilla("Reserva cancelada", `
      <p style="font-size:18px;line-height:1.4">${esc(motivo)}</p>
      <p style="font-size:16px;font-family:Arial,sans-serif">Turno: ${EVENTO.fechaTexto}, ${esc(turno.inicio)}-${esc(turno.fin)}.</p>
      ${boton("Volver a reservar", `${urlSitio()}/acceso`)}`),
  });
}
