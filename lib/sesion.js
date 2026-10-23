// Lilium · Sesión: cookie firmada con el correo verificado
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "lilium_sesion";
const DURACION_DIAS = 30;

function clave() {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto || secreto.length < 32) {
    throw new Error(
      `Falta configurar la llave SESSION_SECRET en Vercel: debe tener al menos 32 letras y números (ahora tiene ${secreto ? secreto.length : 0}).`
    );
  }
  return new TextEncoder().encode(secreto);
}

/** Lanza un error claro si la llave de la sesión no está bien puesta (antes de gastar el código). */
export function comprobarLlaveSesion() {
  clave();
}

export async function iniciarSesion(email) {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACION_DIAS}d`)
    .sign(clave());
  const almacen = await cookies();
  almacen.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_DIAS * 24 * 3600,
  });
}

export async function cerrarSesion() {
  const almacen = await cookies();
  almacen.delete(COOKIE);
}

/** Devuelve el correo de la sesión o null. */
export async function correoDeSesion() {
  const almacen = await cookies();
  const token = almacen.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, clave());
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}
