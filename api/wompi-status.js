module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const id = String((req.query && req.query.id) || "");
  if (!/^[A-Za-z0-9_-]{5,80}$/.test(id)) {
    return res.status(400).json({ error: "bad_id", message: "Transacción inválida." });
  }
  const pub = process.env.WOMPI_PUBLIC_KEY || "";
  if (!pub) return res.status(503).json({ error: "not_configured" });

  const base = pub.startsWith("pub_test_") ? "https://sandbox.wompi.co/v1" : "https://production.wompi.co/v1";
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(`${base}/transactions/${encodeURIComponent(id)}`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return res.status(502).json({ error: "wompi_error", message: "No pudimos consultar el pago." });
    const data = (await r.json()).data || {};
    return res.status(200).json({
      status: data.status || "UNKNOWN",
      reference: data.reference || null,
      amountInCents: data.amount_in_cents || null
    });
  } catch (e) {
    return res.status(502).json({ error: "wompi_unreachable", message: "No pudimos consultar el pago." });
  }
};
