// Monta el texto que se pega en CoverManager (Perfil → Ajustes → Experiencia cliente → Motores web →
// "Introduzca el código CSS para personalizar el motor").
//
// OJO: ese campo no lleva solo estilos. Al final cierra la etiqueta de estilos, mete el script del selector
// de idioma del módulo y vuelve a abrirla. Si se pega solo el CSS, el selector de idioma desaparece.
// Por eso el campo se monta siempre así:  modulo-reservas.css  +  cola-selector-idiomas.txt
//
// Uso:  node tools/covermanager/montar-campo.js   → escribe campo-panel.txt y enseña su tamaño y su huella
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const leer = (f) => fs.readFileSync(path.join(__dirname, f), "utf8").split("\r\n").join("\n");
const css = leer("modulo-reservas.css").trimEnd();
const cola = leer("cola-selector-idiomas.txt").trim();

const fallos = [];
if (/<\/?(style|script)/i.test(css)) fallos.push("modulo-reservas.css no puede llevar etiquetas <style> ni <script>");
if (!cola.startsWith("</style>")) fallos.push("la cola tiene que empezar cerrando </style>");
if (!cola.endsWith("<style>")) fallos.push("la cola tiene que acabar abriendo <style>");
if (!css.startsWith("@import")) fallos.push("el @import de las fuentes tiene que ser lo primero del CSS");
if (css.split("{").length !== css.split("}").length) fallos.push("las llaves del CSS no cuadran");
if (fallos.length) { console.error("NO se monta el campo:\n - " + fallos.join("\n - ")); process.exit(1); }

const campo = css + "\n\n" + cola;
fs.writeFileSync(path.join(__dirname, "campo-panel.txt"), campo);
console.log("campo-panel.txt listo");
console.log("caracteres:", campo.length);
console.log("sha256:", crypto.createHash("sha256").update(Buffer.from(campo, "utf8")).digest("hex"));
