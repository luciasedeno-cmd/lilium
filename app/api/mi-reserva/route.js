// GET /api/mi-reserva → la reserva de la persona con sesión (con QR si ya confirmó)
import QRCode from "qrcode";
import { correoDeSesion } from "@/lib/sesion";
import { reservaDe } from "@/lib/reservas";
import { urlSitio } from "@/lib/correo";
import { ok, error, manejar } from "@/lib/respuestas";

export const dynamic = "force-dynamic";

export const GET = manejar(async () => {
  const email = await correoDeSesion();
  if (!email) return error("Entra con tu correo para ver tu reserva.", 401);

  const reserva = await reservaDe(email);
  if (!reserva) return ok({ reserva: null });

  let qr = null;
  if (reserva.yo.confirmado) {
    qr = await QRCode.toDataURL(`${urlSitio()}/entrada/${reserva.yo.token}`, {
      width: 320, margin: 1, color: { dark: "#292f20", light: "#fffaf2" },
    });
  }
  const { token, ...yo } = reserva.yo;
  return ok({ reserva: { ...reserva, yo, qr } });
});
