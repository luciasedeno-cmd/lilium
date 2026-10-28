"use client";
// Lilium · Mientras se reserva, avisa cada 10 s de qué turno se está mirando (/api/mirando) y devuelve:
// - mirando: { turnoId: cuántas OTRAS personas lo miran ahora }
// - turnos: plazas de cada turno ahora mismo (con su estado: libre, en formación o completo)
// Con la pestaña escondida no avisa (y deja de contar); al volver, avisa enseguida.
import { useEffect, useState } from "react";
import { api } from "./borrador";
import { estadoTurno } from "./turnos";

const CADA_MS = 10000;

export function useMirando(turnoId) {
  const [datos, setDatos] = useState(null);
  useEffect(() => {
    let parado = false;
    let reloj;
    async function avisar() {
      clearTimeout(reloj);
      if (!document.hidden) {
        const r = await api("/api/mirando", { metodo: "POST", datos: { turnoId: turnoId || null } });
        if (parado) return;
        if (r.ok) setDatos({ mirando: r.mirando, turnos: r.turnos.map((x) => ({ ...x, estado: estadoTurno(x.ocupadas) })) });
      }
      reloj = setTimeout(avisar, CADA_MS);
    }
    avisar();
    const alVolver = () => document.visibilityState === "visible" && avisar();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      parado = true;
      clearTimeout(reloj);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [turnoId]);
  return datos;
}
