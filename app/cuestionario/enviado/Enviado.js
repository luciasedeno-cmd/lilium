"use client";
// «¡Tu respuesta ha sido enviada correctamente!»: pantalla completa con el cuadro del retiro de fondo.
import Link from "next/link";
import NavReserva from "@/components/NavReserva";
import PiePagina from "@/components/PiePagina";
import { useTextos } from "@/components/Idioma";

const TEXTOS = {
  es: {
    etiqueta: "CUESTIONARIO",
    titulo: "¡Tu respuesta ha sido enviada correctamente!",
    texto: "Gracias por dedicarnos este momento. Tus palabras ayudan a que el retiro de Lilium florezca un poco más para quienes vengan detrás.",
    firma: "Las guías de Lilium",
    volver: "Volver a la web",
    otra: "Enviar otra respuesta",
  },
  en: {
    etiqueta: "QUESTIONNAIRE",
    titulo: "Your answer has been sent successfully!",
    texto: "Thank you for giving us this moment. Your words help Lilium's retreat bloom a little more for those who come after you.",
    firma: "The guides of Lilium",
    volver: "Back to the website",
    otra: "Send another answer",
  },
};

export default function Enviado() {
  const t = useTextos(TEXTOS);
  return (
    <>
      <NavReserva />
      <main className="cues-enviado" data-fondo="oscuro" data-principal>
        <div className="cues-enviado__tarjeta">
          <img className="cues-enviado__lirio" src="/assets/img/icono-lirio.png" width="99" height="80" alt="" />
          <p className="cues__etiqueta">{t.etiqueta}</p>
          <h1 className="cues-enviado__titulo">{t.titulo}</h1>
          <p className="cues-enviado__texto">{t.texto}</p>
          <p className="cues-enviado__firma">{t.firma}</p>
          <div className="cues-enviado__botones">
            <Link href="/" className="ll-btn ll-btn--lg ll-btn--primary">{t.volver}</Link>
            <Link href="/cuestionario" className="ll-btn ll-btn--md ll-btn--secondary">{t.otra}</Link>
          </div>
        </div>
      </main>
      <PiePagina />
    </>
  );
}
