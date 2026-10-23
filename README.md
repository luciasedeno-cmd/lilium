# Lilium · Escape Room ESADA

Web de reservas de Lilium: Next.js + Supabase (Postgres) + correos con Gmail, desplegada en Vercel.

## Puesta en marcha (una sola vez)

1. **Supabase**: crea un proyecto. En *Project Settings → Database → Connection string*, copia la cadena del **Transaction pooler** (puerto 6543).
2. **Crear las tablas**: en tu ordenador, con Node instalado:
   ```bash
   npm install
   DATABASE_URL='la-cadena-de-supabase' npm run db:migrar
   ```
   (También puedes pegar el contenido de `db/esquema.sql` en el *SQL Editor* de Supabase y ejecutarlo.)
   Los turnos del día están al final de ese archivo; cámbialos ahí o en la tabla `turnos` de Supabase.
3. **Gmail**: en la cuenta que enviará los correos, activa la verificación en dos pasos y crea una *contraseña de aplicación*.
4. **Vercel → Settings → Environment Variables**: añade `DATABASE_URL`, `SESSION_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD` y `CRON_SECRET` (ver `.env.example`). Después, vuelve a desplegar.
5. **GitHub → Settings → Secrets and variables → Actions**: añade `LILIUM_URL` (la URL de la web) y `CRON_SECRET` (el mismo valor que en Vercel) para los recordatorios automáticos.

## Probar antes del 30 de octubre

Hasta la fecha de apertura solo pueden entrar y reservar los **correos de prueba**: `luciasedeno@alumnado.esada.es` (en `lib/config.js`) y los que añadas en la variable `CORREOS_PRUEBA` de Vercel, separados por comas. Las personas que añadas a tu grupo reciben su correo y pueden confirmar normalmente. Para abrirlo a todo el mundo durante una prueba existe `PERMITIR_ANTES_DE_APERTURA=true`. Antes de abrir, **vacía las reservas de prueba** en Supabase (`truncate miembros, reservas, codigos cascade; update turnos set equipo = null;`).

## Trabajar en local

```bash
cp .env.example .env.local   # y rellena DATABASE_URL y SESSION_SECRET
npm run dev                  # http://localhost:3000
```
Sin Gmail configurado, los correos se muestran en la consola y el código de acceso aparece en pantalla.
