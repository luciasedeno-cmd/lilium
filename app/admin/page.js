"use client";
// Entrada de administración: correo + contraseña (para probar las reservas antes de la apertura)
import { useState } from "react";
import { useRouter } from "next/navigation";
import NavReserva from "@/components/NavReserva";
import { api } from "@/lib/borrador";

export default function Admin() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    if (!correo.trim() || !clave) return setError("Escribe el correo y la contraseña.");
    setEnviando(true);
    const res = await api("/api/acceso/admin", { metodo: "POST", datos: { email: correo.trim(), clave } });
    setEnviando(false);
    if (!res.ok) return setError(res.mensaje);
    router.replace(res.tieneReserva ? "/mi-reserva" : "/inicio");
  }

  return (
    <div className="pagina-acceso">
      <NavReserva />
      <main>
        <section className="acceso">
          <p className="acceso__etiqueta">ADMINISTRACIÓN</p>
          <h1 className="acceso__titulo">Entrada para pruebas</h1>
          <p className="acceso__intro">Solo para el equipo de Lilium: entra para probar las reservas antes de la apertura.</p>
          <form onSubmit={entrar} noValidate>
            <label htmlFor="admin-correo">Correo</label>
            <input className="campo" id="admin-correo" type="email" autoComplete="username" placeholder="E-mail"
              value={correo} onChange={(e) => setCorreo(e.target.value)} />
            <label htmlFor="admin-clave">Contraseña</label>
            <input className="campo" id="admin-clave" type="password" autoComplete="current-password" placeholder="Contraseña"
              value={clave} onChange={(e) => setClave(e.target.value)} aria-describedby="admin-error" />
            <p className="error" id="admin-error" role="alert">{error}</p>
            <button className="boton" type="submit" disabled={enviando}>{enviando ? "Comprobando…" : "Entrar"}</button>
          </form>
        </section>
      </main>
    </div>
  );
}
