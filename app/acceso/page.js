"use client";
// Acceso: el correo institucional recibe un código de 6 dígitos para entrar
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NavReserva from "@/components/NavReserva";
import PiePagina from "@/components/PiePagina";
import { useTextos } from "@/components/Idioma";
import { api, leerBorrador, guardarBorrador } from "@/lib/borrador";

const CORREO_VALIDO = /^[a-z0-9._-]+@alumnado\.esada\.es$/i;

const TEXTOS = {
  es: {
    etiqueta: "ACCESO", antes: "Antes de entrar al prado...", revisa: "Revisa tu correo", dentro: "Ya estás dentro",
    intro: "Solo el alumnado de ESADA puede reservar. Confirma tu correo institucional y te enviaremos un código.",
    correo: "Correo institucional", formato: "Formato: nombreapellido@alumnado.esada.es",
    correoMal: "Usa tu correo institucional: nombreapellido@alumnado.esada.es",
    enviando: "Enviando…", enviar: "Enviar código", demo: "Modo pruebas (sin Gmail configurado): tu código es",
    enviado1: "Hemos enviado un código de 6 dígitos a", enviado2: "Caduca en 10 minutos.",
    codigo: "Código de verificación", seisDigitos: "Escribe los 6 dígitos del código.",
    comprobando: "Comprobando…", entrar: "Entrar", reenviar: "Reenviar código", cambiar: "Cambiar correo",
    hasEntrado: "Has entrado con", verReserva: "Ver mi reserva", continuar: "Continuar", otroCorreo: "Entrar con otro correo",
  },
  en: {
    etiqueta: "SIGN IN", antes: "Before entering the meadow...", revisa: "Check your email", dentro: "You're already in",
    intro: "Only ESADA students can book. Confirm your university email and we'll send you a code.",
    correo: "University email", formato: "Format: nameSurname@alumnado.esada.es",
    correoMal: "Use your university email: nameSurname@alumnado.esada.es",
    enviando: "Sending…", enviar: "Send code", demo: "Test mode (Gmail not set up): your code is",
    enviado1: "We've sent a 6-digit code to", enviado2: "It expires in 10 minutes.",
    codigo: "Verification code", seisDigitos: "Type the 6 digits of the code.",
    comprobando: "Checking…", entrar: "Sign in", reenviar: "Resend code", cambiar: "Change email",
    hasEntrado: "You're signed in as", verReserva: "See my booking", continuar: "Continue", otroCorreo: "Sign in with another email",
  },
};

export default function Acceso() {
  const router = useRouter();
  const t = useTextos(TEXTOS);
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
      setError(t.correoMal);
      return;
    }
    setEnviando(true);
    const res = await api("/api/acceso/codigo", { metodo: "POST", datos: { email: limpio } });
    setEnviando(false);
    if (!res.ok) return setError(res.mensaje);
    setError("");
    setCorreo(limpio);
    guardarBorrador({ correo: limpio });
    setAviso(res.codigoDemo ? `${t.demo} ${res.codigoDemo}` : "");
    setFase("codigo");
  }

  async function verificar(e) {
    e.preventDefault();
    if (!/^\d{6}$/.test(codigo.trim())) return setError(t.seisDigitos);
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
          <p className="acceso__etiqueta">{t.etiqueta}</p>
          <h1 className="acceso__titulo">{fase === "codigo" ? t.revisa : fase === "sesion" ? t.dentro : t.antes}</h1>

          {fase === "sesion" ? (
            <>
              <p className="acceso__intro">{t.hasEntrado} <b>{sesion.email}</b>.</p>
              <button className="boton" type="button" onClick={() => router.push(sesion.destino)}>
                {sesion.destino === "/mi-reserva" ? t.verReserva : t.continuar}
              </button>
              <p className="acceso__ayuda acceso__enlaces">
                <button type="button" onClick={otroCorreo}>{t.otroCorreo}</button>
              </p>
            </>
          ) : fase === "correo" ? (
            <>
              <p className="acceso__intro">{t.intro}</p>
              <form onSubmit={pedirCodigo} noValidate>
                <label htmlFor="correo">{t.correo}</label>
                <input className="campo" id="correo" type="email" placeholder="E-mail" autoComplete="email" required
                  value={correo} onChange={(e) => setCorreo(e.target.value)}
                  aria-invalid={error ? "true" : undefined} aria-describedby="correo-ayuda correo-error" />
                <p className="acceso__ayuda" id="correo-ayuda">{t.formato}</p>
                <p className="error" id="correo-error" role="alert">{error}</p>
                <button className="boton" type="submit" disabled={enviando}>{enviando ? t.enviando : t.enviar}</button>
              </form>
            </>
          ) : (
            <>
              <p className="acceso__intro">{t.enviado1} <b>{correo}</b>. {t.enviado2}</p>
              {aviso && <p className="acceso__demo" role="status">{aviso}</p>}
              <form onSubmit={verificar} noValidate>
                <label htmlFor="codigo">{t.codigo}</label>
                <input className="campo campo--codigo" id="codigo" ref={campoCodigo} inputMode="numeric" autoComplete="one-time-code"
                  maxLength={6} placeholder="000000" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                  aria-invalid={error ? "true" : undefined} aria-describedby="codigo-error" />
                <p className="error" id="codigo-error" role="alert">{error}</p>
                <button className="boton" type="submit" disabled={enviando}>{enviando ? t.comprobando : t.entrar}</button>
              </form>
              <p className="acceso__ayuda acceso__enlaces">
                <button type="button" onClick={() => pedirCodigo()}>{t.reenviar}</button>
                {" · "}
                <button type="button" onClick={() => { setFase("correo"); setCodigo(""); setError(""); }}>{t.cambiar}</button>
              </p>
            </>
          )}
        </section>
      </main>
      <PiePagina />
    </div>
  );
}
