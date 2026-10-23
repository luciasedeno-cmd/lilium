// Lilium · Conexión a la base de datos Postgres (Supabase)
import postgres from "postgres";

const globalParaDb = globalThis;

function crearConexion() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Falta la variable de entorno DATABASE_URL (cadena de conexión de Supabase).");
  }
  return postgres(process.env.DATABASE_URL, {
    // El pooler de Supabase en modo transacción (puerto 6543) no admite sentencias preparadas
    prepare: false,
    max: 1,
    idle_timeout: 20,
    onnotice: () => {},
  });
}

/** Una sola conexión por proceso (en desarrollo, también entre recargas del servidor). */
export function db() {
  if (!globalParaDb.__liliumSql) globalParaDb.__liliumSql = crearConexion();
  return globalParaDb.__liliumSql;
}
