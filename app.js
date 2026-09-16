// ===== Kaffa & CO — catálogo =====
const WHATSAPP_NUMBER = "573024645777";

const PRODUCTS = [
  {
    id: "castillo-entero",
    name: "Origen Castillo",
    kind: "grano",
    kindLabel: "Grano Entero · 250g",
    desc: "Origen Valparaíso, Antioquia · 1.700 msnm. Variedad Castillo, proceso semi-lavado, tueste medio. Notas a caramelo, chocolate y panela, acidez media. El clásico que nunca falta.",
    price: 38000,
    oldPrice: 45000,
    badge: "EL CLÁSICO",
    badgeType: "",
    img: "assets/img/castillo-label.jpg",
    labelStyle: true
  },
  {
    id: "hoodie-street",
    name: "Hoodie Kaffa Street",
    kind: "merch",
    kindLabel: "Merch · Unisex",
    desc: "Buso oversize con el bordado del grano rockero. Algodón pesado 320gsm.",
    price: 129000,
    oldPrice: null,
    badge: "",
    badgeType: "",
    img: "assets/img/mascot-army.png"
  },
  {
    id: "taza-kaffa",
    name: "Taza Kaffa & CO",
    kind: "merch",
    kindLabel: "Merch · Cerámica 350ml",
    desc: "Para tu ritual diario. Ilustrada con el mascotón oficial de la marca.",
    price: 32000,
    oldPrice: null,
    badge: "",
    badgeType: "",
    img: "assets/img/mascot-hero.jpg"
  },
  {
    id: "sticker-pack",
    name: "Pack Stickers Kaffa",
    kind: "merch",
    kindLabel: "Merch · Set x6",
    desc: "Vinil resistente al agua. Decora tu termo, tu laptop, tu vida.",
    price: 15000,
    oldPrice: null,
    badge: "GANGA",
    badgeType: "gold",
    img: "assets/img/mascot-clean.jpg"
  }
];

// ===== Drop de lanzamiento — edición única =====
const DROPS = [
  {
    id: "drop01-bourbon-rosado",
    name: "Bourbon Rosado",
    edition: "DROP 001",
    kindLabel: "Grano Entero · 250g numerado",
    desc: "Origen Villa Restrepo, Tolima · 1.750 msnm. Variedad Bourbon Rosado, proceso semi-lavado, tueste medio. Notas a frutos rojos, almendra y melón, acidez media. Nuestro drop de lanzamiento — no se repite.",
    price: 60000,
    stock: 42,
    stockTotal: 50,
    soldOut: false,
    img: "assets/img/drop-bourbon-rosado.jpg",
    fallbackImg: "assets/img/mascot-hero.jpg",
    labelStyle: true
  }
];

const money = n => "$" + n.toLocaleString("es-CO");

// ===== Cart state =====
let cart = JSON.parse(localStorage.getItem("kaffa_cart") || "[]");

function saveCart(){
  localStorage.setItem("kaffa_cart", JSON.stringify(cart));
  renderCart();
}

function findItem(id){
  return PRODUCTS.find(p => p.id === id) || DROPS.find(p => p.id === id);
}

function addToCart(id){
  const product = findItem(id);
  if(!product) return;

  if(product.soldOut){
    showToast(`"${product.name}" ya se agotó — espera el próximo drop 🕐`);
    return;
  }

  const existing = cart.find(c => c.id === id);
  const currentQty = existing ? existing.qty : 0;

  if(product.stockTotal !== undefined && currentQty + 1 > product.stock){
    showToast(`Solo quedan ${product.stock} unidades de este drop ⚡`);
    return;
  }

  if(existing){ existing.qty += 1; }
  else{ cart.push({ id, qty: 1 }); }
  saveCart();
  showToast(`${product.name} añadido al carrito ☕`);
}

function changeQty(id, delta){
  const item = cart.find(c => c.id === id);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0) cart = cart.filter(c => c.id !== id);
  saveCart();
}

function removeItem(id){
  cart = cart.filter(c => c.id !== id);
  saveCart();
}

