// PROPUESTA 5 — "Historia": la foto fija cambia con cada capítulo y el fondo se tiñe de su color.
(function () {
  "use strict";
  var P = window.__propuesta; if (!P || !P.g || !P.ST) return;
  var g = P.g, ST = P.ST, raiz = document.documentElement;
  var caps = P.$$(".historia-cap"), fotos = P.$$(".historia-fotos img");
  if (!caps.length) return;
  var COLORES = ["#000000", "#1a0d05", "#160814", "#0b0f0a"];
  function activar(i) {
    caps.forEach(function (c, j) { c.classList.toggle("is-activa", j === i); });
    fotos.forEach(function (f, j) { f.classList.toggle("is-activa", j === i); });
    if (!P.reducir) g.to(raiz, { "--negro": COLORES[i] || "#000000", duration: 0.9, ease: "power2.out", overwrite: "auto" });
  }
  activar(0);
  caps.forEach(function (c, i) {
    ST.create({ trigger: c, start: "top 55%", end: "bottom 55%", onEnter: function () { activar(i); }, onEnterBack: function () { activar(i); } });
  });
  // Al salir de la historia, el fondo vuelve al negro
  var historia = P.$(".historia");
  if (historia) ST.create({ trigger: historia, start: "bottom 60%", onEnter: function () { if (!P.reducir) g.to(raiz, { "--negro": "#000000", duration: 0.9, overwrite: "auto" }); }, onLeaveBack: function () { activar(caps.length - 1); } });
  if (!P.reducir) caps.forEach(function (c) { g.fromTo(P.$$("h2, p", c), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", stagger: 0.12, scrollTrigger: { trigger: c, start: "top 70%" } }); });
})();
