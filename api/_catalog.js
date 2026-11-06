// Servidor: precios autorizados. Mantener en sincronía con PRODUCTS en app.js.
// Solo los productos con available:true se pueden pagar en línea.
// "code" viaja dentro de la referencia del pago para saber qué se compró.
module.exports = {
  "castillo-entero": { code: "TR", name: "Kaffa & CO Tradicional", price: 45000, available: true, grind: true },
  "drip-bags-x4": { code: "DB", name: "Drip Bags x 4", price: 20000, available: true },
  "taza-kaffa": { code: "TZ", name: "Taza Kaffa", price: 35000, available: false },
  "kit-kaffa": { code: "KT", name: "Kit Kaffa", price: 90000, available: false }
};
// Opciones de molienda (clave del cliente → código corto en la referencia → texto)
module.exports.GRIND = {
  grano: { code: "gr", label: "Grano entero" },
  molido: { code: "mo", label: "Molido" }
};
// Valores antiguos de versiones anteriores del carrito
module.exports.GRIND_LEGACY = ["v60", "prensa", "aeropress", "moka", "otro"];
