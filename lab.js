// ===== Kaffa Lab — recetas de partida (REVISAR: son valores estándar, no oficiales) =====
// c = gramos de café, w = ml de agua (ya multiplicados por el número de tazas)
const CAFES = {
  tradicional: {
    name: "Tradicional",
    sub: "Castillo · semi-lavado",
    note: "Kaffa & CO Tradicional: Castillo de Valparaíso, Antioquia. Notas a caramelo, chocolate y panela, acidez media."
  },
  rubi: { name: "Rubí", sub: "Natural · muy pronto", disabled: true }
};

const METHODS = {
  v60: {
    name: "V60", tag: "Filtrado · limpio y brillante",
    coffeePerCup: 15, waterPerCup: 240, ratio: "1:16", temp: "94 °C",
    grind: ["Media-fina", "como sal fina"],
    prep: "Antes de empezar: enjuaga el filtro con agua caliente, descarta ese agua, agrega el café y nivela la cama.",
    steps: [
      { title: "Bloom", from: 0, to: 40, target: (c) => c * 3,
        text: (c) => `Vierte ${c * 3} ml en espiral para mojar todo el café y espera.` },
      { title: "Primer vertido", from: 40, to: 75, target: (c, w) => Math.round(w * 0.625),
        text: (c, w) => `Vierte despacio, en círculos, hasta ${Math.round(w * 0.625)} ml.` },
      { title: "Segundo vertido", from: 75, to: 110, target: (c, w) => w,
        text: (c, w) => `Completa hasta ${w} ml con el mismo movimiento suave.` },
      { title: "Goteo final", from: 110, to: 180, target: null,
        text: () => "No muevas nada: deja que termine de gotear. Debe acabar cerca de 3:00." }
    ]
  },
  aeropress: {
    name: "AeroPress", tag: "Presión suave · limpio e intenso", maxCups: 1,
    coffeePerCup: 15, waterPerCup: 225, ratio: "1:15", temp: "92 °C",
    grind: ["Media-fina", "como azúcar"],
    prep: "Antes de empezar: coloca el filtro de papel en la tapa, enjuágalo con agua caliente y arma la AeroPress sobre tu taza (método clásico, no invertido). La AeroPress prepara una taza por vez: para más, repite la receta.",
    steps: [
      { title: "Bloom", from: 0, to: 30, target: (c) => c * 3,
        text: (c) => `Agrega el café, vierte ${c * 3} ml y remueve suave para mojarlo todo.` },
      { title: "Completa el agua", from: 30, to: 50, target: (c, w) => w,
        text: (c, w) => `Vierte hasta ${w} ml y remueve 3 veces.` },
      { title: "Reposo", from: 50, to: 120, target: null,
        text: () => "Coloca el émbolo sin presionar, solo para tapar, y espera." },
      { title: "Presiona", from: 120, to: 150, target: null,
        text: () => "Presiona despacio y con constancia durante unos 30 segundos. Detente cuando oigas el siseo del aire." }
    ]
  },
  prensa: {
    name: "Prensa francesa", tag: "Inmersión · cuerpo y dulzor",
    coffeePerCup: 16, waterPerCup: 240, ratio: "1:15", temp: "94 °C",
    grind: ["Gruesa", "como sal de mar"],
    prep: "Antes de empezar: calienta la prensa con agua caliente, descártala y agrega el café.",
    steps: [
      { title: "Vierte el agua", from: 0, to: 30, target: (c, w) => w,
        text: (c, w) => `Vierte los ${w} ml de una vez, cubriendo todo el café.` },
      { title: "Reposo", from: 30, to: 240, target: null,
        text: () => "Tapa sin presionar el émbolo y espera. No lo toques." },
      { title: "Presiona y sirve", from: 240, to: 270, target: null,
        text: () => "Presiona despacio hasta el fondo y sirve enseguida para que no se amargue." }
    ]
  },
  moka: {
    name: "Moka / Greca", tag: "Intenso · estilo espresso",
    coffeePerCup: 7, waterPerCup: 70, ratio: "1:10", temp: "Agua caliente",
    grind: ["Media-fina", "un poco más gruesa que espresso"],
    prep: "Usa la medida de tu moka: llena la base hasta la válvula y el filtro al ras, sin apretar. Las cantidades de arriba son una guía por taza pequeña.",
    steps: [
      { title: "Llena la base", from: 0, to: 30, target: (c, w) => w,
        text: (c, w) => `Con agua recién hervida, llena la base hasta la válvula (≈ ${w} ml).` },
      { title: "Agrega el café", from: 30, to: 60, target: null,
        text: (c) => `Pon ${c} g en el filtro, nivelado y sin apretar. Arma y cierra bien.` },
      { title: "Al fuego", from: 60, to: 210, target: null,
        text: () => "Fuego medio-bajo y la tapa abierta. Espera a que el café suba." },
      { title: "Detén y sirve", from: 210, to: 240, target: null,
        text: () => "Cuando empiece a borbotear, retira del fuego y enfría la base con un paño húmedo." }
    ]
  },
  goteo: {
    name: "Cafetera de goteo", tag: "Práctico · para varias tazas",
    coffeePerCup: 15, waterPerCup: 240, ratio: "1:16", temp: "Automática",
    grind: ["Media", "como arena"],
    prep: "Antes de empezar: coloca el filtro de papel y enjuágalo con agua caliente.",
    steps: [
      { title: "Agrega el café", from: 0, to: 30, target: null,
        text: (c) => `Pon ${c} g de café en el filtro y nivélalo con una sacudida suave.` },
      { title: "Llena el depósito", from: 30, to: 60, target: (c, w) => w,
        text: (c, w) => `Agrega ${w} ml de agua fría o a temperatura ambiente.` },
      { title: "Enciende y espera", from: 60, to: 330, target: null,
        text: () => "Enciende la cafetera y espera a que termine de gotear." },
      { title: "Mezcla y sirve", from: 330, to: 360, target: null,
        text: () => "Mezcla suavemente la jarra para igualar el sabor y sirve." }
    ]
  }
};

