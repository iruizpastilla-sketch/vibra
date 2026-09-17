# Módulo de reservas de CoverManager

El módulo de reservas que sale dentro de `reservar.html` es de CoverManager. Su aspecto se cambia desde su panel,
con un campo de estilos propios. Aquí se guarda lo que hay puesto en ese campo, para no perderlo y poder volver atrás.

## Dónde está el campo

Panel de CoverManager → icono del perfil → **Ajustes** → **Experiencia cliente** → **Motores web** →
"Introduzca el código CSS para personalizar el motor". Motor predeterminado: Motor Clásico. Plantilla: Template personalizado.

## Archivos

- `modulo-reservas.css`: los estilos del módulo, a juego con la web. Es lo que se edita.
- `cola-selector-idiomas.txt`: el final del campo. Cierra la etiqueta de estilos, mete el script del selector de idioma
  y la vuelve a abrir. **No se quita**: sin esa cola el selector de idioma del módulo desaparece. El 18/9/2026 se le
  añadió el catalán (`catalan: "CA"`): antes no estaba en la lista y, desde el módulo en catalán, cambiar de idioma
  llevaba a una dirección rota.
- `campo-panel.txt`: lo que se pega en el campo (CSS + cola). Lo genera `montar-campo.js`.
- `campo-original-2026-09-17.txt`: copia exacta de lo que había antes del rediseño del 18/9/2026. Para volver atrás
  se pega entero en el campo y se guarda.

## Cómo cambiar algo

1. Editar `modulo-reservas.css`.
2. `node tools/covermanager/previsualizar.js` (o `catalan`) para ver cómo queda sin tocar el panel.
3. `node tools/covermanager/montar-campo.js` para generar `campo-panel.txt`.
4. Pegar `campo-panel.txt` entero en el campo del panel y pulsar Guardar.
5. `node tools/covermanager/previsualizar.js --real` para comprobar lo publicado.

## Decisiones

- Sin logo dentro del módulo: la página de reservas ya lo lleva en la cabecera.
- Sin lista de espera: Vibra no la usa. Está desactivada en el panel (Experiencia cliente → Lista de espera →
  "Activar lista de espera: No") y, por si acaso, oculta también con una regla del CSS. Para recuperarla hay que
  hacer las dos cosas: activarla en el panel y borrar esa regla.
- Aviso del pie: "Para reservas a partir de 12 comensales…" en castellano y en catalán. El módulo deja reservar
  hasta 11 personas; los grupos van desde 12.
- En el panel solo se toca este campo. Nada de reservas, mesas ni datos de clientes.
