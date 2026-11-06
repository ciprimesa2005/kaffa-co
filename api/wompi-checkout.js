const crypto = require("crypto");
const catalog = require("./_catalog");

const FREE_SHIPPING_FROM = 90000;
const DEFAULT_SHIPPING_FEE = 15000;

const clean = (v, max) =>
  String(v == null ? "" : v).replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const enc = encodeURIComponent;
const isMedellin = c => c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() === "medellin";

function fail(res, status, error, message) {
  return res.status(status).json({ error, message });
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return fail(res, 405, "method_not_allowed", "Método no permitido.");
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body || typeof body !== "object") return fail(res, 400, "bad_request", "Solicitud inválida.");

  // --- Carrito: los precios SIEMPRE salen del catálogo del servidor ---
  const rawItems = Array.isArray(body.items) ? body.items.slice(0, 20) : [];
  const lines = {}; // clave "id|opcion" -> { id, opt, qty }
  for (const it of rawItems) {
    const id = clean(it && it.id, 60);
    const qty = parseInt(it && it.qty, 10);
    if (id === "GRIND" || id === "GRIND_LEGACY" || !catalog[id] || !catalog[id].available) {
      return fail(res, 400, "unavailable", "Un producto del carrito aún no está disponible para pago en línea.");
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
      return fail(res, 400, "bad_qty", "Cantidad inválida.");
    }
    let opt = "";
    if (catalog[id].grind) {
      opt = clean(it && it.opt, 20) || "grano";
      if (catalog.GRIND_LEGACY.includes(opt)) opt = "molido";
      if (!catalog.GRIND[opt]) return fail(res, 400, "bad_grind", "Elige cómo quieres tu café (grano o molido).");
    }
    const key = id + "|" + opt;
    if (!lines[key]) lines[key] = { id, opt, qty: 0 };
    lines[key].qty += qty;
    if (lines[key].qty > 20) return fail(res, 400, "bad_qty", "Cantidad inválida.");
  }
  const keys = Object.keys(lines);
  if (!keys.length) return fail(res, 400, "empty_cart", "Tu carrito está vacío.");
  const subtotal = keys.reduce((sum, k) => sum + catalog[lines[k].id].price * lines[k].qty, 0);

  // --- Datos del cliente ---
  const c = body.customer || {};
  const name = clean(c.name, 80);
  const email = clean(c.email, 120).toLowerCase();
  let phone = clean(c.phone, 20).replace(/\D/g, "");
  if (phone.length === 12 && phone.startsWith("57")) phone = phone.slice(2);
  const address = clean(c.address, 80);
  const city = clean(c.city, 25);
  const region = clean(c.region, 25);

  if (name.length < 2) return fail(res, 400, "bad_name", "Escribe tu nombre completo.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail(res, 400, "bad_email", "Revisa tu correo.");
  if (!/^\d{10}$/.test(phone)) return fail(res, 400, "bad_phone", "El celular debe tener 10 dígitos.");
  if (address.length < 5) return fail(res, 400, "bad_address", "Escribe tu dirección completa.");
  if (city.length < 2) return fail(res, 400, "bad_city", "Escribe tu ciudad.");
  if (region.length < 2) return fail(res, 400, "bad_region", "Escribe tu departamento.");

  // --- Envío: gratis en Medellín o desde el mínimo; si no, tarifa fija ---
  const feeEnv = parseInt(process.env.SHIPPING_FEE || "", 10);
  const fee = Number.isFinite(feeEnv) && feeEnv >= 0 ? feeEnv : DEFAULT_SHIPPING_FEE;
  const shipping = subtotal >= FREE_SHIPPING_FROM || isMedellin(city) ? 0 : fee;
  const total = subtotal + shipping;

  // --- Configuración de Wompi ---
  const publicKey = process.env.WOMPI_PUBLIC_KEY;
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!publicKey || !integritySecret) {
    return fail(res, 503, "not_configured", "El pago en línea aún no está disponible.");
  }

  const amountInCents = total * 100;
  const currency = "COP";
  const itemsCode = keys.map(k => `${catalog[lines[k].id].code}x${lines[k].qty}${lines[k].opt ? catalog.GRIND[lines[k].opt].code : ""}`).join("_");
  // Wompi no devuelve la dirección en el aviso de pago, así que viaja (comprimida) dentro de la referencia (máx. 255).
  const b64url = (str) => Buffer.from(str, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const refHead = "KAFFA-" + Date.now().toString(36).toUpperCase() + "-" + crypto.randomBytes(3).toString("hex").toUpperCase() + "-" + itemsCode;
  let shipAddress = address;
  let reference = refHead + "-" + b64url(JSON.stringify([shipAddress, city, region]));
  while (reference.length > 250 && shipAddress.length > 12) {
    shipAddress = shipAddress.slice(0, -6);
    reference = refHead + "-" + b64url(JSON.stringify([shipAddress, city, region]));
  }
  const signature = crypto
    .createHash("sha256")
    .update(`${reference}${amountInCents}${currency}${integritySecret}`)
    .digest("hex");

  const site = (process.env.SITE_URL || "https://www.kaffaco.store").replace(/\/+$/, "");
  const params = [
    ["public-key", publicKey],
    ["currency", currency],
    ["amount-in-cents", String(amountInCents)],
    ["reference", reference],
    ["signature:integrity", signature],
    ["redirect-url", `${site}/?pago=1`],
    ["customer-data:email", email],
    ["customer-data:full-name", name],
    ["customer-data:phone-number", phone],
    ["customer-data:phone-number-prefix", "+57"],
    ["shipping-address:address-line-1", address],
    ["shipping-address:country", "CO"],
    ["shipping-address:region", region],
    ["shipping-address:city", city],
    ["shipping-address:name", name],
    ["shipping-address:phone-number", phone]
  ];
  const url = "https://checkout.wompi.co/p/?" + params.map(([k, v]) => `${k}=${enc(v)}`).join("&");

  return res.status(200).json({ url, reference, subtotal, shipping, total });
};
