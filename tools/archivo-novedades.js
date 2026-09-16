#!/usr/bin/env node
// Archivo de novedades (lo que ya ha pasado): convierte lo que haya en imagenes/novedades/
// (fotos o vídeos VERTICALES de Instagram, nombrados AAAA-MM-nombre.ext) en los archivos que usa la
// web y escribe las tarjetas HTML listas para pegar en novedades.html y ca/novedades.html.
//
//   node tools/archivo-novedades.js              genera lo que falte y muestra las tarjetas
//   node tools/archivo-novedades.js --salida DIR  prueba: escribe los archivos web en otra carpeta
//
// Reglas:
//   · Una foto y un vídeo con el MISMO nombre (2026-08-la-campeona.jpg + 2026-08-la-campeona.mp4)
//     son UNA entrada: la foto es el cartel y el vídeo se reproduce encima.
//   · Foto que no es 9:16 (p. ej. 4:5 de Instagram): se pone entera sobre un fondo hecho con la
//     misma foto desenfocada. Si ya es casi 9:16, se recorta al centro.
//   · Vídeo: si es H.264 y pesa 4 MB o menos, se copia tal cual. Si no (HEVC del iPhone, 50 MB…),
//     se recomprime con Chrome a 720x1280 H.264 sin sonido para que quepa en 4 MB. Sin ffmpeg.
//
// Requisitos (una vez, dentro de tools/; node_modules no se sube a git):
//   npm i sharp heic-convert puppeteer
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
const aUrl = (p) => "file:///" + p.split(path.sep).join("/");

// ---------- fotos ----------
async function decodificar(file) {
  if (/\.heic$/i.test(file)) {
    const convert = require("heic-convert");
    return Buffer.from(await convert({ buffer: fs.readFileSync(file), format: "JPEG", quality: 1 }));
  }
  return fs.readFileSync(file);
}
// Cartel 9:16 a partir de una foto: recorte centrado si ya es casi vertical; si no, entera sobre fondo desenfocado
async function cartel916(buf, ancho, dst) {
  const base = sharp(buf).rotate();
  const m = await base.metadata();
  const relacion = m.width / m.height;
  let lienzo;
  if (relacion <= 0.62) {
    let w = m.width, h = Math.round((m.width * 16) / 9);
    if (h > m.height) { h = m.height; w = Math.round((m.height * 9) / 16); }
    lienzo = base.extract({ left: Math.round((m.width - w) / 2), top: Math.round((m.height - h) / 2), width: w, height: h });
  } else {
    const W = 1080, H = 1920;
    const fondo = await sharp(await base.toBuffer()).resize(W, H, { fit: "cover" }).blur(40).modulate({ brightness: 0.35 }).toBuffer();
    const encima = await sharp(await base.toBuffer()).resize({ width: W, height: H, fit: "inside" }).toBuffer();
    const me = await sharp(encima).metadata();
    lienzo = sharp(fondo).composite([{ input: encima, left: Math.round((W - me.width) / 2), top: Math.round((H - me.height) / 2) }]);
  }
  await lienzo.resize({ width: ancho }).webp({ quality: 82 }).toFile(dst);
}

// ---------- vídeos ----------
// Códec de vídeo leyendo las cajas del MP4 (sin dependencias)
function codecDelMp4(file) {
  const buf = fs.readFileSync(file);
  const encontrados = [];
  (function cajas(ini, fin) {
    let p = ini;
    while (p + 8 <= fin) {
      let size = buf.readUInt32BE(p); const tipo = buf.toString("latin1", p + 4, p + 8); let cab = 8;
      if (size === 1) { size = Number(buf.readBigUInt64BE(p + 8)); cab = 16; } else if (size === 0) size = fin - p;
      if (size < cab) break;
      if (/^(avc1|avc3|hvc1|hev1|av01|vp09|mp4v)$/.test(tipo)) encontrados.push(tipo);
      if (["moov", "trak", "mdia", "minf", "stbl"].includes(tipo)) cajas(p + cab, p + size);
      if (tipo === "stsd") cajas(p + cab + 8, p + size);
      p += size;
    }
  })(0, buf.length);
  return encontrados[0] || "?";
}

