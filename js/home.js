// Lilium · Home: menú móvil, carrusel "Cómo funciona" y preguntas frecuentes

// ---------- Menú móvil ----------
const header = document.querySelector(".header");
const botonMenu = document.querySelector(".header__menu");

botonMenu.addEventListener("click", () => {
  const abierto = header.classList.toggle("is-open");
  botonMenu.setAttribute("aria-expanded", String(abierto));
});

document.querySelectorAll(".header__nav a").forEach((enlace) => {
  enlace.addEventListener("click", () => {
    header.classList.remove("is-open");
    botonMenu.setAttribute("aria-expanded", "false");
  });
});

// ---------- Carrusel de pasos (variantes del componente "Cómo funciona") ----------
const PASOS = [
  {
    titulo: "Entra con tu correo",
    descripcion: ["Te mandamos un código a tu correo nombreapellido@alumnado.esada.es para que verifiques tu cuenta."],
  },
  {
    titulo: "Añade a tu grupo",
    descripcion: [
      "Escribe los correos de tu grupo (de 3 a 6 personas).",
      "El líder del grupo es quien hace la reserva.",
    ],
  },
  {
    titulo: "Elige hora",
    descripcion: ["Todo pasa un mismo día. Verás que grupos puedes abrir y cuáles necesitan ser completados. Elige una de las horas disponibles."],
  },
  {
    titulo: "Confirmad la reserva",
    descripcion: [
      "A cada persona le llega un correo. Tenéis 48 horas para confirmar o vuestra reserva se cancelará.",
      "La reserva seguirá para las personas que hayan confirmado.",
    ],
  },
  {
    titulo: "Recibe tu entrada",
    descripcion: ["A tu correo llega la entrada con un QR con un fragmento secreto que os ayudará una vez en el retiro."],
  },
];

const carrusel = document.querySelector(".pasos");
const barra = carrusel.querySelector("[data-paso-barra]");
const numero = carrusel.querySelector("[data-paso-numero]");
const titulo = carrusel.querySelector("[data-paso-titulo]");
const descripcion = carrusel.querySelector("[data-paso-descripcion]");
const puntos = carrusel.querySelectorAll(".pasos__puntos button");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let pasoActual = 0;
let temporizador = null;

function mostrarPaso(indice) {
  pasoActual = (indice + PASOS.length) % PASOS.length;
  const paso = PASOS[pasoActual];

  carrusel.classList.add("is-cambiando");
  setTimeout(() => {
    barra.src = `assets/svg/progreso-${pasoActual + 1}.svg`;
    numero.textContent = `/0${pasoActual + 1}`;
    titulo.textContent = paso.titulo;
    descripcion.replaceChildren(
      ...paso.descripcion.map((texto) => {
        const p = document.createElement("p");
        p.textContent = texto;
        return p;
      })
    );
    puntos.forEach((punto, i) => punto.setAttribute("aria-selected", String(i === pasoActual)));
    carrusel.classList.remove("is-cambiando");
  }, reduceMotion ? 0 : 250);
}

function iniciarAutoplay() {
  if (reduceMotion) return;
  detenerAutoplay();
  temporizador = setInterval(() => mostrarPaso(pasoActual + 1), 6000);
}

function detenerAutoplay() {
  clearInterval(temporizador);
}

puntos.forEach((punto, i) => {
  punto.addEventListener("click", () => {
    mostrarPaso(i);
    iniciarAutoplay();
  });
});

carrusel.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") mostrarPaso(pasoActual + 1);
  if (e.key === "ArrowLeft") mostrarPaso(pasoActual - 1);
});

carrusel.addEventListener("mouseenter", detenerAutoplay);
carrusel.addEventListener("mouseleave", iniciarAutoplay);
iniciarAutoplay();

// ---------- Preguntas frecuentes (acordeón) ----------
const itemsFaq = document.querySelectorAll(".faq__item");

itemsFaq.forEach((item) => {
  const boton = item.querySelector(".faq__pregunta");
  boton.addEventListener("click", () => {
    const abrir = !item.classList.contains("is-open");
    itemsFaq.forEach((otro) => {
      otro.classList.remove("is-open");
      otro.querySelector(".faq__pregunta").setAttribute("aria-expanded", "false");
    });
    if (abrir) {
      item.classList.add("is-open");
      boton.setAttribute("aria-expanded", "true");
    }
  });
});
