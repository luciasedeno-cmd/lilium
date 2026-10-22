// Lilium · Cuenta atrás hasta el 2 de noviembre de 2026, 00:00 (hora peninsular, CET)

const APERTURA = new Date("2026-11-02T00:00:00+01:00");

const cuenta = document.querySelector(".cuenta");
const etiqueta = document.querySelector("[data-cuenta-etiqueta]");
const campos = {
  dias: document.querySelector("[data-dias]"),
  horas: document.querySelector("[data-horas]"),
  minutos: document.querySelector("[data-minutos]"),
  segundos: document.querySelector("[data-segundos]"),
};

const dosCifras = (n) => String(n).padStart(2, "0");

function actualizar() {
  const restante = APERTURA - Date.now();

  if (restante <= 0) {
    cuenta.classList.add("is-abierto");
    etiqueta.textContent = "El prado ya está abierto";
    clearInterval(intervalo);
    return;
  }

  const segundosTotales = Math.floor(restante / 1000);
  campos.dias.textContent = dosCifras(Math.floor(segundosTotales / 86400));
  campos.horas.textContent = dosCifras(Math.floor((segundosTotales % 86400) / 3600));
  campos.minutos.textContent = dosCifras(Math.floor((segundosTotales % 3600) / 60));
  campos.segundos.textContent = dosCifras(segundosTotales % 60);
}

const intervalo = setInterval(actualizar, 1000);
actualizar();
