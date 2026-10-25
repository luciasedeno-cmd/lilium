import "./estilos/base.css";
import "./estilos/home.css";
import "./estilos/reserva.css";
import "./estilos/cuenta-atras.css";
import "./estilos/extra.css";
import "./estilos/lilium-ds.css";
import "./estilos/cuestionario.css";
import "./estilos/admin.css";
import { IdiomaProvider } from "@/components/Idioma";
import { idiomaActual } from "@/lib/idiomaServidor";

export const metadata = {
  title: "Lilium · Escape Room ESADA",
  description: "Lilium, el escape room de ESADA: cinco guías, un destino.",
  // Icono de la pestaña: el lirio, negro si el ordenador o el móvil está en modo claro y blanco en modo oscuro.
  // Van en /assets para que se vean también antes de la apertura (el guardián de la web no toca esa carpeta).
  icons: {
    icon: [
      { url: "/assets/favicon/lirio.svg", type: "image/svg+xml" },
      { url: "/assets/favicon/lirio-negro.png", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/assets/favicon/lirio-blanco.png", type: "image/png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/assets/favicon/apple-touch-icon.png",
  },
};

export default async function RootLayout({ children }) {
  // El idioma elegido (ES / EN) se recuerda en el navegador y se aplica a toda la web
  const idioma = await idiomaActual();
  return (
    <html lang={idioma}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Baskervville:wght@400;500;600;700&family=Inter:ital,wght@0,400;0,600;1,400&family=Luxurious+Script&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <IdiomaProvider inicial={idioma}>{children}</IdiomaProvider>
      </body>
    </html>
  );
}
