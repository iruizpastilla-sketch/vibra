// PROPUESTA 6 — "Galería": la foto de portada respira al bajar y el mosaico se descubre celda a celda.
(function () {
  "use strict";
  var P = window.__propuesta; if (!P || !P.g || !P.ST || P.reducir) return;
  var g = P.g, ST = P.ST;
  g.to(".hero-media", { scale: 1.15, yPercent: 8, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  var celdas = P.$$(".mosaico a, .mosaico .mosaico-nueve");
  if (celdas.length) {
    g.set(celdas, { clipPath: "inset(0 0 100% 0)" });
    ST.batch(celdas, { start: "top 90%", onEnter: function (lote) { g.to(lote, { clipPath: "inset(0 0 0% 0)", duration: 0.9, ease: "power3.out", stagger: 0.07 }); } });
  }
})();
