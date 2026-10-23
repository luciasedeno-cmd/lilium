// Portada: cuenta atrás hasta la apertura de las reservas. Al llegar la fecha, lleva a confirmar el correo.
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
    <>
      <header className="cuenta-nav">
        <div className="logo">
          <img src="/assets/img/logo-lilium.png" alt="Lilium" />
        </div>
      </header>

      <main className="cuenta">
        <h1 className="cuenta__titulo">Cinco guías. Un destino</h1>
        <CuentaAtras apertura={APERTURA.toISOString()} />
        <p className="cuenta__fecha">Viernes, 30 de octubre · ESADA</p>
        <img className="cuenta__encaje" src="/assets/svg/banner-encaje.svg" width="1612" height="176" alt="" />
      </main>
    </>
  );
}
