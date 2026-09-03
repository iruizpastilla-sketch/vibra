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

  // ---------- Portada: carrusel con autoplay y control manual ----------
  function initPortada() {
    var portada = $("[data-portada]");
    if (!portada) return;
    var pista = $(".portada-pista", portada);
    var slides = $$(".portada-slide", portada);
    if (!pista || slides.length < 2) return;

    // Puntos generados según el número de slides (añadir slide = cero cambios aquí)
    var caja = $(".portada-puntos", portada);
    var puntos = [];
    var actual = 0;
    if (caja) {
      slides.forEach(function (ignorado, i) {
        var punto = document.createElement("button");
        punto.type = "button";
        punto.className = "portada-punto" + (i === 0 ? " is-activo" : "");
        punto.setAttribute("aria-label", "Ir a la foto " + (i + 1) + " de " + slides.length);
        punto.addEventListener("click", function () { manual(); irA(i); });
        caja.appendChild(punto);
        puntos.push(punto);
      });
    }

    var reloj = null;
    // Sin puerta de prefers-reduced-motion: muchos Windows lo traen activado
    // y el carrusel parecería muerto (guía de la skill). Las flechas y puntos
    // visibles son el mecanismo de control/parada.
    var autoOn = true;

    // Índice real leído del scroll: inmune a estados obsoletos (bfcache, atrás/adelante)
    function indiceVivo() {
      return Math.round(pista.scrollLeft / pista.clientWidth);
    }
    function irA(i) {
      actual = (i + slides.length) % slides.length;
      pista.scrollTo({ left: actual * pista.clientWidth, behavior: "smooth" });
    }
    function marcar() {
      puntos.forEach(function (p, j) { p.classList.toggle("is-activo", j === actual); });
    }
    function arranca() {
      if (!autoOn || reloj) return;
      reloj = setInterval(function () { irA(indiceVivo() + 1); }, 5000);
    }
    function para() {
      if (reloj) { clearInterval(reloj); reloj = null; }
    }
    // Quien toma el control manual, lo conserva: el autoplay se apaga
    function manual() { autoOn = false; para(); }

    // Sincronizar punto activo con el scroll real (swipe incluido)
    var pendiente = false;
    pista.addEventListener("scroll", function () {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(function () {
        pendiente = false;
        var i = Math.round(pista.scrollLeft / pista.clientWidth);
        if (i !== actual && i >= 0 && i < slides.length) { actual = i; }
        marcar();
      });
    }, { passive: true });

    var prev = $("[data-portada-prev]", portada);
    var next = $("[data-portada-next]", portada);
    if (prev) prev.addEventListener("click", function () { manual(); irA(indiceVivo() - 1); });
    if (next) next.addEventListener("click", function () { manual(); irA(indiceVivo() + 1); });

    pista.addEventListener("pointerdown", manual, { passive: true });
    // Solo el gesto HORIZONTAL sobre el carrusel es interacción con él;
    // el scroll vertical de página que pasa por encima no lo apaga
    pista.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) manual();
    }, { passive: true });

    // Sin pausa por hover: con un carrusel a casi pantalla completa, el cursor
    // siempre está encima y el autoplay no arrancaría nunca en escritorio
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { para(); } else { arranca(); }
    });
    window.addEventListener("resize", function () {
      pista.scrollTo({ left: actual * pista.clientWidth });
    });

    arranca();
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
    safe(initPortada, "initPortada");
    safe(initReveals, "initReveals");
    safe(initCartaNav, "initCartaNav");
    safe(initBurgerModal, "initBurgerModal");
    safe(initMapa, "initMapa");
    safe(initResenas, "initResenas");
    safe(initAnclaCarga, "initAnclaCarga");
    safe(initAnio, "initAnio");

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
