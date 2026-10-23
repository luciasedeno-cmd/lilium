// Lilium · Respuestas JSON de la API
import { NextResponse } from "next/server";

export const ok = (datos = {}) => NextResponse.json({ ok: true, ...datos });

export const error = (mensaje, estado = 400, extra = {}) =>
  NextResponse.json({ ok: false, mensaje, ...extra }, { status: estado });

/** Envuelve un handler para devolver un error 500 legible si algo falla. */
export function manejar(handler) {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      console.error(e);
      return error("Algo ha fallado en el servidor. Inténtalo de nuevo en unos minutos.", 500);
    }
  };
}

export async function leerJson(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
