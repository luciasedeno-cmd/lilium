"use client";
// Confirma la plaza con el token del correo (con un clic, para que los lectores de correo no confirmen solos)
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/borrador";

export default function BotonConfirmar({ token, texto }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function confirmar() {
    setEnviando(true);
    const r = await api("/api/confirmar", { metodo: "POST", datos: { token } });
    setEnviando(false);
    if (!r.ok) return setError(r.mensaje);
    router.replace("/mi-reserva?confirmado=1");
  }

  return (
    <>
      <button className="boton" type="button" onClick={confirmar} disabled={enviando}>{enviando ? "Confirmando…" : texto}</button>
      <p className="error" role="alert">{error}</p>
    </>
  );
}
