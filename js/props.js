// Objetos del casino: tragamonedas, ruleta, Pozo MEGA, expendedora, cajero
import * as THREE from 'three';
import {
  C, toon, glow, rbox, box, cyl, sph, tor, plane, cone, canvasTex, redraw, txt, rr, dynamic, rand, deg, add, hitbox,
} from './util.js';

// =============================================================
//  Símbolos de los rodillos
// =============================================================
function drawSymbol(ctx, kind, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineJoin = 'round';
  switch (kind) {
    case '7':
      txt(ctx, '7', 0, 4, { size: s * 1.25, fill: C.red, lw: s * 0.14 });
      break;
    case 'cherry':
      ctx.strokeStyle = '#2d8a2d'; ctx.lineWidth = s * 0.08;
      ctx.beginPath(); ctx.moveTo(-s * 0.2, s * 0.05); ctx.quadraticCurveTo(-s * 0.05, -s * 0.45, s * 0.2, -s * 0.42); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.22, s * 0.1); ctx.quadraticCurveTo(s * 0.15, -s * 0.3, s * 0.2, -s * 0.42); ctx.stroke();
      for (const [x, y] of [[-s * 0.2, s * 0.18], [s * 0.22, s * 0.22]]) {
        ctx.beginPath(); ctx.arc(x, y, s * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = '#e8342f'; ctx.fill(); ctx.lineWidth = s * 0.06; ctx.strokeStyle = C.ink; ctx.stroke();
        ctx.beginPath(); ctx.arc(x - s * 0.07, y - s * 0.07, s * 0.06, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
      }
      break;
    case 'bar':
      rr(ctx, -s * 0.5, -s * 0.24, s, s * 0.48, s * 0.1);
      ctx.fillStyle = C.ink; ctx.fill();
      txt(ctx, 'BAR', 0, 2, { size: s * 0.36, fill: C.yellow, lw: 0 });
      break;
    case 'bell':
      ctx.beginPath();
      ctx.moveTo(-s * 0.38, s * 0.25);
      ctx.quadraticCurveTo(-s * 0.32, -s * 0.45, 0, -s * 0.42);
      ctx.quadraticCurveTo(s * 0.32, -s * 0.45, s * 0.38, s * 0.25);
      ctx.closePath();
      ctx.fillStyle = C.yellow; ctx.fill(); ctx.lineWidth = s * 0.06; ctx.strokeStyle = C.ink; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, s * 0.3, s * 0.09, 0, Math.PI * 2); ctx.fillStyle = C.orange; ctx.fill(); ctx.stroke();
      break;
    case 'star': {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? s * 0.2 : s * 0.46;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fillStyle = C.orange; ctx.fill(); ctx.lineWidth = s * 0.06; ctx.strokeStyle = C.ink; ctx.stroke();
      break;
    }
    case 'diamond':
      ctx.beginPath(); ctx.moveTo(0, -s * 0.42); ctx.lineTo(s * 0.36, -s * 0.05); ctx.lineTo(0, s * 0.42); ctx.lineTo(-s * 0.36, -s * 0.05); ctx.closePath();
      ctx.fillStyle = '#5fd0f0'; ctx.fill(); ctx.lineWidth = s * 0.06; ctx.strokeStyle = C.ink; ctx.stroke();
      break;
    case 'banana':
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, -s * 0.2);
      ctx.quadraticCurveTo(-s * 0.1, s * 0.55, s * 0.42, -s * 0.15);
      ctx.quadraticCurveTo(0, s * 0.2, -s * 0.4, -s * 0.2);
      ctx.fillStyle = C.yellow; ctx.fill(); ctx.lineWidth = s * 0.06; ctx.strokeStyle = C.ink; ctx.stroke();
      break;
    case 'mega':
      txt(ctx, 'M', 0, 4, { size: s * 1.0, fill: C.yellow, stroke: C.purple, lw: s * 0.14 });
      break;
  }
  ctx.restore();
}

function reelTexture(bg, symbols) {
  // 4 filas x 3 rodillos; se repite verticalmente para "girar"
  return canvasTex(256, 512, (ctx, w, h) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const cw = w / 3;
    for (let c = 0; c < 3; c++) {
      ctx.fillStyle = '#fffaf0';
      ctx.fillRect(c * cw + 6, 0, cw - 12, h);
      ctx.fillStyle = 'rgba(0,0,0,.08)';
      ctx.fillRect(c * cw + 6, 0, 6, h);
      ctx.fillRect(c * cw + cw - 12, 0, 6, h);
    }
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        const k = symbols[(r * 3 + c * 2 + r) % symbols.length];
        drawSymbol(ctx, k, c * cw + cw / 2, r * 128 + 64, 74);
      }
    }
  });
}

// Tragamonedas modernas (gabinete oscuro, pantallas grandes, LED de color)
const SKINS = [
  { led: '#ff3b3b', art: ['777', '#c8222a', '#ffd23a'] },
  { led: '#3bff7a', art: ['FORTUNE', '#14864a', '#ffe14a'] },
  { led: '#38b8ff', art: ['DIAMOND', '#1f3fa8', '#9ff0ff'] },
  { led: '#c86bff', art: ['DRAGON', '#5d22a8', '#ff9a2f'] },
  { led: '#ffb43b', art: ['LUCKY', '#e86a10', '#fff1a0'] },
];
const MEGA_SKIN = { led: '#ffe14a', art: ['MEGA', '#4b1d9a', '#ffd23a'], body: '#3a1f6e' };

