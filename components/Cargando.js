// Pantalla de espera de las páginas de reserva: «Cargando…» o, si algo ha fallado, el motivo
import NavReserva from "./NavReserva";

export default function Cargando({ error, texto = "Cargando…" }) {
  return (
    <>
      <NavReserva />
      <main>
        <div className="columna">
          {error ? (
            <p className="aviso-error" role="alert">{error}</p>
          ) : (
            <p className="cargando" role="status">{texto}</p>
          )}
        </div>
      </main>
    </>
  );
}
