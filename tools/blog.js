#!/usr/bin/env node
// Genera el blog de la web a partir de los artículos de tools/blog/articulos/.
//   node tools/blog.js
//
// Cada artículo es una carpeta  tools/blog/articulos/AAAA-MM-DD-nombre/  con dos ficheros, es.html y ca.html.
// Cada uno empieza con un comentario de datos y sigue con el cuerpo en HTML (párrafos, h2, listas):
//
//   <!--
//   slug: cena-de-empresa-en-lleida          (la dirección: blog/cena-de-empresa-en-lleida.html)
//   fecha: 2026-11-19                        (la del día que se publica)
//   etiqueta: Grupos                         (una palabra: Grupos, Carta, Lleida, Cocina, Local...)
//   titulo: Cena de empresa en Lleida: ...   (el título que sale en Google; menos de 60 letras si se puede)
//   h1: Cena de empresa en <span class="txt-degradado">Lleida</span>.
//   descripcion: ...                         (lo que sale debajo en Google; unas 150 letras)
//   entradilla: ...                          (la frase grande de arriba y la de la tarjeta del listado)
//   -->
//   <h2>...</h2><p>...</p>
//
// Escribe blog/*.html, ca/blog/*.html, las dos portadas del blog y el trozo del sitemap entre <!-- BLOG --> y <!-- /BLOG -->.
// La cabecera y el pie se copian de novedades.html (y ca/novedades.html): si cambian allí, basta con volver a ejecutarlo.
// Borra los .html de blog/ y ca/blog/ que ya no salen de ningún artículo.
"use strict";
const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const FUENTES = path.join(__dirname, "blog", "articulos");
const WEB = "https://vibrastreetfood.com/";
const MESES = {
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  ca: ["gener", "febrer", "març", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"],
};
const T = {
  es: {
    kicker: "Blog", h1: 'Lo que pasa en la <span class="txt-degradado">barra</span>.',
    entradilla: "Planes en Lleida, cómo hacemos las cosas y lo que hay que saber antes de venir.",
    titulo: "Blog — Vibra Street Food, hamburguesería en Lleida",
    descripcion: "Planes en Lleida, grupos, la carta y cómo hacemos las cosas en Vibra Street Food, hamburguesería en Cappont.",
    leer: "Leer", volver: "← Todos los artículos", publicado: "Publicado el", otros: "Más del blog",
    reservar: "Reservar mesa", carta: "Ver la carta",
  },
  ca: {
    kicker: "Blog", h1: 'El que passa a la <span class="txt-degradado">barra</span>.',
    entradilla: "Plans a Lleida, com fem les coses i el que cal saber abans de venir.",
    titulo: "Blog — Vibra Street Food, hamburgueseria a Lleida",
    descripcion: "Plans a Lleida, grups, la carta i com fem les coses a Vibra Street Food, hamburgueseria a Cappont.",
    leer: "Llegir", volver: "← Tots els articles", publicado: "Publicat el", otros: "Més del blog",
    reservar: "Reservar taula", carta: "Veure la carta",
  },
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const sinEtiquetas = (s) => String(s).replace(/<[^>]+>/g, "");
const fechaLarga = (f, l) => { const [a, m, d] = f.split("-").map(Number); return l === "es" ? `${d} de ${MESES.es[m - 1]} de ${a}` : `${d} de ${MESES.ca[m - 1]} de ${a}`.replace(/de ([aeiou])/i, "d'$1"); };

// ---------- Leer los artículos ----------
function leer(fichero) {
  const txt = fs.readFileSync(fichero, "utf8");
  const m = txt.match(/^\s*<!--([\s\S]*?)-->/);
  if (!m) throw new Error(fichero + ": falta el comentario de datos del principio");
  const datos = {};
  for (const linea of m[1].split(/\r?\n/)) {
    const k = linea.match(/^\s*([a-z0-9]+)\s*:\s*(.*?)\s*$/);
    if (k) datos[k[1]] = k[2];
  }
  for (const c of ["slug", "fecha", "etiqueta", "titulo", "h1", "descripcion", "entradilla"]) {
    if (!datos[c]) throw new Error(fichero + ": falta «" + c + "»");
  }
  if (!/^[a-z0-9-]+$/.test(datos.slug)) throw new Error(fichero + ": el slug solo puede llevar minúsculas, números y guiones");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha)) throw new Error(fichero + ": la fecha va como AAAA-MM-DD");
  datos.cuerpo = txt.slice(m[0].length).trim();
  return datos;
}
const articulos = (fs.existsSync(FUENTES) ? fs.readdirSync(FUENTES) : [])
  .filter((d) => fs.statSync(path.join(FUENTES, d)).isDirectory())
  .map((d) => ({ es: leer(path.join(FUENTES, d, "es.html")), ca: leer(path.join(FUENTES, d, "ca.html")) }))
  .sort((a, b) => b.es.fecha.localeCompare(a.es.fecha) || a.es.slug.localeCompare(b.es.slug));

