// GET /api/sesion → correo de la sesión y si ya tiene reserva · DELETE → cerrar sesión
import { correoDeSesion, cerrarSesion } from "@/lib/sesion";
import { reservaDe } from "@/lib/reservas";
import { ok, manejar } from "@/lib/respuestas";

export const dynamic = "force-dynamic";

export const GET = manejar(async () => {
  const email = await correoDeSesion();
  if (!email) return ok({ email: null, tieneReserva: false });
  const reserva = await reservaDe(email);
  return ok({ email, tieneReserva: Boolean(reserva) });
});

export const DELETE = manejar(async () => {
  await cerrarSesion();
  return ok();
});
