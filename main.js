(function () {
  "use strict";

  // ---------- Helpers ----------
  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  // GSAP y ScrollTrigger son opcionales: si no cargan, la web funciona igual, sin los efectos de scroll
  var gsapOk = !!(window.gsap && window.ScrollTrigger);
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
      var src = (vertical && v) ? v : (h || v);
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

  // ---------- Burgers: carril horizontal. En escritorio con GSAP se fija y avanza con el scroll ----------
  function initShots() {
    var seccion = $("[data-shots]");
    if (!seccion) return;
    var pista = $("[data-shots-pista]", seccion);
    if (!pista || !gsapOk) return;
    // Móvil y táctil: scroll horizontal nativo (CSS). Solo se fija en escritorio con puntero fino.
    var escritorio = window.matchMedia("(min-width: 960px) and (hover: hover) and (pointer: fine)");
    var fijado = false;
    var fijar = function () {
      if (fijado || !escritorio.matches) return;
      fijado = true;
      seccion.classList.add("is-pin");
      var distancia = function () { return Math.max(0, pista.scrollWidth - window.innerWidth); };
      window.gsap.to(pista, {
        x: function () { return -distancia(); },
        ease: "none",
        scrollTrigger: {
          trigger: seccion,
          start: "top top",
          end: function () { return "+=" + distancia(); },
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
    };
    fijar();
    // Si la ventana pasa a tamaño escritorio después de cargar, se fija entonces
    if (escritorio.addEventListener) escritorio.addEventListener("change", fijar);
  }

  // ---------- Lista de la carta: la foto sigue al cursor (solo puntero fino) ----------
  function initListaCarta() {
    var lista = $("[data-lista-carta]");
    if (!lista || !finePointer) return;
    var g = gsapOk ? window.gsap : null;
    $$("a", lista).forEach(function (fila) {
      var img = $(".lista-img", fila);
      if (!img) return;
      var posicion = function (e) {
        var r = fila.getBoundingClientRect();
        return { x: e.clientX - r.left - img.offsetWidth / 2, y: e.clientY - r.top - img.offsetHeight / 2 };
      };
      if (!g) {
        fila.addEventListener("mousemove", function (e) {
          var p = posicion(e);
          img.style.transform = "translate(" + p.x + "px, " + p.y + "px) rotate(-6deg)";
        });
        return;
      }
      // Con GSAP: la foto persigue al cursor con inercia y gira según lo rápido que se mueva
      var moverX = g.quickTo(img, "x", { duration: 0.45, ease: "power3.out" });
      var moverY = g.quickTo(img, "y", { duration: 0.45, ease: "power3.out" });
      var girar = g.quickTo(img, "rotation", { duration: 0.6, ease: "power3.out" });
      var ultimoX = null;
      fila.addEventListener("mouseenter", function (e) {
        var p = posicion(e);
        g.set(img, { x: p.x, y: p.y, rotation: -6, scale: 0.7 });
        g.to(img, { scale: 1, duration: 0.5, ease: "back.out(1.6)", overwrite: "auto" });
        ultimoX = e.clientX;
      });
      fila.addEventListener("mousemove", function (e) {
        var p = posicion(e);
        moverX(p.x); moverY(p.y);
        var vx = ultimoX === null ? 0 : e.clientX - ultimoX;
        ultimoX = e.clientX;
        girar(Math.max(-18, Math.min(18, -6 + vx * 0.9)));
      });
      fila.addEventListener("mouseleave", function () { girar(-6); ultimoX = null; });
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
  function initEmbeds() {
    $$("[data-embed]").forEach(function (marco) {
      var boton = $("[data-embed-cargar]", marco);
      var src = marco.getAttribute("data-embed-src");
      if (!boton || !src) return;
      boton.addEventListener("click", function () {
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
      });
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
  var reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var escritorioFino = window.matchMedia("(min-width: 960px) and (hover: hover) and (pointer: fine)").matches;
  var esCatalan = (document.documentElement.lang || "es").indexOf("ca") === 0;

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

  // ---------- Cursor propio: punto + aro que crece sobre enlaces y dice "Ver" / "Pedir" ----------
  function initCursor() {
    if (!escritorioFino || !gsapOk) return;
    var g = window.gsap;
    var tx = esCatalan ? { ver: "Veure" } : { ver: "Ver" };
    var etiquetar = function (sel, texto) {
      $$(sel).forEach(function (el) { if (!el.hasAttribute("data-cursor")) el.setAttribute("data-cursor", texto); });
    };
    // Solo donde la palabra aporta algo: en botones que ya dicen "Reservar" o "Pedir" el aro crece sin texto
    etiquetar(".burger-shot", tx.ver);
    etiquetar(".shot", tx.ver);
    etiquetar(".lista-cats a", tx.ver);

    var raiz = document.createElement("div");
    raiz.className = "cursor";
    raiz.setAttribute("aria-hidden", "true");
    raiz.innerHTML = '<div class="cursor-punto"></div><div class="cursor-aro"><i class="cursor-forma"><b class="cursor-texto"></b></i></div>';
    document.body.appendChild(raiz);
    var punto = $(".cursor-punto", raiz);
    var aro = $(".cursor-aro", raiz);
    var texto = $(".cursor-texto", raiz);
    var aroX = g.quickTo(aro, "x", { duration: 0.32, ease: "power3.out" });
    var aroY = g.quickTo(aro, "y", { duration: 0.32, ease: "power3.out" });
    var visible = false;

    document.addEventListener("mousemove", function (e) {
      if (!visible) {
        visible = true;
        g.set([punto, aro], { x: e.clientX, y: e.clientY });
        raiz.classList.add("is-visible");
        document.documentElement.classList.add("cursor-propio");
      }
      g.set(punto, { x: e.clientX, y: e.clientY });
      aroX(e.clientX); aroY(e.clientY);
    }, { passive: true });
    document.addEventListener("mouseleave", function () { raiz.classList.remove("is-visible"); visible = false; });
    document.addEventListener("mousedown", function () { raiz.classList.add("is-pulsado"); });
    document.addEventListener("mouseup", function () { raiz.classList.remove("is-pulsado"); });

    var estado = function (el) {
      var conTexto = el && el.closest && el.closest("[data-cursor]");
      var nativo = el && el.closest && el.closest("input, textarea, select, iframe, [contenteditable]");
      var enlace = el && el.closest && el.closest("a, button, [role=button], summary, label, .plato");
      raiz.classList.toggle("is-oculto", !!nativo);
      raiz.classList.toggle("is-texto", !!conTexto && !nativo);
      raiz.classList.toggle("is-enlace", !!enlace && !conTexto && !nativo);
      if (conTexto) texto.textContent = conTexto.getAttribute("data-cursor");
    };
    document.addEventListener("mouseover", function (e) { estado(e.target); });
    document.addEventListener("mouseout", function (e) { if (!e.relatedTarget) estado(null); });
  }

  // ---------- Marquesinas vivas: corren más deprisa y se inclinan según la velocidad del scroll ----------
  function initMarquesinaViva() {
    var pistas = $$(".marquesina-pista");
    if (!pistas.length || !gsapOk) return;
    var g = window.gsap;
    var tweens = pistas.map(function (pista) {
      pista.classList.add("is-gsap"); // apaga la animación CSS; GSAP toma el relevo
      return g.to(pista, { xPercent: -50, duration: 34, ease: "none", repeat: -1 });
    });
    var estado = { ts: 1, skew: 0 };
    var aplicar = function () {
      tweens.forEach(function (t) { t.timeScale(estado.ts); });
      g.set(pistas, { skewX: estado.skew });
    };
    var volver = g.to(estado, { ts: 1, skew: 0, duration: 1.4, ease: "power3.out", paused: true, onUpdate: aplicar });
    window.ScrollTrigger.create({
      onUpdate: function (self) {
        var v = self.getVelocity();
        var fuerza = Math.min(Math.abs(v) / 350, 4);
        estado.ts = (self.direction < 0 ? -1 : 1) * (1 + fuerza);
        estado.skew = Math.max(-14, Math.min(14, -v / 160));
        aplicar();
        volver.invalidate().restart();
      }
    });
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

  // ---------- Transición entre páginas: cortina degradada que sube al salir y se retira al llegar ----------
  // El script inline del <head> pone html.is-llegando si venimos de otra página de la web;
  // la CSS anima la retirada sola, así que aunque este JS fallara la cortina desaparece igual.
  function initTransiciones() {
    var raiz = document.documentElement;
    var CLAVE = "vibra-transicion";
    if (raiz.classList.contains("is-llegando")) {
      setTimeout(function () { raiz.classList.remove("is-llegando"); }, 1000);
    }
    if (reducirMovimiento) return;
    var cortina = document.createElement("div");
    cortina.className = "transicion";
    cortina.setAttribute("aria-hidden", "true");
    document.body.appendChild(cortina);

    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.target || a.hasAttribute("download") || a.hasAttribute("data-sin-transicion")) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
      if (url.pathname === location.pathname && url.hash) return; // ancla dentro de la misma página
      e.preventDefault();
      try { sessionStorage.setItem(CLAVE, "1"); } catch (err) { /* sin almacenamiento: sin cortina de llegada */ }
      cortina.classList.add("is-cubierta");
      setTimeout(function () { location.href = url.href; }, 520);
    });
    // Si el navegador restaura la página desde caché (botón atrás), la cortina no debe quedarse puesta
    window.addEventListener("pageshow", function (e) { if (e.persisted) cortina.classList.remove("is-cubierta"); });
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
    safe(initManifiesto, "initManifiesto");
    safe(initShots, "initShots");
    safe(initListaCarta, "initListaCarta");
    safe(initParallax, "initParallax");
    safe(initReveals, "initReveals");
    safe(initCartaNav, "initCartaNav");
    safe(initBurgerModal, "initBurgerModal");
    safe(initEmbeds, "initEmbeds");
    safe(initPedir, "initPedir");
    safe(initBarraAcciones, "initBarraAcciones");
    safe(initResenas, "initResenas");
    safe(initAnclaCarga, "initAnclaCarga");
    safe(initAnalitica, "initAnalitica");
    safe(initAnio, "initAnio");
    // Fase E
    safe(initSuave, "initSuave");
    safe(initCursor, "initCursor");
    safe(initMarquesinaViva, "initMarquesinaViva");
    safe(initTilt, "initTilt");
    safe(initTransiciones, "initTransiciones");

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
