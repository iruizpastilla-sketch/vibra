// Enseña cómo queda el módulo de reservas de CoverManager con modulo-reservas.css SIN tocar nada en su panel:
// abre el módulo público, quita el bloque de estilos propios que tenga publicado, inyecta el CSS local
// y captura escritorio, móvil y el formulario de datos personales (forzado a verse).
//
// Uso:  node tools/covermanager/previsualizar.js [spanish|catalan] [--real]
//   --real  captura el módulo tal cual está publicado (sin inyectar nada), para comprobar lo guardado en el panel.
// Las capturas van a tools/capturas/covermanager/ (carpeta que no se sube al repositorio).
const fs = require("fs");
const path = require("path");
const puppeteer = require("../node_modules/puppeteer");

const args = process.argv.slice(2);
const REAL = args.includes("--real");
const IDIOMA = args.find((a) => a === "spanish" || a === "catalan") || "spanish";
const URL_MOD = "https://www.covermanager.com/reservation/module_restaurant/restaurante-vibra/" + IDIOMA;
const SALIDA = path.join(__dirname, "..", "capturas", "covermanager");
const CSS = fs.readFileSync(path.join(__dirname, "modulo-reservas.css"), "utf8");
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const b = await puppeteer.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--no-sandbox", "--disable-gpu"] });
  for (const [w, h, n, movil] of [[1100, 900, "escritorio", false], [390, 844, "movil", true]]) {
    const p = await b.newPage();
    await p.setViewport(movil ? { width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: w, height: h });
    await p.goto(URL_MOD, { waitUntil: "networkidle2", timeout: 60000 });
    await espera(1500);
    let quitados = 0;
    if (!REAL) {
      quitados = await p.evaluate(() => { let k = 0; document.querySelectorAll("style").forEach((s) => { if (s.textContent.indexOf("datos_reserva:after") >= 0) { s.remove(); k++; } }); return k; });
      await p.addStyleTag({ content: CSS });
      await espera(2500);
    }
    const base = path.join(SALIDA, (REAL ? "real-" : "prueba-") + IDIOMA + "-" + n);
    await p.screenshot({ path: base + ".png", fullPage: true });
    await p.evaluate(() => { const d = document.getElementById("datos_personales"); if (d) { d.style.display = "block"; d.querySelectorAll("[style*='display: none'], [style*='display:none']").forEach((e) => { e.style.display = ""; }); } });
    await espera(600);
    await p.screenshot({ path: base + "-formulario.png", fullPage: true });
    const datos = await p.evaluate(() => {
      const v = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).display !== "none" && e.offsetHeight > 0 : null; };
      return {
        fuente: getComputedStyle(document.body).fontFamily.split(",")[0],
        fondo: getComputedStyle(document.body).backgroundColor,
        listaDeEsperaVisible: v("#waiting_button_list"),
        selectorIdioma: !!document.getElementById("lang_select"),
        botonReservar: (() => { const e = document.querySelector("input.reservarButton"); return e ? getComputedStyle(e).backgroundImage.slice(0, 40) : null; })(),
        alto: document.body.scrollHeight,
      };
    });
    console.log(IDIOMA, n, REAL ? "(publicado)" : "(prueba · bloques antiguos quitados: " + quitados + ")", JSON.stringify(datos));
    await p.close();
  }
  await b.close();
  console.log("capturas en", SALIDA);
})().catch((e) => { console.error(e); process.exit(1); });
