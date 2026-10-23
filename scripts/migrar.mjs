// Lilium · Crea las tablas en la base de datos: `DATABASE_URL=... npm run db:migrar`
import { readFile } from "node:fs/promises";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL. Ejemplo: DATABASE_URL='postgresql://...' npm run db:migrar");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });
const esquema = await readFile(new URL("../db/esquema.sql", import.meta.url), "utf8");

try {
  await sql.unsafe(esquema);
  const [{ n }] = await sql`select count(*)::int as n from turnos`;
  console.log(`Base de datos lista. Turnos: ${n}.`);
} catch (error) {
  console.error("Error al crear las tablas:", error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
