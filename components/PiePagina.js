"use client";
// Pie de página, el mismo en todas las páginas. De arriba abajo (todo centrado):
//   lirio · ✉ correo de contacto · Términos y Condiciones ✦ Aviso Legal · línea fina · «Escape Room ESADA · 2026 · Admin»
// («Admin» más pequeño y claro: es solo para el equipo). Estilos: bloque «Footer» de app/estilos/home.css.
// Siempre lleva encima el encaje verde, que sube sobre el final de la página (ver .footer__encaje):
// por eso cada página deja unos 150 px libres al final.
import Link from "next/link";
import { CONTACTO } from "@/lib/config";
import { useTextos } from "./Idioma";

const TEXTOS = {
  es: { terminos: "Términos y Condiciones", legal: "Aviso Legal", admin: "Admin", correo: "Escríbenos a" },
  en: { terminos: "Terms and Conditions", legal: "Legal Notice", admin: "Admin", correo: "Write to us at" },
};

export default function PiePagina() {
  const t = useTextos(TEXTOS);
  return (
    <footer className="footer">
      <div className="footer__encaje" aria-hidden="true" />
      <img className="footer__lirio" src="/assets/img/icono-lirio.webp" width="99" height="80" alt="" />
      <a className="footer__correo" href={`mailto:${CONTACTO}`} aria-label={`${t.correo} ${CONTACTO}`}>
        <span aria-hidden="true">✉</span> {CONTACTO}
      </a>
      <nav className="footer__enlaces">
        <Link href="/terminos">{t.terminos}</Link>
        <span className="footer__sep" aria-hidden="true">✦</span>
        <Link href="/aviso-legal">{t.legal}</Link>
      </nav>
      <p className="footer__pie">
        Escape Room ESADA · 2026 &nbsp;·&nbsp; {/* Panel del equipo (con el correo y la contraseña de admin) */}
        <Link className="footer__admin" href="/admin">{t.admin}</Link>
      </p>
    </footer>
  );
}
