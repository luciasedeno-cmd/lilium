// Lilium · Orden de las páginas: primero se confirma el correo (/acceso).
// Sin sesión, la Home, la reserva y «Mi reserva» llevan a /acceso.
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

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
  if (await haySesion(req)) return NextResponse.next();
  return NextResponse.redirect(new URL("/acceso", req.url));
}

// Páginas que necesitan haber confirmado el correo
export const config = {
  matcher: ["/inicio", "/reserva/:path*", "/mi-reserva"],
};
