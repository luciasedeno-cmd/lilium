"use client";
// Cuenta atrás para volver a pedir un código: tras enviarlo, hay que esperar unos segundos.
// const [segundos, empezar] = useEspera(); … empezar(10) → segundos baja 10, 9, 8… hasta 0.
import { useEffect, useState } from "react";

export function useEspera() {
  const [segundos, setSegundos] = useState(0);
  useEffect(() => {
    if (segundos <= 0) return;
    const id = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [segundos]);
  return [segundos, setSegundos];
}
