# Almanaque

Colección de juegos de palabras: la portada común de los juegos diarios en español
(Calendas, Periplo, Mentidero, Trampantojo, Atlas, Gentilicio). Es una PWA instalable hecha con HTML, CSS y
JavaScript, sin dependencias ni compilación.

## Archivos

| Archivo | Para qué sirve |
| --- | --- |
| `games.json` | **La lista de juegos.** La portada se genera a partir de aquí. |
| `icons/` | Iconos de los juegos (SVG o PNG) y de la app. |
| `index.html`, `styles.css`, `app.js` | La portada. No hay que tocarlos para añadir juegos. |
| `manifest.json`, `sw.js` | PWA: instalación y funcionamiento sin conexión. |

## Añadir un juego

1. Guarda su icono en `icons/` (por ejemplo `icons/mijuego.svg`). Funciona mejor si es
   cuadrado, de 128 × 128 o más, y tiene su propio fondo.
2. Añade una entrada al final de `games.json` (no olvides la coma tras la entrada anterior):

   ```json
   {
     "id": "mijuego",
     "nombre": "Mi juego",
     "subtitulo": "Frase corta en cursiva",
     "descripcion": "Una o dos líneas que expliquen de qué va.",
     "url": "https://joseleking.github.io/MiJuego/",
     "color": "#2f6b3a",
     "icono": "icons/mijuego.svg",
     "estado": "nuevo"
   }
   ```

   - `id`: único, en minúsculas y sin espacios. Se usa para recordar si se ha jugado hoy.
   - `color`: color de acento de la hoja (nombre, filete superior y sello de «hecho»).
     En modo oscuro se aclara solo.
   - `estado` es opcional: `"nuevo"` añade una etiqueta; `"proximamente"` muestra la hoja
     sin enlace (también se puede dejar `url` vacío). Bórralo cuando ya no haga falta.
   - El orden de las hojas es el del archivo.
3. En el **repositorio del juego**, añade la mano ☜ para volver a Almanaque: copia
   `para-los-juegos/volver-almanaque.js` junto al `index.html` del juego (en un proyecto
   con Vite, en `public/`) y añade en su `index.html`:

   ```html
   <script src="volver-almanaque.js" defer></script>
   ```

   Almanaque abre cada juego con `?desde=almanaque&juego=<id>`; solo entonces el juego
   muestra una franja «☜ Almanaque» arriba, que se mantiene mientras siga abierta esa
   pestaña. Quien entre al juego directamente no la ve. Si el juego guarda archivos para
   jugar sin conexión, añade también `volver-almanaque.js` a esa lista. Si el juego pone
   versión a sus archivos (`app.js?v=3`), pónsela también a este
   (`volver-almanaque.js?v=2`) y súbela cada vez que lo actualices: si no, el navegador
   puede seguir usando la copia antigua.
4. Para que la hoja salga como «Hecho», el juego debe avisar cuando la partida de hoy esté
   terminada (y también al abrirlo si ya lo estaba):

   ```js
   window.almanaqueHecho && window.almanaqueHecho();
   ```

   Al volver con la mano ☜, Almanaque recibe `?hecho=<id>` y marca la hoja. Abrir un juego
   sin jugarlo no la marca.

   En la pantalla final, junto a «Compartir resultado», el juego puede poner un botón de
   volver con el estilo que quiera:

   ```html
   <a class="boton" data-almanaque-volver hidden href="https://joseleking.github.io/Almanaque/">☜ Regresar al Almanaque</a>
   ```

   `volver-almanaque.js` lo muestra solo si se llegó desde Almanaque y lo lleva al mismo
   sitio que la mano ☜.
5. Sube los cambios a GitHub. Si quieres que quien tenga la app instalada vea el cambio
   también sin conexión, actualiza la versión de la caché (siguiente apartado).

## Actualizar la versión de la caché

El service worker guarda una copia de la portada para abrirla sin conexión. Con conexión
siempre se descarga la versión más reciente, pero conviene cambiar la versión en cada
publicación para que la copia guardada se renueve entera y se borre la antigua:

1. Abre `sw.js`.
2. Cambia la constante del principio, por ejemplo de `'v1'` a `'v2'`:

   ```js
   const CACHE_VERSION = 'v2';
   ```
3. Sube los cambios. Al abrir la app, el navegador detecta que `sw.js` ha cambiado,
   instala el nuevo y elimina la caché vieja.

Si añades un archivo nuevo a la portada (no un juego), inclúyelo también en la lista
`ARCHIVOS` de `sw.js`. Los iconos de los juegos no hace falta: se leen de `games.json`.

## Probar en local

El service worker y `games.json` necesitan un servidor (no funciona abriendo el archivo
con doble clic). Desde la carpeta del proyecto:

```sh
python3 -m http.server 8000
```

y abre <http://localhost:8000>. Para probar el modo sin conexión: DevTools → Application →
Service Workers (o Network → Offline) y recarga.

## Publicar en GitHub Pages

1. Sube el repositorio a GitHub (rama `main`).
2. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a
   branch**, rama `main`, carpeta `/ (root)`. Guarda.
3. En un par de minutos estará en `https://<usuario>.github.io/Almanaque/`.

Todas las rutas son relativas, así que funciona igual en una subcarpeta o en un dominio
propio.