function cartTotal(){
  return cart.reduce((sum, c) => {
    const p = findItem(c.id);
    return sum + (p ? p.price * c.qty : 0);
  }, 0);
}

function renderCart(){
  const count = cart.reduce((s,c) => s + c.qty, 0);
  document.getElementById("cartCount").textContent = count;

  const wrap = document.getElementById("cartItems");
  if(cart.length === 0){
    wrap.innerHTML = `<div class="cart-empty">Tu carrito está vacío.<br>¡Ve a elegir tu tueste! ☕</div>`;
  } else {
    wrap.innerHTML = cart.map(c => {
      const p = findItem(c.id);
      if(!p) return "";
      return `
        <div class="cart-item">
          <img src="${p.img}" alt="${p.name}">
          <div class="cart-item-info">
            <strong>${p.name}</strong>
            <span>${money(p.price)} c/u</span>
            <div class="qty-row">
              <button class="qty-btn" onclick="changeQty('${p.id}',-1)">−</button>
              <span>${c.qty}</span>
              <button class="qty-btn" onclick="changeQty('${p.id}',1)">+</button>
              <button class="remove-btn" onclick="removeItem('${p.id}')">Quitar</button>
            </div>
          </div>
        </div>`;
    }).join("");
  }

  const total = cartTotal();
  document.getElementById("cartTotal").textContent = money(total);

  const note = document.getElementById("shipNote");
  if(total === 0){ note.textContent = ""; }
  else if(total >= 120000){ note.textContent = "🎉 ¡Tu pedido tiene envío gratis!"; }
  else{ note.textContent = `Te faltan ${money(120000-total)} para envío gratis`; }

  buildCheckoutLink(total);
}

function buildCheckoutLink(total){
  const btn = document.getElementById("checkoutBtn");
  if(cart.length === 0){
    btn.href = "#";
    return;
  }
  let msg = "¡Hola Kaffa & CO! Quiero pedir:\n\n";
  cart.forEach(c => {
    const p = findItem(c.id);
    if(p) msg += `• ${p.name} (${p.kindLabel}) x${c.qty} — ${money(p.price*c.qty)}\n`;
  });
  msg += `\nTotal: ${money(total)}\n\n¿Cómo sigo con el pago?`;
  btn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  btn.target = "_blank";
}

