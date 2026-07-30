# Vibra Street Food — Guion de arranque de la web

> Documento de contexto para construir la web en Claude Code.
> Es el "intake": todo lo decidido, para que no haya que adivinar nada.
> Web de un restaurante real de Lleida. Se construye en Code, en su propia carpeta.

---

## 1. Qué es Vibra

- **Qué:** restaurante de street food. La hamburguesa es la estrella, pero también
  tapas, bocadillos, milanesas, ensalada y postres.
- **Dónde:** Lleida.
- **Público:** 20-50 años.
- **Ambiente:** animado, con energía.
- **Diferencial:** calidad de producto + equipo joven y cercano.
- **Claim de marca:** "SIENTE LA VIBRA".

## 2. Tono de la web

Descarado, joven, con humor, cercano. Se habla de tú. NADA formal ni acartonado.
Referencia real del tono (sacado de su propia carta):
- Burgers: "El motivo por el que has venido"
- Bocadillos: "Tienen muy pocos modales"
- Dips: "Dipea como si nadie te estuviera mirando"

## 3. Dirección visual

- **Web OSCURA:** fondo negro, con los colores de marca vibrando encima.
- **Colores oficiales (del brandbook):**
  - Amarillo/naranja `#F38F1C`
  - Rosa `#E83085`
  - Negro `#000000`
  - Degradado oficial amarillo→rosa (para fondos y elementos destacados)
- **Tipografías (del brandbook):** UT Bagh Display para titulares, Poppins para
  el cuerpo de texto. (Fuentes del logo: Empires / Days.)
- El detalle visual fino se ajustará iterando, viéndolo en el navegador. Aquí solo
  va la dirección general.

## 4. Estructura de la web (Fase 1)

| Sección | Qué es | Cómo se hace |
| --- | --- | --- |
| **Inicio** | Portada con impacto: qué es Vibra + botón Reservar | Estático |
| **Carta** | Menú navegable (NO pdf), por categorías, con fotos | Estático |
| **Sobre nosotros** | La historia, el equipo, el diferencial | Estático |
| **Contacto** | Dirección, mapa, horario, teléfono, cómo llegar | Estático |
| **Novedades** | "Burger del mes" y anuncios. Editable por el dueño | Estático (editable) |
| **Reservar** | Acción principal. Botón MUY visible en todas las páginas | Widget CoverManager |
| **Currículums** | Formulario para enviar CV → llega por email | Servicio de formularios (sin backend propio) |
| **Música** | Reproductor de la playlist de Spotify incrustado | Embed de Spotify |
| **Fidelización** | Enlace a la fidelización que ya gestiona Square | Enlace externo (NO construir) |
| **Legales** | Aviso legal, privacidad, cookies | Skill paginas-legales-es |

**Acción principal de toda la web: RESERVAR.** Botón siempre visible.

## 5. Datos reales del negocio

- **Dirección:** Carrer Jaume II, 77 — Lleida 25001
- **Email:** ruizruiz.bu@gmail.com  *(a este email llegan los currículums)*
- **Instagram:** @vibrastreetfood
- **Horario:**
  - Temporada verano: martes a domingo, 18:00–00:00
  - Temporada normal: martes a viernes 17:00–00:00; sábado y domingo 13:00–00:00
  - *(Mostrar los dos claramente diferenciados.)*
- **Reservas:** CoverManager *(falta localizar el enlace/código de incrustar)*
- **Playlist Spotify:** *(pendiente de pasar)*

## 6. La carta (contenido real, del PDF)

Categorías: **Compartir** (bravas, patatas, nachos), **Dips** (croquetas, gyozas,
fingers, tequeños), **Burgers** (La Jack Dream, La Influencer, La Kimchi Crunch,
La Goat, La Truffled, La Smokey, La Original, La CBD, La Veggie), **Bocadillos**
(El Jefecito, El Tex-Mex, El Shiitake, El Caprisito, El Briebérico, El Philly
Cheese), **Milanesas** (La Napolitana, La A Caballo, La de Cabra), **Ensalada**
(La César), **Postres** (Carrot Cake, Warm Brownie, Cheesecake, Torrija, Salsas
como extra). Precios y descripciones en el PDF de la carta. Todas las burgers
incluyen patatas. Carne 100% vaca nacional madurada. Opciones para celíacos.

## 7. Lo que NO se hace ahora (Fase 2 — tras Módulo 3)

- **Fidelización integrada dentro de la web** (login del cliente + ver SUS puntos
  trayendo datos de Square). Es backend real + datos personales = Mundo 2.
  De momento: **enlazar** a lo que Square ya ofrece. Revisar en su momento si Square
  lo resuelve solo (probablemente sí) antes de construir nada.

---

## Notas técnicas para el arranque en Code

- **Carpeta nueva** `vibra`, al lado de `formacion` y `mi-primera-web`. Su propio
  repositorio (`git init`).
- **El brandbook pesa 190 MB: NO meterlo entero.** Extraer solo lo necesario:
  logo en buena calidad, colores (ya arriba), fuentes.
- La skill `adrian-saenz-hostinger-premium-website` se activará para construir.
  La skill `paginas-legales-es` para las páginas legales.
- **Pedir el PLAN antes de construir.** Iterar en trozos pequeños, commit entre cada uno.
- Reservas, currículums, Spotify y fidelización son piezas que se ENCHUFAN
  (widgets/enlaces/servicios), no backend propio.
