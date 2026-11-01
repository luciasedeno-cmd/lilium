// Panel del equipo · «Correos al alumnado» (solo con la llave del equipo)
// GET  → cuántas personas recibirían cada correo ahora mismo
// POST { tipo: "prueba", email }          → manda las DOS versiones a ese correo, con «[PRUEBA]» en el asunto
// POST { tipo: "sin_confirmar" }          → «Confirma tu plaza antes de perderla» a quien aún no ha confirmado
// POST { tipo: "perdidas", extra: [...] } → «¿Perdiste tu plaza?» a quien la perdió (más los correos pegados)
import { conLlavePrevia } from "@/lib/previaServidor";
import { sinConfirmar, plazasPerdidas, marcarPerdidasAvisadas, cuentasCorreos } from "@/lib/retiro";
import { limiteDe, aplicarPlazos } from "@/lib/reservas";
import { correoRecordatorio, correoPlazaPerdida, urlSitio, motivoFalloCorreo } from "@/lib/correo";
import { normalizarCorreo } from "@/lib/config";
import { ok, error, manejar, leerJson } from "@/lib/respuestas";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // con mucha gente puede tardar un poco (Vercel deja hasta 60 s)
const A_LA_VEZ = 8; // correos a la vez (para no saturar Gmail)

/** Manda un correo a cada persona, de 8 en 8. Devuelve a quién le llegó bien, cuántos fallaron y por qué. */
async function mandarATodos(gente, mandar) {
  const bien = [];
  let fallidos = 0;
  let motivo = null; // por qué falló el primero (para enseñarlo en el panel)
  for (let i = 0; i < gente.length; i += A_LA_VEZ) {
    const grupo = gente.slice(i, i + A_LA_VEZ);
    const res = await Promise.allSettled(grupo.map(mandar));
    res.forEach((r, j) => {
      if (r.status === "fulfilled") bien.push(grupo[j]);
      else {
        fallidos++;
        motivo ||= motivoFalloCorreo(r.reason);
        console.error("Error enviando correo:", r.reason);
      }
    });
  }
  return { bien, fallidos, motivo };
}

export const GET = manejar(async () => {
  if (!(await conLlavePrevia())) return error("Entra con el correo y la contraseña del equipo.", 401);
  await aplicarPlazos(); // quien acaba de pasar sus 48 h sin confirmar pasa ya a «plazas perdidas»
  return ok(await cuentasCorreos());
});

export const POST = manejar(async (req) => {
  if (!(await conLlavePrevia())) return error("Entra con el correo y la contraseña del equipo.", 401);
  const { tipo, email, extra = [] } = await leerJson(req);
  const base = urlSitio();

  if (tipo === "prueba") {
    const para = normalizarCorreo(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(para)) return error("Escribe un correo válido para la prueba.");
    // Datos de ejemplo: el botón de confirmar lleva a la web (no a una plaza de verdad)
    try {
      await correoRecordatorio({
        para, prueba: true, turno: { inicio: "11:00", fin: "12:00" }, equipo: "La Orden del Lirio Dormido",
        enlace: `${base}/acceso`, limite: new Date(Date.now() + 24 * 3600 * 1000),
      });
      await correoPlazaPerdida({ para, prueba: true });
    } catch (e) {
      console.error("Error enviando la prueba:", e);
      return error(`No se ha podido enviar: ${motivoFalloCorreo(e)}`, 502);
    }
    return ok({ enviados: 2 });
  }

  if (tipo === "sin_confirmar") {
    const gente = await sinConfirmar();
    const { bien, fallidos, motivo } = await mandarATodos(gente, (p) =>
      correoRecordatorio({
        para: p.email, turno: { inicio: p.inicio, fin: p.fin }, equipo: p.equipo,
        enlace: `${base}/confirmar/${p.token}`, limite: limiteDe(p.creada),
      }));
    return ok({ enviados: bien.length, fallidos, motivo });
  }

  if (tipo === "perdidas") {
    await aplicarPlazos();
    const gente = await plazasPerdidas(Array.isArray(extra) ? extra : []);
    const { bien, fallidos, motivo } = await mandarATodos(gente, (para) => correoPlazaPerdida({ para }));
    await marcarPerdidasAvisadas(bien);
    return ok({ enviados: bien.length, fallidos, motivo });
  }

  return error("Datos no válidos.");
});
