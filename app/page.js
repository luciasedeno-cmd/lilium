// Portada: cuenta atrás hasta la apertura de las reservas (Figma: CUENTA REGRESIVA).
// Solo el cuadro a pantalla completa, «FALTAN» y el reloj. Al llegar la fecha, lleva a confirmar el correo.
import { redirect } from "next/navigation";
import { APERTURA } from "@/lib/config";
import CuentaAtras from "@/components/CuentaAtras";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cuenta atrás · Lilium",
  description: "Lilium, el escape room de ESADA, abre el 30 de octubre.",
};

export default function Portada() {
  if (Date.now() >= APERTURA.getTime()) redirect("/acceso");

  return (
    <main className="cuenta">
      {/* Título para buscadores y lectores de pantalla (no se ve) */}
      <h1 className="visually-hidden">Lilium · Las reservas abren el viernes 30 de octubre</h1>
      <CuentaAtras apertura={APERTURA.toISOString()} />
    </main>
  );
}
