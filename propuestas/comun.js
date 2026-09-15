// PROPUESTAS — base común: intro (VIBRA como ventana) y entrada del titular.
// Se carga después de main.js y usa su GSAP. Expone window.__propuesta con utilidades.
(function () {
  "use strict";
  var g = window.gsap, ST = window.ScrollTrigger;
  var raiz = document.documentElement;
  var reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var intro = document.getElementById("intro");
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // Titular: cada línea bajo una máscara
  var lineas = $$(".hero-titulo .hero-linea");
  lineas.forEach(function (l) {
    var m = document.createElement("span");
    m.className = "hero-mascara";
    l.parentNode.insertBefore(m, l);
    m.appendChild(l);
  });
  var partes = [".hero-kicker", ".hero-sub", ".hero-acciones", ".hero-estado", ".hero-marquesina", "[data-entra]"]
    .reduce(function (a, s) { return a.concat($$(s)); }, []);

  function entradaHero(retraso) {
    if (!g || reducir) return;
    if (lineas.length) g.set(lineas, { yPercent: 110 });
    if (partes.length) g.set(partes, { opacity: 0, y: 18 });
    // El aviso "propuesta:hero" sale cuando ARRANCA la entrada (tras la intro), no al programarla:
    // así las propuestas, que se cargan justo después de este archivo, llegan a tiempo de escucharlo.
    var tl = g.timeline({ delay: retraso || 0, onStart: function () { document.dispatchEvent(new CustomEvent("propuesta:hero")); } });
    if (lineas.length) tl.to(lineas, { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.12 });
    if (partes.length) tl.to(partes, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 }, lineas.length ? "-=0.7" : 0);
    if (!lineas.length && !partes.length) tl.to({}, { duration: 0.01 });
  }

  var vista = false;
  try { vista = sessionStorage.getItem("vibra-intro") === "1" && location.search.indexOf("intro") === -1; } catch (e) {}
  var conIntro = !!intro && !vista && !reducir && !!g;
  if (!conIntro) {
    if (intro) intro.remove();
    raiz.classList.add("sin-intro");
    entradaHero(0.15);
  } else {
    try { sessionStorage.setItem("vibra-intro", "1"); } catch (e) {}
    document.body.classList.add("sin-scroll");
    var palabra = $(".intro-palabra", intro);
    var ondas = $$(".intro-onda", intro);
    g.timeline({ onComplete: function () { intro.remove(); document.body.classList.remove("sin-scroll"); } })
      .fromTo(palabra, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" }, 0)
      .fromTo(palabra, { backgroundPosition: "50% 22%" }, { backgroundPosition: "50% 62%", duration: 1.6, ease: "none" }, 0)
      .fromTo(ondas, { opacity: 0, x: function (i) { return i ? 70 : -70; } }, { opacity: 0.85, x: 0, duration: 0.9, ease: "power3.out", stagger: 0.1 }, 0.15)
      .to(palabra, { scale: 18, opacity: 0, duration: 0.95, ease: "power3.in" }, 1.3)
      .to(ondas, { opacity: 0, duration: 0.4 }, 1.35)
      .to(intro, { opacity: 0, duration: 0.35 }, 1.95);
    entradaHero(1.6);
  }

  // NUEVE: la foto se desplaza dentro de las letras al bajar
  if (g && ST && !reducir) {
    var gigante = $(".gigante");
    if (gigante) g.fromTo(gigante, { backgroundPosition: "50% 10%" }, { backgroundPosition: "50% 80%", ease: "none", scrollTrigger: { trigger: gigante, start: "top bottom", end: "bottom top", scrub: true } });
  }

  window.__propuesta = { g: g, ST: ST, reducir: reducir, $: $, $$: $$, conIntro: conIntro };
})();
