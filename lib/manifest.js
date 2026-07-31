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
    telefono: "973 208 727",
    telefonoEnlace: "tel:+34973208727",
    email: "ruizruiz.bu@gmail.com",
    instagram: "@vibrastreetfood",
    instagramUrl: "https://www.instagram.com/vibrastreetfood",
    horarios: {
      normal: {
        titulo: "Temporada normal",
        lineas: ["Martes a viernes — 17:00 a 00:00", "Sábado y domingo — 13:00 a 00:00", "Lunes cerrado"]
      },
      verano: {
        titulo: "Verano (29 junio – 14 septiembre)",
        fechas: { desde: "06-29", hasta: "09-14" },
        lineas: ["Martes a domingo — 18:00 a 00:00", "Lunes cerrado"]
      }
    },
    // Pendiente: enlace/código de CoverManager. De momento apunta a la página de reservas.
    reservasUrl: "reservar.html"
  };
})();