// ---------- La plantilla: cabecera y pie de novedades.html ----------
// Todas las páginas del blog están una carpeta más abajo que su plantilla: se añade "../" a cada ruta relativa.
function plantilla(l) {
  const html = fs.readFileSync(path.join(RAIZ, l === "es" ? "novedades.html" : "ca/novedades.html"), "utf8");
  const ini = html.indexOf('<main id="contenido"');
  const fin = html.indexOf("</main>") + "</main>".length;
  if (ini < 0 || fin < 7) throw new Error("No encuentro <main> en novedades.html");
  return { antes: html.slice(0, ini), despues: html.slice(fin) };
}
const PLANT = { es: plantilla("es"), ca: plantilla("ca") };
const externo = /^(https?:|mailto:|tel:|data:|javascript:|#|\/)/i;
function bajarUnNivel(html) {
  return html
    .replace(/(\s(?:href|src|poster|data-src)=")([^"]*)"/g, (t, a, v) => (v === "" || externo.test(v) ? t : a + "../" + v + '"'))
    .replace(/(\ssrcset=")([^"]*)"/g, (t, a, v) => a + v.split(",").map((x) => { const p = x.trim(); return externo.test(p) ? p : "../" + p; }).join(", ") + '"');
}

function pagina(l, o) {
  // o: { ruta (desde la raíz, p. ej. "blog/x.html"), rutaOtra, titulo, descripcion, tipo, jsonld, main }
  let { antes, despues } = PLANT[l];
  const otra = l === "es" ? "ca" : "es";
  // El cambio de idioma lleva a la misma página en el otro idioma (antes de bajar de nivel).
  const idiomaPlantilla = l === "es" ? "ca/novedades.html" : "../novedades.html";
  const idiomaNuevo = (l === "es" ? "" : "../") + o.rutaOtra.replace(/index\.html$/, "");
  antes = antes.split('href="' + idiomaPlantilla + '"').join('href="' + idiomaNuevo + '"');
  antes = bajarUnNivel(antes);
  despues = bajarUnNivel(despues);
  const url = WEB + o.ruta.replace(/index\.html$/, "");
  const urlOtra = WEB + o.rutaOtra.replace(/index\.html$/, "");
  const urlEs = l === "es" ? url : urlOtra;
  const urlCa = l === "ca" ? url : urlOtra;
  antes = antes
    .replace(/<title>[\s\S]*?<\/title>/, "<title>" + esc(o.titulo) + "</title>")
    .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + esc(o.descripcion) + '">')
    .replace(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="' + url + '">')
    .replace(/<link rel="alternate" hreflang="es" href="[^"]*">/, '<link rel="alternate" hreflang="es" href="' + urlEs + '">')
    .replace(/<link rel="alternate" hreflang="ca" href="[^"]*">/, '<link rel="alternate" hreflang="ca" href="' + urlCa + '">')
    .replace(/<link rel="alternate" hreflang="x-default" href="[^"]*">/, '<link rel="alternate" hreflang="x-default" href="' + urlEs + '">')
    .replace(/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="' + url + '">')
    .replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="' + esc(o.titulo) + '">')
    .replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="' + esc(o.descripcion) + '">')
    .replace(/<meta property="og:type" content="[^"]*">/, '<meta property="og:type" content="' + o.tipo + '">')
    .replace("</head>", '  <script type="application/ld+json">' + JSON.stringify(o.jsonld) + "</script>\n</head>");
  const cabecera = "<!-- Página generada por tools/blog.js: no se edita a mano (se cambia el artículo en tools/blog/articulos/ y se vuelve a generar). -->\n";
  return antes.replace("<!DOCTYPE html>\n", "<!DOCTYPE html>\n" + cabecera) + o.main + despues;
}

const ORG = { "@type": "Restaurant", "@id": WEB + "#restaurante", name: "Vibra Street Food", url: WEB };

function rutaArt(l, a) { return (l === "es" ? "blog/" : "ca/blog/") + a.slug + ".html"; }

function tarjeta(l, a, desde) {
  // desde: "lista" (en blog/index.html) o "articulo" (en blog/x.html): en los dos casos el enlace es el nombre del fichero.
  return `          <article class="blog-tarjeta reveal">
            <p class="blog-meta"><time datetime="${a.fecha}">${fechaLarga(a.fecha, l)}</time> · ${esc(a.etiqueta)}</p>
            <h2 class="blog-tarjeta-titulo"><a href="${a.slug}.html">${sinEtiquetas(a.h1)}</a></h2>
            <p>${a.entradilla}</p>
            <a class="blog-leer" href="${a.slug}.html" aria-hidden="true" tabindex="-1">${T[l].leer} →</a>
          </article>`;
}

const generados = new Set();
function escribir(ruta, html) {
  const abs = path.join(RAIZ, ruta);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, html);
  generados.add(ruta);
}

for (const l of ["es", "ca"]) {
  const otra = l === "es" ? "ca" : "es";
  const t = T[l];
  // ---- Cada artículo ----
  articulos.forEach((par) => {
    const a = par[l], b = par[otra];
    const ruta = rutaArt(l, a);
    const rutaOtra = rutaArt(otra, b);
    const otros = articulos.filter((x) => x !== par).slice(0, 3).map((x) => tarjeta(l, x[l])).join("\n");
    const main = `<main id="contenido" tabindex="-1">

    <section class="carta-hero">
      <div class="contenedor">
        <p class="kicker">${esc(a.etiqueta)}</p>
        <h1 class="larga">${a.h1}</h1>
        <p class="nos-entradilla">${a.entradilla}</p>
        <p class="blog-meta blog-meta-hero">${t.publicado} <time datetime="${a.fecha}">${fechaLarga(a.fecha, l)}</time></p>
      </div>
    </section>

    <article class="contenedor articulo">
${a.cuerpo.split(/\r?\n/).map((x) => (x ? "      " + x : x)).join("\n")}

      <div class="articulo-acciones">
        <a class="btn btn-degradado" href="../reservar.html">${t.reservar}</a>
        <a class="btn btn-fantasma" href="../carta.html">${t.carta}</a>
      </div>
      <p class="articulo-volver"><a href="./">${t.volver}</a></p>
    </article>
${otros ? `
    <section class="seccion nos-alterna claro">
      <div class="contenedor">
        <p class="kicker reveal">${t.otros}</p>
        <div class="blog-lista">
${otros}
        </div>
      </div>
    </section>
` : ""}
  </main>`;
    escribir(ruta, pagina(l, {
      ruta, rutaOtra, titulo: a.titulo, descripcion: a.descripcion, tipo: "article", main,
      jsonld: {
        "@context": "https://schema.org", "@type": "BlogPosting", headline: sinEtiquetas(a.h1).replace(/\.$/, ""),
        description: a.descripcion, datePublished: a.fecha, dateModified: a.fecha, inLanguage: l,
        mainEntityOfPage: WEB + ruta, image: WEB + "imagenes/web/og.jpg", author: ORG, publisher: ORG,
      },
    }));
  });
  // ---- La portada del blog ----
  const lista = articulos.map((p) => tarjeta(l, p[l])).join("\n");
  const main = `<main id="contenido" tabindex="-1">

    <section class="carta-hero">
      <div class="contenedor">
        <p class="kicker">${t.kicker}</p>
        <h1>${t.h1}</h1>
        <p class="nos-entradilla">${t.entradilla}</p>
      </div>
    </section>

    <section class="seccion blog-portada">
      <div class="contenedor">
        <div class="blog-lista">
${lista}
        </div>
      </div>
    </section>

  </main>`;
  const ruta = (l === "es" ? "blog/" : "ca/blog/") + "index.html";
  const rutaOtra = (l === "es" ? "ca/blog/" : "blog/") + "index.html";
  escribir(ruta, pagina(l, {
    ruta, rutaOtra, titulo: t.titulo, descripcion: t.descripcion, tipo: "website", main,
    jsonld: {
      "@context": "https://schema.org", "@type": "Blog", name: t.titulo, url: WEB + ruta.replace("index.html", ""), inLanguage: l, publisher: ORG,
      blogPost: articulos.map((p) => ({ "@type": "BlogPosting", headline: sinEtiquetas(p[l].h1).replace(/\.$/, ""), url: WEB + rutaArt(l, p[l]), datePublished: p[l].fecha })),
    },
  }));
}

// ---------- Quitar páginas que ya no salen de ningún artículo ----------
for (const dir of ["blog", "ca/blog"]) {
  for (const f of fs.readdirSync(path.join(RAIZ, dir))) {
    const ruta = dir + "/" + f;
    if (f.endsWith(".html") && !generados.has(ruta)) { fs.unlinkSync(path.join(RAIZ, ruta)); console.log("Borrada (ya no hay artículo): " + ruta); }
  }
}

// ---------- Sitemap ----------
const sm = path.join(RAIZ, "sitemap.xml");
let xml = fs.readFileSync(sm, "utf8").replace(/\s*<!-- BLOG -->[\s\S]*?<!-- \/BLOG -->/, "");
const url = (es, ca, cual, fecha) => `  <url>
    <loc>${WEB + (cual === "es" ? es : ca)}</loc>${fecha ? `\n    <lastmod>${fecha}</lastmod>` : ""}
    <xhtml:link rel="alternate" hreflang="es" href="${WEB + es}"/>
    <xhtml:link rel="alternate" hreflang="ca" href="${WEB + ca}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${WEB + es}"/>
  </url>`;
const trozos = [];
const ultima = articulos[0] && articulos[0].es.fecha;
for (const c of ["es", "ca"]) trozos.push(url("blog/", "ca/blog/", c, ultima));
for (const p of articulos) for (const c of ["es", "ca"]) trozos.push(url(rutaArt("es", p.es), rutaArt("ca", p.ca), c, p.es.fecha));
xml = xml.replace("</urlset>", "  <!-- BLOG -->\n" + trozos.join("\n") + "\n  <!-- /BLOG -->\n</urlset>");
fs.writeFileSync(sm, xml);

console.log(articulos.length + " artículos → " + generados.size + " páginas del blog y el sitemap al día.");