// ===== Toast =====
let toastTimer;
function showToast(text){
  const toast = document.getElementById("toast");
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

// ===== Render products =====
function renderProducts(filter = "all"){
  const grid = document.getElementById("productGrid");
  const items = filter === "all" ? PRODUCTS : PRODUCTS.filter(p => p.kind === filter);
  grid.innerHTML = items.map(p => `
    <div class="product-card reveal in">
      <div class="product-media${p.labelStyle ? " label-fit" : ""}">
        <img src="${p.img}" alt="${p.name}">
        ${p.badge ? `<span class="badge ${p.badgeType}">${p.badge}</span>` : ""}
      </div>
      <div class="product-body">
        <span class="kind">${p.kindLabel}</span>
        <h3>${p.name}</h3>
        <div class="stars">★★★★★</div>
        <p>${p.desc}</p>
        <div class="price-row">
          <span class="price">${p.oldPrice ? `<span class="old">${money(p.oldPrice)}</span>` : ""}${money(p.price)}</span>
        </div>
        <button class="add-btn" onclick="addToCart('${p.id}')">Añadir al carrito +</button>
      </div>
    </div>
  `).join("");
}

// ===== Render drops =====
function renderDrops(){
  const grid = document.getElementById("dropGrid");
  grid.innerHTML = DROPS.map(p => {
    const pct = Math.max(0, Math.min(100, (p.stock / p.stockTotal) * 100));
    const low = pct <= 20 && !p.soldOut;
    const fallback = p.fallbackImg ? ` onerror="this.onerror=null;this.src='${p.fallbackImg}';this.classList.add('is-fallback');"` : "";
    return `
    <div class="drop-card drop-card-feature reveal in">
      <div class="product-media${p.labelStyle ? " label-fit" : ""}">
        <img src="${p.img}" alt="${p.name}"${fallback}>
        <span class="edition-tag">${p.edition}</span>
      </div>
      <div class="drop-body">
        <span class="kind">${p.kindLabel}</span>
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="stock-row">
          <span>${p.soldOut ? "Agotado" : "Disponibles"}</span>
          <strong>${p.soldOut ? "0" : p.stock} / ${p.stockTotal}</strong>
        </div>
        <div class="stock-bar"><div class="stock-bar-fill ${low ? "low" : ""}" style="width:${p.soldOut ? 0 : pct}%"></div></div>
        <div class="drop-price-row">
          <span class="drop-price">${money(p.price)}</span>
          <button class="drop-add ${p.soldOut ? "soldout" : ""}" ${p.soldOut ? "disabled" : ""} onclick="addToCart('${p.id}')">
            ${p.soldOut ? "Agotado" : "Reservar +"}
          </button>
        </div>
      </div>
    </div>`;
  }).join("");
}

// ===== Drop countdown (targets next Sunday 20:00 as example live-drop end) =====
function tickDropTimer(){
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
  end.setHours(20,0,0,0);
  const diff = end - now;
  const h = Math.floor(diff/3600000);
  const m = Math.floor((diff%3600000)/60000);
  const s = Math.floor((diff%60000)/1000);
  const dh = document.getElementById("d-h");
  if(!dh) return;
  dh.textContent = String(h).padStart(2,"0");
  document.getElementById("d-m").textContent = String(m).padStart(2,"0");
  document.getElementById("d-s").textContent = String(s).padStart(2,"0");
}
setInterval(tickDropTimer, 1000);
tickDropTimer();

// ===== Waitlist form (envía a Mailchimp, abre confirmación en pestaña nueva) =====
const waitlistForm = document.getElementById("waitlistForm");
if(waitlistForm){
  waitlistForm.addEventListener("submit", () => {
    showToast("¡Casi listo! Revisa tu correo para confirmar 🔥");
    setTimeout(() => waitlistForm.reset(), 300);
  });
}

// ===== Filters =====
document.addEventListener("click", e => {
  if(e.target.matches(".filter-btn")){
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    renderProducts(e.target.dataset.filter);
  }
});

// ===== Cart drawer =====
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");
function openCart(){ cartDrawer.classList.add("show"); overlay.classList.add("show"); }
function closeCartFn(){ cartDrawer.classList.remove("show"); overlay.classList.remove("show"); }
document.getElementById("openCart").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCartFn);
overlay.addEventListener("click", closeCartFn);

// ===== FAQ accordion =====
document.querySelectorAll(".faq-q").forEach(btn => {
  btn.addEventListener("click", () => {
    const item = btn.parentElement;
    const wasOpen = item.classList.contains("open");
    document.querySelectorAll(".faq-item").forEach(f => f.classList.remove("open"));
    if(!wasOpen) item.classList.add("open");
  });
});

// ===== Newsletter (envía a Mailchimp, abre confirmación en pestaña nueva) =====
const newsForm = document.getElementById("newsForm");
newsForm.addEventListener("submit", () => {
  showToast("¡Casi listo! Confirma en tu correo para recibir el código 🎉");
  setTimeout(() => newsForm.reset(), 300);
});

// ===== Reveal on scroll =====
const io = new IntersectionObserver(entries => {
  entries.forEach(en => { if(en.isIntersecting) en.target.classList.add("in"); });
},{ threshold: 0.15 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

// ===== Mobile menu (simple toggle to nav links) =====
document.getElementById("menuToggle").addEventListener("click", () => {
  const links = document.querySelector(".nav-links");
  links.style.display = links.style.display === "flex" ? "none" : "flex";
  links.style.position = "absolute";
  links.style.top = "100%";
  links.style.left = "0";
  links.style.right = "0";
  links.style.background = "var(--crema)";
  links.style.flexDirection = "column";
  links.style.padding = "20px 24px";
  links.style.borderBottom = "3px solid var(--tinta)";
  links.style.gap = "18px";
});

// ===== Init =====
renderProducts();
renderDrops();
renderCart();
