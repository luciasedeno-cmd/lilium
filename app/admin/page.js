"use client";
// Página previa del equipo (antes de la apertura): correo del equipo + contraseña.
// Si es correcta, este navegador recibe la «llave de pruebas» y ya puede ver la web y probar las reservas.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    // Con la llave de pruebas, se sigue como lo hará todo el mundo el día 30: confirmando el correo
    router.replace("/acceso");
  }

  return (
    <main className="previa">
      <section className="acceso previa__tarjeta" aria-labelledby="previa-titulo">
        <img className="previa__logo" src="/assets/img/logo-lilium.png" width="198" height="118" alt="Lilium" />
        <p className="acceso__etiqueta">EQUIPO LILIUM</p>
        <h1 className="acceso__titulo" id="previa-titulo">Solo para el equipo</h1>
        <p className="acceso__intro">La web abre el 30 de octubre. Si formas parte del equipo, entra con la contraseña para probarla antes.</p>
        <form onSubmit={entrar} noValidate>
          <label htmlFor="admin-correo">Correo del equipo</label>
          <input className="campo" id="admin-correo" type="email" autoComplete="username" placeholder="E-mail"
            value={correo} onChange={(e) => setCorreo(e.target.value)} />
          <label htmlFor="admin-clave">Contraseña</label>
          <input className="campo" id="admin-clave" type="password" autoComplete="current-password" placeholder="Contraseña"
            value={clave} onChange={(e) => setClave(e.target.value)} aria-describedby="admin-error" />
          <p className="error" id="admin-error" role="alert">{error}</p>
          <button className="boton" type="submit" disabled={enviando}>{enviando ? "Comprobando…" : "Entrar"}</button>
        </form>
        <Link className="previa__volver" href="/">← Volver a la cuenta atrás</Link>
      </section>
    </main>
  );
}
