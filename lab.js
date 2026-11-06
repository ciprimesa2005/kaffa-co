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
    name: "V60 / Origami", tag: "Filtrado · limpio y brillante",
    coffee: 20, water: 300, ratio: "1:15", temp: "94 °C", timeLabel: "2:30–3:00",
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
        text: () => "No muevas nada: deja que termine de gotear. Debe acabar entre 2:30 y 3:00." }
    ]
  },
  prensa: {
    name: "Prensa francesa", tag: "Inmersión · cuerpo y dulzor",
    coffee: 30, water: 450, ratio: "1:15", temp: "94 °C",
    grind: ["Media", "como arena"],
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
  aeropress: {
    name: "AeroPress", tag: "Presión suave · limpio e intenso",
    coffee: 13, water: 195, ratio: "1:15", temp: "94 °C",
    grind: ["Media-fina", "como azúcar"],
    prep: "Antes de empezar: coloca el filtro de papel en la tapa, enjuágalo con agua caliente y arma la AeroPress sobre tu taza (método clásico, no invertido).",
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
  moka: {
    name: "Moka italiana", tag: "Intenso · estilo espresso",
    open: true, ratio: "", temp: "Ambiente",
    customStats: [["Llena la canastilla", "Café"], ["Hasta la mitad de la válvula", "Agua"], ["Agua a temperatura ambiente", "Temperatura"], ["Según el fuego", "Tiempo"]],
    grind: ["Media-fina", "un poco más gruesa que espresso"],
    prep: "La moka no lleva medidas exactas: se llena a ojo, como indica cada paso. El cronómetro de abajo cuenta el tiempo, pero lo que manda es el fuego.",
    steps: [
      { title: "Llena la base", text: () => "Agrega agua a temperatura ambiente hasta la mitad de la válvula." },
      { title: "Llena la canastilla", text: () => "Pon el café molido media-fina hasta llenar la canastilla, sin compactar." },
      { title: "Al fuego", text: () => "Arma, cierra bien y llévala al fuego con la tapa abierta." },
      { title: "Detén y sirve", text: () => "Cuando el café suba y empiece a borbotear, retírala del fuego y sirve." }
    ]
  }
};

const TIPS = [
  "¿Sabe muy ácido o aguado? Muele un poco más fino o sube 1–2 °C el agua.",
  "¿Sabe amargo o seco? Muele un poco más grueso o baja 1–2 °C el agua.",
  "¿Lo pides molido? Escríbenos por WhatsApp, dinos tu método y te lo molemos para eso."
];

const BUDDY_POSES = { point: "assets/img/buddy-point.png", coffee: "assets/img/buddy-coffee.png", dj: "assets/img/buddy-dj.png" };
const state = { cafe: "tradicional", method: "v60" };
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
  const last = m.steps[m.steps.length - 1];
  return { m, c: m.coffee, w: m.water, total: m.open ? Infinity : last.to };
}

function renderChoices() {
  $("cafeChips").innerHTML = Object.entries(CAFES).map(([id, cf]) =>
    `<button type="button" class="lab-chip" data-cafe="${id}" aria-pressed="${state.cafe === id}" ${cf.disabled ? "disabled" : ""}>${cf.name}<small>${cf.sub}</small></button>`).join("");
  $("cafeNote").textContent = CAFES[state.cafe].note || "";
  $("methodGrid").innerHTML = Object.entries(METHODS).map(([id, m]) =>
    `<button type="button" class="lab-method" data-method="${id}" aria-pressed="${state.method === id}">${m.name}<small>${m.tag}</small></button>`).join("");
}

function renderRecipe() {
  const { m, c, w, total } = current();
  $("recipeTitle").textContent = `${m.name} · ${CAFES[state.cafe].name}`;
  $("recipeRatio").textContent = m.ratio;
  const tiles = m.customStats ||
    [
      [`${c}<small>g</small>`, "Café"],
      [`${w}<small>ml</small>`, "Agua"],
      [`${m.temp.replace(/\s*°C/, "")}<small>°C</small>`, "Temperatura"],
      [m.timeLabel ? `${m.timeLabel}<small>min</small>` : `${fmt(total)}<small>min</small>`, "Tiempo"]
    ];
  $("recipeStats").innerHTML = tiles.map(([v, k]) => {
    const isText = !!m.customStats;
    return `<div class="lab-stat${isText ? " text" : ""}"><strong>${v}</strong><span>${k}</span></div>`;
  }).join("");
  $("grindLabel").textContent = m.grind[0];
  $("grindHint").textContent = m.grind[1];
  $("tipsList").innerHTML = TIPS.map((t) => `<li>${t}</li>`).join("");
  $("prepNote").textContent = m.prep;
  $("stepsList").innerHTML = m.steps.map((s, i) => {
    const target = s.target ? s.target(c, w) : null;
    const when = m.open ? "" : `${fmt(s.from)} – ${fmt(s.to)}`;
    return `<li class="lab-step" data-step="${i}">
      <span class="lab-step-n">${i + 1}</span>
      <div><h3>${s.title}</h3><p>${s.text(c, w)}</p></div>
      <div class="lab-step-meta">${target ? `<b>→ ${target} ml</b>` : ""}${when}</div>
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
  if (m.open) { document.querySelectorAll(".lab-step").forEach((el) => el.classList.remove("active", "done")); return; }
  document.querySelectorAll(".lab-step").forEach((el, i) => {
    const s = m.steps[i];
    if (!s) return;
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
  if (!m.open && timer.elapsed >= total) { finish(); return; }
  $("labClock").textContent = fmt(timer.elapsed);
  if (m.open) return;
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
  if (current().m.open) { $("labNow").textContent = "Cronómetro: lo que manda es el fuego"; return; }
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
  else if (b.dataset.method) { state.method = b.dataset.method; }
  else return;
  renderChoices(); renderRecipe(); reset();
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
