// Pie de página (Figma: Footer), el mismo en todas las páginas
import Link from "next/link";
import { CONTACTO } from "@/lib/config";

export default function PiePagina() {
  return (
    <footer className="footer">
      <p>Lilium · Escape Room ESADA · 2026</p>
      <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a>
      <Link href="/terminos">Términos y Condiciones</Link>
      <a href="#">Aviso Legal</a>
    </footer>
  );
}
