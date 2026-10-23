// Cabecera de cada paso de la reserva: botón atrás + «Paso N de 3» + barra de progreso
import Link from "next/link";

const RELLENO = { 1: "34.93%", 2: "69.86%", 3: "calc(100% + 2px)" };

export default function PasoCabecera({ paso, atras }) {
  return (
    <div className="paso-cabecera">
      <Link className="boton-atras" href={atras} aria-label="Volver">
        <img className="boton-atras__base" src="/assets/svg/boton-atras.svg" width="51" height="51" alt="" />
        <img className="boton-atras__hover" src="/assets/svg/boton-atras-hover.svg" width="51" height="51" alt="" />
      </Link>
      <p className="paso-cabecera__titulo">Paso {paso} de 3</p>
      <div className="barra-pasos" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={paso}>
        <div className="barra-pasos__relleno" style={{ width: RELLENO[paso] }} />
      </div>
    </div>
  );
}
