#!/usr/bin/env node
// Comprueba los enlaces internos de la web: cada href/src/srcset/poster que apunte a un archivo del
// propio sitio tiene que existir, y cada ancla (#id) tiene que estar en la página de destino.
//   node tools/enlaces.js
// Sale con código 1 si hay algo roto. Ejecutarlo antes de cada subida importante.
const fs = require("fs");
const path = require("path");
const RAIZ = path.resolve(__dirname, "..");
const paginas = fs.readdirSync(RAIZ).filter((f) => f.endsWith(".html"))
  .concat(fs.readdirSync(path.join(RAIZ, "ca")).filter((f) => f.endsWith(".html")).map((f) => "ca/" + f));
const externo = /^(https?:|mailto:|tel:|data:|javascript:|\/\/)/i;
const ids = {};
const idsDe = (rel) => {
  if (!ids[rel]) { const s = fs.readFileSync(path.join(RAIZ, rel), "utf8"); ids[rel] = new Set([...s.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])); }
  return ids[rel];
};
const rotos = [];
let total = 0;
for (const pag of paginas) {
  const html = fs.readFileSync(path.join(RAIZ, pag), "utf8").replace(/<!--[\s\S]*?-->/g, "");
  const refs = [];
  for (const m of html.matchAll(/\s(?:href|src|poster|data-src|data-video-h|data-video-v)="([^"]*)"/g)) refs.push(m[1]);
  for (const m of html.matchAll(/\ssrcset="([^"]*)"/g)) m[1].split(",").forEach((x) => refs.push(x.trim().split(/\s+/)[0]));
  for (const ref of refs) {
    if (!ref || externo.test(ref)) continue;
    total++;
    const [ruta, ancla] = ref.split("#");
    const limpia = ruta.split("?")[0];
    let destino = pag;
    if (limpia) {
      const abs = limpia.startsWith("/") ? path.join(RAIZ, limpia) : path.resolve(RAIZ, path.dirname(pag), limpia);
      let fichero = abs;
      if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) fichero = path.join(abs, "index.html");
      if (!fs.existsSync(fichero)) { rotos.push(pag + " → " + ref + " (no existe)"); continue; }
      destino = path.relative(RAIZ, fichero).split(path.sep).join("/");
    }
    if (ancla && destino.endsWith(".html") && !idsDe(destino).has(ancla)) rotos.push(pag + " → " + ref + " (falta el id #" + ancla + " en " + destino + ")");
  }
}
console.log(paginas.length + " páginas, " + total + " referencias internas comprobadas");
if (rotos.length) { console.log("ROTOS (" + rotos.length + "):\n  " + rotos.join("\n  ")); process.exit(1); }
console.log("Todo correcto: ningún enlace interno roto.");
