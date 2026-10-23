// Las direcciones antiguas (.html) redirigen a las nuevas para no romper enlaces ya compartidos
const antiguas = {
  "/index.html": "/",
  "/inicio.html": "/inicio",
  "/acceso.html": "/acceso",
  "/reserva-integrantes.html": "/reserva/integrantes",
  "/reserva-hora.html": "/reserva/hora",
  "/reserva-confirmacion.html": "/reserva/confirmacion",
  "/mi-reserva.html": "/mi-reserva",
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return Object.entries(antiguas).map(([source, destination]) => ({ source, destination, permanent: true }));
  },
};

export default nextConfig;
