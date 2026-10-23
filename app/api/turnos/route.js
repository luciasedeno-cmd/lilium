// GET /api/turnos → turnos del día con plazas libres (sin datos personales)
import { listarTurnos } from "@/lib/reservas";
import { correoDeSesion } from "@/lib/sesion";
import { ok, manejar } from "@/lib/respuestas";

export const dynamic = "force-dynamic";

export const GET = manejar(async () => ok({ turnos: await listarTurnos(await correoDeSesion()) }));
