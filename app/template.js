// Transición entre páginas: cada vez que se cambia de página, un velo crema con el lirio
// cubre la pantalla un instante y se retira hacia arriba, como una cortina.
// Solo con CSS (ver .transicion en app/estilos/transiciones.css): no hace falta JavaScript.
export default function Plantilla({ children }) {
  return (
    <>
      <div className="transicion" aria-hidden="true">
        <img className="transicion__lirio" src="/assets/img/icono-lirio.webp" width="99" height="80" alt="" />
      </div>
      {children}
    </>
  );
}
