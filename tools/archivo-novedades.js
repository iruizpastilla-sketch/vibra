#!/usr/bin/env node
// Archivo de novedades (lo que ya ha pasado): convierte lo que haya en imagenes/novedades/
// (fotos o vídeos VERTICALES de Instagram, nombrados AAAA-MM-nombre.ext) en los archivos que usa la
// web y escribe las tarjetas HTML listas para pegar en novedades.html y ca/novedades.html.
//
//   node tools/archivo-novedades.js              genera lo que falte y muestra las tarjetas
//   node tools/archivo-novedades.js --salida DIR  prueba: escribe los WebP en otra carpeta
//
// Requisitos (una vez, dentro de tools/; node_modules no se sube a git):
//   npm i sharp heic-convert puppeteer
// El vídeo se copia tal cual si pesa 4 MB o menos; si pesa más, se avisa y se usa solo la foto.
const fs = require("fs");
const os = require("os");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const ORIGEN = path.join(RAIZ, "imagenes", "novedades");
const args = process.argv.slice(2);
const iSalida = args.indexOf("--salida");
const SALIDA = iSalida >= 0 ? path.resolve(args[iSalida + 1]) : path.join(RAIZ, "imagenes", "web", "novedades");
const LIMITE_VIDEO = 4 * 1024 * 1024;
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const MESES = {
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  ca: ["gener", "febrer", "març", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"],
};

let sharp;
try { sharp = require("sharp"); } catch (e) { console.error("Falta sharp. Dentro de tools/ ejecuta: npm i sharp heic-convert puppeteer"); process.exit(1); }

const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);

async function decodificar(file) {
  if (/\.heic$/i.test(file)) {
    const convert = require("heic-convert");
    return Buffer.from(await convert({ buffer: fs.readFileSync(file), format: "JPEG", quality: 1 }));
  }
  return fs.readFileSync(file);
}

// Recorte centrado a 9:16 y WebP al ancho pedido
async function vertical916(buf, ancho, dst) {
  const img = sharp(buf).rotate();
  const m = await img.metadata();
  let w = m.width, h = Math.round((m.width * 16) / 9);
  if (h > m.height) { h = m.height; w = Math.round((m.height * 9) / 16); }
  await img.extract({ left: Math.round((m.width - w) / 2), top: Math.round((m.height - h) / 2), width: w, height: h })
    .resize({ width: ancho }).webp({ quality: 82 }).toFile(dst);
}

