const crypto = require("crypto");
const catalog = require("./_catalog");

const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = n => "$" + Number(n).toLocaleString("es-CO");
const getPath = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

function safeEqual(a, b) {
  const A = Buffer.from(String(a)), B = Buffer.from(String(b));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

// Referencia: KAFFA-<tiempo>-<azar>-TRx2_DBx1  →  productos y cantidades
function parseItems(reference) {
  const code = String(reference || "").split("-").slice(3).join("-");
  return code.split("_").map(tok => {
    const m = /^([A-Z0-9]+)x(\d+)$/.exec(tok);
    if (!m) return null;
    const entry = Object.values(catalog).find(c => c.code === m[1]);
    return entry ? { name: entry.name, price: entry.price, qty: parseInt(m[2], 10) } : null;
  }).filter(Boolean);
}

function buildEmail(tx) {
  const items = parseItems(tx.reference);
  const total = Math.round((tx.amount_in_cents || 0) / 100);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = items.length ? Math.max(0, total - subtotal) : null;
  const cd = tx.customer_data || {};
  const sa = tx.shipping_address || {};
  const name = cd.full_name || sa.name || "Cliente";
  const email = tx.customer_email || "";
  const phone = String(cd.phone_number || sa.phone_number || "").replace(/\D/g, "");
  const when = new Date(tx.finalized_at || tx.created_at || Date.now()).toLocaleString("es-CO", { timeZone: "America/Bogota" });
  const row = (k, v) => `<tr><td style="padding:6px 12px 6px 0;color:#7a7160;vertical-align:top">${k}</td><td style="padding:6px 0"><strong>${v}</strong></td></tr>`;

  const itemsHtml = items.length
    ? items.map(i => `<li>${esc(i.name)} × ${i.qty} — ${money(i.price * i.qty)}</li>`).join("")
    : "<li>No se pudo leer el detalle de productos (revisa la referencia en Wompi).</li>";

  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#201a12">
  <h2 style="margin:0 0 4px">Nuevo pedido pagado ✅</h2>
  <p style="margin:0 0 16px;color:#7a7160">${esc(when)} · Ref. ${esc(tx.reference)}</p>
  <h3 style="margin:16px 0 6px">Productos</h3>
  <ul style="margin:0;padding-left:18px">${itemsHtml}</ul>
  <table style="margin-top:10px">${shipping !== null ? row("Envío", money(shipping)) : ""}${row("Total pagado", money(total))}${row("Método", esc(tx.payment_method_type || "—"))}</table>
  <h3 style="margin:18px 0 6px">Cliente y envío</h3>
  <table>${row("Nombre", esc(name))}${row("Correo", email ? `<a href="mailto:${esc(email)}">${esc(email)}</a>` : "—")}${row("Celular", phone ? `<a href="https://wa.me/57${esc(phone)}">${esc(phone)}</a> (WhatsApp)` : "—")}${row("Dirección", esc(sa.address_line_1 || "—"))}${row("Ciudad", esc([sa.city, sa.region].filter(Boolean).join(", ") || "—"))}</table>
  <p style="margin-top:18px;color:#7a7160;font-size:13px">Más detalles en tu panel de Wompi → Transacciones. Recuerda confirmar con el cliente si lo quiere en grano o molido.</p>
</div>`;
  return { subject: `Nuevo pedido pagado ${money(total)} — ${name}`, html };
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "method_not_allowed" }); }

  const secret = process.env.WOMPI_EVENTS_SECRET;
  if (!secret) return res.status(503).json({ error: "not_configured" });

  let ev = req.body;
  if (typeof ev === "string") { try { ev = JSON.parse(ev); } catch (e) { ev = null; } }
  if (!ev || typeof ev !== "object") return res.status(400).json({ error: "bad_request" });

  // Verificación del checksum de Wompi: SHA256(valores + timestamp + secreto de eventos)
  const sig = ev.signature || {};
  const props = Array.isArray(sig.properties) ? sig.properties : [];
  const expected = crypto.createHash("sha256")
    .update(props.map(p => getPath(ev.data, p)).join("") + String(ev.timestamp) + secret)
    .digest("hex");
  const received = String(sig.checksum || (req.headers && req.headers["x-event-checksum"]) || "");
  if (!safeEqual(expected.toLowerCase(), received.toLowerCase())) return res.status(401).json({ error: "bad_signature" });

  if (ev.event !== "transaction.updated") return res.status(200).json({ ignored: "event" });
  const t = ev.data && ev.data.transaction;
  if (!t || t.status !== "APPROVED") return res.status(200).json({ ignored: "status" });

  // Datos completos y confiables directamente desde Wompi
  let tx = t;
  try {
    const base = ev.environment === "test" ? "https://sandbox.wompi.co/v1" : "https://production.wompi.co/v1";
    const r = await fetch(`${base}/transactions/${encodeURIComponent(t.id)}`);
    if (r.ok) tx = (await r.json()).data || t;
  } catch (e) { /* si falla, usamos los datos del evento */ }
  if (tx.status !== "APPROVED") return res.status(200).json({ ignored: "status" });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "email_not_configured" });
  const { subject, html } = buildEmail(tx);

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `kaffa-order-${tx.id}` },
      body: JSON.stringify({
        from: process.env.ORDER_EMAIL_FROM || "Kaffa & CO Pedidos <onboarding@resend.dev>",
        to: [process.env.ORDER_NOTIFY_TO || "kaffaandco@gmail.com"],
        subject,
        html
      })
    });
    if (!r.ok) return res.status(502).json({ error: "email_failed" });
  } catch (e) {
    return res.status(502).json({ error: "email_failed" });
  }
  return res.status(200).json({ ok: true });
};
