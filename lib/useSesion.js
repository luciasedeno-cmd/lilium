"use client";
// Comprueba la sesión al abrir una página de la reserva y redirige si hace falta
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./borrador";

/**
 * @param {"reserva" | "mi-reserva"} tipo  reserva: hace falta sesión y NO tener reserva; mi-reserva: hace falta tener reserva
 * @returns el correo de la sesión, o null mientras se comprueba
 */
export function useSesion(tipo) {
  const router = useRouter();
  const [email, setEmail] = useState(null);

  useEffect(() => {
    api("/api/sesion").then((s) => {
      if (!s.email) return router.replace("/acceso");
      if (tipo === "reserva" && s.tieneReserva) return router.replace("/mi-reserva");
      if (tipo === "mi-reserva" && !s.tieneReserva) return router.replace("/reserva/integrantes");
      setEmail(s.email);
    });
  }, [router, tipo]);

  return email;
}
