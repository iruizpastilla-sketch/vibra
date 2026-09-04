// Capturas de la web con Chrome sin interfaz (puppeteer) para revisar el diseno.
// Instalar puppeteer en una carpeta temporal:  npm i puppeteer  (en esa carpeta)
// y ejecutar con NODE_PATH apuntando a su node_modules:
//   NODE_PATH=/ruta/temporal/node_modules node tools/capturas.js http://localhost:8765/index.html desktop d hero:y=0 carta:.carta-lista
// Uso: node capturas.js <url> <desktop|mobile> <prefijo> paso paso ...
//   paso = nombre:y=1234 | nombre:y=+600 (relativo) | nombre:selector | nombre:hover=selector | nombre:full
const puppeteer = require('puppeteer');
const path = require('path');
const [,, url, modo = 'desktop', prefijo = 'x', ...pasos] = process.argv;
const out = process.env.CAPTURAS_DIR || path.join(__dirname, 'capturas');
const espera = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  if (modo === 'mobile') {
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
  } else {
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  }
  const logs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => logs.push('pageerror: ' + e.message));
  page.on('requestfailed', r => logs.push('failed: ' + r.url()));
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await espera(1500);
  for (const paso of pasos) {
    const i = paso.indexOf(':');
    const nombre = paso.slice(0, i), objetivo = paso.slice(i + 1);
    const archivo = path.join(out, prefijo + '-' + nombre + '.png');
    if (objetivo === 'full') { await page.screenshot({ path: archivo, fullPage: true }); continue; }
    if (objetivo.startsWith('hover=')) {
      await page.hover(objetivo.slice(6));
      await page.mouse.move(700, 450);
      await espera(500);
    } else if (objetivo.startsWith('y=+')) {
      await page.evaluate(d => window.scrollBy({ top: d, behavior: 'instant' }), +objetivo.slice(3));
    } else if (objetivo.startsWith('y=')) {
      await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), +objetivo.slice(2));
    } else {
      await page.evaluate(sel => document.querySelector(sel).scrollIntoView({ behavior: 'instant', block: 'start' }), objetivo);
    }
    await espera(1300);
    await page.screenshot({ path: archivo });
  }
  const info = await page.evaluate(() => ({ alto: document.documentElement.scrollHeight, pin: !!document.querySelector('.shots.is-pin') }));
  console.log(JSON.stringify({ logs: logs.slice(0, 12), ...info }));
  await browser.close();
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
