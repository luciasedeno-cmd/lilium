"use client";
// Comprueba la sesión al abrir una página de la reserva y redirige si hace falta
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./borrador";

/**
 * @param {"reserva" | "mi-reserva"} tipo  reserva: hace falta sesión y NO tener reserva; mi-reserva: hace falta tener reserva
 * @returns { email, error }: el correo de la sesión (null mientras se comprueba) y, si algo falla, el motivo
 */
export function useSesion(tipo) {
  const router = useRouter();
  const [email, setEmail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/sesion").then((s) => {
      // Si el servidor falla, se explica en pantalla en vez de mandar a otra página
      if (!s.ok) return setError(s.mensaje);
      if (!s.email) return router.replace("/acceso");
      if (tipo === "reserva" && s.tieneReserva) return router.replace("/mi-reserva");
      if (tipo === "mi-reserva" && !s.tieneReserva) return router.replace("/inicio");
      setEmail(s.email);
    });
  }, [router, tipo]);

  return { email, error };
}
