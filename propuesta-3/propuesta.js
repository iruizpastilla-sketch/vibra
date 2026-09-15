// PROPUESTA 3 — "Revista": la foto de portada entra con un barrido suave y todo lo demás aparece con calma.
(function () {
  "use strict";
  var P = window.__propuesta; if (!P || !P.g || P.reducir) return;
  var g = P.g, ST = P.ST;
  var foto = P.$(".hero-media");
  if (foto) {
    g.set(foto, { clipPath: "inset(0 0 100% 0)" });
    document.addEventListener("propuesta:hero", function () { g.to(foto, { clipPath: "inset(0 0 0% 0)", duration: 1.4, ease: "power4.out", delay: 0.2 }); });
  }
  if (!ST) return;
  P.$$(".revista-fotos figure").forEach(function (f, i) {
    g.fromTo(f, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: (i % 4) * 0.08, scrollTrigger: { trigger: f, start: "top 88%" } });
  });
  var cita = P.$(".revista-cita p");
  if (cita) g.fromTo(cita, { opacity: 0.2, y: 24 }, { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: cita, start: "top 80%" } });
})();
