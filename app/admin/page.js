// Página del equipo (/admin): con el correo lilium@esada.es y la contraseña se ve el panel del día del retiro.
// No sale en Google («noindex»).
import Admin from "./Admin";

export const metadata = {
  title: "Admin · Lilium",
  robots: { index: false, follow: false },
};

export default function PaginaAdmin() {
  return <Admin />;
}
