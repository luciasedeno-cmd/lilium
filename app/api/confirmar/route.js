// POST /api/confirmar · { token } → confirma la plaza desde el enlace del correo y abre la sesión
import { confirmarPorToken, reservaDe, fragmentosDe } from "@/lib/reservas";
import { iniciarSesion } from "@/lib/sesion";
import { correoEntrada, urlSitio } from "@/lib/correo";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";

export const POST = manejar(async (req) => {
  const { token, aceptaTerminos } = await leerJson(req);
  if (aceptaTerminos !== true) return error("Para confirmar tu plaza tienes que aceptar los Términos y Condiciones.");
  const miembro = await confirmarPorToken(token);
  if (!miembro) return error("Este enlace ya no es válido: puede que el plazo de 48 h haya terminado o que la reserva se haya cancelado.", 404);

  // Abrir el enlace del correo demuestra que el correo es suyo
  await iniciarSesion(miembro.email);

  const reserva = await reservaDe(miembro.email);
  const base = urlSitio();
  try {
    await correoEntrada({
      para: miembro.email,
      turno: reserva.turno,
      equipo: reserva.turno.equipo,
      enlaceEntrada: `${base}/entrada/${miembro.token}`,
      enlaceReserva: `${base}/mi-reserva`,
      fragmentos: await fragmentosDe(miembro.email),
    });
  } catch (e) {
    console.error("Error enviando la entrada:", e);
  }
  return ok();
});
