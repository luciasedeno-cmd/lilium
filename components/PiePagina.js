"use client";
// Pie de página (Figma: Footer), el mismo en todas las páginas.
// Siempre lleva encima el encaje verde, que sube sobre el final de la página (ver .footer__encaje en home.css):
// por eso cada página deja unos 150 px libres al final.
import Link from "next/link";
import { CONTACTO } from "@/lib/config";
import { useTextos } from "./Idioma";

const TEXTOS = {
  es: { terminos: "Términos y Condiciones", legal: "Aviso Legal", admin: "Admin" },
  en: { terminos: "Terms and Conditions", legal: "Legal Notice", admin: "Admin" },
};

export default function PiePagina() {
  const t = useTextos(TEXTOS);
  return (
    <footer className="footer">
      <div className="footer__encaje" aria-hidden="true" />
      <p>Lilium · Escape Room ESADA · 2026</p>
      <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a>
      <Link href="/terminos">{t.terminos}</Link>
      <a href="#">{t.legal}</a>
      {/* Panel del equipo (con el correo y la contraseña de admin) */}
      <Link href="/admin">{t.admin}</Link>
    </footer>
  );
}
