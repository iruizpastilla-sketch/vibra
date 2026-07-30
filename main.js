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
