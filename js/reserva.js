// Lilium · Flujo de reserva: acceso → integrantes → hora → confirmación → mi reserva.
// El estado se guarda en sessionStorage para pasar los datos entre páginas.

const CLAVE = "lilium-reserva";
const DOMINIO = /^[a-z0-9._-]+@alumnado\.esada\.es$/i;
const MAX_PERSONAS = 6;
const MIN_SALA_NUEVA = 3;
const FOTOS = ["perfil-2.png", "perfil-3.png", "perfil-1.png"];

function leerEstado() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE)) || {};
  } catch {
    return {};
  }
}

function guardarEstado(cambios) {
  const estado = { ...leerEstado(), ...cambios };
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch {
    // Sin almacenamiento (modo privado): el flujo sigue funcionando en la página actual.
  }
  return estado;
}

const estado = leerEstado();
const correoLider = estado.correo || "luciamartin@alumnado.esada.es";
const integrantes = estado.integrantes || [];

function fotoIntegrante(i) {
  return `assets/img/${FOTOS[i % FOTOS.length]}`;
}

function crearImg(src, size, className) {
  const img = document.createElement("img");
  img.src = src;
  img.width = size;
  img.height = size;
  img.alt = "";
  if (className) img.className = className;
  return img;
}

// ---------- Selector de idioma ----------
document.querySelectorAll(".idioma button").forEach((boton, _, botones) => {
  boton.addEventListener("click", () => {
    botones.forEach((b) => b.setAttribute("aria-pressed", String(b === boton)));
    document.documentElement.lang = boton.dataset.idioma;
  });
});

const pagina = document.body.dataset.pagina;

// ---------- Acceso ----------
if (pagina === "acceso") {
  const form = document.getElementById("form-acceso");
  const campo = document.getElementById("correo");
  const error = document.getElementById("correo-error");

  if (estado.correo) campo.value = estado.correo;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const correo = campo.value.trim().toLowerCase();
    if (!DOMINIO.test(correo)) {
      campo.setAttribute("aria-invalid", "true");
      error.textContent = "Usa tu correo institucional: nombreapellido@alumnado.esada.es";
      campo.focus();
      return;
    }
    campo.removeAttribute("aria-invalid");
    guardarEstado({ correo });
    window.location.href = "reserva-integrantes.html";
  });
}

// ---------- Paso 1 · Integrantes ----------
if (pagina === "integrantes") {
  const lista = document.querySelector("[data-lista-integrantes]");
  const huecos = document.querySelector("[data-huecos]");
  const contador = document.querySelector("[data-contador]");
  const continuar = document.querySelector("[data-continuar-integrantes]");
  const form = document.getElementById("form-integrante");
  const campo = document.getElementById("correo-integrante");
  const error = document.getElementById("integrante-error");

  document.querySelector("[data-correo-lider]").textContent = correoLider;

  function pintar() {
    lista.querySelectorAll("[data-extra]").forEach((li) => li.remove());
    integrantes.forEach((correo, i) => {
      const li = document.createElement("li");
      li.className = "integrante";
      li.dataset.extra = "";
      li.innerHTML = `
        <div class="integrante__datos">
          <p class="integrante__nombre">Integrante ${i + 2}</p>
          <p class="integrante__correo"></p>
        </div>
        <button class="integrante__quitar" type="button">Quitar</button>`;
      li.prepend(crearImg(fotoIntegrante(i), 94));
      li.querySelector(".integrante__correo").textContent = correo;
      li.querySelector("button").addEventListener("click", () => {
        integrantes.splice(i, 1);
        guardarEstado({ integrantes });
        pintar();
      });
      lista.append(li);
    });

    // Resumen del grupo: fotos + huecos discontinuos hasta completar la sala mínima
    const total = integrantes.length + 1;
    const vacios = total < MIN_SALA_NUEVA ? MIN_SALA_NUEVA - total : total < MAX_PERSONAS ? 1 : 0;
    huecos.replaceChildren();
    const lider = crearImg("assets/img/avatar-lider.png", 94);
    lider.style.left = "10px";
    huecos.append(lider);
    integrantes.forEach((_, i) => {
      const img = crearImg(fotoIntegrante(i), 94);
      img.style.left = `${10 + 74 * (i + 1)}px`;
      huecos.append(img);
    });
    for (let i = 0; i < vacios; i++) {
      const hueco = crearImg("assets/svg/hueco-integrante.svg", 114, "hueco");
      hueco.style.left = `${74 * (total + i)}px`;
      huecos.append(hueco);
    }
    contador.textContent = total;

    continuar.textContent = total >= MIN_SALA_NUEVA
      ? "Continuar y abrir sala nueva →"
      : "Continuar y unirme a un grupo →";
    campo.disabled = total >= MAX_PERSONAS;
    campo.placeholder = total >= MAX_PERSONAS ? "Grupo completo" : "E-mail";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const correo = campo.value.trim().toLowerCase();
    let mensaje = "";
    if (!DOMINIO.test(correo)) mensaje = "El correo debe ser nombreapellido@alumnado.esada.es";
    else if (correo === correoLider || integrantes.includes(correo)) mensaje = "Ese correo ya está en el grupo.";
    else if (integrantes.length + 1 >= MAX_PERSONAS) mensaje = "Máximo 6 personas por turno.";

    error.textContent = mensaje;
    campo.toggleAttribute("aria-invalid", Boolean(mensaje));
    if (mensaje) return;

    integrantes.push(correo);
    guardarEstado({ integrantes });
    campo.value = "";
    pintar();
    campo.focus();
  });

  pintar();
}

