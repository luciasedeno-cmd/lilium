"use client";
// Ficha que ve el equipo al escanear una entrada (boceto «Verificación con el QR»):
// sello verde «Asistencia registrada» / naranja «Ya había entrado» / rojo «Entrada no válida»,
// los datos de la persona y «Deshacer» por si se ha escaneado por error.
import { useState } from "react";

export default function EntradaEquipo({ estado: inicial, email, hora, turno, equipo, llegadas, total }) {
  const [estado, setEstado] = useState(inicial); // registrada | ya | deshecha | no_valida
  const [llegan, setLlegan] = useState(llegadas);
  const [ocupado, setOcupado] = useState(false);
  const [fallo, setFallo] = useState("");

  // Deshacer (asistencia sin marcar) o volver a registrarla
  async function cambiar(asistio) {
    setOcupado(true);
    setFallo("");
    try {
      const res = await fetch("/api/admin/asistencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, asistio }),
      });
      const r = await res.json();
      if (!r.ok) throw new Error(r.mensaje);
      setEstado(asistio ? "registrada" : "deshecha");
      setLlegan((n) => (n === null ? n : n + (asistio ? 1 : -1)));
    } catch (e) {
      setFallo(e.message || "No se ha podido guardar. Inténtalo de nuevo.");
    }
    setOcupado(false);
  }

  const SELLO = {
    registrada: { clase: "verde", simbolo: "✓", titulo: "Asistencia registrada" },
    ya: { clase: "naranja", simbolo: "!", titulo: "Ya había entrado" },
    deshecha: { clase: "gris", simbolo: "↺", titulo: "Asistencia deshecha" },
    no_valida: { clase: "rojo", simbolo: "✕", titulo: "Entrada no válida" },
  }[estado];

  return (
    <main className="puerta">
      <section className={`puerta__ficha puerta__ficha--${SELLO.clase}`} role="status">
        <img className="puerta__lirio" src="/assets/img/icono-lirio.webp" width="99" height="79" alt="" />
        <p className="puerta__etiqueta">ENTRADA LILIUM</p>
        <span className="puerta__sello" aria-hidden="true">{SELLO.simbolo}</span>
        <h1 className="puerta__titulo">{SELLO.titulo}</h1>

        {estado === "ya" && hora && (
          <p className="puerta__texto">Esta entrada se escaneó a las <b>{hora}</b>. No hace falta volver a registrarla.</p>
        )}
        {estado === "no_valida" && (
          <p className="puerta__texto">Esta entrada no existe, la reserva se ha cancelado o la plaza no se confirmó.</p>
        )}

        {email && (
          <dl className="puerta__datos">
            <div><dt>Correo</dt><dd>{email}</dd></div>
            {turno && <div><dt>Turno</dt><dd>{turno}</dd></div>}
            {equipo && <div><dt>Sala</dt><dd>{equipo}</dd></div>}
            {estado !== "no_valida" && llegan !== null && <div><dt>Grupo</dt><dd>{llegan} de {total} han llegado</dd></div>}
          </dl>
        )}

        {(estado === "registrada" || estado === "ya") && (
          <button type="button" className="puerta__boton puerta__boton--borde" disabled={ocupado} onClick={() => cambiar(null)}>
            {estado === "ya" ? "Deshacer asistencia" : "Deshacer"}
          </button>
        )}
        {estado === "deshecha" && (
          <button type="button" className="puerta__boton" disabled={ocupado} onClick={() => cambiar(true)}>Volver a registrar</button>
        )}
        {fallo && <p className="puerta__fallo" role="alert">{fallo}</p>}
        <p className="puerta__nota">Para escanear a la siguiente persona, usa otra vez la cámara.</p>
      </section>
    </main>
  );
}