let reelTexes = null;
let megaReel = null;
const artTex = new Map();
function getArt([label, c1, c2]) {
  if (!artTex.has(label)) {
    artTex.set(label, canvasTex(256, 180, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h * 0.6, 10, w / 2, h / 2, w * 0.7);
      g.addColorStop(0, c2); g.addColorStop(0.35, c1); g.addColorStop(1, '#14102a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.save(); ctx.translate(w / 2, h * 0.62);
      for (let i = 0; i < 16; i++) {
        ctx.rotate(Math.PI / 8);
        ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.10)';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(220, -30); ctx.lineTo(220, 30); ctx.fill();
      }
      ctx.restore();
      for (let i = 0; i < 7; i++) {
        ctx.beginPath(); ctx.arc(20 + i * 36, h - 18 - (i % 2) * 8, 11, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd23a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#a8701a'; ctx.stroke();
      }
      txt(ctx, label, w / 2, h * 0.45, { size: label.length > 5 ? 50 : 72, fill: c2, lw: 10 });
    }));
  }
  return artTex.get(label);
}

export function makeSlot(skinIndex = 0, opts = {}) {
  if (!reelTexes) {
    reelTexes = [
      reelTexture('#3b2a80', ['7', 'cherry', 'bar', 'bell', 'star', 'diamond', 'banana']),
      reelTexture('#a8211f', ['cherry', '7', 'star', 'bar', 'banana', 'bell']),
      reelTexture('#1f6f8a', ['diamond', 'bell', '7', 'cherry', 'star', 'bar']),
    ];
    megaReel = reelTexture('#2a1060', ['mega', '7', 'star', 'diamond', 'mega', 'bar']);
  }
  const skin = opts.mega ? MEGA_SKIN : SKINS[skinIndex % SKINS.length];
  const g = new THREE.Group();
  const body = toon(skin.body || '#262a40');
  const trim = toon('#3a3f58');
  const ledMat = glow(skin.led);
  const chrome = toon('#d3d8e4');
  const black = toon('#1d1e26');

  // gabinete
  rbox(g, 0.92, 0.95, 0.75, 0.08, body, 0, 0.475, 0);
  box(g, 0.8, 0.04, 0.02, ledMat, 0, 0.12, 0.38).castShadow = false;
  rbox(g, 0.6, 0.4, 0.04, 0.03, trim, 0, 0.55, 0.37);
  // consola con botones
  rbox(g, 0.95, 0.12, 0.44, 0.04, trim, 0, 1.0, 0.21);
  [C.red, C.yellow, C.green, '#3b9bff', '#ffffff'].forEach((c, i) => rbox(g, 0.1, 0.03, 0.07, 0.01, glow(c), -0.38 + i * 0.13, 1.07, 0.3));
  cyl(g, 0.07, 0.075, 0.05, glow(skin.led), 0.34, 1.08, 0.3, 16);
  // pantalla principal
  rbox(g, 0.92, 0.95, 0.42, 0.08, body, 0, 1.56, -0.1);
  rbox(g, 0.84, 0.84, 0.04, 0.03, toon(C.ink), 0, 1.56, 0.11);
  const tex = (opts.mega ? megaReel : reelTexes[skinIndex % 3]).clone();
  tex.needsUpdate = true;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 0.5);
  tex.offset.y = Math.floor(Math.random() * 4) * 0.25;
  const screen = plane(g, 0.76, 0.76, glow('#ffffff', { map: tex, unique: true }), 0, 1.56, 0.132);
  screen.castShadow = false;
  dynamic(screen);
  // pantalla superior con arte del juego
  rbox(g, 0.92, 0.66, 0.38, 0.1, body, 0, 2.38, -0.11, 3);
  plane(g, 0.8, 0.56, glow('#ffffff', { map: getArt(skin.art) }), 0, 2.38, 0.085).castShadow = false;
  // tiras de LED laterales + corona que titila
  for (const s of [-1, 1]) box(g, 0.04, 1.85, 0.04, ledMat, s * 0.47, 1.8, 0.1).castShadow = false;
  const lampMat = glow(skin.led, { unique: true });
  const lamp = rbox(g, 0.96, 0.08, 0.42, 0.03, lampMat, 0, 2.74, -0.11);
  lamp.castShadow = false;
  dynamic(lamp);
  const lever = new THREE.Group();
  g.add(lever);
  // banqueta negra con base cromada
  if (opts.stool !== false) {
    cyl(g, 0.27, 0.3, 0.05, chrome, 0, 0.025, 0.88, 20);
    cyl(g, 0.045, 0.045, 0.6, chrome, 0, 0.33, 0.88, 10);
    tor(g, 0.2, 0.022, chrome, 0, 0.32, 0.88, Math.PI * 2, 20).rotation.x = Math.PI / 2;
    rbox(g, 0.5, 0.13, 0.48, 0.06, black, 0, 0.68, 0.88, 3);
    rbox(g, 0.46, 0.42, 0.08, 0.04, black, 0, 0.98, 1.12);
    box(g, 0.04, 0.3, 0.04, chrome, 0, 0.8, 1.11);
  }

  g.userData.slot = {
    tex, lampMat, lever, screen,
    baseColor: new THREE.Color(skin.led),
    phase: Math.random() * 10,
    spin: 0, nextSpin: rand(3, 14), pull: 0,
  };
  g.userData.seat = new THREE.Vector3(0, 0.75, 0.88);
  g.userData.hit = hitbox(g, 1.0, 2.8, 0.8, 0, 1.4, 0);
  return g;
}

