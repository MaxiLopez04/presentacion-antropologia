// =============================================================
//  Paseo por el Casino — cámara, diapositivas y navegación
// =============================================================
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildWorld } from './world.js';
import { SLIDES, META } from './slides.js';
import { createMinimap } from './minimap.js';
import { X, Z, ease, clamp, damp } from './util.js';
import { FX } from './facade.js';
import { spinSlot } from './props.js';
import { initRemote } from './remote-host.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const XL = X(45);
const DOOR_MID = 0;
const DOOR_LANE = 0;

// ---------- Posiciones de cámara para cada diapositiva ----------
// pos = dónde está la cámara, target = hacia dónde mira (metros)
const VIEWS = {
  portada: { pos: V(FX - 19, 1.9, DOOR_MID), target: V(FX, 7.6, DOOR_MID), fov: 55 },
  ruleta: { pos: V(18.6, 3.9, -5.2), target: V(6.5, 0.6, -0.6), fov: 55 },
  pozo: { pos: V(4.6, 2.6, 3.7), target: V(-2.6, 1.6, -1.4), fov: 55 },
  expendedora: { pos: V(-14.3, 1.7, -3.1), target: V(-11.2, 1.2, -4.6), fov: 52 },
  moza: null, // se calcula a partir de la posición final de la moza
  cajero: { pos: V(13.5, 1.8, 5.8), target: V(15.0, 1.25, 8.8), fov: 52 },
  camaras: { pos: V(15.5, 2.0, 5.0), target: V(15.5, 3.25, 9.9), fov: 52 },
};

// ---------- Renderer ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b1030');
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.05, 220);

// Postproceso: brillo ("bloom") en luces, carteles, pantallas y LED
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.45, 0.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());
function resizeComposer() {
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(innerWidth, innerHeight);
}
resizeComposer();

// Esperar las fuentes antes de dibujar los carteles
try {
  await Promise.all([
    document.fonts.load('60px "Lilita One"'),
    document.fonts.load('60px "VT323"'),
    document.fonts.load('600 30px "Fredoka"'),
    document.fonts.load('700 30px "Fredoka"'),
  ]);
} catch (e) { /* si falla, se usan fuentes del sistema */ }

const world = buildWorld(scene);
window.casino = { renderer, scene, camera, world }; // útil para depurar desde la consola
// las cámaras de seguridad del cajero siguen al espectador en su diapositiva
const CAMS_SLIDE = SLIDES.findIndex((s) => s.id === 'camaras');
world.watch = () => (current === CAMS_SLIDE ? camera.position : null);
const worker = world.worker;
VIEWS.moza = (() => {
  const f = worker.endFraming(2.7, 0.6, 1.6);
  return { pos: f.pos, target: f.target, fov: 46 };
})();
const viewOf = (i) => VIEWS[SLIDES[i].id];

// ---------- Estado de cámara ----------
const cam = { pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 55 };
let move = null;  // vuelo entre paradas
let cine = null;  // cinemática de la moza
let current = 0;

function setCam(v) { cam.pos.copy(v.pos); cam.target.copy(v.target); cam.fov = v.fov; }

