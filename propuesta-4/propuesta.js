// PROPUESTA 4 — "Neón": la segunda línea del titular cambia de palabra, y la burger baja del cielo.
(function () {
  "use strict";
  var P = window.__propuesta; if (!P || !P.g) return;
  var g = P.g, ST = P.ST;
  var palabra = P.$(".neon-palabra > span");
  var escena = P.$(".neon-escena");
  var PALABRAS = ["la vibra", "el hambre", "la música", "la noche", "Cappont"];
  if (P.reducir) return;
  if (escena) g.set(escena, { xPercent: -50, yPercent: -50, y: 60, opacity: 0, scale: 0.9 });
  document.addEventListener("propuesta:hero", function () {
    if (escena) g.to(escena, { y: 0, opacity: 1, scale: 1, duration: 1.3, ease: "power3.out", delay: 0.4 });
    if (!palabra) return;
    var i = 0;
    setInterval(function () {
      i = (i + 1) % PALABRAS.length;
      g.timeline()
        .to(palabra, { yPercent: -110, opacity: 0, duration: 0.35, ease: "power2.in" })
        .add(function () { palabra.textContent = PALABRAS[i]; })
        .fromTo(palabra, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "power3.out" });
    }, 2400);
  });
  if (!ST || !escena) return;
  g.to(escena, { y: 220, scale: 0.86, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
})();