export function spinSlot(g, dur = 1.6) {
  const s = g.userData.slot;
  if (s.spin > 0) return;
  s.spin = dur;
  s.pull = 1;
}

export function updateSlots(slots, t, dt) {
  for (const g of slots) {
    const s = g.userData.slot;
    const blink = s.spin > 0 ? (Math.sin(t * 30) > 0 ? 1 : 0.25) : 0.6 + 0.4 * Math.sin(t * 3 + s.phase);
    s.lampMat.color.copy(s.baseColor).multiplyScalar(0.35 + 0.65 * blink);
    s.nextSpin -= dt;
    if (s.nextSpin <= 0) { spinSlot(g, rand(1, 2)); s.nextSpin = rand(6, 18); }
    if (s.spin > 0) {
      s.spin -= dt;
      s.tex.offset.y += dt * 3.2;
      if (s.spin <= 0) s.tex.offset.y = Math.round(s.tex.offset.y / 0.25) * 0.25;
    }
  }
}

// =============================================================
//  Ruleta electrónica (consola negra con borde rojo acolchado,
//  cúpula con LED celeste y torre de pantallas arriba)
// =============================================================
const RED_NUMS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const numColor = (n) => (n === 0 ? '#1fa34a' : RED_NUMS.has(n) ? '#d62828' : '#1d1d26');
const ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

function drawWheel(ctx, cx, cy, R, angle) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = '#5a2e14'; ctx.fill();
  const n = ORDER.length;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R * 0.93, a0, a1); ctx.closePath();
    ctx.fillStyle = numColor(ORDER[i]); ctx.fill();
    ctx.save(); ctx.rotate((a0 + a1) / 2 + Math.PI / 2);
    ctx.fillStyle = '#fff'; ctx.font = `${Math.round(R * 0.09)}px "Lilita One"`; ctx.textAlign = 'center';
    ctx.fillText(String(ORDER[i]), 0, -R * 0.8);
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(0, 0, R * 0.62, 0, Math.PI * 2); ctx.fillStyle = '#c0703a'; ctx.fill();
  ctx.lineWidth = R * 0.05; ctx.strokeStyle = '#f4b52b'; ctx.stroke();
  for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.fillStyle = '#f4d27a'; ctx.fillRect(-R * 0.04, -R * 0.55, R * 0.08, R * 0.45); }
  ctx.beginPath(); ctx.arc(0, 0, R * 0.12, 0, Math.PI * 2); ctx.fillStyle = '#f4d27a'; ctx.fill();
  ctx.restore();
}