// ---------- Red de pasillos para los recorridos de cámara ----------
// La cámara viaja por los pasillos de la sala (a ~2,3 m de altura, por
// encima de las cabezas y por debajo de los carteles), como si caminara.
// Cada nodo es un punto de un pasillo; las aristas unen nodos que se ven
// sin obstáculos en el medio. Las paradas se conectan a sus nodos cercanos.
const DOOR_PATH = [V(FX - 3, 1.85, DOOR_LANE), V(FX, 1.85, DOOR_LANE), V(XL, 1.85, DOOR_LANE), V(X(118), 1.95, DOOR_LANE)];
const NODES = {
  E: V(-21.5, 2.2, -1.0),   // hall de entrada
  N1: V(-19.2, 2.3, -3.0),  // pasillo norte (entre bancos y escalera mecánica)
  N2: V(-15.0, 2.3, -2.9),
  N3: V(-11.0, 2.2, -2.9),
  N4: V(-6.0, 2.3, -2.6),   // entre el Pozo MEGA y su cartel
  N5: V(1.8, 2.4, -2.6),
  NM: V(7.0, 2.6, -3.0),    // entre las tragamonedas de la escalera y la ruleta
  NE: V(7.9, 2.8, -6.3),    // pasillo al norte de la ruleta
  R1: V(14.0, 3.4, -6.6),
  M: V(5.8, 2.5, -1.0),     // espacio entre el Pozo MEGA y la ruleta
  S1: V(5.5, 2.4, 3.0),     // pasillo sur
  S2: V(-4.0, 2.3, 3.0),
  S3: V(-14.6, 2.2, 2.7),
  W: V(-15.0, 2.2, 0.0),    // pasillo entre los dos bancos de la izquierda
  D: V(9.5, 2.5, 3.5),      // hacia el cajero
  S4: V(-1.6, 2.3, 3.2),    // frente a la moza (diapositiva 4)
};
const EDGES = [
  ['E', 'N1'], ['N1', 'N2'], ['N2', 'N3'], ['N3', 'N4'], ['N4', 'N5'], ['N5', 'NM'], ['NM', 'NE'], ['NE', 'R1'],
  ['N5', 'M'], ['NE', 'M'], ['M', 'S1'], ['M', 'D'], ['S1', 'S2'], ['S2', 'S3'], ['S3', 'W'], ['W', 'N2'], ['S1', 'D'],
  // paradas
  ['v0', 'E'], ['v1', 'R1'], ['v1', 'M'], ['v2', 'S1'], ['v2', 'M'], ['v2', 'S2'],
  ['v3', 'N2'], ['v3', 'W'], ['v4', 'S2'], ['v4', 'S4'], ['S4', 'S1'], ['S4', 'S2'], ['v5', 'D'], ['v6', 'v5'], ['v6', 'D'],
];
let graph = null;
function buildGraph() {
  const pos = { ...NODES };
  SLIDES.forEach((s, i) => { pos['v' + i] = viewOf(i).pos; });
  const adj = {};
  for (const [a, b] of EDGES) {
    if (!pos[a] || !pos[b]) continue;
    // la portada pasa por la puerta
    const via = a === 'v0' ? DOOR_PATH : b === 'v0' ? DOOR_PATH.slice().reverse() : [];
    const len = [pos[a], ...via, pos[b]].reduce((acc, p, i, arr) => (i ? acc + p.distanceTo(arr[i - 1]) : 0), 0);
    (adj[a] ||= []).push({ to: b, len, via });
    (adj[b] ||= []).push({ to: a, len, via: via.slice().reverse() });
  }
  return { pos, adj };
}
function shortestPath(from, to) {
  const { adj } = graph;
  const dist = { [from]: 0 }, prev = {}, done = new Set();
  while (true) {
    let u = null;
    for (const k in dist) if (!done.has(k) && (u === null || dist[k] < dist[u])) u = k;
    if (u === null || u === to) break;
    done.add(u);
    for (const e of adj[u] || []) {
      const nd = dist[u] + e.len;
      if (dist[e.to] === undefined || nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = { from: u, via: e.via }; }
    }
  }
  const pts = [];
  for (let n = to; n !== from; n = prev[n].from) {
    if (!prev[n]) return null;
    pts.unshift(...prev[n].via.map((p) => p.clone()), graph.pos[n].clone());
  }
  return pts; // incluye el destino, no el origen
}
function buildPath(a, fromIdx, toIdx) {
  graph ||= buildGraph();
  // si la cámara quedó a mitad de un vuelo, arranca desde el nodo más cercano
  let start = 'v' + fromIdx;
  if (a.distanceTo(graph.pos[start]) > 1.0) {
    let best = null, bd = Infinity;
    for (const k in NODES) { const d = a.distanceTo(NODES[k]); if (d < bd) { bd = d; best = k; } }
    start = best;
  }
  const pts = [a.clone()];
  const route = shortestPath(start, 'v' + toIdx) || [viewOf(toIdx).pos.clone()];
  for (const p of route) if (p.distanceTo(pts[pts.length - 1]) > 0.3) pts.push(p);
  if (pts.length < 2) pts.push(viewOf(toIdx).pos.clone());
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
}

