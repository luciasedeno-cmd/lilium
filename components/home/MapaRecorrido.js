"use client";
// «Cuándo» y «Dónde» sobre el mapa antiguo con el recorrido de pasitos (diseño de Figma «Mapa Recorrido»).
// Al llegar a esta parte de la página (una sola vez):
//   1) cae la chincheta de la derecha, 2) los pasitos van apareciendo de derecha a izquierda,
//   3) al llegar, cae la chincheta de la izquierda. Las dos tarjetas entran suaves y luego flotan un poco.
// Cómo está hecho: el mapa, los pasitos y las chinchetas van en un mismo dibujo (SVG) con las medidas
// del Figma (1440 × 589), así siempre coinciden. Los pasitos son una imagen aparte (pasos.webp) que se
// descubre con una «máscara»: una línea invisible que sigue el camino y se va alargando (CSS).
// Imágenes: public/assets/img/mapa/ (mapa.webp = mapa sin pasitos; pasos.webp = solo los pasitos).
// Sin animación (si el sistema pide «reducir movimiento») se ve todo directamente.
// Estilos: bloque «Cuándo y dónde» de app/estilos/home.css.
import { useEffect, useRef, useState } from "react";

// Parte del mapa que se ve: entero en el ordenador; en el móvil, solo la zona del recorrido
const VISTA = { ordenador: "0 0 1440 589", movil: "325 0 620 589" };

// Camino de los pasitos (de la chincheta derecha a la izquierda), medido sobre el mapa del Figma
const CAMINO = "M916 324 L828 134 L813 133 L362 369";

// Chincheta del Figma (29 × 42), la misma para las dos
const CHINCHETA =
  "M14.5 0C6.48357 0 0 6.573 0 14.7C0 25.725 14.5 42 14.5 42C14.5 42 29 25.725 29 14.7C29 6.573 22.5164 0 14.5 0ZM14.5 19.95C13.1266 19.95 11.8094 19.3969 10.8382 18.4123C9.86703 17.4277 9.32143 16.0924 9.32143 14.7C9.32143 13.3076 9.86703 11.9723 10.8382 10.9877C11.8094 10.0031 13.1266 9.45 14.5 9.45C15.8734 9.45 17.1906 10.0031 18.1618 10.9877C19.133 11.9723 19.6786 13.3076 19.6786 14.7C19.6786 16.0924 19.133 17.4277 18.1618 18.4123C17.1906 19.3969 15.8734 19.95 14.5 19.95Z";

