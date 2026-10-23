"use client";
// Acceso: el correo institucional recibe un código de 6 dígitos para entrar
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NavReserva from "@/components/NavReserva";
import { api, leerBorrador, guardarBorrador } from "@/lib/borrador";

const CORREO_VALIDO = /^[a-z0-9._-]+@alumnado\.esada\.es$/i;

export default function Acceso() {
  const router = useRouter();
  const [fase, setFase] = useState("correo"); // correo | codigo
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const campoCodigo = useRef(null);

  // Si ya hay sesión, se continúa donde toque
  useEffect(() => {
    setCorreo(leerBorrador().correo || "");
    api("/api/sesion").then((s) => {
      if (s.email) router.replace(s.tieneReserva ? "/mi-reserva" : "/reserva/integrantes");
    });
  }, [router]);

  useEffect(() => {
    if (fase === "codigo") campoCodigo.current?.focus();
  }, [fase]);

  async function pedirCodigo(e) {
    e?.preventDefault();
    const limpio = correo.trim().toLowerCase();
    if (!CORREO_VALIDO.test(limpio)) {
      setError("Usa tu correo institucional: nombreapellido@alumnado.esada.es");
      return;
    }
    setEnviando(true);
    const res = await api("/api/acceso/codigo", { metodo: "POST", datos: { email: limpio } });
    setEnviando(false);
    if (!res.ok) return setError(res.mensaje);
    setError("");
    setCorreo(limpio);
    guardarBorrador({ correo: limpio });
    setAviso(res.codigoDemo ? `Modo pruebas (sin Gmail configurado): tu código es ${res.codigoDemo}` : "");
    setFase("codigo");
  }

  async function verificar(e) {
    e.preventDefault();
    if (!/^\d{6}$/.test(codigo.trim())) return setError("Escribe los 6 dígitos del código.");
    setEnviando(true);
    const res = await api("/api/acceso/verificar", { metodo: "POST", datos: { email: correo, codigo: codigo.trim() } });
    setEnviando(false);
    if (!res.ok) return setError(res.mensaje);
    router.replace(res.tieneReserva ? "/mi-reserva" : "/reserva/integrantes");
  }

  return (
    <>
      <NavReserva />
      <main>
        <section className="acceso">
          <p className="acceso__etiqueta">ACCESO</p>
          <h1 className="acceso__titulo">{fase === "correo" ? "Antes de entrar al prado..." : "Revisa tu correo"}</h1>

          {fase === "correo" ? (
            <>
              <p className="acceso__intro">Solo el alumnado de ESADA puede reservar. Confirma tu correo institucional y te enviaremos un código.</p>
              <form onSubmit={pedirCodigo} noValidate>
                <label htmlFor="correo">Correo institucional</label>
                <input className="campo" id="correo" type="email" placeholder="E-mail" autoComplete="email" required
                  value={correo} onChange={(e) => setCorreo(e.target.value)}
                  aria-invalid={error ? "true" : undefined} aria-describedby="correo-ayuda correo-error" />
                <p className="acceso__ayuda" id="correo-ayuda">Formato: nombreapellido@alumnado.esada.es</p>
                <p className="error" id="correo-error" role="alert">{error}</p>
                <button className="boton" type="submit" disabled={enviando}>{enviando ? "Enviando…" : "Enviar código"}</button>
              </form>
            </>
          ) : (
            <>
              <p className="acceso__intro">Hemos enviado un código de 6 dígitos a <b>{correo}</b>. Caduca en 10 minutos.</p>
              {aviso && <p className="acceso__demo" role="status">{aviso}</p>}
              <form onSubmit={verificar} noValidate>
                <label htmlFor="codigo">Código de verificación</label>
                <input className="campo campo--codigo" id="codigo" ref={campoCodigo} inputMode="numeric" autoComplete="one-time-code"
                  maxLength={6} placeholder="000000" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                  aria-invalid={error ? "true" : undefined} aria-describedby="codigo-error" />
                <p className="error" id="codigo-error" role="alert">{error}</p>
                <button className="boton" type="submit" disabled={enviando}>{enviando ? "Comprobando…" : "Entrar"}</button>
              </form>
              <p className="acceso__ayuda acceso__enlaces">
                <button type="button" onClick={() => pedirCodigo()}>Reenviar código</button>
                {" · "}
                <button type="button" onClick={() => { setFase("correo"); setCodigo(""); setError(""); }}>Cambiar correo</button>
              </p>
            </>
          )}
        </section>
      </main>
    </>
  );
}
