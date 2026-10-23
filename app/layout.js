import "./estilos/base.css";
import "./estilos/home.css";
import "./estilos/reserva.css";
import "./estilos/cuenta-atras.css";
import "./estilos/extra.css";

export const metadata = {
  title: "Lilium · Escape Room ESADA",
  description: "Lilium, el escape room de ESADA: cinco guías, un destino.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
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
        {children}
      </body>
    </html>
  );
}