/** Icono del calendario con reloj (Figma «andrsrxn:calendar-clock») */
function IconoCalendario() {
  return (
    <svg className="ubicacion__icono" width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <path opacity="0.2" d="M27.435 33.3748C30.7321 33.3748 33.405 30.702 33.405 27.4048C33.405 24.1077 30.7321 21.4348 27.435 21.4348C24.1379 21.4348 21.465 24.1077 21.465 27.4048C21.465 30.702 24.1379 33.3748 27.435 33.3748Z" fill="#732F23" />
      <path opacity="0.2" d="M29.97 5.18994H6.015C5.18657 5.18994 4.515 5.86151 4.515 6.68994V11.5649C4.515 12.3934 5.18657 13.0649 6.015 13.0649H29.97C30.7984 13.0649 31.47 12.3934 31.47 11.5649V6.68994C31.47 5.86151 30.7984 5.18994 29.97 5.18994Z" fill="#732F23" />
      <path d="M27.435 33.3748C30.7321 33.3748 33.405 30.702 33.405 27.4048C33.405 24.1077 30.7321 21.4348 27.435 21.4348C24.1379 21.4348 21.465 24.1077 21.465 27.4048C21.465 30.702 24.1379 33.3748 27.435 33.3748Z" stroke="#732F23" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28.98 28.7249L27.99 28.0649C27.66 27.8399 27.495 27.7349 27.405 27.5699C27.315 27.4049 27.315 27.2099 27.315 26.8199V25.3649M31.5 17.7749V14.1749C31.485 9.92989 31.47 7.81489 30.15 6.50989C28.845 5.18989 26.73 5.18989 22.5 5.18989H13.5C9.27 5.18989 7.14 5.18989 5.835 6.50989C4.53 7.82989 4.5 9.95989 4.5 14.1899V23.1449C4.5 27.3899 4.5 29.5049 5.82 30.8249C7.125 32.1449 9.255 32.1449 13.5 32.1449H17.52M11.52 2.63989V7.73989M24.54 2.63989V7.73989M30.84 13.0499H5.745" stroke="#732F23" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Icono del marcador de mapa (Figma «mdi:map-marker-outline») */
function IconoMarcador() {
  return (
    <svg className="ubicacion__icono" width="35" height="37" viewBox="0 0 35 37" fill="none" aria-hidden="true">
      <path d="M17.5 9.975C18.5893 9.975 19.634 10.3833 20.4042 11.11C21.1744 11.8367 21.6071 12.8223 21.6071 13.85C21.6071 14.3589 21.5009 14.8628 21.2945 15.3329C21.0881 15.803 20.7856 16.2302 20.4042 16.59C20.0228 16.9499 19.57 17.2353 19.0717 17.43C18.5734 17.6248 18.0394 17.725 17.5 17.725C16.4107 17.725 15.3661 17.3167 14.5958 16.59C13.8256 15.8633 13.3929 14.8777 13.3929 13.85C13.3929 12.8223 13.8256 11.8367 14.5958 11.11C15.3661 10.3833 16.4107 9.975 17.5 9.975ZM17.5 3C20.55 3 23.4751 4.14312 25.6317 6.17789C27.7884 8.21266 29 10.9724 29 13.85C29 21.9875 17.5 34 17.5 34C17.5 34 6 21.9875 6 13.85C6 10.9724 7.2116 8.21266 9.36827 6.17789C11.5249 4.14312 14.45 3 17.5 3ZM17.5 6.1C15.3214 6.1 13.2321 6.91652 11.6916 8.36992C10.1511 9.82333 9.28571 11.7946 9.28571 13.85C9.28571 15.4 9.28571 18.5 17.5 28.9005C25.7143 18.5 25.7143 15.4 25.7143 13.85C25.7143 11.7946 24.8489 9.82333 23.3084 8.36992C21.7679 6.91652 19.6786 6.1 17.5 6.1Z" fill="#732F23" />
    </svg>
  );
}

export default function MapaRecorrido({ textos, fecha, lugar }) {
  const seccion = useRef(null);
  const [vista, setVista] = useState(VISTA.ordenador);

  // En el móvil se enseña solo la zona del recorrido (si no, quedaría diminuto)
  useEffect(() => {
    const movil = window.matchMedia("(max-width: 760px)");
    const cambiar = () => setVista(movil.matches ? VISTA.movil : VISTA.ordenador);
    cambiar();
    movil.addEventListener("change", cambiar);
    return () => movil.removeEventListener("change", cambiar);
  }, []);

  // La animación empieza la primera vez que la sección se ve bien en pantalla
  useEffect(() => {
    const sec = seccion.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    sec.setAttribute("data-anim", ""); // desde aquí, pasitos, chinchetas y tarjetas esperan escondidos
    const vigia = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          sec.setAttribute("data-visible", "");
          vigia.disconnect();
        }
      },
      { threshold: 0.45 }
    );
    vigia.observe(sec);
    return () => vigia.disconnect();
  }, []);

  return (
    <section className="ubicacion" data-fondo="claro" ref={seccion}>
      <svg className="ubicacion__mapa" viewBox={vista} preserveAspectRatio="xMidYMid slice" role="img" aria-label={textos.mapaAlt}>
        <defs>
          {/* Máscara: lo blanco deja ver los pasitos; la línea crece de la chincheta derecha a la izquierda */}
          <mask id="mascara-pasos" maskUnits="userSpaceOnUse" x="0" y="0" width="1440" height="589">
            <path className="ubicacion__trazo" d={CAMINO} pathLength="1" fill="none" stroke="#fff" strokeWidth="30"
              strokeLinecap="round" strokeLinejoin="round" />
          </mask>
        </defs>
        <image href="/assets/img/mapa/mapa.webp" width="1440" height="589" />
        <image href="/assets/img/mapa/pasos.webp" width="1440" height="589" mask="url(#mascara-pasos)" />
        <path className="ubicacion__chincheta ubicacion__chincheta--der" d={CHINCHETA} fill="#8E3526" transform="translate(902 282)" />
        <path className="ubicacion__chincheta ubicacion__chincheta--izq" d={CHINCHETA} fill="#8E3526" transform="translate(348 326)" />
      </svg>

      <div className="ubicacion__dato ubicacion__dato--cuando">
        <IconoCalendario />
        <div>
          <h2>{textos.cuando}</h2>
          <p>{fecha}</p>
          <p>{textos.cuandoNota}</p>
        </div>
      </div>
      <div className="ubicacion__dato ubicacion__dato--donde">
        <IconoMarcador />
        <div>
          <h2>{textos.donde}</h2>
          <p>{lugar}</p>
        </div>
      </div>
    </section>
  );
}
