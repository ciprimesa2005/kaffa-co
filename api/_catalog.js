// Servidor: precios autorizados. Mantener en sincronía con PRODUCTS en app.js.
// Solo los productos con available:true se pueden pagar en línea.
module.exports = {
  "castillo-entero": { name: "Kaffa & CO Tradicional", price: 45000, available: true },
  "drip-bags-x4": { name: "Drip Bags x 4", price: 20000, available: false },
  "taza-kaffa": { name: "Taza Kaffa", price: 35000, available: false },
  "kit-kaffa": { name: "Kit Kaffa", price: 90000, available: false }
};
