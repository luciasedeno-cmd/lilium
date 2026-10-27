// Cuestionario de después de la experiencia: https://lilium.esada.es/cuestionario
// No hay ningún botón en la web que lleve aquí: se comparte el enlace (o un QR) al salir de la sala.
// «noindex» pide a Google y compañía que no la enseñen en sus resultados.
// Aquí (en el servidor) se leen los turnos del día para la pregunta «¿En qué turno has estado?» y,
// si se llega con el enlace personal del correo (?t=…), cuál era el de esa persona (sale ya marcado).
import Cuestionario from "./Cuestionario";
import { conDb } from "@/lib/db";
import { turnosCuestionario } from "@/lib/retiro";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cuestionario · Lilium",
  robots: { index: false, follow: false },
};

export default async function PaginaCuestionario({ searchParams }) {
  const { t } = (await searchParams) || {};
  let datos = { turnos: [], suyo: null };
  try {
    datos = await conDb(() => turnosCuestionario(typeof t === "string" ? t : null));
  } catch (e) {
    // Si la base de datos no responde, el cuestionario sigue funcionando sin la pregunta del turno
    console.error("No se pudieron leer los turnos para el cuestionario:", e.message);
  }
  return <Cuestionario turnos={datos.turnos} turnoInicial={datos.suyo} />;
}