export function makeRoulette() {
  const g = new THREE.Group();
  const state = { speed: 0.6, ballAngle: 0, boost: 0, wheelAngle: 0, history: [17, 32, 5, 0, 23, 14, 9, 36] };

  const wheelTex = canvasTex(512, 512, (ctx, w) => drawWheel(ctx, w / 2, w / 2, w / 2 - 4, 0));
  const termTex = canvasTex(320, 200, (ctx, w, h) => {
    ctx.fillStyle = '#0f6a35'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1fa34a'; ctx.fillRect(10, 24, 28, 108);
    txt(ctx, '0', 24, 78, { size: 20, lw: 0 });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) {
      const n = c * 3 + (3 - r);
      ctx.fillStyle = numColor(n);
      ctx.fillRect(42 + c * 34, 24 + r * 36, 32, 34);
      txt(ctx, String(n), 58 + c * 34, 42 + r * 36, { size: 17, lw: 0 });
    }
    ['1-12', '13-24', '25-36'].forEach((s, i) => {
      ctx.fillStyle = '#e9e4d4'; ctx.fillRect(42 + i * 91, 138, 89, 28);
      txt(ctx, s, 86 + i * 91, 153, { size: 18, fill: '#1d1d26', lw: 0 });
    });
    ctx.fillStyle = '#d62828'; ctx.fillRect(10, 172, 100, 22);
    txt(ctx, 'APOSTAR', 60, 184, { size: 15, lw: 0 });
    txt(ctx, 'CRÉDITO 1500', 220, 184, { font: 'VT323', size: 22, fill: '#7dff6a', lw: 0 });
  });
  const logoTex = canvasTex(256, 64, (ctx, w, h) => {
    ctx.fillStyle = '#111218'; rr(ctx, 0, 0, w, h, 30); ctx.fill();
    txt(ctx, 'RULETA', w / 2, h / 2 + 3, { size: 40, fill: '#ff4a3a', stroke: '#5a0a0a', lw: 4 });
  });

  // ---- base y consola ----
  const black = toon('#1b1c26');
  const chrome = toon('#d3d8e4');
  cyl(g, 4.0, 4.0, 0.04, toon('#2a1c2e'), 0, 0.02, 0, 48);
  add(g, new THREE.CylinderGeometry(3.45, 2.2, 0.8, 48), black, 0, 0.5, 0);
  cyl(g, 3.55, 3.55, 0.12, black, 0, 0.96, 0, 64);
  // borde rojo acolchado
  const rail = tor(g, 3.62, 0.17, toon('#d42a2a'), 0, 1.0, 0, Math.PI * 2, 96);
  rail.rotation.x = Math.PI / 2;
  rail.scale.z = 0.85;
  // LED rojo bajo la consola
  const ledR = tor(g, 3.47, 0.025, glow('#ff3b2f'), 0, 0.82, 0, Math.PI * 2, 96);
  ledR.rotation.x = Math.PI / 2; ledR.castShadow = false;
  const ledR2 = tor(g, 2.28, 0.025, glow('#ff3b2f'), 0, 0.12, 0, Math.PI * 2, 64);
  ledR2.rotation.x = Math.PI / 2; ledR2.castShadow = false;

  // ---- terminales en la consola ----
  const N = 10;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const t = new THREE.Group();
    t.rotation.y = Math.atan2(Math.cos(a), Math.sin(a));
    g.add(t);
    const scr = new THREE.Group();
    scr.position.set(0, 1.04, 2.92);
    scr.rotation.x = -Math.PI / 2 + 0.3;
    t.add(scr);
    rbox(scr, 0.98, 0.66, 0.06, 0.03, toon('#0d0e14'), 0, 0, -0.02);
    plane(scr, 0.9, 0.56, glow('#ffffff', { map: termTex }), 0, 0, 0.015).castShadow = false;
    // logo en el frente
    const lg = plane(t, 0.62, 0.16, glow('#ffffff', { map: logoTex }), 0, 0.72, 3.2);
    lg.rotation.x = 0.55;
    lg.castShadow = false;
    // portavasos cromado entre terminales
    const ca = a + Math.PI / N;
    const cup = sph(g, 0.14, chrome, Math.cos(ca) * 3.15, 1.05, Math.sin(ca) * 3.15, 16, 10);
    cup.scale.set(1.2, 0.45, 1.2);
    cyl(g, 0.07, 0.07, 0.03, toon('#2a2c38'), Math.cos(ca) * 3.15, 1.1, Math.sin(ca) * 3.15, 12);

    // banqueta negra con respaldo
    const st = new THREE.Group();
    st.position.set(Math.cos(a) * 4.45, 0, Math.sin(a) * 4.45);
    st.rotation.y = Math.atan2(Math.cos(a), Math.sin(a));
    g.add(st);
    cyl(st, 0.28, 0.32, 0.05, chrome, 0, 0.025, 0, 20);
    cyl(st, 0.05, 0.05, 0.6, chrome, 0, 0.33, 0, 10);
    tor(st, 0.22, 0.024, chrome, 0, 0.32, 0, Math.PI * 2, 20).rotation.x = Math.PI / 2;
    cyl(st, 0.28, 0.28, 0.13, toon('#1d1e26'), 0, 0.68, 0, 24);
    rbox(st, 0.5, 0.45, 0.09, 0.04, toon('#1d1e26'), 0, 1.0, 0.27);
  }

  // ---- centro: rueda bajo cúpula con LED celeste ----
  cyl(g, 1.8, 1.9, 0.3, toon('#141520'), 0, 1.12, 0, 48);
  tor(g, 1.82, 0.04, chrome, 0, 1.27, 0, Math.PI * 2, 64).rotation.x = Math.PI / 2;
  const wheel = new THREE.Group();
  wheel.position.y = 1.29;
  g.add(wheel);
  const disc = cyl(wheel, 1.3, 1.3, 0.04, toon('#ffffff', { map: wheelTex }), 0, 0, 0, 64);
  disc.castShadow = false;
  cone(wheel, 0.18, 0.28, chrome, 0, 0.16, 0, 16);
  sph(wheel, 0.07, chrome, 0, 0.32, 0, 12, 8);
  dynamic(wheel);
  const ball = sph(g, 0.055, toon('#ffffff'), 1.0, 1.36, 0, 12, 8);
  dynamic(ball);
  const dome = add(g, new THREE.SphereGeometry(1.65, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), toon('#bff0ff', { opacity: 0.2 }), 0, 1.27, 0);
  dome.scale.y = 0.5;
  dome.castShadow = false;
  const cyan = glow('#4fe3ff');
  for (const [r, y, tube] of [[1.72, 1.29, 0.05], [1.95, 1.08, 0.03]]) {
    const l = tor(g, r, tube, cyan, 0, y, 0, Math.PI * 2, 80);
    l.rotation.x = Math.PI / 2; l.castShadow = false;
  }

  // ---- torre de pantallas colgante ----
  const wheelScreen = canvasTex(512, 300, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#16205a'); gr.addColorStop(1, '#070a24');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    drawWheel(ctx, 175, 165, 120, state.wheelAngle);
    ctx.beginPath(); ctx.moveTo(175, 32); ctx.lineTo(163, 12); ctx.lineTo(187, 12); ctx.closePath(); ctx.fillStyle = '#ffd23a'; ctx.fill();
    txt(ctx, 'RULETA', 400, 46, { size: 46, fill: '#ffd23a', lw: 6 });
    txt(ctx, 'ELECTRÓNICA', 400, 86, { size: 28, fill: '#fff', lw: 5 });
    const last = state.history[0];
    ctx.beginPath(); ctx.arc(400, 185, 62, 0, Math.PI * 2); ctx.fillStyle = numColor(last); ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = '#ffd23a'; ctx.stroke();
    txt(ctx, String(last), 400, 190, { size: 64, lw: 6 });
  });
  const statsScreen = canvasTex(320, 180, (ctx, w, h) => {
    ctx.fillStyle = '#0b0f2e'; ctx.fillRect(0, 0, w, h);
    txt(ctx, 'ÚLTIMOS', w / 2, 30, { size: 30, fill: '#4fe3ff', lw: 4 });
    state.history.slice(0, 8).forEach((n, i) => {
      const x = 28 + (i % 4) * 88, y = 82 + Math.floor(i / 4) * 60;
      ctx.beginPath(); ctx.arc(x, y, 24, 0, Math.PI * 2); ctx.fillStyle = numColor(n); ctx.fill();
      txt(ctx, String(n), x, y + 2, { size: 24, lw: 0 });
    });
  });
  const promoScreen = canvasTex(320, 180, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, '#d62828'); gr.addColorStop(1, '#5a0a6a');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    txt(ctx, '¡HAGAN', w / 2, 60, { size: 48, fill: '#ffd23a', lw: 7 });
    txt(ctx, 'SUS APUESTAS!', w / 2, 118, { size: 40, fill: '#fff', lw: 7 });
  });
  const tower = new THREE.Group();
  tower.position.y = 0;
  g.add(tower);
  cyl(tower, 0.12, 0.12, 0.9, toon('#1b1c26'), 0, 5.1, 0, 12);
  rbox(tower, 2.3, 1.5, 2.3, 0.08, toon('#14151d'), 0, 3.95, 0);
  for (let f = 0; f < 4; f++) {
    const face = new THREE.Group();
    face.rotation.y = (f * Math.PI) / 2;
    tower.add(face);
    plane(face, 2.1, 1.23, glow('#ffffff', { map: wheelScreen }), 0, 4.12, 1.16).castShadow = false;
    rbox(face, 1.05, 0.6, 0.08, 0.03, toon('#14151d'), -0.56, 2.95, 1.0);
    rbox(face, 1.05, 0.6, 0.08, 0.03, toon('#14151d'), 0.56, 2.95, 1.0);
    plane(face, 0.98, 0.54, glow('#ffffff', { map: f % 2 ? promoScreen : statsScreen }), -0.56, 2.95, 1.045).castShadow = false;
    plane(face, 0.98, 0.54, glow('#ffffff', { map: f % 2 ? statsScreen : promoScreen }), 0.56, 2.95, 1.045).castShadow = false;
    box(face, 2.2, 0.05, 0.05, glow('#4fe3ff'), 0, 3.2, 1.16).castShadow = false;
  }
  box(tower, 0.1, 0.45, 0.1, toon('#1b1c26'), 0, 3.4, 0);

  let acc = 0, wasBoost = false;
  g.userData.spin = () => { state.boost = 1; };
  g.userData.update = (t, dt) => {
    const sp = state.speed + state.boost * 5;
    state.boost = Math.max(0, state.boost - dt * 0.25);
    if (wasBoost && state.boost === 0) {
      state.history.unshift(Math.floor(Math.random() * 37));
      state.history.length = 8;
      redraw(statsScreen);
    }
    wasBoost = state.boost > 0;
    wheel.rotation.y += dt * sp;
    state.wheelAngle += dt * sp;
    state.ballAngle -= dt * (sp * 1.8 + 0.4);
    ball.position.set(Math.cos(state.ballAngle) * 1.05, 1.34, Math.sin(state.ballAngle) * 1.05);
    acc += dt;
    if (acc > 0.08) { acc = 0; redraw(wheelScreen); }
  };
  g.userData.hit = hitbox(g, 7.4, 1.4, 7.4, 0, 0.7, 0);
  return g;
}

