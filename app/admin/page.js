"use client";
// Página previa del equipo (antes de la apertura): correo del equipo + contraseña.
// Si es correcta, este navegador recibe la «llave de pruebas» y ya puede ver la web y probar las reservas.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/borrador";

const TEXTOS = {
  es: { etiqueta: "EQUIPO LILIUM", titulo: "Solo para el equipo", intro: "La web abre el 30 de octubre. Si formas parte del equipo, entra con la contraseña para probarla antes.", correo: "Correo del equipo", clave: "Contraseña", comprobando: "Comprobando…", entrar: "Entrar", volver: "← Volver a la cuenta atrás", falta: "Escribe el correo y la contraseña." },
  en: { etiqueta: "LILIUM TEAM", titulo: "Team only", intro: "The website opens on 30 October. If you're part of the team, sign in with the password to try it out first.", correo: "Team email", clave: "Password", comprobando: "Checking…", entrar: "Sign in", volver: "← Back to the countdown", falta: "Type the email and the password." },
};
import { useTextos } from "@/components/Idioma";

export default function Admin() {
  const router = useRouter();
  const t = useTextos(TEXTOS);
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    if (!correo.trim() || !clave) return setError(t.falta);
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
        <p className="acceso__etiqueta">{t.etiqueta}</p>
        <h1 className="acceso__titulo" id="previa-titulo">{t.titulo}</h1>
        <p className="acceso__intro">{t.intro}</p>
        <form onSubmit={entrar} noValidate>
          <label htmlFor="admin-correo">{t.correo}</label>
          <input className="campo" id="admin-correo" type="email" autoComplete="username" placeholder="E-mail"
            value={correo} onChange={(e) => setCorreo(e.target.value)} />
          <label htmlFor="admin-clave">{t.clave}</label>
          <input className="campo" id="admin-clave" type="password" autoComplete="current-password" placeholder={t.clave}
            value={clave} onChange={(e) => setClave(e.target.value)} aria-describedby="admin-error" />
          <p className="error" id="admin-error" role="alert">{error}</p>
          <button className="boton" type="submit" disabled={enviando}>{enviando ? t.comprobando : t.entrar}</button>
        </form>
        <Link className="previa__volver" href="/">{t.volver}</Link>
      </section>
    </main>
  );
}