let navegador = null;
async function paginaChrome() {
  const puppeteer = require("puppeteer");
  if (!navegador) navegador = await puppeteer.launch({ headless: "new", executablePath: CHROME, args: ["--no-sandbox", "--allow-file-access-from-files", "--autoplay-policy=no-user-gesture-required"] });
  const p = await navegador.newPage();
  await p.setViewport({ width: 1080, height: 1920 });
  const html = path.join(os.tmpdir(), "vibra-archivo-novedades.html");
  fs.writeFileSync(html, '<!DOCTYPE html><meta charset="utf-8"><script src="https://cdn.jsdelivr.net/npm/mp4-muxer@5/build/mp4-muxer.min.js"></script><body style="margin:0;background:#000"></body>');
  await p.goto(aUrl(html), { waitUntil: "load" });
  return p;
}

// Un fotograma del vídeo (a los 0,8 s, o al 20 % si es largo), como PNG
async function fotogramaVideo(file) {
  const p = await paginaChrome();
  const png = await p.evaluate((src) => new Promise((res, rej) => {
    const v = document.createElement("video"); v.muted = true; v.preload = "auto"; v.src = src;
    v.style.cssText = "display:block;width:1080px;height:1920px;object-fit:cover"; document.body.appendChild(v);
    v.addEventListener("error", () => rej(new Error("Chrome no puede leer el vídeo")));
    v.addEventListener("loadeddata", () => { const d = v.duration; v.currentTime = Math.min(Math.max(0.8, d * 0.2), Math.max(0, d - 0.1)); });
    v.addEventListener("seeked", () => {
      const c = document.createElement("canvas"); c.width = 1080; c.height = 1920;
      const ctx = c.getContext("2d"); const r = v.videoWidth / v.videoHeight, R = 1080 / 1920;
      let sw = v.videoWidth, sh = v.videoHeight, sx = 0, sy = 0;
      if (r > R) { sw = Math.round(v.videoHeight * R); sx = Math.round((v.videoWidth - sw) / 2); } else { sh = Math.round(v.videoWidth / R); sy = Math.round((v.videoHeight - sh) / 2); }
      ctx.drawImage(v, sx, sy, sw, sh, 0, 0, 1080, 1920);
      res(c.toDataURL("image/png").split(",")[1]);
    }, { once: true });
  }), aUrl(file));
  await p.close();
  return Buffer.from(png, "base64");
}

