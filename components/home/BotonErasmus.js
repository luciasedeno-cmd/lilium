"use client";
// Botón «Ver turnos Erasmus» de la Home: lleva a la reserva mostrando solo los turnos Erasmus
import { useRouter } from "next/navigation";
import { guardarBorrador } from "@/lib/borrador";
import { useIdioma } from "@/components/Idioma";

export default function BotonErasmus() {
  const router = useRouter();
  const { idioma } = useIdioma();
  function verTurnos() {
    guardarBorrador({ soloErasmus: true }); // el paso 2 mostrará solo los turnos Erasmus
    router.push("/reserva/integrantes");
  }
  return (
    <button type="button" className="boton-reserva erasmus__boton" onClick={verTurnos}>
      {idioma === "en" ? "See Erasmus sessions" : "Ver turnos Erasmus"}
    </button>
  );
}
