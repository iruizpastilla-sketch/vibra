// PROPUESTA 7 — "Contraste": al bajar, la portada se aleja y cada bloque claro entra desde su corte.
(function () {
  "use strict";
  var P = window.__propuesta; if (!P || !P.g || !P.ST || P.reducir) return;
  var g = P.g, ST = P.ST;
  g.to(".hero-int", { yPercent: 14, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  g.to(".hero-media", { scale: 1.1, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  var tarjetas = P.$$(".shot");
  if (tarjetas.length) {
    g.set(tarjetas, { clipPath: "inset(0 0 100% 0)" });
    ST.batch(tarjetas, { start: "top 88%", onEnter: function (lote) { g.to(lote, { clipPath: "inset(0 0 0% 0)", duration: 0.9, ease: "power3.out", stagger: 0.08 }); } });
  }
})();
