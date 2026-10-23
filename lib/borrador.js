// Lilium · Borrador de la reserva en el navegador (integrantes, turno elegido…) mientras se completan los pasos.
// La reserva de verdad solo se crea en el servidor al confirmar.
const CLAVE = "lilium-reserva";

export function leerBorrador() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE)) || {};
  } catch {
    return {};
  }
}

export function guardarBorrador(cambios) {
  const borrador = { ...leerBorrador(), ...cambios };
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(borrador));
  } catch {
    // Sin almacenamiento (modo privado): el paso actual sigue funcionando
  }
  return borrador;
}

export function borrarBorrador() {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {}
}

/** Llama a la API y devuelve el JSON (también en los errores, que traen `mensaje`). */
export async function api(ruta, { metodo = "GET", datos } = {}) {
  // Si el servidor tarda más de 20 s, se avisa en vez de esperar para siempre
  const control = new AbortController();
  const limite = setTimeout(() => control.abort(), 20000);
  try {
    const res = await fetch(ruta, {
      method: metodo,
      headers: datos ? { "Content-Type": "application/json" } : undefined,
      body: datos ? JSON.stringify(datos) : undefined,
      cache: "no-store",
      signal: control.signal,
    });
    const texto = await res.text();
    try {
      return JSON.parse(texto);
    } catch {
      return { ok: false, mensaje: `El servidor ha respondido con un error (${res.status}). Inténtalo de nuevo en unos minutos.` };
    }
  } catch (e) {
    return {
      ok: false,
      mensaje: e?.name === "AbortError"
        ? "El servidor está tardando demasiado. Recarga la página."
        : "No hay conexión. Revisa tu internet e inténtalo de nuevo.",
    };
  } finally {
    clearTimeout(limite);
  }
}
