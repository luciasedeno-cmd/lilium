// Lilium · Fotos de perfil del diseño: se reparten entre los integrantes en orden
const FOTOS = ["perfil-1.png", "perfil-2.png", "perfil-3.png"];

export const fotoDe = (indice) => `/assets/img/${FOTOS[indice % FOTOS.length]}`;
