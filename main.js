(function () {
  "use strict";

  // ---------- Helpers ----------
  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
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
    $$("a", menu).forEach(function (a) { a.addEventListener("click", cerrar); });
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

  // ---------- Glow reactivo del hero (firma visual) ----------
  function initGlow() {
    var hero = $("[data-hero]");
    var glow = $(".hero-glow", hero);
    if (!hero || !glow || !finePointer) return;

    var objetivoX = 70, objetivoY = 42;
    var actualX = objetivoX, actualY = objetivoY;
    var animando = false;

    hero.addEventListener("pointermove", function (e) {
      var caja = hero.getBoundingClientRect();
      objetivoX = ((e.clientX - caja.left) / caja.width) * 100;
      objetivoY = ((e.clientY - caja.top) / caja.height) * 100;
      if (!animando) { animando = true; requestAnimationFrame(paso); }
    });

    function paso() {
      actualX += (objetivoX - actualX) * 0.08;
      actualY += (objetivoY - actualY) * 0.08;
      glow.style.setProperty("--mx", actualX.toFixed(2) + "%");
      glow.style.setProperty("--my", actualY.toFixed(2) + "%");
      if (Math.abs(objetivoX - actualX) + Math.abs(objetivoY - actualY) > 0.05) {
        requestAnimationFrame(paso);
      } else {
        animando = false;
      }
    }
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

  // ---------- Entrada del hero (GSAP) ----------
  function initHeroIntro() {
    var hero = $("[data-hero]");
    if (!hero || !window.gsap) return;
    var lineas = $$(".hero-titulo .linea > span", hero);
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from($(".kicker", hero), { y: 18, opacity: 0, duration: 0.7 })
      .from(lineas, { yPercent: 112, duration: 1.05, stagger: 0.1 }, 0.1)
      .from($(".hero-sub", hero), { y: 22, opacity: 0, duration: 0.8 }, 0.55)
      .from($(".hero-acciones", hero), { y: 22, opacity: 0, duration: 0.8 }, 0.68)
      .from($(".hero-burger", hero), { y: 40, opacity: 0, scale: 0.94, duration: 1.1 }, 0.35)
      .from($(".hero-pista", hero), { opacity: 0, duration: 0.9 }, 1.0);
  }

  // ---------- Parallax suave de la burger ----------
  function initParallax() {
    var burger = $(".hero-burger");
    if (!burger || !window.gsap || !window.ScrollTrigger) return;
    gsap.to(burger, {
      yPercent: -13,
      ease: "none",
      scrollTrigger: {
        trigger: "[data-hero]",
        start: "top top",
        end: "bottom top",
        scrub: 0.6
      }
    });
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

  // ---------- Mapa en dos pasos: Google solo carga cuando el visitante lo pide ----------
  function initMapa() {
    var marco = $("[data-mapa]");
    if (!marco) return;
    var boton = $("[data-mapa-cargar]", marco);
    var src = marco.getAttribute("data-mapa-src");
    if (!boton || !src) return;
    boton.addEventListener("click", function () {
      var iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.title = "Mapa de Google Maps con la ubicación de Vibra Street Food";
      iframe.setAttribute("allowfullscreen", "");
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      iframe.loading = "lazy";
      marco.innerHTML = "";
      marco.appendChild(iframe);
    });
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
    safe(initGlow, "initGlow");
    safe(initReveals, "initReveals");
    safe(initCartaNav, "initCartaNav");
    safe(initBurgerModal, "initBurgerModal");
    safe(initMapa, "initMapa");
    safe(initAnclaCarga, "initAnclaCarga");
    safe(initAnio, "initAnio");

    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
      safe(initHeroIntro, "initHeroIntro");
      safe(initParallax, "initParallax");
    } else if (window.gsap) {
      safe(initHeroIntro, "initHeroIntro");
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
