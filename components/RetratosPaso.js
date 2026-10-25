// Dos retratos ovalados con marco de encaje a los lados del paso 1 (Figma «PAG RESERVA - INTEGRANTES»).
// Van en los márgenes, a la altura del formulario (no junto al título), uno más alto que el otro.
// Solo decoran: se ocultan en pantallas estrechas para no tapar nada.
export default function RetratosPaso() {
  return (
    <div className="retratos-paso" aria-hidden="true">
      <span className="retrato-paso retrato-paso--izq">
        <img className="retrato-paso__marco" src="/assets/img/marco-retrato.png" alt="" />
        <img className="retrato-paso__foto" src="/assets/img/retrato.png" alt="" />
      </span>
      <img className="retrato-paso retrato-paso--der" src="/assets/img/retrato-lirios.png" width="145" height="191" alt="" />
    </div>
  );
}
