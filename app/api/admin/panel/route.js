// GET /api/admin/panel?dia=2026-11-06 → todo lo del panel del equipo de ese día: salas, grupos, personas y totales.
// Sin ?dia, el día que se reserva ahora (el lunes 9).
// Solo con la llave del equipo (la que da /admin con el correo lilium@esada.es y la contraseña).
import { conLlavePrevia } from "@/lib/previaServidor";
import { datosPanel } from "@/lib/retiro";
import { mandarOlvidosHoy } from "@/lib/olvidoHoy";
import { after } from "next/server";
import { conDb } from "@/lib/db";
import { ok, error, manejar } from "@/lib/respuestas";

export const dynamic = "force-dynamic";

export const GET = manejar(async (req) => {
  if (!(await conLlavePrevia())) return error("Entra con el correo y la contraseña del equipo.", 401);
  const dia = new URL(req.url).searchParams.get("dia") || undefined;
  // Después de contestar (sin hacer esperar al panel; con su propia conexión, la del panel ya se cerró): «Uy uy uy» a quien terminó hace 1 hora y no ha valorado
  after(() => conDb(() => mandarOlvidosHoy({ conPausa: true })).catch((e) => console.error("Uy uy uy (panel):", e)));
  return ok(await datosPanel(dia));
});