// =============================================================
//  Pozo MEGA (cartel + tambor colgante)
// =============================================================
export function makePozo() {
  const g = new THREE.Group();
  let amount = 12345678.9;
  let chase = 0;
  const fmt = (v) => '$ ' + v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const boardTex = canvasTex(1000, 200, (ctx, w, h) => {
    const grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#4b1d9a'); grd.addColorStop(1, '#2a0d63');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
    // luces de marquesina
    const n = 40;
    for (let i = 0; i < n; i++) {
      const on = (i + chase) % 3 === 0;
      const x = 14 + (i * (w - 28)) / (n - 1);
      for (const y of [12, h - 12]) {
        ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = on ? '#fff6b0' : '#a0781e'; ctx.fill();
      }
    }
    txt(ctx, 'POZO MEGA', w / 2, 72, { size: 84, fill: C.yellow, stroke: C.red, lw: 14 });
    rr(ctx, 210, 112, 580, 66, 12); ctx.fillStyle = '#0e2a14'; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = C.gold; ctx.stroke();
    txt(ctx, fmt(amount), w / 2, 148, { font: 'VT323', size: 64, fill: '#7dff6a', lw: 0 });
  });
  const drumTex = canvasTex(1280, 128, (ctx, w, h) => {
    ctx.fillStyle = '#2a0d63'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) {
      const x0 = i * (w / 2);
      txt(ctx, '★ POZO MEGA', x0 + 170, h / 2 + 4, { size: 64, fill: C.yellow, stroke: C.red, lw: 10 });
      txt(ctx, fmt(amount), x0 + 470, h / 2 + 6, { font: 'VT323', size: 64, fill: '#7dff6a', lw: 0 });
    }
    ctx.fillStyle = C.gold; ctx.fillRect(0, 0, w, 8); ctx.fillRect(0, h - 8, w, 8);
  });

  // cartel sobre patas
  cyl(g, 0.1, 0.12, 2.5, toon(C.gold), -3.4, 1.25, 0, 16);
  cyl(g, 0.1, 0.12, 2.5, toon(C.gold), 3.4, 1.25, 0, 16);
  rbox(g, 8.3, 1.75, 0.36, 0.16, toon('#3a1580'), 0, 3.35, 0, 3);
  rbox(g, 8.5, 0.14, 0.42, 0.06, toon(C.gold), 0, 2.45, 0);
  rbox(g, 8.5, 0.14, 0.42, 0.06, toon(C.gold), 0, 4.25, 0);
  const faceMat = glow('#ffffff', { map: boardTex });
  const f1 = plane(g, 8.0, 1.6, faceMat, 0, 3.35, 0.185); f1.castShadow = false;
  const f2 = plane(g, 8.0, 1.6, faceMat, 0, 3.35, -0.185); f2.rotation.y = Math.PI; f2.castShadow = false;
  // estrella en la punta
  const star = new THREE.Group();
  star.position.set(0, 4.75, 0);
  g.add(star);
  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.22 : 0.5, a = Math.PI / 2 + (i * Math.PI) / 5;
    if (i === 0) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r); else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.14, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
  starGeo.center();
  add(star, starGeo, toon(C.yellow, { emissive: '#ffb000', ei: 0.35 }), 0, 0, 0);
  dynamic(star);

  // tambor colgante sobre el banco de máquinas
  const drum = new THREE.Group();
  drum.position.set(0, 4.0, 3.1);
  g.add(drum);
  const band = add(drum, new THREE.CylinderGeometry(1.7, 1.7, 0.95, 64, 1, true), glow('#ffffff', { map: drumTex, side: THREE.DoubleSide }), 0, 0, 0);
  band.castShadow = false;
  tor(drum, 1.7, 0.07, toon(C.gold), 0, 0.48, 0, Math.PI * 2, 64).rotation.x = Math.PI / 2;
  tor(drum, 1.7, 0.07, toon(C.gold), 0, -0.48, 0, Math.PI * 2, 64).rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    cyl(drum, 0.012, 0.012, 1.1, toon(C.ink), Math.cos(a) * 1.6, 1.0, Math.sin(a) * 1.6, 6);
  }
  dynamic(drum);

  let acc = 0;
  g.userData.update = (t, dt) => {
    drum.rotation.y += dt * 0.35;
    star.rotation.y += dt * 1.2;
    star.position.y = 4.75 + Math.sin(t * 2) * 0.05;
    acc += dt;
    if (acc > 0.12) {
      acc = 0;
      chase++;
      amount += rand(3, 45);
      redraw(boardTex);
      redraw(drumTex);
    }
  };
  return g;
}

