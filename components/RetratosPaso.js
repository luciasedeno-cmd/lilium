// Dos retratos ovalados con marco de encaje a los lados de las páginas de los pasos (Figma «PAG RESERVA - INTEGRANTES»).
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