function flyTo(view, onDone, fromIdx, toIdx) {
  const curve = buildPath(cam.pos, fromIdx, toIdx);
  const len = curve.getLength();
  const m = {
    curve, t: 0, dur: clamp(len / 7, 1.8, 6.5),
    fromT: cam.target.clone(), toT: view.target.clone(),
    fromFov: cam.fov, toFov: view.fov, onDone,
    // en los tramos cortos hacia atrás casi no se mira "hacia adelante":
    // la cámara gira directo desde una parada a la otra
    aheadW: len < 8 ? 0 : toIdx < fromIdx && len < 25 ? 0.25 : 1,
    toCover: toIdx === 0 && fromIdx !== 0,
  };
  if (m.toCover) {
    // punto del recorrido donde se llega al hall de entrada: ahí la cámara
    // se da vuelta y sale "caminando hacia atrás" mirando hacia la sala
    let best = 0, bd = Infinity;
    for (let i = 0; i <= 200; i++) {
      const d = curve.getPointAt(i / 200).distanceTo(NODES.E);
      if (d < bd) { bd = d; best = i / 200; }
    }
    m.uHall = best;
  }
  move = m;
}
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerpAngle = (a, b, t) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * t; };

const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
function updateMove(dt) {
  const m = move;
  m.t += dt;
  const k = clamp(m.t / m.dur, 0, 1);
  const e = ease.inOutCubic(k);
  m.curve.getPointAt(e, cam.pos);
  // dirección de avance
  m.curve.getPointAt(Math.min(1, e + 0.035), tmpB).sub(cam.pos);
  tmpB.y = 0;
  const hasAhead = tmpB.lengthSq() > 1e-5;
  if (hasAhead) {
    tmpB.normalize().multiplyScalar(6).add(cam.pos);
    tmpB.y = cam.pos.y - 0.4;
    m.ahead = (m.ahead || tmpB.clone()).lerp(tmpB, 1 - Math.exp(-6 * dt));
  }
  const base = tmpA.copy(m.fromT);
  if (m.toCover) {
    // adentro mira hacia adelante; en el hall gira (por ángulo, sin saltos)
    // y sale de espaldas mirando hacia la sala, hasta ver la fachada
    if (m.ahead) {
      const yawAhead = Math.atan2(m.ahead.x - cam.pos.x, m.ahead.z - cam.pos.z);
      const yaw = lerpAngle(yawAhead, Math.PI / 2, smooth(m.uHall - 0.06, m.uHall + 0.04, e));
      const look = V(cam.pos.x + Math.sin(yaw) * 6, cam.pos.y - 0.2, cam.pos.z + Math.cos(yaw) * 6);
      base.lerp(look, smooth(0, 0.12, k));
    }
    base.lerp(m.toT, smooth(0.8, 1, k));
  } else {
    // al principio mira hacia adelante; desde la mitad se va perfilando
    // hacia lo que se ve en la parada de destino
    if (m.ahead) base.lerp(m.ahead, smooth(0, 0.12, k) * m.aheadW);
    base.lerp(m.toT, smooth(m.aheadW === 0 ? 0 : 0.35, 0.85, k));
  }
  cam.target.x = damp(cam.target.x, base.x, 8, dt);
  cam.target.y = damp(cam.target.y, base.y, 8, dt);
  cam.target.z = damp(cam.target.z, base.z, 8, dt);
  if (k >= 1) cam.target.copy(m.toT);
  cam.fov = THREE.MathUtils.lerp(m.fromFov, m.toFov, ease.inOutSine(k));
  if (k >= 1) { move = null; m.onDone?.(); }
}