// =============================================================
//  Máquina expendedora (frente hacia +z local)
// =============================================================
export function makeVending() {
  const g = new THREE.Group();
  const body = toon('#8fd6ea');
  rbox(g, 1.2, 2.0, 0.85, 0.12, body, 0, 1.0, 0, 3);
  rbox(g, 1.24, 0.1, 0.9, 0.04, toon(C.orange), 0, 0.05, 0);
  // interior
  rbox(g, 0.8, 1.3, 0.05, 0.02, toon('#22305e'), -0.13, 1.17, 0.33);
  const itemMats = [toon('#2f9a46'), toon(C.red), toon(C.yellow), toon(C.purple), toon(C.orange)];
  const items = [];
  for (let s = 0; s < 4; s++) {
    const y = 0.62 + s * 0.31;
    rbox(g, 0.78, 0.03, 0.26, 0.01, toon(C.steel), -0.13, y, 0.44);
    for (let i = 0; i < 4; i++) {
      const x = -0.4 + i * 0.18;
      const kind = (s + i) % 3;
      const it = new THREE.Group();
      it.position.set(x, y + 0.015, 0.46);
      g.add(it);
      if (kind === 0) { // botella
        cyl(it, 0.045, 0.05, 0.16, itemMats[0], 0, 0.08, 0, 12);
        cyl(it, 0.02, 0.04, 0.06, itemMats[0], 0, 0.19, 0, 10);
        cyl(it, 0.051, 0.051, 0.06, toon(C.orange), 0, 0.08, 0, 12);
      } else if (kind === 1) { // lata
        cyl(it, 0.05, 0.05, 0.15, itemMats[(s + i) % 2 ? 1 : 2], 0, 0.075, 0, 14);
        cyl(it, 0.045, 0.045, 0.01, toon(C.steel), 0, 0.155, 0, 14);
      } else { // snack
        rbox(it, 0.13, 0.19, 0.05, 0.03, itemMats[3 + ((s + i) % 2)], 0, 0.1, 0);
      }
      dynamic(it);
      items.push(it);
    }
  }
  // vidrio
  const glass = rbox(g, 0.84, 1.36, 0.03, 0.02, toon('#d8f6ff', { opacity: 0.25 }), -0.13, 1.17, 0.6);
  glass.castShadow = false;
  rbox(g, 0.92, 0.06, 0.08, 0.02, toon(C.orange), -0.13, 1.88, 0.6);
  rbox(g, 0.92, 0.06, 0.08, 0.02, toon(C.orange), -0.13, 0.46, 0.6);
  // panel derecho
  rbox(g, 0.28, 1.36, 0.06, 0.03, toon('#2a2f45'), 0.43, 1.17, 0.44);
  const lcdTex = canvasTex(128, 48, (ctx, w, h, msg = '$ 1.500') => {
    ctx.fillStyle = '#0e2a14'; ctx.fillRect(0, 0, w, h);
    txt(ctx, msg, w / 2, h / 2 + 2, { font: 'VT323', size: 34, fill: '#7dff6a', lw: 0 });
  });
  plane(g, 0.22, 0.09, glow('#ffffff', { map: lcdTex }), 0.43, 1.68, 0.475).castShadow = false;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    rbox(g, 0.05, 0.05, 0.03, 0.01, toon(r === 3 ? (c === 2 ? C.green : C.red) : C.cream), 0.37 + c * 0.065, 1.5 - r * 0.07, 0.48);
  }
  rbox(g, 0.12, 0.03, 0.02, 0.01, glow('#7dff6a'), 0.43, 1.12, 0.48);
  rbox(g, 0.16, 0.18, 0.04, 0.02, toon(C.ink), 0.43, 0.9, 0.475);
  // cartel superior
  const headTex = canvasTex(512, 128, (ctx, w, h) => {
    ctx.fillStyle = C.red; ctx.fillRect(0, 0, w, h);
    txt(ctx, 'SNACKS & BEBIDAS', w / 2, h / 2 + 4, { size: 58, fill: C.yellow, lw: 10 });
  });
  plane(g, 1.1, 0.27, glow('#ffffff', { map: headTex }), 0, 2.15, 0.2).castShadow = false;
  rbox(g, 1.2, 0.34, 0.4, 0.08, toon(C.red), 0, 2.15, -0.01);
  // bandeja de retiro
  rbox(g, 0.84, 0.24, 0.06, 0.03, toon(C.ink), -0.13, 0.25, 0.42);
  const flap = rbox(g, 0.78, 0.18, 0.03, 0.02, toon(C.orange), -0.13, 0.25, 0.45);
  dynamic(flap);

  g.userData.hit = hitbox(g, 1.25, 2.4, 0.95, 0, 1.2, 0);

  // animación de compra
  const drops = [];
  g.userData.buy = () => {
    if (drops.length > 2) return;
    const src = items[Math.floor(Math.random() * items.length)];
    const it = src.clone();
    it.position.copy(src.position);
    it.position.z = 0.5;
    g.add(it);
    drops.push({ it, vy: 0, t: 0, floor: 0.17 });
    redraw(lcdTex, '¡GRACIAS!');
    clearTimeout(g.userData._lcdTimer);
    g.userData._lcdTimer = setTimeout(() => redraw(lcdTex, '$ 1.500'), 2200);
  };
  g.userData.update = (t, dt) => {
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.t += dt;
      d.vy -= 9.8 * dt;
      d.it.position.y += d.vy * dt;
      if (d.it.position.y < d.floor) {
        d.it.position.y = d.floor;
        d.vy = Math.abs(d.vy) * 0.35;
        if (d.vy < 0.3) d.vy = 0;
      }
      d.it.rotation.z = Math.min(d.t * 4, Math.PI / 2) * 0.9;
      if (d.t > 2.6) { d.it.removeFromParent(); drops.splice(i, 1); }
    }
    flap.rotation.x = drops.length ? -0.5 : flap.rotation.x * 0.9;
  };
  return g;
}

