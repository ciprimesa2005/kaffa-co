module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const pub = process.env.WOMPI_PUBLIC_KEY || "";
  const secret = process.env.WOMPI_INTEGRITY_SECRET || "";
  const feeEnv = parseInt(process.env.SHIPPING_FEE || "", 10);
  const fee = Number.isFinite(feeEnv) && feeEnv >= 0 ? feeEnv : 15000;
  res.status(200).json({
    enabled: Boolean(pub && secret),
    mode: pub.startsWith("pub_test_") ? "sandbox" : "production",
    shippingFee: Number.isFinite(fee) && fee > 0 ? fee : null,
    freeShippingFrom: 90000, freeCity: "Medellín"
  });
};
