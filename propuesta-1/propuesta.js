// PROPUESTA 1 — "Entrada de cine": portada que se aleja al bajar, tarjetas que se descubren,
// viaje de color en las reseñas y el nombre subiendo desde el pie.
(function () {
  "use strict";
  var P = window.__propuesta; if (!P || !P.g || !P.ST || P.reducir) return;
  var g = P.g, ST = P.ST, raiz = document.documentElement;
  g.to(".hero-int", { yPercent: 16, opacity: 0.15, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  g.to(".hero-media", { scale: 1.12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  var tarjetas = P.$$(".shot");
  if (tarjetas.length) {
    g.set(tarjetas, { clipPath: "inset(0 0 100% 0)" });
    ST.batch(tarjetas, { start: "top 88%", onEnter: function (lote) { g.to(lote, { clipPath: "inset(0 0 0% 0)", duration: 0.9, ease: "power3.out", stagger: 0.08 }); } });
  }
  if (P.$("#resenas")) g.to(raiz, { "--negro": "#140811", ease: "none", scrollTrigger: { trigger: "#resenas", start: "top 85%", end: "top 25%", scrub: true } });
  if (P.$(".practica")) g.to(raiz, { "--negro": "#000000", ease: "none", scrollTrigger: { trigger: ".practica", start: "top 95%", end: "top 35%", scrub: true } });
  var pie = P.$(".pie-gigante");
  if (pie) g.fromTo(pie, { yPercent: 35, opacity: 0.25 }, { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: pie, start: "top bottom", end: "bottom bottom", scrub: true } });
})();
