// PROPUESTA 1 — "Entrada de cine". Se carga después de main.js y usa su GSAP.
// Sin cursor propio, sin fijar secciones, sin cortinas: solo entrada, tipografía y scroll.
(function () {
  "use strict";
  var g = window.gsap, ST = window.ScrollTrigger;
  var raiz = document.documentElement;
  var reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var intro = document.getElementById("intro");
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  // ---------- Titular: cada línea sale de debajo de una máscara ----------
  var lineas = $$(".hero-titulo .hero-linea");
  lineas.forEach(function (l) {
    var m = document.createElement("span");
    m.className = "hero-mascara";
    l.parentNode.insertBefore(m, l);
    m.appendChild(l);
  });
  var partes = [".hero-kicker", ".hero-sub", ".hero-acciones", ".hero-estado", ".sello", ".hero-marquesina"].map($).filter(Boolean);
  function entradaHero(retraso) {
    if (!g || reducir) return;
    g.set(lineas, { yPercent: 110 });
    g.set(partes, { opacity: 0, y: 18 });
    g.timeline({ delay: retraso || 0 })
      .to(lineas, { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.12 })
      .to(partes, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 }, "-=0.7");
  }

  // ---------- Intro: VIBRA como ventana a la burger, una vez por sesión ----------
  var vista = false;
  try { vista = sessionStorage.getItem("vibra-intro") === "1" && location.search.indexOf("intro") === -1; } catch (e) {}
  if (!intro || vista || reducir || !g) {
    if (intro) intro.remove();
    raiz.classList.add("sin-intro");
    entradaHero(0.15);
  } else {
    try { sessionStorage.setItem("vibra-intro", "1"); } catch (e) {}
    document.body.classList.add("sin-scroll");
    var palabra = intro.querySelector(".intro-palabra");
    var ondas = intro.querySelectorAll(".intro-onda");
    g.timeline({ onComplete: function () { intro.remove(); document.body.classList.remove("sin-scroll"); } })
      .fromTo(palabra, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" }, 0)
      .fromTo(palabra, { backgroundPosition: "50% 22%" }, { backgroundPosition: "50% 62%", duration: 1.6, ease: "none" }, 0)
      .fromTo(ondas, { opacity: 0, x: function (i) { return i ? 70 : -70; } }, { opacity: 0.85, x: 0, duration: 0.9, ease: "power3.out", stagger: 0.1 }, 0.15)
      .to(palabra, { scale: 18, opacity: 0, duration: 0.95, ease: "power3.in" }, 1.3)
      .to(ondas, { opacity: 0, duration: 0.4 }, 1.35)
      .to(intro, { opacity: 0, duration: 0.35 }, 1.95);
    entradaHero(1.6);
  }

  if (!g) return;

  // ---------- Ondas del logo flotando detrás del titular ----------
  if (!reducir) {
    g.to(".hero-onda--naranja", { y: -26, x: 12, rotation: -2, duration: 6.5, yoyo: true, repeat: -1, ease: "sine.inOut" });
    g.to(".hero-onda--rosa", { y: 24, x: -12, rotation: 2, duration: 7.5, yoyo: true, repeat: -1, ease: "sine.inOut" });
  }

  if (!ST || reducir) return;

  // ---------- Portada: la foto crece un poco y el texto se aleja al bajar (sin fijar nada) ----------
  g.to(".hero-int", { yPercent: 16, opacity: 0.15, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  g.to(".hero-media", { scale: 1.12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  // ---------- NUEVE: la foto se desplaza dentro de las letras ----------
  var gigante = $(".gigante");
  if (gigante) {
    g.fromTo(gigante, { backgroundPosition: "50% 10%" }, { backgroundPosition: "50% 80%", ease: "none", scrollTrigger: { trigger: gigante, start: "top bottom", end: "bottom top", scrub: true } });
  }

  // ---------- Tarjetas de burger: se descubren de arriba abajo ----------
  var tarjetas = $$(".shot");
  if (tarjetas.length) {
    g.set(tarjetas, { clipPath: "inset(0 0 100% 0)" });
    ST.batch(tarjetas, { start: "top 88%", onEnter: function (lote) { g.to(lote, { clipPath: "inset(0 0 0% 0)", duration: 0.9, ease: "power3.out", stagger: 0.08 }); } });
  }

  // ---------- Viaje de color: el negro se calienta al llegar a las reseñas y vuelve al final ----------
  if ($("#resenas")) g.to(raiz, { "--negro": "#140811", ease: "none", scrollTrigger: { trigger: "#resenas", start: "top 85%", end: "top 25%", scrub: true } });
  if ($(".practica")) g.to(raiz, { "--negro": "#000000", ease: "none", scrollTrigger: { trigger: ".practica", start: "top 95%", end: "top 35%", scrub: true } });

  // ---------- Cierre: el nombre sube desde el pie ----------
  var pieGigante = $(".pie-gigante");
  if (pieGigante) {
    g.fromTo(pieGigante, { yPercent: 35, opacity: 0.25 }, { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: pieGigante, start: "top bottom", end: "bottom bottom", scrub: true } });
  }
})();
