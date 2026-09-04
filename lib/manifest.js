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
    // Delivery: enlaces PROVISIONALES a las paginas de Lleida. Sustituir por los del local de Vibra.
    delivery: {
      glovo: "https://glovoapp.com/es/es/lleida/",
      uber: "https://www.ubereats.com/es/city/lleida-ct"
    },
    // Fidelizacion (Square): pendiente del enlace publico del programa.
    fidelizacionUrl: "",
    // Horarios. "lineas" es el texto que se muestra; "tramos" lo que usa main.js
    // para calcular "Abierto ahora / Hoy abrimos a las...". Dias: 0 domingo ... 6 sabado.
    horarios: {
      normal: {
        titulo: "Temporada normal",
        lineas: ["Martes a viernes — 17:00 a 00:00", "Sábado y domingo — 13:00 a 00:00", "Lunes cerrado"],
        tramos: [
          { dias: [2, 3, 4, 5], abre: "17:00", cierra: "00:00" },
          { dias: [6, 0], abre: "13:00", cierra: "00:00" }
        ]
      },
      verano: {
        titulo: "Verano (29 junio – 14 septiembre)",
        fechas: { desde: "06-29", hasta: "09-14" },
        lineas: ["Martes a domingo — 18:00 a 00:00", "Lunes cerrado"],
        tramos: [
          { dias: [2, 3, 4, 5, 6, 0], abre: "18:00", cierra: "00:00" }
        ]
      }
    },
    // Reservas: el modulo de CoverManager vive en reservar.html.
    reservasUrl: "reservar.html"
  };
})();
