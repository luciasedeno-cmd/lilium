// Portada: cuenta atrás hasta la apertura de las reservas (Figma: CUENTA REGRESIVA).
// El cuadro a pantalla completa, «FALTAN», el reloj, el selector ES / EN y un botón pequeño «Admin».
// Al llegar la fecha, lleva a confirmar el correo.
import { redirect } from "next/navigation";
import Link from "next/link";
import { APERTURA } from "@/lib/config";
import { idiomaActual } from "@/lib/idiomaServidor";
import CuentaAtras from "@/components/CuentaAtras";
import SelectorIdioma from "@/components/SelectorIdioma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cuenta atrás · Lilium",
  description: "Lilium, el escape room de ESADA, abre el 30 de octubre.",
};

export default async function Portada() {
  if (Date.now() >= APERTURA.getTime()) redirect("/acceso");
  const en = (await idiomaActual()) === "en";

  return (
    <main className="cuenta">
      {/* Título para buscadores y lectores de pantalla (no se ve) */}
      <h1 className="visually-hidden">{en ? "Lilium · Bookings open on Friday 30 October" : "Lilium · Las reservas abren el viernes 30 de octubre"}</h1>
      <div className="cuenta__idioma"><SelectorIdioma /></div>
      <CuentaAtras apertura={APERTURA.toISOString()} />
      {/* Entrada del equipo: hasta el día 30 es la única forma de ver el resto de la web (pide contraseña) */}
      <Link className="cuenta__admin" href="/admin">Admin</Link>
    </main>
  );
}
