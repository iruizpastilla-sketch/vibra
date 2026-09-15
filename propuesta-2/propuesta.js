// PROPUESTA 2 — "Cartel": la burger recortada entra de golpe y las pegatinas se pegan.
(function () {
  "use strict";
  var P = window.__propuesta; if (!P || !P.g) return;
  var g = P.g, ST = P.ST;
  var burger = P.$(".cartel-burger"), pegatinas = P.$$(".pegatina");
  if (P.reducir) return;
  if (burger) g.set(burger, { xPercent: 40, rotation: 8, opacity: 0 });
  if (pegatinas.length) g.set(pegatinas, { scale: 0, opacity: 0 });
  document.addEventListener("propuesta:hero", function () {
    var tl = g.timeline({ delay: 0.5 });
    if (burger) tl.to(burger, { xPercent: 0, rotation: -8, opacity: 1, duration: 0.7, ease: "back.out(1.4)" });
    if (pegatinas.length) tl.to(pegatinas, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(3)", stagger: 0.12 }, "-=0.2");
  });
  if (!ST) return;
  // La burger se mueve un poco al bajar, las pegatinas giran
  if (burger) g.to(burger, { yPercent: 30, rotation: -14, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  pegatinas.forEach(function (p, i) { g.to(p, { rotation: "+=" + (i % 2 ? -18 : 18), ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } }); });
})();
