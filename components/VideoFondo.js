"use client";
// Vídeo de fondo (el cuadro de Thomas Cole en movimiento), en bucle y sin sonido.
// Se usa en la portada de la Home y en la cuenta atrás. En el móvil se carga una versión más ligera.
// Mientras carga (o si el vídeo no puede reproducirse) se ve su primer fotograma (poster).
// Con «reducir movimiento» el CSS lo esconde y queda el cuadro quieto de siempre.
import { useEffect, useRef } from "react";

export default function VideoFondo({ className = "" }) {
  const video = useRef(null);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    // El iPhone solo reproduce solo un vídeo si está silenciado: se marca otra vez por si acaso
    v.muted = true;
    v.play?.().catch(() => {}); // si el navegador no deja, se queda el primer fotograma
  }, []);

  return (
    <video ref={video} className={`video-fondo ${className}`} autoPlay muted loop playsInline preload="auto"
      poster="/assets/video/retiro-poster.webp" aria-hidden="true" tabIndex={-1}>
      {/* El navegador coge el primero que pueda reproducir: móvil (más ligero) o pantalla grande; MP4 o WebM */}
      <source src="/assets/video/retiro-movil.mp4" type="video/mp4" media="(max-width: 760px)" />
      <source src="/assets/video/retiro-movil.webm" type="video/webm" media="(max-width: 760px)" />
      <source src="/assets/video/retiro.mp4" type="video/mp4" />
      <source src="/assets/video/retiro.webm" type="video/webm" />
    </video>
  );
}
