// Cuestionario de después de la experiencia: https://lilium.esada.es/cuestionario
// No hay ningún botón en la web que lleve aquí: se comparte el enlace (o un QR) al salir de la sala.
// «noindex» pide a Google y compañía que no la enseñen en sus resultados.
import Cuestionario from "./Cuestionario";

export const metadata = {
  title: "Cuestionario · Lilium",
  robots: { index: false, follow: false },
};

export default function PaginaCuestionario() {
  return <Cuestionario />;
}