// Recomprime a 720x1280 H.264 sin sonido, con el bitrate justo para no pasar del límite
async function recomprimirVideo(file, dst) {
  const p = await paginaChrome();
  const b64 = await p.evaluate(async (src, limite) => {
    const v = document.createElement("video"); v.muted = true; v.preload = "auto"; v.src = src; document.body.appendChild(v);
    await new Promise((res, rej) => { v.addEventListener("loadeddata", res, { once: true }); v.addEventListener("error", () => rej(new Error("Chrome no puede leer el vídeo"))); });
    if (!v.videoWidth) throw new Error("Chrome no decodifica este vídeo (¿sin GPU?)");
    const W = 720, H = 1280, FPS = 24, dur = v.duration;
    const bitrate = Math.min(1800000, Math.floor((limite * 8 * 0.9) / dur));
    const codec = (await VideoEncoder.isConfigSupported({ codec: "avc1.4d0028", width: W, height: H, bitrate, framerate: FPS })).supported ? "avc1.4d0028" : "avc1.42E028";
    const muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: "avc", width: W, height: H }, fastStart: "in-memory" });
    let fallo = null;
    const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { fallo = e; } });
    enc.configure({ codec, width: W, height: H, bitrate, framerate: FPS, latencyMode: "quality" });
    const c = document.createElement("canvas"); c.width = W; c.height = H; const ctx = c.getContext("2d");
    const r = v.videoWidth / v.videoHeight, R = W / H;
    let sw = v.videoWidth, sh = v.videoHeight, sx = 0, sy = 0;
    if (r > R) { sw = Math.round(v.videoHeight * R); sx = Math.round((v.videoWidth - sw) / 2); } else { sh = Math.round(v.videoWidth / R); sy = Math.round((v.videoHeight - sh) / 2); }
    const total = Math.floor(dur * FPS);
    for (let i = 0; i < total; i++) {
      const t = i / FPS;
      await new Promise((res) => { v.addEventListener("seeked", res, { once: true }); v.currentTime = t; });
      ctx.drawImage(v, sx, sy, sw, sh, 0, 0, W, H);
      const frame = new VideoFrame(c, { timestamp: Math.round(t * 1e6), duration: Math.round(1e6 / FPS) });
      enc.encode(frame, { keyFrame: i % (FPS * 2) === 0 });
      frame.close();
      if (fallo) throw fallo;
      while (enc.encodeQueueSize > 6) await new Promise((res) => setTimeout(res, 20));
    }
    await enc.flush(); enc.close(); muxer.finalize();
    const bytes = new Uint8Array(muxer.target.buffer);
    let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }, aUrl(file), LIMITE_VIDEO);
  await p.close();
  fs.writeFileSync(dst, Buffer.from(b64, "base64"));
  return fs.statSync(dst).size;
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
  const validos = todos.filter((f) => /^\d{4}-(0[1-9]|1[0-2])-[a-z0-9]+(-[a-z0-9]+)*\.(jpe?g|png|heic|mp4)$/i.test(f));
  const ignorados = todos.filter((f) => !validos.includes(f));
  if (ignorados.length) console.log("Ignorados (el nombre debe ser AAAA-MM-nombre.ext, en minúsculas y sin espacios): " + ignorados.join(", "));
  if (!validos.length) { console.log("No hay nada en " + ORIGEN); return; }

  // Agrupa por nombre: foto y vídeo con el mismo nombre son una entrada
  const entradas = {};
  for (const f of validos) {
    const base = f.replace(/\.[^.]+$/, "").toLowerCase();
    entradas[base] = entradas[base] || { base, foto: null, video: null };
    if (/\.mp4$/i.test(f)) entradas[base].video = path.join(ORIGEN, f); else entradas[base].foto = path.join(ORIGEN, f);
  }
  const bases = Object.keys(entradas).sort().reverse();
  const tarjetas = { es: [], ca: [] };
  for (const base of bases) {
    const e = entradas[base];
    const [y, m] = base.split("-");
    const slug = base.slice(8);
    const dst540 = path.join(SALIDA, base + "-540.webp"), dst1080 = path.join(SALIDA, base + "-1080.webp");
    if (!fs.existsSync(dst1080) || !fs.existsSync(dst540)) {
      const buf = e.foto ? await decodificar(e.foto) : await fotogramaVideo(e.video);
      await cartel916(buf, 1080, dst1080);
      await cartel916(buf, 540, dst540);
      console.log("ok  " + base + " → cartel 540 y 1080 px" + (e.foto ? "" : " (fotograma del vídeo)"));
    } else console.log("ya  " + base + " → cartel");
    let conVideo = false;
    if (e.video) {
      const dstV = path.join(SALIDA, base + ".mp4");
      if (fs.existsSync(dstV)) { console.log("ya  " + base + " → vídeo"); conVideo = true; }
      else {
        const tam = fs.statSync(e.video).size, codec = codecDelMp4(e.video);
        if (tam <= LIMITE_VIDEO && /^avc/.test(codec)) { fs.copyFileSync(e.video, dstV); conVideo = true; console.log("ok  " + base + " → vídeo copiado (" + Math.round(tam / 1024) + " KB, " + codec + ")"); }
        else {
          process.stdout.write("..  " + base + " → recomprimiendo (" + Math.round((tam / 1024 / 1024) * 10) / 10 + " MB, " + codec + ") ");
          try { const nuevo = await recomprimirVideo(e.video, dstV); conVideo = true; console.log("→ " + Math.round(nuevo / 1024) + " KB, 720x1280 H.264"); }
          catch (err) { console.log("\nAVISO " + base + ": no se ha podido recomprimir (" + err.message + "). Se queda solo el cartel; pide una exportación de 4 MB o menos."); }
        }
      }
    }
    const titulo = slug.split("-").map(mayus).join(" ");
    tarjetas.es.push(tarjeta("es", base, y, m, titulo, conVideo));
    tarjetas.ca.push(tarjeta("ca", base, y, m, titulo, conVideo));
  }
  if (navegador) await navegador.close();
  console.log("\n---- novedades.html: pegar dentro de <div class=\"archivo-carril\" data-archivo>, la más reciente primero ----\n");
  console.log(tarjetas.es.join("\n"));
  console.log("\n---- ca/novedades.html ----\n");
  console.log(tarjetas.ca.join("\n"));
  console.log("\nRevisa en cada tarjeta: ETIQUETA (Burger del mes · Tardeo · Evento · Carta), el título y la línea. Y quita el atributo hidden de la <section id=\"archivo\"> la primera vez.");
})().catch(async (e) => { console.error(e); if (navegador) await navegador.close(); process.exit(1); });