// ---------- Cinemática de la moza (diapositiva 3 -> 4) ----------
const VANTAGE = V(-14.7, 1.85, -2.3);
function startCinematic() {
  cine = { t: 0, from: { pos: cam.pos.clone(), target: cam.target.clone(), fov: cam.fov }, shown: false };
  world.staffDoor.userData.target = 1;
  worker.start();
}
function updateCinematic(dt) {
  const c = cine;
  c.t += dt;
  const T1 = 1.3, T2 = 3.4;
  const look0 = worker.root.position.clone().setY(1.25);
  const fr = worker.framing(2.7, 0.6, 1.6);
  if (c.t < T1) {
    const e = ease.inOutSine(c.t / T1);
    cam.pos.lerpVectors(c.from.pos, VANTAGE, e);
    cam.target.lerpVectors(c.from.target, look0, e);
    cam.fov = THREE.MathUtils.lerp(c.from.fov, 55, e);
  } else if (c.t < T2) {
    const e = ease.inOutCubic((c.t - T1) / (T2 - T1));
    cam.pos.lerpVectors(VANTAGE, fr.pos, e);
    cam.pos.y += Math.sin(Math.PI * e) * 0.6;
    cam.target.lerpVectors(look0, fr.target, e);
    cam.fov = THREE.MathUtils.lerp(55, VIEWS.moza.fov, e);
  } else {
    cam.pos.x = damp(cam.pos.x, fr.pos.x, 5, dt);
    cam.pos.y = damp(cam.pos.y, fr.pos.y, 5, dt);
    cam.pos.z = damp(cam.pos.z, fr.pos.z, 5, dt);
    cam.target.x = damp(cam.target.x, fr.target.x, 6, dt);
    cam.target.y = damp(cam.target.y, fr.target.y, 6, dt);
    cam.target.z = damp(cam.target.z, fr.target.z, 6, dt);
    if (!c.shown) { c.shown = true; arrive(4); }
    if (worker.done && c.t > T2 + 1.0) {
      cine = null;
      world.staffDoor.userData.target = 0;
    }
  }
  if (c.t > 2.2) world.staffDoor.userData.target = 0;
}

// ---------- Navegación ----------
function go(i) {
  if (i < 0 || i >= SLIDES.length || i === current) return;
  const from = current;
  hidePanel();
  bubbleT = 0;
  move = null; // cancelar cualquier vuelo pendiente (si no, retoma al terminar la cinemática)
  if (cine) { // saltar la cinemática
    cine = null;
    worker.placeAtEnd();
    world.staffDoor.userData.target = 0;
  }
  current = i;
  updateNavUI();
  if (i > 0) world.doors.target = 1;
  if (from === 3 && i === 4) { startCinematic(); return; }
  if (i >= 4 && !worker.root.visible) worker.placeAtEnd();
  flyTo(viewOf(i), () => arrive(i), from, i);
}

function arrive(i) {
  if (i !== current) return;
  if (i < 4) worker.hide();
  if (i === 0) world.doors.target = 0;
  showPanel(i);
}

const next = () => go(current + 1);
const prev = () => go(current - 1);

// ---------- UI ----------
const $ = (id) => document.getElementById(id);
const panel = $('panel');
const cover = $('cover');
document.getElementById('brand').textContent = META.brand;

function showPanel(i) {
  const s = SLIDES[i];
  if (s.type === 'cover') {
    $('cover-kicker').textContent = s.kicker || '';
    $('cover-title').textContent = s.title || '';
    $('cover-sub').textContent = s.subtitle || '';
    cover.classList.remove('hidden');
    cover.querySelectorAll('div,h1,p').forEach((el, k) => {
      el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
      el.style.animationDelay = `${k * 0.08}s`;
    });
    return;
  }
  $('panel-kicker').textContent = s.kicker || '';
  $('panel-title').textContent = s.title || '';
  $('panel-tip').textContent = s.tip || '';
  const ul = $('panel-bullets');
  ul.innerHTML = '';
  (s.bullets || []).forEach((b) => { const li = document.createElement('li'); li.textContent = b; ul.appendChild(li); });
  panel.style.setProperty('--accent', s.accent || '#e8342f');
  panel.classList.remove('side-left', 'side-right');
  panel.classList.add(s.side === 'left' ? 'side-left' : 'side-right');
  void panel.offsetWidth;
  panel.classList.add('show');
}
function hidePanel() {
  panel.classList.remove('show');
  cover.classList.add('hidden');
}

const dotsEl = $('dots');
SLIDES.forEach((s, i) => {
  if (i === 0) return;
  const b = document.createElement('button');
  b.title = s.title;
  b.setAttribute('aria-label', `Ir a ${s.title}`);
  b.addEventListener('click', () => go(i));
  dotsEl.appendChild(b);
});
const total = SLIDES.length - 1;
function updateNavUI() {
  const pad = (n) => String(n).padStart(2, '0');
  $('lcd-text').textContent = `${pad(current)}/${pad(total)}`;
  [...dotsEl.children].forEach((b, k) => b.classList.toggle('on', k + 1 === current));
  $('prev').disabled = current === 0;
  $('next').disabled = current === SLIDES.length - 1;
  minimap.setCurrent(current);
  history.replaceState(null, '', `#${current}`);
  if (current > 0) $('hint').classList.add('gone');
  remote?.broadcast();
}

