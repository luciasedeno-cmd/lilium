// Lilium · Avisos automáticos por correo que no dependen de una persona concreta
import { pendientesListaEspera, marcarAvisados } from "./reservas";
import { correoPlazaLibre } from "./correo";

/**
 * Escribe a quien estaba en la lista de espera de un turno que ahora tiene plazas libres.
 * Se llama al cancelar o cambiar de hora (se libera un hueco) y cada hora desde /api/cron
 * (por si se liberó al vencer el plazo de 48 h). A cada persona se le avisa una sola vez.
 * @returns cuántos avisos se han enviado
 */
export async function avisarListaEspera() {
  const pendientes = await pendientesListaEspera();
  const resultados = await Promise.allSettled(pendientes.map((p) =>
    correoPlazaLibre({ para: p.email, turno: { inicio: p.inicio, fin: p.fin }, hueco: p.hueco })
  ));
  const enviados = pendientes.filter((_, i) => resultados[i].status === "fulfilled");
  resultados.forEach((r) => r.status === "rejected" && console.error("Error avisando de una plaza libre:", r.reason));
  await marcarAvisados(enviados);
  return enviados.length;
}