const TIPS = [
  "¿Sabe muy ácido o aguado? Muele un poco más fino o sube 1–2 °C el agua.",
  "¿Sabe amargo o seco? Muele un poco más grueso o baja 1–2 °C el agua.",
  "¿Lo pides molido? Escríbenos por WhatsApp, dinos tu método y te lo molemos para eso."
];

const BUDDY_POSES = { point: "assets/img/buddy-point.png", coffee: "assets/img/buddy-coffee.png", dj: "assets/img/buddy-dj.png" };
const state = { cafe: "tradicional", method: "v60", cups: 1 };
const $ = (id) => document.getElementById(id);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Personaje ----------
let buddyTimer;
function buddySay(text, pose = "point") {
  const buddy = $("buddy");
  $("buddyImg").src = BUDDY_POSES[pose] || BUDDY_POSES.point;
  $("buddyBubble").textContent = text;
  buddy.classList.add("show", "talk");
  clearTimeout(buddyTimer);
  buddyTimer = setTimeout(() => buddy.classList.remove("show", "talk"), 3800);
}
Object.values(BUDDY_POSES).forEach((src) => { const i = new Image(); i.src = src; });

// ---------- Receta ----------
function current() {
  const m = METHODS[state.method];
  const c = m.coffeePerCup * state.cups;
  const w = m.waterPerCup * state.cups;
  return { m, c, w, total: m.steps[m.steps.length - 1].to };
}

function renderChoices() {
  $("cafeChips").innerHTML = Object.entries(CAFES).map(([id, cf]) =>
    `<button type="button" class="lab-chip" data-cafe="${id}" aria-pressed="${state.cafe === id}" ${cf.disabled ? "disabled" : ""}>${cf.name}<small>${cf.sub}</small></button>`).join("");
  $("cafeNote").textContent = CAFES[state.cafe].note || "";
  $("methodGrid").innerHTML = Object.entries(METHODS).map(([id, m]) =>
    `<button type="button" class="lab-method" data-method="${id}" aria-pressed="${state.method === id}">${m.name}<small>${m.tag}</small></button>`).join("");
  $("cupChips").innerHTML = [1, 2, 3].map((n) =>
    `<button type="button" class="lab-chip" data-cups="${n}" aria-pressed="${state.cups === n}" ${n > (METHODS[state.method].maxCups || 3) ? "disabled" : ""}>${n} ${n === 1 ? "taza" : "tazas"}</button>`).join("");
}

function renderRecipe() {
  const { m, c, w, total } = current();
  $("recipeTitle").textContent = `${m.name} · ${CAFES[state.cafe].name} · ${state.cups} ${state.cups === 1 ? "taza" : "tazas"}`;
  $("recipeRatio").textContent = m.ratio;
  const tempIsNumber = /\d/.test(m.temp);
  $("recipeStats").innerHTML = [
    [`${c}<small>g</small>`, "Café"],
    [`${w}<small>ml</small>`, "Agua"],
    [tempIsNumber ? `${m.temp.replace(/\s*°C/, "")}<small>°C</small>` : `<small style="margin:0;font-size:1.1rem">${m.temp}</small>`, "Temperatura"],
    [`${fmt(total)}<small>min</small>`, "Tiempo total"]
  ].map(([v, k]) => `<div class="lab-stat"><strong>${v}</strong><span>${k}</span></div>`).join("");
  $("grindLabel").textContent = m.grind[0];
  $("grindHint").textContent = m.grind[1];
  $("tipsList").innerHTML = TIPS.map((t) => `<li>${t}</li>`).join("");
  $("prepNote").textContent = m.prep;
  $("stepsList").innerHTML = m.steps.map((s, i) => {
    const target = s.target ? s.target(c, w) : null;
    return `<li class="lab-step" data-step="${i}">
      <span class="lab-step-n">${i + 1}</span>
      <div><h3>${s.title}</h3><p>${s.text(c, w)}</p></div>
      <div class="lab-step-meta">${target ? `<b>→ ${target} ml</b>` : ""}${fmt(s.from)} – ${fmt(s.to)}</div>
    </li>`;
  }).join("");
}