// Un fotograma del vídeo (Chrome, sin ffmpeg): a los 0,8 s, o al 20 % si el vídeo es largo
async function fotogramaVideo(file) {
  const puppeteer = require("puppeteer");
  const b = await puppeteer.launch({ headless: true, executablePath: CHROME, args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files"] });
  const p = await b.newPage();
  await p.setViewport({ width: 1080, height: 1920 });
  const html = path.join(os.tmpdir(), "vibra-fotograma.html");
  fs.writeFileSync(html, '<!DOCTYPE html><body style="margin:0;background:#000"><video id="v" src="file:///' + file.replace(/\\/g, "/") + '" muted playsinline preload="auto" style="display:block;width:1080px;height:1920px;object-fit:cover"></video></body>');
  await p.goto("file:///" + html.replace(/\\/g, "/"));
  const d = await p.evaluate(() => new Promise((res) => { const v = document.getElementById("v"); const done = () => res(v.duration); if (v.readyState >= 1) done(); else v.addEventListener("loadedmetadata", done); }));
  const t = Math.min(Math.max(0.8, d * 0.2), Math.max(0, d - 0.1));
  await p.evaluate((t) => new Promise((res) => { const v = document.getElementById("v"); v.addEventListener("seeked", () => res(), { once: true }); v.currentTime = t; }), t);
  await new Promise((r) => setTimeout(r, 300));
  const png = await (await p.$("#v")).screenshot({ type: "png" });
  await b.close();
  return png;
}

function tarjeta(lang, base, y, m, titulo, conVideo) {
  const p = lang === "ca" ? "../" : "";
  const ruta = p + "imagenes/web/novedades/" + base;
  const fecha = mayus(MESES[lang][parseInt(m, 10) - 1]) + " " + y;
  const video = conVideo ? '\n              <video data-src="' + ruta + '.mp4" muted loop playsinline preload="none" poster="' + ruta + '-540.webp" aria-hidden="true"></video>' : "";
  return [
    '          <article class="archivo-item" data-fecha="' + y + "-" + m + '">',
    '            <div class="archivo-media">',
    '              <img src="' + ruta + '-540.webp" srcset="' + ruta + "-540.webp 540w, " + ruta + '-1080.webp 1080w" sizes="(min-width: 400px) 280px, 72vw" width="540" height="960" alt="' + titulo + '" loading="lazy" decoding="async">' + video,
    "            </div>",
    '            <div class="archivo-pie">',
    '              <p class="archivo-etiqueta"><time datetime="' + y + "-" + m + '">' + fecha + "</time> · ETIQUETA</p>",
    "              <h3>" + titulo + "</h3>",
    "              <p>" + (lang === "ca" ? "Una línia, si vols." : "Una línea, si quieres.") + "</p>",
    "            </div>",
    "          </article>",
  ].join("\n");
}

(async () => {
  if (!fs.existsSync(ORIGEN)) {
    fs.mkdirSync(ORIGEN, { recursive: true });
    console.log("Creada " + ORIGEN + ". Deja ahí las fotos o vídeos verticales como AAAA-MM-nombre.jpg (o .mp4) y vuelve a ejecutar.");
    return;
  }
  fs.mkdirSync(SALIDA, { recursive: true });
  const todos = fs.readdirSync(ORIGEN).filter((f) => !fs.statSync(path.join(ORIGEN, f)).isDirectory());
  const validos = todos.filter((f) => /^\d{4}-(0[1-9]|1[0-2])-[a-z0-9]+(-[a-z0-9]+)*\.(jpe?g|png|heic|mp4)$/i.test(f)).sort().reverse();
  const ignorados = todos.filter((f) => !validos.includes(f));
  if (ignorados.length) console.log("Ignorados (el nombre debe ser AAAA-MM-nombre.ext, en minúsculas y sin espacios): " + ignorados.join(", "));
  if (!validos.length) { console.log("No hay nada en " + ORIGEN); return; }

  const tarjetas = { es: [], ca: [] };
  for (const f of validos) {
    const base = f.replace(/\.[^.]+$/, "").toLowerCase();
    const [y, m] = base.split("-");
    const slug = base.slice(8);
    const esVideo = /\.mp4$/i.test(f);
    const src = path.join(ORIGEN, f);
    const dst540 = path.join(SALIDA, base + "-540.webp"), dst1080 = path.join(SALIDA, base + "-1080.webp");
    if (!fs.existsSync(dst1080) || !fs.existsSync(dst540)) {
      const buf = esVideo ? await fotogramaVideo(src) : await decodificar(src);
      await vertical916(buf, 1080, dst1080);
      await vertical916(buf, 540, dst540);
      console.log("ok  " + base + " → " + path.basename(dst540) + " y " + path.basename(dst1080) + (esVideo ? " (fotograma del vídeo)" : ""));
    } else console.log("ya  " + base);
    let conVideo = false;
    if (esVideo) {
      const tam = fs.statSync(src).size;
      if (tam > LIMITE_VIDEO) console.log("AVISO " + f + " pesa " + Math.round((tam / 1024 / 1024) * 10) / 10 + " MB: pide una exportación de 4 MB o menos; mientras tanto se queda solo la foto.");
      else { const dstV = path.join(SALIDA, base + ".mp4"); if (!fs.existsSync(dstV)) fs.copyFileSync(src, dstV); conVideo = true; }
    }
    const titulo = slug.split("-").map(mayus).join(" ");
    tarjetas.es.push(tarjeta("es", base, y, m, titulo, conVideo));
    tarjetas.ca.push(tarjeta("ca", base, y, m, titulo, conVideo));
  }
  console.log("\n---- novedades.html: pegar dentro de <div class=\"archivo-carril\" data-archivo>, la más reciente primero ----\n");
  console.log(tarjetas.es.join("\n"));
  console.log("\n---- ca/novedades.html ----\n");
  console.log(tarjetas.ca.join("\n"));
  console.log("\nRevisa en cada tarjeta: ETIQUETA (Burger del mes · Tardeo · Evento · Carta), el título y la línea. Y quita el atributo hidden de la <section id=\"archivo\"> la primera vez.");
})().catch((e) => { console.error(e); process.exit(1); });
