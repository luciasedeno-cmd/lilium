// Lilium · Conexión a la base de datos Postgres (Supabase)
//
// En Vercel la web «se duerme» entre visitas. Si se guardara una conexión abierta, al despertar
// podría estar cortada y la web se quedaría esperando. Por eso cada petición abre su propia
// conexión y la cierra al terminar (ver conDb), y nunca se espera más de 10 s a conectar.
import postgres from "postgres";
import { AsyncLocalStorage } from "node:async_hooks";

const peticion = new AsyncLocalStorage();

function crearConexion() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Falta la variable de entorno DATABASE_URL (cadena de conexión de Supabase).");
  }
  return postgres(process.env.DATABASE_URL, {
    // El pooler de Supabase en modo transacción (puerto 6543) no admite sentencias preparadas
    prepare: false,
    max: 1,
    connect_timeout: 10,
    idle_timeout: 5,
    max_lifetime: 60,
    onnotice: () => {},
  });
}

/** Conexión de la petición actual (se crea la primera vez que se usa). */
export function db() {
  const almacen = peticion.getStore();
  if (!almacen) {
    // Fuera de conDb (por ejemplo, scripts): una conexión compartida
    globalThis.__liliumSql ||= crearConexion();
    return globalThis.__liliumSql;
  }
  almacen.sql ||= crearConexion();
  return almacen.sql;
}

/** Ejecuta `fn` con su propia conexión a la base de datos y la cierra al terminar. */
export async function conDb(fn) {
  const almacen = {};
  try {
    return await peticion.run(almacen, fn);
  } finally {
    if (almacen.sql) await almacen.sql.end({ timeout: 2 }).catch(() => {});
  }
}