// =============================================================
//  Cajero automático / máquina para cobrar (frente hacia +z)
// =============================================================
function makeKiosk(screenTex) {
  const g = new THREE.Group();
  rbox(g, 1.15, 0.1, 0.85, 0.04, toon(C.ink), 0, 0.05, 0);
  rbox(g, 1.05, 1.55, 0.75, 0.1, toon('#2346a8'), 0, 0.85, 0, 3);
  rbox(g, 1.12, 0.48, 0.86, 0.14, toon(C.yellow), 0, 1.85, 0.02, 3);
  rbox(g, 0.4, 0.4, 0.05, 0.08, toon(C.ink), 0, 1.86, 0.45);
  const signTex = canvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(w / 2, h / 2, 60, 0, Math.PI * 2); ctx.fill();
    txt(ctx, '$', w / 2, h / 2 + 6, { size: 96, fill: '#fff', lw: 10 });
  });
  plane(g, 0.34, 0.34, glow('#ffffff', { map: signTex }), 0, 1.86, 0.476).castShadow = false;
  // pantalla inclinada
  const head = new THREE.Group();
  head.position.set(0, 1.36, 0.36);
  head.rotation.x = -0.28;
  g.add(head);
  rbox(head, 0.82, 0.6, 0.08, 0.05, toon(C.ink), 0, 0, 0);
  const screen = plane(head, 0.7, 0.48, glow('#ffffff', { map: screenTex }), 0, 0, 0.045);
  screen.castShadow = false;
  // teclado
  rbox(g, 0.86, 0.07, 0.3, 0.03, toon('#55607a'), 0, 0.98, 0.48);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    rbox(g, 0.07, 0.03, 0.06, 0.01, toon(C.cream), -0.3 + c * 0.09, 1.03, 0.4 + r * 0.065);
  }
  [C.red, C.yellow, C.green].forEach((col, i) => rbox(g, 0.12, 0.03, 0.06, 0.01, glow(col), 0.05, 1.03, 0.4 + i * 0.08));
  // ranura de ticket / tarjeta
  rbox(g, 0.24, 0.04, 0.03, 0.01, glow('#7dff6a'), 0.27, 1.06, 0.6);
  // dispensador de billetes
  rbox(g, 0.56, 0.1, 0.06, 0.03, toon(C.ink), 0, 0.72, 0.38);
  rbox(g, 0.6, 0.02, 0.05, 0.01, glow('#7dff6a'), 0, 0.79, 0.385);
  g.userData.screen = screen;
  g.userData.hit = hitbox(g, 1.15, 2.1, 0.9, 0, 1.05, 0);
  return g;
}

