(function () {
  "use strict";

  // ---------- Helpers ----------
  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  // GSAP y ScrollTrigger son opcionales: si no cargan, la web funciona igual, sin los efectos de scroll
  var gsapOk = !!(window.gsap && window.ScrollTrigger);
  var reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (gsapOk) { window.gsap.registerPlugin(window.ScrollTrigger); }
  function safe(fn, nombre) {
    try { fn(); } catch (e) { console.warn("[" + nombre + "]", e); }
  }

  // ---------- Cabecera: fondo sólido al hacer scroll ----------
  function initCabecera() {
    var cab = $("[data-cabecera]");
    if (!cab) return;
    var marcar = function () {
      cab.classList.toggle("is-solida", window.scrollY > 24);
    };
    marcar();
    window.addEventListener("scroll", marcar, { passive: true });
  }

  // ---------- Menú móvil ----------
  function initMenuMovil() {
    var boton = $("[data-menu-btn]");
    var menu = $("[data-menu]");
    if (!boton || !menu) return;

    var cerrar = function () {
      if (!menu.classList.contains("is-abierto")) return;
      boton.setAttribute("aria-expanded", "false");
      menu.classList.remove("is-abierto");
      document.body.classList.remove("sin-scroll");
    };
    boton.addEventListener("click", function () {
      var abierto = boton.getAttribute("aria-expanded") === "true";
      boton.setAttribute("aria-expanded", String(!abierto));
      menu.classList.toggle("is-abierto", !abierto);
      document.body.classList.toggle("sin-scroll", !abierto);
    });
    $$("a, button", menu).forEach(function (a) { a.addEventListener("click", cerrar); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") cerrar();
    });
  }

  // ---------- Enlace activo según la página ----------
  function initNavActiva() {
    var pagina = location.pathname.split("/").pop() || "index.html";
    $$(".cabecera-nav a, .menu-movil a").forEach(function (a) {
      var destino = (a.getAttribute("href") || "").split("#")[0];
      if (destino && destino === pagina) a.classList.add("is-activa");
    });
  }

  // ---------- Vídeo opcional: si el archivo existe se reproduce; si no, queda la foto ----------
  // <div data-media-slot data-video-h="..." data-video-v="..."><img ...></div>
  // En vertical (móvil) se prefiere data-video-v. Sin vídeo -> clase "sin-video" (Ken Burns en la portada).
  function initMediaSlots() {
    var vertical = window.matchMedia("(orientation: portrait)").matches;
    $$("[data-media-slot]").forEach(function (slot) {
      var h = slot.getAttribute("data-video-h");
      var v = slot.getAttribute("data-video-v");
      // Con data-video-solo-vertical, el vídeo vertical solo se usa en pantallas verticales (en apaisado queda la foto)
      var src = (vertical && v) ? v : (h || (slot.hasAttribute("data-video-solo-vertical") ? null : v));
      if (!src) { slot.classList.add("sin-video"); return; }

      var video = document.createElement("video");
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("aria-hidden", "true");
      var foto = $("img", slot);
      if (foto) video.poster = foto.currentSrc || foto.src;

      video.addEventListener("error", function () {
        slot.classList.add("sin-video");
        if (video.parentNode) video.parentNode.removeChild(video);
      });
      video.addEventListener("playing", function () { slot.classList.add("con-video"); });
      video.src = src;
      slot.appendChild(video);
      var intento = video.play();
      if (intento && intento.catch) intento.catch(function () { /* autoplay bloqueado: se queda la foto */ });
    });
  }

  // ---------- "Abierto ahora / Hoy abrimos a las..." a partir de los tramos de manifest.js ----------
  function initHorarioHoy() {
    var el = $("[data-horario-hoy]");
    var marca = window.__BRAND__;
    if (!el || !marca || !marca.horarios) return;

    var ahora = new Date();
    var dos = function (n) { return (n < 10 ? "0" : "") + n; };
    var mmdd = dos(ahora.getMonth() + 1) + "-" + dos(ahora.getDate());
    var verano = marca.horarios.verano;
    var enVerano = verano && verano.fechas && mmdd >= verano.fechas.desde && mmdd <= verano.fechas.hasta;
    var temporada = enVerano ? verano : marca.horarios.normal;
    var tramos = (temporada && temporada.tramos) || [];

    var tramoDe = function (dia) {
      return tramos.filter(function (t) { return t.dias.indexOf(dia) !== -1; })[0];
    };
    var aMinutos = function (hhmm) {
      var p = hhmm.split(":");
      return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
    };

    // Textos según el idioma de la página (es / ca)
    var ca = (document.documentElement.lang || "es").indexOf("ca") === 0;
    var t = ca ? {
      cerradoManana: "Avui tancat · Demà obrim a les ",
      cerrado: "Avui tancat",
      abrimos: "Avui obrim a les ",
      hasta: " · fins a les ",
      abierto: "Obert ara · fins a les ",
      llegas: "Encara hi arribes · Obert fins a les ",
      pronto: "Obrim en {n} min · Ves reservant taula"
    } : {
      cerradoManana: "Hoy cerrado · Mañana abrimos a las ",
      cerrado: "Hoy cerrado",
      abrimos: "Hoy abrimos a las ",
      hasta: " · hasta las ",
      abierto: "Abierto ahora · hasta las ",
      llegas: "Aún llegas · Abierto hasta las ",
      pronto: "Abrimos en {n} min · Ve pidiendo mesa"
    };
    // "Aún llegas" solo en la última parte de la noche: desde las 21:00 y nunca más tarde de las 22:30
    var LLEGAS_DESDE = 21 * 60, LLEGAS_HASTA = 22 * 60 + 30;

    var hoy = tramoDe(ahora.getDay());
    var minutos = ahora.getHours() * 60 + ahora.getMinutes();
    var texto = "";
    var abierto = false;

    if (!hoy) {
      var manana = tramoDe((ahora.getDay() + 1) % 7);
      texto = manana ? t.cerradoManana + manana.abre : t.cerrado;
    } else if (minutos < aMinutos(hoy.abre)) {
      var faltan = aMinutos(hoy.abre) - minutos;
      texto = faltan <= 60 ? t.pronto.replace("{n}", faltan) : t.abrimos + hoy.abre + t.hasta + hoy.cierra;
    } else {
      abierto = true;
      var ultimaHora = minutos >= LLEGAS_DESDE && minutos < LLEGAS_HASTA;
      texto = (ultimaHora ? t.llegas : t.abierto) + hoy.cierra;
    }
    el.textContent = texto;
    el.classList.toggle("is-abierto", abierto);
    el.hidden = false;
  }

  // ---------- Manifiesto: cada palabra se enciende al hacer scroll ----------
  function initManifiesto() {
    var el = $("[data-palabras]");
    if (!el) return;

    // Envolver cada palabra en un span sin romper los spans de degradado existentes
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodos = [];
    while (walker.nextNode()) nodos.push(walker.currentNode);
    nodos.forEach(function (nodo) {
      if (!nodo.nodeValue.trim()) return;
      var frag = document.createDocumentFragment();
      nodo.nodeValue.split(/(\s+)/).forEach(function (trozo) {
        if (!trozo) return;
        if (/^\s+$/.test(trozo)) { frag.appendChild(document.createTextNode(" ")); return; }
        var s = document.createElement("span");
        s.className = "palabra";
        s.textContent = trozo;
        frag.appendChild(s);
      });
      nodo.parentNode.replaceChild(frag, nodo);
    });

    if (!gsapOk) return;
    window.gsap.fromTo($$(".palabra", el), { opacity: 0.16 }, {
      opacity: 1,
      stagger: 0.06,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 48%", scrub: true }
    });
  }

  // ---------- Parallax suave en bloques con foto/vídeo a sangre ----------
  function initParallax() {
    if (!gsapOk) return;
    $$("[data-parallax]").forEach(function (seccion) {
      var media = $("[data-parallax-media]", seccion);
      if (!media) return;
      window.gsap.fromTo(media, { yPercent: -10 }, {
        yPercent: 10,
        ease: "none",
        scrollTrigger: { trigger: seccion, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
  }

  // ---------- Apariciones al hacer scroll (con red de seguridad) ----------
  function initReveals() {
    var elementos = $$(".reveal");
    if (!elementos.length) return;

    if (!("IntersectionObserver" in window)) {
      elementos.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.04, rootMargin: "0px 0px -8% 0px" });
    elementos.forEach(function (el) { obs.observe(el); });

    // Red de seguridad: pase lo que pase, a los 6s todo visible.
    setTimeout(function () {
      $$(".reveal:not(.is-in)").forEach(function (el) { el.classList.add("is-in"); });
    }, 6000);
  }

  // ---------- Carta: chip activa según la sección visible ----------
  function initCartaNav() {
    var nav = $("[data-carta-nav]");
    if (!nav) return;
    var chips = $$("a.chip", nav);
    var mapa = {};
    chips.forEach(function (c) {
      var id = (c.getAttribute("href") || "").split("#")[1];
      if (id) mapa[id] = c;
    });
    var secciones = Object.keys(mapa)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    if (!secciones.length || !("IntersectionObserver" in window)) return;

    var activa = null;
    var marcar = function (chip) {
      if (!chip || chip === activa) return;
      if (activa) activa.classList.remove("is-activa");
      chip.classList.add("is-activa");
      activa = chip;
      var destino = chip.offsetLeft - nav.clientWidth / 2 + chip.clientWidth / 2;
      nav.scrollTo({ left: destino, behavior: "smooth" });
    };
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) marcar(mapa[en.target.id]);
      });
    }, { rootMargin: "-25% 0px -65% 0px", threshold: 0 });
    secciones.forEach(function (s) { obs.observe(s); });
  }

  // ---------- Burgers: modal que se rellena leyendo la tarjeta pulsada ----------
  function initBurgerModal() {
    var modal = $("[data-burger-modal]");
    if (!modal || typeof modal.showModal !== "function") return;
    var tarjetas = $$(".burger-shot");
    if (!tarjetas.length) return;

    var mImg = $("[data-modal-img]", modal);
    var mTitulo = $("[data-modal-titulo]", modal);
    var mDesc = $("[data-modal-desc]", modal);
    var mPrecio = $("[data-modal-precio]", modal);

    tarjetas.forEach(function (tarjeta) {
      var abrir = $(".burger-shot-abrir", tarjeta);
      if (!abrir) return;
      abrir.addEventListener("click", function () {
        var img = $(".burger-shot-media img", tarjeta);
        var titulo = $("h3", tarjeta);
        var desc = $(".burger-shot-desc", tarjeta);
        var precio = $(".precio-cifra", tarjeta);
        if (mImg && img) { mImg.src = img.src; mImg.alt = img.alt; }
        if (mTitulo && titulo) { mTitulo.innerHTML = titulo.innerHTML; }
        if (mDesc && desc) { mDesc.textContent = desc.textContent; }
        if (mPrecio && precio) { mPrecio.textContent = precio.textContent; }
        modal.showModal();
        document.body.classList.add("sin-scroll");
      });
    });

    // Cierre robusto: desbloquea el scroll SIEMPRE, sin depender del evento "close"
    var cerrarModal = function () {
      if (modal.open) modal.close();
      document.body.classList.remove("sin-scroll");
    };
    $$("[data-modal-cerrar]", modal).forEach(function (boton) {
      boton.addEventListener("click", cerrarModal);
    });
    // Clic fuera del contenido (el propio dialog) cierra
    modal.addEventListener("click", function (e) {
      if (e.target === modal) cerrarModal();
    });
    // Cierre nativo (Esc del navegador): también desbloquea
    modal.addEventListener("close", function () {
      document.body.classList.remove("sin-scroll");
    });
    // Red extra por si el cierre nativo no dispara eventos
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.open) cerrarModal();
    });
  }

  // ---------- Embeds en dos pasos: Google Maps y Spotify solo cargan cuando el visitante lo pide ----------
  function cargarEmbed(marco) {
    var src = marco.getAttribute("data-embed-src");
    if (!src || marco.classList.contains("is-cargado")) return;
    var iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = marco.getAttribute("data-embed-title") || "";
    var allow = marco.getAttribute("data-embed-allow");
    if (allow) iframe.setAttribute("allow", allow);
    if (marco.hasAttribute("data-embed-fullscreen")) iframe.setAttribute("allowfullscreen", "");
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.loading = "lazy";
    marco.innerHTML = "";
    marco.appendChild(iframe);
    marco.classList.add("is-cargado");
  }
  function initEmbeds() {
    $$("[data-embed]").forEach(function (marco) {
      var boton = $("[data-embed-cargar]", marco);
      if (!boton) return;
      boton.addEventListener("click", function () { cargarEmbed(marco); });
    });
  }

  // ---------- Pedir a domicilio: un modal, varios disparadores (cabecera, menú, barra) ----------
  function initPedir() {
    var modal = $("[data-pedir-modal]");
    if (!modal || typeof modal.showModal !== "function") return;
    var abrir = function (e) {
      e.preventDefault();
      modal.showModal();
      document.body.classList.add("sin-scroll");
    };
    var cerrar = function () {
      if (modal.open) modal.close();
      document.body.classList.remove("sin-scroll");
    };
    $$("[data-pedir-abrir]").forEach(function (b) { b.addEventListener("click", abrir); });
    $$("[data-pedir-cerrar]", modal).forEach(function (b) { b.addEventListener("click", cerrar); });
    modal.addEventListener("click", function (e) { if (e.target === modal) cerrar(); });
    modal.addEventListener("close", function () { document.body.classList.remove("sin-scroll"); });
  }

  // ---------- Barra de acciones móvil: aparece cuando la portada ya ha pasado ----------
  function initBarraAcciones() {
    var barra = $("[data-barra-acciones]");
    if (!barra) return;
    var marcar = function () { barra.classList.toggle("is-visible", window.scrollY > 360); };
    marcar();
    window.addEventListener("scroll", marcar, { passive: true });
  }

  // ---------- Re-salto al ancla tras cargar (las imágenes desplazan el destino) ----------
  function initAnclaCarga() {
    if (!location.hash) return;
    window.addEventListener("load", function () {
      var el = document.querySelector(location.hash);
      if (!el) return;
      var raiz = document.documentElement;
      var suave = raiz.style.scrollBehavior;
      raiz.style.scrollBehavior = "auto";
      el.scrollIntoView();
      raiz.style.scrollBehavior = suave;
    });
  }

  // ---------- Reseñas: flechas del carril (sin autoplay: el texto se lee) ----------
  function initResenas() {
    var carril = $("[data-resenas]");
    if (!carril) return;
    var paso = function () {
      var tarjeta = carril.querySelector(".resena");
      return tarjeta ? tarjeta.getBoundingClientRect().width + 20 : 380;
    };
    var prev = $("[data-resenas-prev]");
    var next = $("[data-resenas-next]");
    if (prev) prev.addEventListener("click", function () { carril.scrollBy({ left: -paso(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { carril.scrollBy({ left: paso(), behavior: "smooth" }); });
  }

  // ---------- Archivo de novedades: carril con flechas; los vídeos verticales solo se reproducen a la vista ----------
  function initArchivo() {
    var carril = $("[data-archivo]");
    if (!carril) return;
    var paso = function () {
      var t = carril.querySelector(".archivo-item");
      return t ? t.getBoundingClientRect().width + 18 : 300;
    };
    var prev = $("[data-archivo-prev]"), next = $("[data-archivo-next]");
    if (prev) prev.addEventListener("click", function () { carril.scrollBy({ left: -paso(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { carril.scrollBy({ left: paso(), behavior: "smooth" }); });
    var videos = $$("video[data-src]", carril);
    if (!videos.length || reducirMovimiento) return;
    var arrancar = function (v) {
      if (!v.getAttribute("src")) v.src = v.getAttribute("data-src");
      var p = v.play();
      if (p && p.catch) p.catch(function () { /* autoplay bloqueado: se queda la foto */ });
    };
    videos.forEach(function (v) { v.addEventListener("playing", function () { v.classList.add("is-playing"); }); });
    if (!("IntersectionObserver" in window)) { videos.forEach(arrancar); return; }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) arrancar(v); else if (v.getAttribute("src")) v.pause();
      });
    }, { rootMargin: "120px 0px", threshold: 0.25 });
    videos.forEach(function (v) { io.observe(v); });
  }

  // ---------- Analítica sin cookies: nombres de evento para Umami ----------
  // Umami lee data-umami-event en el momento del clic, así que basta con marcar los elementos.
  function initAnalitica() {
    var marcar = function (sel, evento, extra) {
      $$(sel).forEach(function (el) {
        if (el.hasAttribute("data-umami-event")) return;
        el.setAttribute("data-umami-event", evento);
        if (extra) el.setAttribute("data-umami-event-" + extra.nombre, extra.valor(el));
      });
    };
    marcar('a[href$="reservar.html"]', "reservar");
    marcar("[data-pedir-abrir]", "pedir-abrir");
    marcar(".pedir-opcion", "pedir-app", { nombre: "app", valor: function (el) { return /glovo/i.test(el.href) ? "glovo" : "uber"; } });
    marcar('a[href*="squareup.com"]', "puntos");
    marcar('a[href^="tel:"]', "llamar");
    marcar('a[href*="instagram.com"]', "instagram");
    marcar('a[href*="open.spotify.com"]', "spotify");
    marcar("[data-embed-cargar]", "embed-cargar");
  }

  // =============================================================
  //  Fase E: la "magia". Todo opcional: sin GSAP, sin ratón o con
  //  "reducir movimiento" activado, la web funciona igual sin estos extras.
  // =============================================================
  var escritorioFino = window.matchMedia("(min-width: 960px) and (hover: hover) and (pointer: fine)").matches;

  // ---------- Scroll suave con inercia (Lenis): solo escritorio con ratón ----------
  function initSuave() {
    if (!window.Lenis || !escritorioFino || reducirMovimiento) return;
    if ($("iframe")) return; // reservar.html: el widget de reservas manda sobre el scroll
    var relleno = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 84;
    var lenis = new window.Lenis({
      lerp: 0.09,
      smoothWheel: true,
      autoRaf: !gsapOk,
      anchors: { offset: -relleno }
    });
    window.__lenis = lenis;
    if (gsapOk) {
      lenis.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    }
    // Los modales bloquean el scroll con body.sin-scroll: Lenis se para y arranca con ellos
    var sincronizar = function () {
      if (document.body.classList.contains("sin-scroll")) lenis.stop(); else lenis.start();
    };
    new MutationObserver(sincronizar).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  // ---------- Tarjetas con relieve: se inclinan hacia el cursor (platos de la carta y burgers) ----------
  function initTilt() {
    if (!escritorioFino || !gsapOk) return;
    var g = window.gsap;
    $$(".plato, .burger-shot").forEach(function (tarjeta) {
      tarjeta.classList.add("is-tilt");
      var esPlato = tarjeta.classList.contains("plato");
      var img = esPlato ? $("img", tarjeta) : null;
      g.set(tarjeta, { transformPerspective: 900 });
      var rx = g.quickTo(tarjeta, "rotationX", { duration: 0.5, ease: "power3.out" });
      var ry = g.quickTo(tarjeta, "rotationY", { duration: 0.5, ease: "power3.out" });
      var ix = img && g.quickTo(img, "x", { duration: 0.6, ease: "power3.out" });
      var iy = img && g.quickTo(img, "y", { duration: 0.6, ease: "power3.out" });
      tarjeta.addEventListener("mouseenter", function () {
        g.to(tarjeta, esPlato
          ? { y: -6, duration: 0.45, ease: "power3.out", overwrite: "auto" }
          : { scale: 1.04, duration: 0.45, ease: "power3.out", overwrite: "auto" });
        if (img) g.to(img, { scale: 1.06, rotation: -1.5, duration: 0.5, ease: "power3.out", overwrite: "auto" });
      });
      tarjeta.addEventListener("mousemove", function (e) {
        var r = tarjeta.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5;
        var dy = (e.clientY - r.top) / r.height - 0.5;
        rx(-dy * 10); ry(dx * 12);
        if (ix) { ix(dx * 14); iy(dy * 14); }
      });
      tarjeta.addEventListener("mouseleave", function () {
        rx(0); ry(0);
        g.to(tarjeta, { y: 0, scale: 1, duration: 0.6, ease: "power3.out", overwrite: "auto" });
        if (img) { ix(0); iy(0); g.to(img, { scale: 1, rotation: 0, duration: 0.6, ease: "power3.out", overwrite: "auto" }); }
      });
    });
  }


  // =============================================================
  //  Portada (elegida por Ivan el 15/9/2026): intro de marca, entrada del
  //  titular, carrusel de apartados y NUEVE gigante. Todo opcional: sin GSAP
  //  o con "reducir movimiento" la portada funciona igual, sin adornos.
  // =============================================================

  // ---------- Intro: VIBRA como ventana a la burger, una vez por sesión (?intro la repite) ----------
  function initIntro() {
    var intro = document.getElementById("intro");
    var raiz = document.documentElement;
    if (!intro) return;
    var vista = false;
    try { vista = sessionStorage.getItem("vibra-intro") === "1" && location.search.indexOf("intro") === -1; } catch (e) {}
    if (vista || reducirMovimiento || !gsapOk) { intro.remove(); raiz.classList.add("sin-intro"); return; }
    try { sessionStorage.setItem("vibra-intro", "1"); } catch (e) {}
    raiz.classList.add("con-intro");
    document.body.classList.add("sin-scroll");
    var g = window.gsap;
    var palabra = $(".intro-palabra", intro);
    var ondas = $$(".intro-onda", intro);
    g.timeline({ onComplete: function () { intro.remove(); document.body.classList.remove("sin-scroll"); } })
      .fromTo(palabra, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" }, 0)
      .fromTo(palabra, { backgroundPosition: "50% 22%" }, { backgroundPosition: "50% 62%", duration: 1.6, ease: "none" }, 0)
      .fromTo(ondas, { opacity: 0, x: function (i) { return i ? 70 : -70; } }, { opacity: 0.85, x: 0, duration: 0.9, ease: "power3.out", stagger: 0.1 }, 0.15)
      .to(palabra, { scale: 18, opacity: 0, duration: 0.95, ease: "power3.in" }, 1.3)
      .to(ondas, { opacity: 0, duration: 0.4 }, 1.35)
      .to(intro, { opacity: 0, duration: 0.35 }, 1.95);
  }

  // ---------- Portada: entrada del titular y carrusel de apartados ----------
  function initPortada() {
    var hero = $(".hero");
    if (!hero) return;
    var g = gsapOk ? window.gsap : null;
    var animar = !!g && !reducirMovimiento;

    // Cada línea del titular sale de debajo de una máscara
    $$(".hero-titulo .hero-linea", hero).forEach(function (l) {
      var m = document.createElement("span");
      m.className = "hero-mascara";
      l.parentNode.insertBefore(m, l);
      m.appendChild(l);
    });
    var partesDe = function (slide) {
      return [".hero-kicker", ".hero-sub", ".hero-acciones", ".hero-nota", ".hero-estado"].map(function (s) { return $(s, slide); }).filter(Boolean);
    };
    var entrar = function (slide, retraso) {
      if (!animar) return;
      var lineas = $$(".hero-linea", slide), partes = partesDe(slide);
      g.set(lineas, { yPercent: 110 });
      g.set(partes, { opacity: 0, y: 18 });
      g.timeline({ delay: retraso || 0 })
        .to(lineas, { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.12 })
        .to(partes, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 }, "-=0.7");
    };

    var slides = $$("[data-slide]", hero);
    var primera = slides[0] || hero;
    entrar(primera, document.documentElement.classList.contains("con-intro") ? 1.6 : 0.15);
    if (slides.length < 2) return;

    // ----- Carrusel -----
    var DUR = 6500;
    hero.style.setProperty("--hero-dur", DUR + "ms");
    var control = $("[data-hero-control]", hero);
    var puntos = $$(".hero-punto", control);
    var actual = 0, temporizador = null, pausado = false;

    var reiniciar = function () {
      clearTimeout(temporizador);
      if (pausado || reducirMovimiento) return;
      temporizador = setTimeout(function () { ir(actual + 1); }, DUR);
    };
    // Reinicia la barra de progreso del punto activo (aunque sea el mismo elemento)
    var barra = function () {
      var activo = puntos[actual];
      if (activo) { activo.classList.remove("is-activa"); void activo.offsetWidth; activo.classList.add("is-activa"); }
    };
    var ir = function (i) {
      var siguiente = (i + slides.length) % slides.length;
      if (siguiente === actual) return;
      var prev = slides[actual], next = slides[siguiente];
      actual = siguiente;
      if (animar) {
        var salen = $$(".hero-linea, .hero-kicker, .hero-sub, .hero-acciones, .hero-nota, .hero-estado", prev);
        g.to(salen, { opacity: 0, y: -14, duration: 0.4, ease: "power2.in", onComplete: function () { g.set(salen, { clearProps: "opacity,y" }); } });
      }
      prev.classList.remove("is-activa");
      next.classList.add("is-activa");
      entrar(next, 0.25);
      puntos.forEach(function (p, j) {
        p.classList.toggle("is-activa", j === actual);
        p.setAttribute("aria-current", j === actual ? "true" : "false");
      });
      barra();
      reiniciar();
    };

    puntos.forEach(function (p, j) { p.addEventListener("click", function () { ir(j); }); });
    var prevBtn = $("[data-hero-prev]", control), nextBtn = $("[data-hero-next]", control);
    if (prevBtn) prevBtn.addEventListener("click", function () { ir(actual - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { ir(actual + 1); });

    // Se para con el ratón sobre los controles (la barra se detiene y se ve), con el
    // teclado dentro y con la pestaña oculta. En el resto de la portada sigue pasando.
    var pausar = function () { pausado = true; hero.classList.add("is-pausado"); clearTimeout(temporizador); };
    var seguir = function () { pausado = false; hero.classList.remove("is-pausado"); reiniciar(); };
    if (control) {
      control.addEventListener("mouseenter", pausar);
      control.addEventListener("mouseleave", seguir);
    }
    hero.addEventListener("focusin", pausar);
    hero.addEventListener("focusout", function (e) { if (!hero.contains(e.relatedTarget)) seguir(); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) pausar(); else seguir(); });

    // Deslizar con el dedo
    var x0 = null;
    hero.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) ir(dx < 0 ? actual + 1 : actual - 1);
    }, { passive: true });

    // Con intro, el reloj arranca cuando la intro se va, para que la primera diapositiva se vea entera
    var arranque = document.documentElement.classList.contains("con-intro") ? 1600 : 0;
    setTimeout(function () { barra(); reiniciar(); }, arranque);
  }

  // ---------- NUEVE gigante: la foto se desplaza dentro de las letras al bajar ----------
  function initGigante() {
    var el = $(".gigante");
    if (!el || !gsapOk || reducirMovimiento) return;
    window.gsap.fromTo(el, { backgroundPosition: "50% 10%" }, { backgroundPosition: "50% 80%", ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
  }


  // ---------- Cookies (15/9/2026): aviso con "aceptar todas", "solo necesarias" y "configurar".
  // Guarda la elección 12 meses en localStorage. Con "contenido de terceros" aceptado, Spotify y el
  // mapa se cargan solos al acercarse; si no, siguen esperando al botón. "Publicidad" queda listo
  // para el píxel de Meta: escuchar el evento "vibra:cookies" o leer window.vibraConsent. ----------
  var CLAVE_COOKIES = "vibra-cookies";
  function leerConsentimiento() {
    try {
      var d = JSON.parse(localStorage.getItem(CLAVE_COOKIES) || "null");
      if (!d || !d.fecha || Date.now() - d.fecha > 365 * 24 * 3600 * 1000) return null;
      return d;
    } catch (e) { return null; }
  }
  function initCookies() {
    var ca = (document.documentElement.lang || "es").indexOf("ca") === 0;
    var base = /\/ca\//.test(location.pathname) ? "../" : "";
    var T = ca ? {
      titulo: "Avís de galetes",
      texto: "Fem servir galetes tècniques perquè la web funcioni. Si acceptes, també carreguem contingut de tercers (Spotify i Google Maps) i galetes de publicitat per mesurar els nostres anuncis. Ho pots canviar quan vulguis.",
      enlace: "Política de galetes",
      necesarias: "Necessàries (sempre actives)",
      terceros: "Contingut de tercers: Spotify i Google Maps",
      publicidad: "Publicitat i mesura: Meta (Facebook i Instagram)",
      aceptar: "Acceptar-les totes", rechazar: "Només les necessàries", configurar: "Configurar", guardar: "Desar l'elecció"
    } : {
      titulo: "Aviso de cookies",
      texto: "Usamos cookies técnicas para que la web funcione. Si aceptas, también cargamos contenido de terceros (Spotify y Google Maps) y cookies de publicidad para medir nuestros anuncios. Puedes cambiarlo cuando quieras.",
      enlace: "Política de cookies",
      necesarias: "Necesarias (siempre activas)",
      terceros: "Contenido de terceros: Spotify y Google Maps",
      publicidad: "Publicidad y medición: Meta (Facebook e Instagram)",
      aceptar: "Aceptar todas", rechazar: "Solo necesarias", configurar: "Configurar", guardar: "Guardar elección"
    };
    var estado = leerConsentimiento();
    window.vibraConsent = { terceros: !!(estado && estado.terceros), publicidad: !!(estado && estado.publicidad) };

    // Con permiso, los contenidos de terceros se cargan solos cuando están cerca de la pantalla
    var autoCargar = function () {
      var marcos = $$("[data-embed]").filter(function (m) { return !m.classList.contains("is-cargado"); });
      if (!marcos.length) return;
      if (!("IntersectionObserver" in window)) { marcos.forEach(cargarEmbed); return; }
      var io = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) { if (en.isIntersecting) { cargarEmbed(en.target); io.unobserve(en.target); } });
      }, { rootMargin: "400px 0px" });
      marcos.forEach(function (m) { io.observe(m); });
    };
    var aplicar = function () {
      try { document.dispatchEvent(new CustomEvent("vibra:cookies", { detail: window.vibraConsent })); } catch (e) {}
      if (window.vibraConsent.terceros) autoCargar();
    };

    var aviso = document.createElement("div");
    aviso.className = "cookies";
    aviso.setAttribute("role", "dialog");
    aviso.setAttribute("aria-label", T.titulo);
    aviso.hidden = true;
    aviso.innerHTML =
      '<p class="cookies-texto">' + T.texto + ' <a href="' + base + 'cookies.html">' + T.enlace + '</a></p>' +
      '<form class="cookies-config" hidden>' +
        '<label class="cookies-opcion"><input type="checkbox" checked disabled> <span>' + T.necesarias + '</span></label>' +
        '<label class="cookies-opcion"><input type="checkbox" name="terceros"> <span>' + T.terceros + '</span></label>' +
        '<label class="cookies-opcion"><input type="checkbox" name="publicidad"> <span>' + T.publicidad + '</span></label>' +
      '</form>' +
      '<div class="cookies-botones">' +
        '<button type="button" class="btn btn-degradado" data-cookies-todas>' + T.aceptar + '</button>' +
        '<button type="button" class="btn btn-fantasma" data-cookies-necesarias>' + T.rechazar + '</button>' +
        '<button type="button" class="cookies-enlace" data-cookies-config>' + T.configurar + '</button>' +
        '<button type="button" class="btn btn-fantasma" data-cookies-guardar hidden>' + T.guardar + '</button>' +
      '</div>';
    document.body.appendChild(aviso);

    var form = $(".cookies-config", aviso);
    var btnConfig = $("[data-cookies-config]", aviso);
    var btnGuardar = $("[data-cookies-guardar]", aviso);
    var abrir = function () {
      form.hidden = true; btnConfig.hidden = false; btnGuardar.hidden = true;
      aviso.hidden = false;
      requestAnimationFrame(function () { aviso.classList.add("is-visible"); });
    };
    var cerrar = function () { aviso.classList.remove("is-visible"); aviso.hidden = true; };
    var guardar = function (terceros, publicidad) {
      window.vibraConsent = { terceros: !!terceros, publicidad: !!publicidad };
      try { localStorage.setItem(CLAVE_COOKIES, JSON.stringify({ terceros: !!terceros, publicidad: !!publicidad, fecha: Date.now() })); } catch (e) {}
      estado = { terceros: !!terceros, publicidad: !!publicidad };
      cerrar();
      aplicar();
    };
    $("[data-cookies-todas]", aviso).addEventListener("click", function () { guardar(true, true); });
    $("[data-cookies-necesarias]", aviso).addEventListener("click", function () { guardar(false, false); });
    btnConfig.addEventListener("click", function () {
      form.hidden = false; btnConfig.hidden = true; btnGuardar.hidden = false;
      form.terceros.checked = !!(estado && estado.terceros);
      form.publicidad.checked = !!(estado && estado.publicidad);
    });
    btnGuardar.addEventListener("click", function () { guardar(form.terceros.checked, form.publicidad.checked); });
    // "Cambiar mis preferencias" (política de cookies) vuelve a abrir el aviso
    $$("[data-cookies-abrir]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); abrir(); }); });

    if (estado) aplicar(); else abrir();
  }

  // ---------- Año del pie ----------
  function initAnio() {
    var el = $("[data-anio]");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  // ---------- Arranque ----------
  function boot() {
    safe(initCabecera, "initCabecera");
    safe(initMenuMovil, "initMenuMovil");
    safe(initNavActiva, "initNavActiva");
    safe(initMediaSlots, "initMediaSlots");
    safe(initHorarioHoy, "initHorarioHoy");
    safe(initIntro, "initIntro");
    safe(initPortada, "initPortada");
    safe(initGigante, "initGigante");
    safe(initManifiesto, "initManifiesto");
    safe(initParallax, "initParallax");
    safe(initReveals, "initReveals");
    safe(initCartaNav, "initCartaNav");
    safe(initBurgerModal, "initBurgerModal");
    safe(initEmbeds, "initEmbeds");
    safe(initCookies, "initCookies");
    safe(initPedir, "initPedir");
    safe(initBarraAcciones, "initBarraAcciones");
    safe(initResenas, "initResenas");
    safe(initArchivo, "initArchivo");
    safe(initAnclaCarga, "initAnclaCarga");
    safe(initAnalitica, "initAnalitica");
    safe(initAnio, "initAnio");
    // Fase E
    safe(initSuave, "initSuave");
    safe(initTilt, "initTilt");

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
