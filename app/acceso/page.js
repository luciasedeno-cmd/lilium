"use client";
// Acceso: el correo institucional recibe un código de 6 dígitos para entrar
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NavReserva from "@/components/NavReserva";
import PiePagina from "@/components/PiePagina";
import { useTextos } from "@/components/Idioma";
import { api, leerBorrador, guardarBorrador } from "@/lib/borrador";
import { useEspera } from "@/lib/useEspera";

// Segundos que hay que esperar para pedir otro código (los mismos que en lib/codigos.js)
const ESPERA_REENVIO = 10;

// En el navegador solo se mira que tenga forma de correo: el servidor decide si se puede entrar
// (alumnado de ESADA o, como excepción, los correos autorizados por el equipo, como el del profesor)
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TEXTOS = {
  es: {
    etiqueta: "ACCESO", antes: "Antes de entrar al prado...", revisa: "Revisa tu correo", dentro: "Ya estás dentro",
    intro: "Pueden reservar el alumnado y el profesorado de ESADA. Confirma tu correo institucional y te enviaremos un código.",
    correo: "Correo institucional", formato: "Formato: nombreapellido@alumnado.esada.es (profesorado: nombre@esada.es)",
    correoMal: "Usa tu correo institucional: nombreapellido@alumnado.esada.es (profesorado: nombre@esada.es)",
    enviando: "Enviando…", enviar: "Enviar código", demo: "Modo pruebas (sin Gmail configurado): tu código es",
    pistaCorreo: "nombreapellido@alumnado.esada.es", pistaCodigo: "******",
    reenviarEn: (s) => `Podrás pedir otro código en ${s} s`,
    enviado1: "Hemos enviado un código de 6 dígitos a", enviado2: "Caduca en 10 minutos.",
    codigo: "Código de 6 cifras que te hemos enviado", seisDigitos: "Escribe los 6 dígitos del código.",
    comprobando: "Comprobando…", entrar: "Entrar", correcto: "Código correcto. Entrando…", entrando: "Entrando…", reenviar: "Reenviar código", cambiar: "Cambiar correo",
    hasEntrado: "Has entrado con", verReserva: "Ver mi reserva", continuar: "Continuar", otroCorreo: "Entrar con otro correo",
  },
  en: {
    etiqueta: "SIGN IN", antes: "Before entering the meadow...", revisa: "Check your email", dentro: "You're already in",
    intro: "ESADA students and teaching staff can book. Confirm your university email and we'll send you a code.",
    correo: "University email", formato: "Format: nameSurname@alumnado.esada.es (teaching staff: name@esada.es)",
    correoMal: "Use your university email: nameSurname@alumnado.esada.es (teaching staff: name@esada.es)",
    enviando: "Sending…", enviar: "Send code", demo: "Test mode (Gmail not set up): your code is",
    pistaCorreo: "namesurname@alumnado.esada.es", pistaCodigo: "******",
    reenviarEn: (s) => `You can ask for another code in ${s} s`,
    enviado1: "We've sent a 6-digit code to", enviado2: "It expires in 10 minutes.",
    codigo: "6-digit code we've sent you", seisDigitos: "Type the 6 digits of the code.",
    comprobando: "Checking…", entrar: "Sign in", correcto: "Correct code. Signing you in…", entrando: "Signing in…", reenviar: "Resend code", cambiar: "Change email",
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
  const [correcto, setCorrecto] = useState(false); // el código ya se ha comprobado y es bueno
  const [espera, empezarEspera] = useEspera(); // segundos para poder pedir otro código
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
    if (espera > 0) return;
    setEnviando(true);
    const res = await api("/api/acceso/codigo", { metodo: "POST", datos: { email: limpio } });
    setEnviando(false);
    if (!res.ok) return setError(res.mensaje);
    setError("");
    empezarEspera(ESPERA_REENVIO);
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
    // Código correcto: mensaje, pantalla de carga y carga completa de la página siguiente.
    // (Se recarga entera a propósito: así no se usa ninguna copia guardada de cuando aún no habías entrado,
    // que era lo que hacía que la página «no avanzara».)
    setError("");
    setCorrecto(true);
    setTimeout(() => window.location.assign(res.tieneReserva ? "/mi-reserva" : "/inicio"), 700);
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
              <button className="boton" type="button" onClick={() => window.location.assign(sesion.destino)}>
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
                <input className="campo" id="correo" type="email" placeholder={t.pistaCorreo} autoComplete="email" required
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
                  maxLength={6} placeholder={t.pistaCodigo} value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                  aria-invalid={error ? "true" : undefined} aria-describedby="codigo-error" />
                {/* Debajo del código: si es correcto (verde) o el error (naranja) */}
                {correcto ? (
                  <p className="acceso__correcto" role="status">✓ {t.correcto}</p>
                ) : (
                  <p className="error" id="codigo-error" role="alert">{error}</p>
                )}
                <button className="boton" type="submit" disabled={enviando || correcto}>{enviando ? t.comprobando : correcto ? t.entrando : t.entrar}</button>
              </form>
              <p className="acceso__ayuda acceso__enlaces">
                {/* Reenviar: se puede pasados 10 s; mientras, se ve la cuenta atrás */}
                <button type="button" onClick={() => pedirCodigo()} disabled={espera > 0} aria-live="polite">
                  {espera > 0 ? t.reenviarEn(espera) : t.reenviar}
                </button>
                {" · "}
                <button type="button" onClick={() => { setFase("correo"); setCodigo(""); setError(""); }}>{t.cambiar}</button>
              </p>
            </>
          )}
        </section>
      </main>
      <PiePagina />
      {/* Pantalla de carga mientras se abre la web tras un código correcto */}
      {correcto && (
        <div className="carga" role="status">
          <img className="carga__lirio" src="/assets/img/icono-lirio.webp" width="99" height="80" alt="" />
          <img className="carga__logo" src="/assets/img/logo-lilium.webp" width="198" height="118" alt="Lilium" />
          <span className="carga__linea" aria-hidden="true"><span /></span>
          <p className="carga__texto">{t.correcto}</p>
        </div>
      )}
    </div>
  );
}
