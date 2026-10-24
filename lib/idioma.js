// Lilium · Idioma de la web (español o inglés). Se recuerda en una cookie del navegador.
export const IDIOMAS = ["es", "en"];
export const COOKIE_IDIOMA = "lilium_idioma";
export const idiomaValido = (valor) => (IDIOMAS.includes(valor) ? valor : "es");

/** Fecha y hora con el formato de cada idioma (p. ej. «lunes, 26 de octubre, 11:04» / «Monday, 26 October, 11:04») */
export const fechaHora = (fecha, idioma) =>
  new Date(fecha).toLocaleString(idioma === "en" ? "en-GB" : "es-ES", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });
