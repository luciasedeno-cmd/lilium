// Lilium · Códigos de acceso de 6 dígitos (se guarda solo su hash)
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { db } from "./db";

const MINUTOS_VALIDEZ = 10;
const SEGUNDOS_ENTRE_ENVIOS = 60;
const MAX_INTENTOS = 5;

const hash = (email, codigo) =>
  createHash("sha256").update(`${process.env.SESSION_SECRET}:${email}:${codigo}`).digest("hex");

/** Crea un código nuevo. Si se pidió otro hace menos de un minuto, devuelve los segundos que faltan. */
export async function nuevoCodigo(email) {
  const sql = db();
  const [previo] = await sql`select enviado from codigos where email = ${email}`;
  if (previo) {
    const espera = SEGUNDOS_ENTRE_ENVIOS - Math.floor((Date.now() - new Date(previo.enviado).getTime()) / 1000);
    if (espera > 0) return { ok: false, espera };
  }
  const codigo = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await sql`
    insert into codigos (email, hash, expira, enviado, intentos)
    values (${email}, ${hash(email, codigo)}, now() + make_interval(mins => ${MINUTOS_VALIDEZ}), now(), 0)
    on conflict (email) do update set hash = excluded.hash, expira = excluded.expira, enviado = now(), intentos = 0`;
  return { ok: true, codigo };
}

/** Comprueba el código. Tras 5 intentos fallidos hay que pedir otro. */
export async function comprobarCodigo(email, codigo) {
  const sql = db();
  const [fila] = await sql`select * from codigos where email = ${email}`;
  if (!fila) return { ok: false, error: "sin_codigo" };
  if (new Date(fila.expira) < new Date()) return { ok: false, error: "caducado" };
  if (fila.intentos >= MAX_INTENTOS) return { ok: false, error: "intentos" };

  const esperado = Buffer.from(fila.hash, "hex");
  const recibido = Buffer.from(hash(email, String(codigo || "").trim()), "hex");
  if (!timingSafeEqual(esperado, recibido)) {
    await sql`update codigos set intentos = intentos + 1 where email = ${email}`;
    return { ok: false, error: "incorrecto" };
  }
  await sql`delete from codigos where email = ${email}`;
  return { ok: true };
}
