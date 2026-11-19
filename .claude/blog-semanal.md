# Tarea semanal: los artículos del blog

Decidido por Iván el 19/11/2026: un blog que salga «casi solo», para salir más en Google, **con su «sí» antes de publicar**
[«Con mi sí»]. Pidió «un par de artículos cada semana». Esta tarea los escribe y los deja en la dirección de pruebas; a la web
de verdad no sale nada sin que Iván diga «sí» a esos artículos.

## Antes de escribir

1. Lee el manual de esta carpeta (`.claude/CLAUDE.md`) y lo que enlaza: `~/Desktop/Claude-Inventos/CLAUDE.md`, el `INDICE.md` de
   `VIBRA-negocio/` y `lo-aprendido.md`.
2. Lee `~/Desktop/Claude-Inventos/Agente-Marketing-Ventas/VOZ-VIBRA.md` y `VIBRA-negocio/03-marca.md` (voz y palabras prohibidas).
3. `git pull` en `main`. Mira qué artículos hay ya en `tools/blog/articulos/` y los temas en `tools/blog/temas.md`.

## Qué se escribe

- **Dos artículos por semana**, si hay dos temas con datos de verdad. Si solo hay uno bueno, uno, y se le dice a Iván por qué.
  Mejor uno bueno que dos de relleno: Google castiga los textos en serie que no aportan nada («abuso de contenido a escala»).
- El tema, de `tools/blog/temas.md`: primero lo de temporada (lo que pasa en las próximas 2 a 6 semanas), luego lo que más
  busque la gente de Lleida. Temas nuevos, al final de la lista. Nunca recetas genéricas, sartenes ni temas sin relación con Vibra.
- Cada artículo, en **castellano y catalán** (`es.html` y `ca.html`), de 400 a 900 palabras, con una búsqueda clara a la que
  apunta (en el título, el h1, la descripción y el primer párrafo, sin repetirla a la fuerza).
- Formato: copia la carpeta `tools/blog/articulos/2026-11-19-cena-de-empresa/` y sigue el comentario de datos que explica
  `tools/blog.js`. Los enlaces del cuerpo van desde la carpeta del blog: `../carta.html`, `../grupos.html`, `../reservar.html`.
  Al menos un enlace a una página de la web que venga a cuento.

## Lo que no se escribe nunca (si hace falta, se le pregunta a Iván y el artículo espera)

- **Un dato que no esté en la base (`VIBRA-negocio/`) o publicado ya en la web.** Precios, platos, horarios y cierres, de ahí.
  Un dato de fuera (fechas de una fiesta, un cine, una calle) solo con su fuente oficial, y se le enseña a Iván la fuente.
- **Lo que solo decide Iván**: «sin gluten», «casero», «artesano», «vegano» (salvo «Pídela con pan vegano y es vegana»),
  alérgenos, años de historia, y el origen o la maduración de la carne (está en duda: `03-marca.md`, «Lo que no cuadra»).
- **Cifras que se quedan viejas**: número de reseñas, cuántas hamburguesas hay, «desde que abrimos en…».
- **Nada de dentro**: costes, márgenes, ventas, proveedores, el banco, nóminas, nombres del equipo.
- Las muletillas prohibidas de VOZ-VIBRA, la urgencia inventada, «street food cuidada» y «familia» o «tribu».
- No se inventa nada para rellenar: ni anécdotas, ni clientes, ni frases de nadie.

## Cómo se deja listo

1. `node tools/blog.js` y `node tools/enlaces.js` (tiene que decir «Todo correcto»).
2. Arranca el servidor «vibra» y mira el artículo nuevo en el navegador de la app, en ordenador y en móvil, y la portada del
   blog (`/blog/` y `/ca/blog/`). Sin errores en la consola.
3. Marca el tema en `tools/blog/temas.md` con la fecha y la carpeta.
4. Commit en `main` («Blog: <título>») y `git push origin main`. **Nunca** `main:produccion` desde esta tarea sin su «sí».
5. Mensaje para Iván, corto, para el móvil:
   - El título de cada artículo y su enlace de pruebas: `https://iruizpastilla-sketch.github.io/vibra/blog/<slug>.html`.
   - En dos líneas, qué cuenta y a qué búsqueda apunta.
   - Lo que necesita su decisión (un dato que falta, una frase que toca algo suyo), si lo hay.
   - La pregunta: «¿Lo publico?».

## Cuando Iván dice «sí»

1. `git log --oneline origin/produccion..main`: si en `main` hay algo más que estos artículos, se le dice qué es y se espera
   a que diga «sí» también a eso.
2. `git push origin main:produccion` (la subida a FastComet sale sola), y después
   `node tools/dia0-check.js https://vibrastreetfood.com`.
3. Abre el artículo en vibrastreetfood.com y comprueba que se ve. Se lo dices con el enlace.
4. Si dice que no o pide cambios: se cambian y se le vuelve a enseñar; si no lo quiere, se borra la carpeta del artículo,
   `node tools/blog.js` (borra sus páginas) y commit en `main`.
