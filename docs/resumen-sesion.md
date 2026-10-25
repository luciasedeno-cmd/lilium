# Lilium · Resumen del trabajo hecho (octubre 2026)

Resumen para quien siga con la web. Los detalles técnicos están en `CLAUDE.md`.

## Qué es y cómo está montado
- Web de reservas del escape room **Lilium** de ESADA (evento: viernes 6 de noviembre en Calle Trinidad, 4, Centro, 18001 Granada; reservas abren el 30 de octubre).
- **Next.js (JavaScript, sin TypeScript)** con rutas de API en `app/api/`, base de datos **Postgres en Supabase** y correos con **Gmail**.
- Se trabaja **solo en la rama `main`**; cada push a `main` se publica en **Vercel** (producción). Compilar con `npm run build` antes de subir.
- Las claves secretas van **solo en Vercel** (Settings → Environment Variables), nunca en el código: `DATABASE_URL`, `SESSION_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `CRON_SECRET`, `ADMIN_CLAVE`… (lista completa en `.env.example`).

## Recorrido de la web
1. **Cuenta atrás** (`/`): cuadro a pantalla completa, «FALTAN» y días:horas:min:seg, selector ES/EN y botón «Admin».
2. **Web cerrada hasta el 30 de octubre**: sin la «llave de pruebas» todo vuelve a la cuenta atrás. «Admin» → `/admin` → `lilium@esada.es` + contraseña de `ADMIN_CLAVE` da la llave (30 días) para probar.
3. **Acceso** (`/acceso`): correo @alumnado.esada.es + código de 6 cifras. Si ya hay sesión, muestra «Ya estás dentro».
4. **Inicio** (`/inicio`): portada, historia, «¿Cómo reservar?» (cambia de crema a terracota al bajar), carrusel de 5 pasos, ritual, cuándo/dónde, Erasmus, preguntas frecuentes y llamada final. Pop-up Erasmus solo la primera vez.
5. **Reserva en 3 pasos**: integrantes (como en Figma, con retratos) → hora (filtros y tarjetas) → revisión de la sala (como en Figma «PAG RESERVA - REVISION»: datos de la sala, fecha y llegada, equipo, anotaciones y tarjeta «Resumen» con las casillas de Términos y normas).
6. **Mi reserva** (`/mi-reserva`): QR de la entrada, fragmento secreto, cambiar de hora, cancelar; la líder puede **editar el grupo** (añadir / quitar).
7. **Cuestionario** (`/cuestionario`): encuesta anónima para después de la experiencia (como en Figma «PAG ENCUESTA»: 6 preguntas obligatorias en tarjetas de cristal sobre el cuadro del retiro) y, al enviarla, `/cuestionario/enviado`. No hay botón en la web: se comparte el enlace o un QR. Las respuestas se ven en Supabase → Table Editor → `cuestionario`.
8. Enlaces de los correos: `/confirmar/[token]` (confirmar plaza) y `/entrada/[token]` (lo que abre el QR en la puerta).

## Reglas de las reservas
- De 3 a 6 personas por turno; con 1 o 2 solo se puede entrar en un grupo en formación.
- Un correo = una reserva. La líder queda confirmada; cada integrante tiene **48 h** (desde que le invitan) para confirmar, con recordatorio 12 h antes.
- Lista de espera («Avísame si se libera una plaza»).
- Fragmentos de la frase «Dos rostros, un espíritu: elegid bien.» repartidos al azar en cada sala.
- Iconos de perfil al azar (fijos por correo) en `public/assets/img/perfiles/`.

## Diseño y comportamiento añadidos en esta sesión
- Diseño pasado desde Figma (Home, pasos, Mi reserva, cuenta atrás) con imágenes exportadas.
- **Barra de navegación única** en toda la web: transparente sobre la sección principal, cristal de color al bajar, cambia de color según el fondo y se esconde al bajar.
- **Idioma ES / EN** funcional en toda la web (los correos siguen solo en español).
- Pie fino, portada e historia a pantalla completa, preguntas frecuentes que se abren sin saltos.
- **«¿Cómo reservar?»** ocupa una pantalla; en cada paso cambia el color de fondo y la mano hace algo distinto (clavel, ramo, reloj, carta sellada, llave). Las manos 2–5 se crearon con la IA de Figma (están también en el archivo de Figma).
- Retrato de «¿Qué es Lilium?» con los ojos que siguen al ratón (en el móvil, miran hacia donde se toca). Entre secciones, encajes que suben al bajar para que no se vea el corte.
- **Home animada**: entrada de la portada, elementos que aparecen al bajar, parallax suave (portada, retrato, cuadros del ritual, preguntas, paisaje final) y salida de la portada que se funde con la historia. Correcciones: textos del ritual en verde (se leían mal), datos de «Cuándo / Dónde» sobre tarjetas de papel con punto terracota, y título de las preguntas en letra de mano como el resto.

- **Panel del equipo** (`/admin`, enlace «Admin» en el pie): lista de reservas por sala y grupo, plazas, «¿Ha venido?» (Sí/No) y «¿Ha valorado?».
- **Correos nuevos**: recordatorio el día antes y «¿Qué te pareció Lilium?» el día después (solo a quien no ha valorado). Todos los correos con la estética del diseño del equipo.
- Favicon del lirio (negro / blanco según el modo del dispositivo). QR del cuestionario para imprimir: `docs/qr-cuestionario.png`.

## Cosas pendientes o para revisar
- **Términos y Condiciones**: el texto es un borrador; revisarlo.
- **Traducciones al inglés**: escritas por Claude; conviene revisarlas. Los **correos** solo están en español, y el **fragmento secreto** también.
- **«Aviso Legal»** del pie todavía no lleva a ninguna página.
- **GitHub**: añadir los secretos `LILIUM_URL` y `CRON_SECRET` para que funcione la tarea de cada hora (recordatorios y lista de espera).
- Imágenes exportadas como captura desde Figma (el lirio, el retrato de la joven con lirios…): si se tienen los originales, cambiarlos para que se vean más nítidos.
- En el móvil la historia de la Home es algo más alta que una pantalla (texto + retrato no caben).
- **Antes del 30 de octubre**: borrar las reservas de prueba pegando `db/borrar-reservas.sql` en el SQL Editor de Supabase.