// ---------- Paso 2 · Hora ----------
if (pagina === "hora") {
  const total = integrantes.length + 1;
  const salas = document.querySelectorAll(".sala");
  const continuar = document.querySelector("[data-continuar-hora]");
  const error = document.getElementById("hora-error");

  document.querySelector("[data-eres]").textContent = total === 1 ? "Eres 1." : `Sois ${total}.`;
  document.querySelector("[data-eres-texto]").textContent = total >= MIN_SALA_NUEVA
    ? "Podéis abrir una sala libre o uniros a un grupo con hueco."
    : "Te mostramos los grupos en formación con hueco para vosotros.";

  let escogida = null;

  salas.forEach((sala) => {
    const plazas = MAX_PERSONAS - Number(sala.dataset.inscritos);
    const libre = sala.hasAttribute("data-libre");

    if (libre && total >= MIN_SALA_NUEVA) {
      sala.querySelector(".sala__candado").hidden = true;
      sala.querySelector(".sala__elegir").hidden = false;
    } else if (libre) {
      sala.classList.add("is-bloqueada");
      sala.setAttribute("aria-disabled", "true");
    }
    if (total > plazas) {
      sala.classList.add("is-llena");
      sala.setAttribute("aria-disabled", "true");
    }

    const elegir = () => {
      if (sala.getAttribute("aria-disabled") === "true") {
        error.textContent = libre && total < MIN_SALA_NUEVA
          ? "Necesitáis al menos 3 personas para abrir una sala libre."
          : "En este turno no queda hueco para todo el grupo.";
        return;
      }
      salas.forEach((s) => {
        s.classList.remove("is-escogida");
        s.setAttribute("aria-checked", "false");
      });
      sala.classList.add("is-escogida");
      sala.setAttribute("aria-checked", "true");
      escogida = sala;
      error.textContent = "";
    };

    sala.addEventListener("click", elegir);
    sala.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        elegir();
      }
    });

    if (estado.sala && estado.sala.hora === sala.dataset.hora && sala.getAttribute("aria-disabled") !== "true") {
      elegir();
    }
  });

  continuar.addEventListener("click", (e) => {
    if (!escogida) {
      e.preventDefault();
      error.textContent = "Elige un turno para continuar.";
      return;
    }
    guardarEstado({
      sala: {
        hora: escogida.dataset.hora,
        equipo: escogida.dataset.equipo,
        tipo: escogida.dataset.tipo,
      },
    });
  });
}

// ---------- Paso 3 · Confirmación y Mi reserva ----------
if (pagina === "confirmacion" || pagina === "mi-reserva") {
  if (estado.sala) {
    document.querySelectorAll("[data-turno]").forEach((el) => {
      el.textContent = estado.sala[el.dataset.turno];
    });
  }

  if (estado.correo) {
    const miembros = [correoLider, ...integrantes];
    const fotos = miembros.map((_, i) => (i === 0 ? "assets/img/perfil-1.png" : fotoIntegrante(i - 1)));
    const lista = document.querySelector("[data-lista-equipo]");
    const avatares = document.querySelector("[data-avatares-equipo]");
    const totalEl = document.querySelector("[data-total]");

    lista.replaceChildren(...miembros.map((correo, i) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="miembro">
          <div><p class="miembro__correo"></p><p class="miembro__estado"></p></div>
        </div>
        <img class="separador" src="assets/svg/linea-discontinua.svg" width="720" height="1" alt="">`;
      li.querySelector(".miembro").prepend(crearImg(fotos[i], 51));
      li.querySelector(".miembro__correo").textContent = correo;
      li.querySelector(".miembro__estado").textContent = i === 0
        ? "Líder · Confirmado automáticamente"
        : "Recibirá correo de confirmación";
      return li;
    }));
    avatares.replaceChildren(...fotos.map((src) => crearImg(src, 51)));
    if (totalEl) totalEl.textContent = miembros.length;
  }

  const confirmar = document.querySelector("[data-confirmar]");
  if (confirmar) {
    confirmar.addEventListener("click", () => guardarEstado({ confirmada: true }));
  }
}