// ---------- Temporizador ----------
const timer = { running: false, elapsed: 0, last: 0, id: null, step: -1, finished: false, audio: null, sound: true, wake: null };

function beep(freq = 880, ms = 160) {
  if (!timer.sound || !timer.audio) return;
  try {
    const o = timer.audio.createOscillator(), g = timer.audio.createGain();
    o.frequency.value = freq; o.connect(g); g.connect(timer.audio.destination);
    g.gain.setValueAtTime(0.18, timer.audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, timer.audio.currentTime + ms / 1000);
    o.start(); o.stop(timer.audio.currentTime + ms / 1000);
  } catch (e) { /* sin sonido */ }
}

function paintSteps() {
  const { m } = current();
  document.querySelectorAll(".lab-step").forEach((el, i) => {
    const s = m.steps[i];
    el.classList.toggle("active", timer.step === i && !timer.finished);
    el.classList.toggle("done", timer.finished || (timer.step > i) || (timer.elapsed >= s.to));
  });
}

function onStepChange(i, { silent } = {}) {
  const { m, c, w } = current();
  const s = m.steps[i];
  $("labNow").textContent = `Paso ${i + 1}: ${s.title}`;
  if (!silent) {
    beep(i === 0 ? 660 : 880);
    if (navigator.vibrate) navigator.vibrate(120);
    const pose = i === 0 ? "dj" : (s.target ? "point" : "coffee");
    buddySay(`${s.title}${s.target ? ` → ${s.target(c, w)} ml` : ""}`, pose);
    const el = document.querySelector(`.lab-step[data-step="${i}"]`);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
  }
}

function tick() {
  const now = performance.now();
  timer.elapsed += (now - timer.last) / 1000;
  timer.last = now;
  const { m, total } = current();
  if (timer.elapsed >= total) { finish(); return; }
  $("labClock").textContent = fmt(timer.elapsed);
  const idx = m.steps.findIndex((s) => timer.elapsed >= s.from && timer.elapsed < s.to);
  if (idx !== -1 && idx !== timer.step) { timer.step = idx; onStepChange(idx); }
  paintSteps();
}

async function keepAwake() {
  try { if (navigator.wakeLock) timer.wake = await navigator.wakeLock.request("screen"); } catch (e) { /* opcional */ }
}
function releaseAwake() { try { if (timer.wake) { timer.wake.release(); timer.wake = null; } } catch (e) { /* opcional */ } }

function start() {
  if (timer.finished) reset();
  if (!timer.audio) { try { timer.audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* sin audio */ } }
  if (timer.audio && timer.audio.state === "suspended") timer.audio.resume();
  timer.running = true; timer.last = performance.now();
  clearInterval(timer.id); timer.id = setInterval(tick, 200);
  $("labTimer").classList.add("running");
  $("startBtn").textContent = "Pausar";
  keepAwake();
  if (timer.step === -1) { timer.step = 0; onStepChange(0); paintSteps(); }
}

function pause() {
  timer.running = false; clearInterval(timer.id);
  $("labTimer").classList.remove("running");
  $("startBtn").textContent = "Seguir";
  releaseAwake();
}

function finish() {
  clearInterval(timer.id); timer.running = false; timer.finished = true;
  timer.elapsed = current().total;
  $("labClock").textContent = fmt(timer.elapsed);
  $("labTimer").classList.remove("running");
  $("startBtn").textContent = "Otra vez";
  $("labNow").textContent = "¡Listo para tomar!";
  $("labDone").hidden = false;
  paintSteps();
  beep(988, 220); setTimeout(() => beep(1318, 300), 240);
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  buddySay("¡Listo! A disfrutar ☕", "coffee");
  releaseAwake();
}

function reset() {
  clearInterval(timer.id);
  Object.assign(timer, { running: false, elapsed: 0, step: -1, finished: false });
  $("labClock").textContent = "0:00";
  $("labNow").textContent = "Listo para empezar";
  $("startBtn").textContent = "Comenzar";
  $("labTimer").classList.remove("running");
  $("labDone").hidden = true;
  releaseAwake();
  paintSteps();
}

// ---------- Eventos ----------
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.cafe) { state.cafe = b.dataset.cafe; }
  else if (b.dataset.method) { state.method = b.dataset.method; state.cups = Math.min(state.cups, METHODS[state.method].maxCups || 3); }
  else if (b.dataset.cups) { state.cups = parseInt(b.dataset.cups, 10); }
  else return;
  reset(); renderChoices(); renderRecipe();
});
$("startBtn").addEventListener("click", () => (timer.running ? pause() : start()));
$("resetBtn").addEventListener("click", reset);
$("soundBtn").addEventListener("click", () => {
  timer.sound = !timer.sound;
  $("soundBtn").setAttribute("aria-pressed", String(timer.sound));
});
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && timer.running) keepAwake(); });

renderChoices();
renderRecipe();
