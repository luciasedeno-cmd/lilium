# Lilium · notas para Claude

## Cómo hablar con el equipo
- El equipo no sabe nada de programación ni de webs. Cada paso que se les pida hacer, o que haga Claude, va con una explicación sencilla de **qué es** y **para qué sirve**, sin jerga (o explicando cada palabra técnica con una comparación de la vida diaria).
- Instrucciones paso a paso, numeradas, diciendo exactamente dónde pulsar y qué deberían ver si ha ido bien.

## Ramas
- Se trabaja **solo en la rama `main`**. No crear ramas nuevas: los commits van directamente a `main` y se suben con `git push origin main`.
- Cada push a `main` se despliega en Vercel (producción). No subir nada a medias: compilar (`npm run build`) y probar antes.

## Tecnología
- Next.js (App Router) en JavaScript, sin TypeScript: el equipo no conoce React, así que el código debe ser sencillo y comentado en español.
- Backend: rutas de API de Next.js en Node (`app/api/`). Base de datos Postgres en Supabase, accedida con el paquete `postgres` desde el servidor (nunca desde el navegador).
- Correos con Gmail (Nodemailer + contraseña de aplicación).
- Variables de entorno: ver `.env.example`.

## Estructura
- Orden de las páginas: 1) `/acceso` (confirmar el correo, ocupa justo la pantalla, sin scroll) → 2) `/inicio` (Home) → 3) reserva en 3 pasos. Quien ya tiene reserva (como líder o dentro de un grupo) va a `/mi-reserva` al entrar.
- Pop-up Erasmus (`components/ErasmusBanner.js`): solo en `/inicio` y solo la primera vez en ese navegador (se guarda en localStorage). Fondos: `public/assets/img/erasmus-encaje.webp` (ordenador) y `erasmus-encaje-movil.webp` (móvil).
- Home: cabecera fina (72 px); «¿Cómo reservar?» pasa a la sección roja de los pasos con un degradado (ya no se tapan); preguntas frecuentes con altura fija y respuesta que se despliega suave (no mueve la página).
- **Idioma ES / EN** (`components/Idioma.js`, cookie `lilium_idioma`): cada página tiene sus textos en un objeto `TEXTOS = { es: {...}, en: {...} }`. En componentes de cliente `useIdioma()` / `useTextos(TEXTOS)`; en páginas del servidor `await idiomaActual()` (`lib/idiomaServidor.js`). Los mensajes del servidor se traducen en el navegador con `lib/mensajesEn.js`. Los correos siguen solo en español.
- «¿Cómo reservar?» (`components/home/ComoReservar.js`): al bajar, el fondo pasa de crema a terracota y el texto al revés (variables `--p` y `--pt`).
- Cabecera de los pasos (`components/PasoCabecera.js`): 3 puntos animados + «PASO N DE 3»; los puntos anteriores llevan atrás. Pie común: `components/PiePagina.js`.
- `/mi-reserva` (Figma «PAG RESERVA - INTEGRANTES B»): «Tu reserva» (QR, fragmento, cambiar de hora), «Mi equipo» (la líder pulsa «Editar reserva» para quitar ✕ o añadir integrantes y «Guardar cambios» → `/api/mi-reserva/integrantes`) y «Antes de venir…».
- `middleware.js`: además, sin sesión, `/inicio`, `/reserva/*` y `/mi-reserva` llevan a `/acceso`.
- `app/page.js`: portada con la cuenta atrás hasta el 30 de octubre (Figma «CUENTA REGRESIVA»: cuadro a pantalla completa, «FALTAN» y horas:minutos:segundos, con las horas totales); al llegar la fecha redirige a `/acceso`.
- **Web cerrada hasta el 30 de octubre** (`middleware.js` + `lib/previa.js`): sin la «llave de pruebas» solo se ven la cuenta atrás, `/admin` y los enlaces de los correos (`/confirmar`, `/entrada`); todo lo demás vuelve a `/` y la API responde 403. El botón «Admin» de la cuenta atrás → `/admin`: `lilium@esada.es` + contraseña de `ADMIN_CLAVE` (solo en Vercel, nunca en el código) da la llave (cookie `lilium_previa`, 30 días). Con la llave, cualquier correo @alumnado.esada.es puede entrar y reservar para probar. Desde la apertura la puerta desaparece sola.
- `/acceso` con la sesión abierta no salta: muestra «Ya estás dentro» con «Continuar» y «Entrar con otro correo».
- `app/inicio`, `app/acceso`, `app/reserva/{integrantes,hora,confirmacion}`, `app/mi-reserva`: páginas de la web.
- `app/confirmar/[token]`: enlace del correo para confirmar la plaza. `app/entrada/[token]`: lo que abre el QR de la entrada.
- `app/estilos/`: CSS del diseño (`base`, `home`, `reserva`, `cuenta-atras`) y `extra.css` para lo añadido con el backend.
- `components/`: piezas de React. `lib/`: configuración del evento (`config.js`), base de datos, sesión, correo y reglas de reserva (`reservas.js`).
- `db/esquema.sql`: tablas y turnos del día. Se aplica con `npm run db:migrar`.
- `db/borrar-reservas.sql`: vacía todas las reservas (los turnos se quedan).
- `db/cambiar-turnos.sql`: para cambiar los turnos desde el SQL Editor de Supabase (borra las reservas que haya).
- Iconos de perfil (`public/assets/img/perfiles/`, 10 símbolos × 6 colores): `lib/fotos.js` → `iconosDe(correos)` da a cada persona uno «al azar» fijo según su correo, sin repetir símbolo ni color dentro del grupo.
- `public/assets/`: imágenes y SVG. `public/prototipo.html`: prototipo antiguo de una sola página (solo referencia).
- `.github/workflows/recordatorios.yml`: llama cada hora a `/api/cron` (plazo de 48 h y recordatorios).
- Diseño de referencia en Figma: https://www.figma.com/design/b0Z4AyQb7eFU08qjStTuFz/Lilium-Figma?node-id=1-6

## Reglas de las reservas (en `lib/reservas.js`)
- De 3 a 6 personas por turno; con menos de 3 solo se puede unir a un grupo en formación.
- Un correo = una reserva. El líder queda confirmado; el resto tiene 48 h para confirmar desde su correo o pierde la plaza. El plazo es de cada persona (`miembros.invitado_en`; vacío = fecha de la reserva) y el recordatorio también (`miembros.recordatorio_en`).
- Hay que aceptar los Términos y Condiciones (`app/terminos`, incluye el aviso de luces y efectos) para reservar y para confirmar la plaza; se guarda en `miembros.terminos_en`.
- Lista de espera («Avísame si se libera una plaza», tabla `lista_espera`): al cancelar, cambiar de hora o en `/api/cron` se escribe una vez a quien esperaba (`lib/avisos.js`).
- Fragmentos de la frase secreta (`lib/fragmentos.js`): «Dos rostros, un espíritu: elegid bien.», 6 palabras con número romano. Se reparten al azar (fijo por sala) entre todas las personas de la sala; con menos de 6, a alguien le tocan varias.
- `lib/esquema.js` crea sola en Supabase lo que falte (tablas o columnas nuevas): no hace falta pegar SQL tras cada cambio.
