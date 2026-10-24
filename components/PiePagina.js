"use client";
// Pie de página (Figma: Footer), el mismo en todas las páginas
import Link from "next/link";
import { CONTACTO } from "@/lib/config";
import { useTextos } from "./Idioma";

const TEXTOS = {
  es: { terminos: "Términos y Condiciones", legal: "Aviso Legal" },
  en: { terminos: "Terms and Conditions", legal: "Legal Notice" },
};

export default function PiePagina() {
  const t = useTextos(TEXTOS);
  return (
    <footer className="footer">
      <p>Lilium · Escape Room ESADA · 2026</p>
      <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a>
      <Link href="/terminos">{t.terminos}</Link>
      <a href="#">{t.legal}</a>
    </footer>
  );
}
