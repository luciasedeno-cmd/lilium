// POST /api/cola → «¿me toca ya?»: entra o devuelve el puesto en la sala de espera (lib/cola.js)
// DELETE /api/cola → deja el sitio libre (al terminar la reserva)
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { pasarPorLaCola, salirDeLaCola } from "@/lib/cola";
import { ok, manejar } from "@/lib/respuestas";

export const dynamic = "force-dynamic";
const COOKIE = "lilium_cola";

export const POST = manejar(async () => {
  const almacen = await cookies();
  // El ticket de este navegador (si no tiene, se le da uno nuevo: se pone el último de la cola)
  let ticket = almacen.get(COOKIE)?.value;
  if (!/^[a-f0-9]{32}$/.test(ticket || "")) {
    ticket = randomBytes(16).toString("hex");
    almacen.set(COOKIE, ticket, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 12 * 3600,
    });
  }
  return ok(await pasarPorLaCola(ticket));
});

export const DELETE = manejar(async () => {
  const ticket = (await cookies()).get(COOKIE)?.value;
  if (ticket) await salirDeLaCola(ticket);
  return ok();
});