export function makeCashStation() {
  const g = new THREE.Group();
  let mode = 'idle', modeT = 0, blink = 0;
  const screenTex = canvasTex(320, 220, (ctx, w, h) => {
    const grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#2c6ee8'); grd.addColorStop(1, '#173a9a');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
    if (mode === 'idle') {
      txt(ctx, 'BIENVENIDO', w / 2, 52, { size: 40, fill: C.yellow, lw: 7 });
      txt(ctx, 'Insertá tu ticket', w / 2, 112, { font: 'Fredoka', weight: '600', size: 28, fill: '#fff', lw: 0 });
      if (blink % 2 === 0) txt(ctx, '▼', w / 2, 168, { size: 44, fill: '#7dff6a', lw: 6 });
    } else {
      txt(ctx, '¡COBRADO!', w / 2, 60, { size: 46, fill: '#7dff6a', lw: 7 });
      rr(ctx, 40, 110, w - 80, 70, 12); ctx.fillStyle = '#0e2a14'; ctx.fill();
      txt(ctx, '$ 25.000', w / 2, 146, { font: 'VT323', size: 58, fill: '#7dff6a', lw: 0 });
    }
  });
  // panel trasero
  rbox(g, 2.4, 3.0, 0.4, 0.12, toon('#2a2f8a'), 0, 1.5, -0.55, 3);
  rbox(g, 2.5, 0.16, 0.46, 0.06, toon(C.gold), 0, 3.02, -0.55);
  rbox(g, 2.5, 0.16, 0.46, 0.06, toon(C.gold), 0, 0.08, -0.55);
  const headTex = canvasTex(640, 200, (ctx, w, h) => {
    ctx.fillStyle = C.green; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 19; i++) {
      ctx.beginPath(); ctx.arc(18 + i * 33.6, 16, 7, 0, Math.PI * 2); ctx.fillStyle = i % 2 ? '#fff6b0' : C.yellow; ctx.fill();
      ctx.beginPath(); ctx.arc(18 + i * 33.6, h - 16, 7, 0, Math.PI * 2); ctx.fill();
    }
    txt(ctx, 'CAJERO', w / 2, h / 2 + 5, { size: 110, fill: '#fff', lw: 14 });
  });
  plane(g, 2.2, 0.69, glow('#ffffff', { map: headTex }), 0, 2.55, -0.34).castShadow = false;
  const k1 = makeKiosk(screenTex); g.add(k1);
  // billetes animados
  const billTex = canvasTex(128, 64, (ctx, w, h) => {
    ctx.fillStyle = '#6fd36a'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#2d7a2a'; ctx.lineWidth = 6; ctx.strokeRect(5, 5, w - 10, h - 10);
    txt(ctx, '$', w / 2, h / 2 + 3, { size: 44, fill: '#2d7a2a', lw: 0 });
  });
  const billMat = glow('#ffffff', { map: billTex, side: THREE.DoubleSide });
  const bills = [];
  g.userData.pay = () => {
    if (mode === 'paid') return;
    mode = 'paid'; modeT = 0;
    redraw(screenTex);
    for (let i = 0; i < 7; i++) {
      for (const k of [k1]) {
        const b = plane(g, 0.32, 0.16, billMat, k.position.x + rand(-0.15, 0.15), 0.72, 0.45);
        b.castShadow = false;
        b.rotation.x = -Math.PI / 2;
        bills.push({ b, t: -i * 0.12, vx: rand(-0.6, 0.6), vy: rand(1.6, 2.6), vz: rand(0.6, 1.4), spin: rand(-6, 6) });
      }
    }
  };
  let acc = 0;
  g.userData.update = (t, dt) => {
    acc += dt;
    if (acc > 0.5) { acc = 0; blink++; if (mode === 'idle') redraw(screenTex); }
    if (mode === 'paid') { modeT += dt; if (modeT > 3.5) { mode = 'idle'; redraw(screenTex); } }
    for (let i = bills.length - 1; i >= 0; i--) {
      const s = bills[i];
      s.t += dt;
      if (s.t < 0) continue;
      s.vy -= 4.5 * dt;
      s.b.position.x += s.vx * dt;
      s.b.position.y = Math.max(0.03, s.b.position.y + s.vy * dt);
      s.b.position.z += s.vz * dt;
      if (s.b.position.y > 0.031) { s.b.rotation.z += s.spin * dt; s.b.rotation.x += s.spin * 0.5 * dt; }
      else { s.vx *= 0.9; s.vz *= 0.9; s.b.rotation.x = -Math.PI / 2; }
      if (s.t > 3.2) { s.b.removeFromParent(); bills.splice(i, 1); }
    }
  };
  g.userData.hits = [k1.userData.hit];
  return g;
}