const minimap = createMinimap($('minimap-canvas'), (slide) => go(slide));

$('next').addEventListener('click', next);
$('prev').addEventListener('click', prev);
function pressFx(id) { const b = $(id); b.classList.add('pressed'); setTimeout(() => b.classList.remove('pressed'), 120); }

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  switch (e.key) {
    case 'ArrowRight': case 'PageDown': case ' ': case 'Enter':
      e.preventDefault(); pressFx('next'); next(); break;
    case 'ArrowLeft': case 'PageUp': case 'Backspace':
      e.preventDefault(); pressFx('prev'); prev(); break;
    case 'Home': go(0); break;
    case 'End': go(SLIDES.length - 1); break;
    case 'f': case 'F': toggleFull(); break;
    case 'm': case 'M': toggleMap(); break;
    case 'h': case 'H': document.body.classList.toggle('ui-hidden'); break;
    case 'r': case 'R': remote?.toggle(); break;
    default:
      if (/^[0-9]$/.test(e.key) && +e.key < SLIDES.length) go(+e.key);
  }
});

function toggleFull() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
}
function toggleMap() {
  $('minimap').classList.toggle('hidden-soft');
  $('btn-map').classList.toggle('off');
}
$('btn-full').addEventListener('click', toggleFull);
$('btn-map').addEventListener('click', toggleMap);

// swipe en pantallas táctiles
let touchX = null;
canvas.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
canvas.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 60) (dx < 0 ? next : prev)();
  touchX = null;
});

// ---------- Interacción con objetos ----------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(9, 9);
const parallax = new THREE.Vector2();
const parallaxTarget = new THREE.Vector2();
const hoverTip = $('hover-tip');
let hovered = null;
const hitObjs = world.clickables.map((c) => c.obj);
const clickOf = (obj) => {
  for (let o = obj; o; o = o.parent) {
    const c = world.clickables.find((k) => k.obj === o);
    if (c) return c;
  }
  return null;
};

canvas.addEventListener('pointermove', (e) => {
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  parallaxTarget.copy(mouse);
  hoverTip.style.left = e.clientX + 'px';
  hoverTip.style.top = e.clientY + 'px';
});
canvas.addEventListener('pointerleave', () => { mouse.set(9, 9); parallaxTarget.set(0, 0); });

function pick() {
  if (move || cine || mouse.x > 2) return null;
  raycaster.setFromCamera(mouse, camera);
  raycaster.far = 14;
  const hit = raycaster.intersectObjects(hitObjs, true).find((h) => {
    for (let o = h.object; o; o = o.parent) if (!o.visible) return false;
    return true;
  });
  return hit ? clickOf(hit.object) : null;
}

canvas.addEventListener('click', (e) => {
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  const c = pick();
  if (c) c.action();
});

// Globo de diálogo de la moza
const bubble = $('bubble');
let bubbleT = 0;
const PHRASES = ['¿Un cafecito? ☕', '¡Bienvenidos!', '¡Recién hecho!', '¿Con azúcar?'];
let phraseIdx = 0;
world.onWorkerClick = () => {
  bubble.textContent = PHRASES[phraseIdx++ % PHRASES.length];
  bubble.classList.remove('hidden');
  bubble.style.animation = 'none'; void bubble.offsetWidth; bubble.style.animation = '';
  bubbleT = 2.6;
};

// ---------- Control remoto desde el celular ----------
// Interacciones que se pueden disparar desde el celular en cada parada
const ACTIONS = {
  ruleta: [{ id: 'spin', label: '🎡 Girar la ruleta', run: () => world.roulette.userData.spin() }],
  pozo: [{ id: 'slot', label: '🎰 Tirar las tragamonedas', run: () => world.slots.slice(4, 8).forEach((s, k) => setTimeout(() => spinSlot(s), k * 150)) }],
  expendedora: [{ id: 'buy', label: '🥤 Comprar algo', run: () => world.vending.userData.buy() }],
  moza: [{ id: 'hi', label: '👋 Saludar a la moza', run: () => { worker.hop(); world.onWorkerClick?.(); } }],
  cajero: [{ id: 'pay', label: '💵 Cobrar el ticket', run: () => world.cash.userData.pay() }],
  camaras: [],
};
const remote = initRemote({
  getState: () => ({
    current,
    total,
    title: SLIDES[current].title,
    slides: SLIDES.map((s, i) => ({ i, title: s.title })),
    actions: (ACTIONS[SLIDES[current].id] || []).map(({ id, label }) => ({ id, label })),
  }),
  onCommand: (d) => {
    switch (d.type) {
      case 'next': pressFx('next'); next(); break;
      case 'prev': pressFx('prev'); prev(); break;
      case 'go': if (Number.isInteger(d.i)) go(d.i); break;
      case 'action': (ACTIONS[SLIDES[current].id] || []).find((a) => a.id === d.id)?.run(); break;
      case 'toggleMap': toggleMap(); break;
      case 'toggleUI': document.body.classList.toggle('ui-hidden'); break;
    }
  },
});

