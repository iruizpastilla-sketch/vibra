(function () {
  "use strict";
  // Datos del negocio centralizados. Una sola fuente de verdad para los scripts.
  // El contenido crítico va SIEMPRE también en el HTML (la web funciona sin JS).
  window.__BRAND__ = {
    nombre: "Vibra Street Food",
    claim: "SIENTE LA VIBRA",
    ciudad: "Lleida",
    direccion: "Carrer Jaume II, 77 — 25001 Lleida",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Carrer+Jaume+II+77+25001+Lleida",
    email: "ruizruiz.bu@gmail.com",
    instagram: "@vibrastreetfood",
    instagramUrl: "https://www.instagram.com/vibrastreetfood",
    horarios: {
      verano: {
        titulo: "Temporada de verano",
        lineas: ["Martes a domingo — 18:00 a 00:00", "Lunes cerrado"]
      },
      normal: {
        titulo: "Resto del año",
        lineas: ["Martes a viernes — 17:00 a 00:00", "Sábado y domingo — 13:00 a 00:00", "Lunes cerrado"]
      }
    },
    // Pendiente: enlace/código de CoverManager. De momento apunta a la página de reservas.
    reservasUrl: "reservar.html"
  };
})();
