// Lilium · Guardián de la web (se ejecuta antes de enseñar cualquier página).
// 1) Hasta el 30 de octubre (APERTURA) la web está cerrada: solo se ve la cuenta atrás y la página
//    del equipo (/admin). Quien entra ahí con la contraseña recibe la «llave de pruebas» y ve todo.
// 2) Sin sesión, la Home, la reserva y «Mi reserva» llevan a /acceso (confirmar el correo).
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { APERTURA } from "./lib/config";
import { COOKIE_PREVIA, llavePreviaValida } from "./lib/previa";

// Lo que se puede ver antes de la apertura sin la llave de pruebas
const SIEMPRE_ABIERTO = [
  /^\/$/, // la cuenta atrás
  /^\/admin$/, // la página del equipo
  /^\/api\/acceso\/admin(\/(codigo|verificar))?$/, // su contraseña o el código por correo
  /^\/api\/admin\/.+$/, // el panel del equipo (cada ruta comprueba la llave por su cuenta)
  /^\/api\/cron$/, // la tarea de cada hora (tiene su propia clave)
  // Enlaces de los correos de las pruebas (solo funcionan con su código secreto)
  /^\/confirmar\/[^/]+$/,
  /^\/entrada\/[^/]+$/,
  /^\/api\/confirmar$/,
];

// Páginas que además necesitan haber confirmado el correo
const CON_SESION = [/^\/inicio$/, /^\/reserva(\/.*)?$/, /^\/mi-reserva$/];

async function haySesion(req) {
  const token = req.cookies.get("lilium_sesion")?.value;
  const secreto = process.env.SESSION_SECRET;
  if (!token || !secreto || secreto.length < 32) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secreto));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req) {
  const ruta = req.nextUrl.pathname;

  // 1) Web cerrada hasta la apertura
  if (Date.now() < APERTURA.getTime() && !SIEMPRE_ABIERTO.some((r) => r.test(ruta))) {
    const conLlave = await llavePreviaValida(req.cookies.get(COOKIE_PREVIA)?.value);
    if (!conLlave) {
      if (ruta.startsWith("/api/")) {
        return NextResponse.json({ ok: false, mensaje: "La web abre el 30 de octubre a las 12:00." }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // 2) Páginas que necesitan sesión
  if (CON_SESION.some((r) => r.test(ruta)) && !(await haySesion(req))) {
    return NextResponse.redirect(new URL("/acceso", req.url));
  }
  return NextResponse.next();
}

// Se revisan todas las direcciones menos los archivos internos de Next.js y las imágenes
export const config = {
  matcher: ["/((?!_next/|assets/|favicon\\.ico).*)"],
};
