// Guion de comprobacion del Dia 0 para la web de Vibra Street Food.
// Uso:  node dia0-check.js https://vibrastreetfood.com
//       node dia0-check.js https://iruizpastilla-sketch.github.io/vibra   (ensayo)
// Para cada URL imprime: codigo, Content-Type, Content-Encoding, Cache-Control, HSTS,
// X-Robots-Tag, si el HTML lleva meta noindex y si el canonical coincide con la URL pedida.
// No sigue redirecciones: si hay un 301/302 lo muestra con su Location.

const https = require('https');
const http = require('http');
const { URL } = require('url');

const BASE = (process.argv[2] || 'https://vibrastreetfood.com').replace(/\/$/, '');

const PAGINAS = [
  '/', '/carta.html', '/contacto.html', '/reservar.html', '/grupos.html', '/local.html',
  '/nosotros.html', '/novedades.html', '/aviso-legal.html', '/privacidad.html', '/cookies.html',
  '/ca/', '/ca/carta.html', '/ca/contacto.html', '/ca/reservar.html', '/ca/grupos.html',
  '/ca/local.html', '/ca/nosotros.html', '/ca/novedades.html',
];
const RECURSOS = ['/sitemap.xml', '/robots.txt', '/favicon.png', '/imagenes/web/og.jpg', '/no-existe-vibra-404.html'];

function pedir(url) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const mod = u.protocol === 'http:' ? http : https;
    const req = mod.request(u, {
      method: 'GET',
      headers: { 'Accept-Encoding': 'br, gzip', 'User-Agent': 'Mozilla/5.0 (compatible; vibra-dia0/1.0)' },
      timeout: 20000,
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        let cuerpo = '';
        const buf = Buffer.concat(chunks);
        const enc = res.headers['content-encoding'];
        try {
          const zlib = require('zlib');
          if (enc === 'br') cuerpo = zlib.brotliDecompressSync(buf).toString('utf8');
          else if (enc === 'gzip') cuerpo = zlib.gunzipSync(buf).toString('utf8');
          else cuerpo = buf.toString('utf8');
        } catch (e) { cuerpo = buf.toString('utf8'); }
        resolve({ status: res.statusCode, headers: res.headers, cuerpo });
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
    req.end();
  });
}

function corto(v, n) { v = v == null ? '-' : String(v); return v.length > n ? v.slice(0, n - 1) + '~' : v; }

(async () => {
  console.log('Base: ' + BASE);
  const cab = ['URL', 'Cod', 'Content-Type', 'Enc', 'Cache-Control', 'HSTS', 'X-Robots', 'noindex', 'canonical=URL'];
  console.log(cab.join(' | '));
  let fallos = 0;
  for (const ruta of PAGINAS.concat(RECURSOS)) {
    const url = BASE + ruta;
    const r = await pedir(url);
    if (r.error) { console.log([ruta, 'ERR ' + r.error].join(' | ')); fallos++; continue; }
    const h = r.headers;
    const esHtml = /text\/html/.test(h['content-type'] || '');
    let noindex = '-', canon = '-';
    if (esHtml && r.status === 200) {
      const m = r.cuerpo.match(/<meta[^>]+name=["']robots["'][^>]*>/i);
      noindex = (m && /noindex/i.test(m[0])) ? 'SI' : 'no';
      if (/X-Robots|noindex/i.test(h['x-robots-tag'] || '')) noindex = 'SI(cab)';
      const c = r.cuerpo.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
      if (c) {
        const pedida = url.replace(/index\.html$/, '');
        canon = (c[1] === pedida) ? 'ok' : 'NO -> ' + c[1];
      } else canon = 'sin canonical';
    }
    const loc = (r.status >= 300 && r.status < 400) ? ' -> ' + h['location'] : '';
    console.log([
      ruta, r.status + loc, corto(h['content-type'], 28), corto(h['content-encoding'], 5),
      corto(h['cache-control'], 34), corto(h['strict-transport-security'], 30),
      corto(h['x-robots-tag'], 12), noindex, canon,
    ].join(' | '));
    // Criterios de exito para el dominio definitivo
    const esperado404 = ruta.includes('no-existe');
    if (esperado404 ? r.status !== 404 : r.status !== 200) fallos++;
    if (esHtml && r.status === 200 && (noindex !== 'no' || canon !== 'ok')) fallos++;
  }
  console.log('');
  console.log('Cabeceras de seguridad en ' + BASE + '/ :');
  const home = await pedir(BASE + '/');
  if (!home.error) {
    for (const k of ['strict-transport-security', 'x-frame-options', 'content-security-policy', 'x-content-type-options', 'referrer-policy', 'permissions-policy', 'server', 'x-powered-by', 'vary', 'alt-svc']) {
      console.log('  ' + k + ': ' + (home.headers[k] || '(ausente)'));
    }
  }
  console.log('');
  console.log(fallos === 0 ? 'RESULTADO: todo correcto' : 'RESULTADO: ' + fallos + ' comprobaciones fuera de lo esperado (canonical/noindex/codigo)');
  console.log('Esperado el Dia 0 en vibrastreetfood.com: 19 paginas 200 text/html br|gzip no-cache HSTS presente sin X-Robots noindex=no canonical=ok; sitemap.xml 200 application/xml; robots.txt 200 text/plain; favicon.png 200 image/png; og.jpg 200 image/jpeg; URL inexistente 404.');
})();
