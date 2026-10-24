"use client";
// Confirma la plaza con el token del correo (con un clic, para que los lectores de correo no confirmen solos)
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/borrador";
import AceptarTerminos from "./AceptarTerminos";
import { useIdioma } from "./Idioma";

// texto: { es, en } con el texto del botón en cada idioma
export default function BotonConfirmar({ token, texto, pedirTerminos = true }) {
  const { idioma } = useIdioma();
  const en = idioma === "en";
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [aceptado, setAceptado] = useState(!pedirTerminos);

  async function confirmar() {
    if (!aceptado) return setError(en ? "To confirm your place you must accept the Terms and Conditions." : "Para confirmar tu plaza tienes que aceptar los Términos y Condiciones.");
    setEnviando(true);
    const r = await api("/api/confirmar", { metodo: "POST", datos: { token, aceptaTerminos: true } });
    setEnviando(false);
    if (!r.ok) return setError(r.mensaje);
    router.replace("/mi-reserva?confirmado=1");
  }

  return (
    <>
      {pedirTerminos && <AceptarTerminos aceptado={aceptado} onCambiar={(v) => { setAceptado(v); if (v) setError(""); }} />}
      <button className="boton" type="button" onClick={confirmar} disabled={enviando} aria-disabled={aceptado ? undefined : "true"}>{enviando ? (en ? "Confirming…" : "Confirmando…") : texto[idioma]}</button>
      <p className="error" role="alert">{error}</p>
    </>
  );
}
