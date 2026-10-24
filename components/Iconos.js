// Iconitos dibujados a mano (SVG): siempre centrados dentro de su círculo
export const IconoCheck = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false">
    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconoCruz = ({ tamano = 13 }) => (
  <svg viewBox="0 0 24 24" width={tamano} height={tamano} aria-hidden="true" focusable="false">
    <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

export const IconoMas = ({ tamano = 26 }) => (
  <svg viewBox="0 0 24 24" width={tamano} height={tamano} aria-hidden="true" focusable="false">
    <path d="M12 4v16M4 12h16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
