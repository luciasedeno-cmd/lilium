"use client";
// Acceso: el correo institucional recibe un código de 6 dígitos para entrar
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NavReserva from "@/components/NavReserva";
import { api, leerBorrador, guardarBorrador } from "@/lib/borrador";

const CORREO_VALIDO = /^[a-z0-9._-]+@alumnado\.esada\.es$/i;

export default function Acceso() {
  const router = useRouter();
  const [fase, setFase] = useState("correo"); // correo | codigo | sesion (ya habías entrado)
  const [sesion, setSesion] = useState(null); // { email, destino } si el navegador ya te recuerda
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const campoCodigo = useRef(null);

  // Si el navegador ya te recuerda, no se salta la página: se ofrece continuar o entrar con otro correo
  useEffect(() => {
    setCorreo(leerBorrador().correo || "");
    api("/api/sesion").then((s) => {
      if (s.email) {
        setSesion({ email: s.email, destino: s.tieneReserva ? "/mi-reserva" : "/inicio" });
        setFase("sesion");
      }
    });
  }, []);

  // «Entrar con otro correo»: se cierra la sesión y vuelve el formulario
  async function otroCorreo() {
    await api("/api/sesion", { metodo: "DELETE" });
    setSesion(null);
    setCorreo("");
    setFase("correo");
  }

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
    router.replace(res.tieneReserva ? "/mi-reserva" : "/inicio");
  }

  return (
    <div className="pagina-acceso">
      <NavReserva />
      <main>
        <section className="acceso">
          <p className="acceso__etiqueta">ACCESO</p>
          <h1 className="acceso__titulo">{fase === "codigo" ? "Revisa tu correo" : fase === "sesion" ? "Ya estás dentro" : "Antes de entrar al prado..."}</h1>

          {fase === "sesion" ? (
            <>
              <p className="acceso__intro">Has entrado con <b>{sesion.email}</b>.</p>
              <button className="boton" type="button" onClick={() => router.push(sesion.destino)}>
                {sesion.destino === "/mi-reserva" ? "Ver mi reserva" : "Continuar"}
              </button>
              <p className="acceso__ayuda acceso__enlaces">
                <button type="button" onClick={otroCorreo}>Entrar con otro correo</button>
              </p>
            </>
          ) : fase === "correo" ? (
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
    </div>
  );
}