// ---------- Bucle principal ----------
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  resizeComposer();
});

// Calidad adaptativa: si la PC va lenta, baja la resolución interna
const maxPR = Math.min(window.devicePixelRatio, 2);
let pr = maxPR, qAcc = 0, qFrames = 0;
function adaptQuality(dt) {
  if (document.hidden) return;
  qAcc += dt; qFrames++;
  if (qAcc < 2) return;
  const fps = qFrames / qAcc;
  qAcc = 0; qFrames = 0;
  let np = pr;
  if (fps < 40) np = Math.max(0.6, pr - 0.2);
  else if (fps > 57) np = Math.min(maxPR, pr + 0.1);
  if (Math.abs(np - pr) > 0.01) { pr = np; renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight); resizeComposer(); }
}

const clock = new THREE.Clock();
const lookDir = new THREE.Vector3();
let frame = 0;
const headPos = new THREE.Vector3();

function tick() {
  const dt = Math.min(clock.getDelta(), 0.1);
  const t = clock.elapsedTime;

  for (const u of world.updaters) u(t, dt);

  if (cine) updateCinematic(dt);
  else if (move) updateMove(dt);

  // cámara: leve respiración + paralaje con el mouse
  parallax.x = damp(parallax.x, parallaxTarget.x, 3, dt);
  parallax.y = damp(parallax.y, parallaxTarget.y, 3, dt);
  camera.position.copy(cam.pos);
  camera.position.y += Math.sin(t * 0.8) * 0.02;
  lookDir.subVectors(cam.target, cam.pos).normalize();
  const right = tmpA.set(-lookDir.z, 0, lookDir.x).normalize();
  const look = tmpB.copy(cam.target)
    .addScaledVector(right, parallax.x * 0.35 + Math.sin(t * 0.5) * 0.03)
    .add(new THREE.Vector3(0, parallax.y * 0.22, 0));
  camera.lookAt(look);
  if (Math.abs(camera.fov - cam.fov) > 0.01) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }

  // hover
  if (frame % 3 === 0) {
    const c = pick();
    if (c !== hovered) {
      hovered = c;
      canvas.style.cursor = c ? 'pointer' : 'default';
      hoverTip.classList.toggle('hidden', !c);
      if (c) hoverTip.textContent = c.tip;
    }
  }

  // globo
  if (bubbleT > 0) {
    bubbleT -= dt;
    worker.head.getWorldPosition(headPos);
    headPos.y += 0.45;
    headPos.project(camera);
    bubble.style.left = ((headPos.x + 1) / 2) * innerWidth + 'px';
    bubble.style.top = ((1 - headPos.y) / 2) * innerHeight + 'px';
    if (bubbleT <= 0 || !worker.root.visible || headPos.z > 1) bubble.classList.add('hidden');
  } else if (!bubble.classList.contains('hidden')) bubble.classList.add('hidden');

  if (frame % 2 === 0) minimap.draw(cam.pos, lookDir);
  frame++;

  if (frame % 2 === 0) renderer.shadowMap.needsUpdate = true;
  adaptQuality(dt);
  composer.render();
  requestAnimationFrame(tick);
}

// ---------- Inicio ----------
const startAt = clamp(parseInt(location.hash.slice(1), 10) || 0, 0, SLIDES.length - 1);
current = startAt;
if (startAt >= 4) worker.placeAtEnd();
world.doors.target = world.doors.open = startAt > 0 ? 1 : 0;
setCam(viewOf(startAt));
updateNavUI();
tick();
setTimeout(() => {
  $('loader').classList.add('fade');
  showPanel(startAt);
}, 250);
setTimeout(() => $('loader').remove(), 1000);
