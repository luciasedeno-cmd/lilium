// Página que se ve después de enviar el cuestionario (/cuestionario/enviado)
import Enviado from "./Enviado";

export const metadata = {
  title: "Respuesta enviada · Lilium",
  robots: { index: false, follow: false },
};

export default function PaginaEnviado() {
  return <Enviado />;
}
