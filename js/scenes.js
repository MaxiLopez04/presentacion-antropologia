// Escenas de las paradas nuevas: recepción del hall, mapa de seguridad
// y la tragamonedas descompuesta con el técnico.
import * as THREE from 'three';
import { C, X, Z, toon, glow, rbox, box, cyl, sph, tor, plane, cone, add, canvasTex, txt, rr, dynamic, limb } from './util.js';
import { makeStanding, makeBackpack, makeIdCard } from './characters.js';
import { BUILDING, HALL, SLOTS, MEGA_SLOTS, ROULETTE, MAP_RECTS, DOME_CAMS, ATM_CAMS } from './layout.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ZB = Z(528) - 0.15; // cara interna de la pared sur

// =============================================================
//  Hall: recepcionista de traje, guardarropa y gente dejando
//  la mochila / mostrando el DNI (en la pared izquierda al entrar)
// =============================================================
export function buildReception(root, R) {
  // Mostrador contra la pared izquierda (norte) del hall ampliado, mirando
  // hacia el centro (sur). Todo lo de la recepción va en un grupo: +z local
  // es hacia el centro del hall y x local corre a lo largo de la pared.
  const rc = new THREE.Group();
  rc.position.set((X(HALL.x1) + X(45)) / 2 - 0.2, 0, Z(HALL.y1) + 1.25);
  root.add(rc);
  const desk = new THREE.Group();
  rc.add(desk);
  rbox(desk, 2.2, 1.0, 0.6, 0.06, toon('#4a2c20'), 0, 0.5, 0);
  rbox(desk, 2.35, 0.07, 0.72, 0.03, toon('#efe3c8'), 0, 1.04, 0);
  rbox(desk, 2.25, 0.06, 0.62, 0.02, toon(C.gold), 0, 0.06, 0);
  const signTex = canvasTex(640, 200, (ctx, w, h) => {
    ctx.fillStyle = '#1b1f3b'; rr(ctx, 0, 0, w, h, 24); ctx.fill();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 8; rr(ctx, 8, 8, w - 16, h - 16, 18); ctx.stroke();
    txt(ctx, 'RECEPCIÓN', w / 2, 74, { size: 76, fill: C.yellow, lw: 0 });
    txt(ctx, 'Dejá tu mochila · Mostrá tu DNI', w / 2, 148, { font: 'Fredoka', weight: '600', size: 33, fill: '#ffffff', lw: 0 });
  });
  plane(desk, 1.8, 0.56, glow('#e8e0d0', { map: signTex }), 0, 0.58, 0.305).castShadow = false;
  // el mismo cartel, grande, en la pared de atrás de la recepcionista
  const wz = -1.25 + 0.15; // cara interna de la pared norte (en coords del grupo)
  rbox(rc, 2.75, 0.95, 0.06, 0.04, toon(C.gold), 0, 2.75, wz + 0.03);
  plane(rc, 2.6, 0.81, glow('#e8e0d0', { map: signTex }), 0, 2.75, wz + 0.065).castShadow = false;
  rbox(desk, 0.34, 0.04, 0.24, 0.01, toon('#2a2c38'), 0.65, 1.1, 0.12);
  for (let i = 0; i < 3; i++) {
    const card = makeIdCard();
    card.position.set(0.58 + i * 0.06, 1.13 + i * 0.004, 0.12);
    card.rotation.x = -Math.PI / 2;
    card.rotation.z = 0.3 - i * 0.25;
    desk.add(card);
  }
  cyl(desk, 0.06, 0.07, 0.04, toon(C.gold), -0.8, 1.1, 0.15, 14);
  sph(desk, 0.05, toon(C.gold), -0.8, 1.14, 0.15, 12, 8);
  rbox(desk, 0.5, 0.34, 0.04, 0.02, toon(C.ink), -0.3, 1.33, -0.15);
  const scr = plane(desk, 0.44, 0.28, glow('#6fb8ff'), -0.3, 1.33, -0.172);
  scr.rotation.y = Math.PI;
  cyl(desk, 0.03, 0.03, 0.14, toon(C.ink), -0.3, 1.13, -0.15, 8);

  // guardarropa con mochilas (contra la cabina de seguridad)
  const sx = -25.7, sz = Z(209) + 0.25;
  rbox(root, 2.7, 2.1, 0.42, 0.04, toon('#3a2218'), sx, 1.05, sz);
  const cols = 4, rows = 3, cw = 2.5 / cols, ch = 1.9 / rows;
  for (let i = 1; i < cols; i++) box(root, 0.05, 1.9, 0.44, toon('#5b3b2c'), sx - 1.25 + i * cw, 1.05, sz + 0.01);
  for (let j = 1; j < rows; j++) box(root, 2.5, 0.05, 0.44, toon('#5b3b2c'), sx, 0.1 + j * ch, sz + 0.01);
  const bagCols = ['#e8342f', '#3b7be8', '#3fae49', '#ff8a1f', '#7b3fc4', '#2fb8c4', '#ff5fa2', '#f2c46d'];
  let k = 0;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    if ((i + j * 3) % 4 === 3) continue; // algunos casilleros vacíos
    const b = makeBackpack(bagCols[k++ % bagCols.length]);
    b.scale.setScalar(0.85);
    b.position.set(sx - 1.25 + cw * (i + 0.5), 0.1 + ch * j + 0.24, sz + 0.12);
    root.add(b);
  }
  const lbl = canvasTex(400, 90, (ctx, w, h) => {
    ctx.fillStyle = C.yellow; rr(ctx, 0, 0, w, h, 16); ctx.fill();
    txt(ctx, 'GUARDARROPA', w / 2, h / 2 + 3, { size: 50, fill: C.ink, lw: 0 });
  });
  plane(root, 1.3, 0.3, glow('#e8e0d0', { map: lbl }), sx, 2.35, sz + 0.22).castShadow = false;

  const add2 = (o) => { rc.add(o); R.updaters.push(o.userData.update); return o; };

  // recepcionista de traje (detrás del mostrador, mirando a la sala)
  const rec = makeStanding({
    type: 'youngW', body: '#1c1c26', pants: '#1c1c26', hair: '#2a1a12',
    handPos: [V(-0.24, 0.36, 0.28), V(0.16, 0.5, 0.34)],
  });
  rec.position.set(-0.1, 0, -0.6);
  add2(rec);
  const up = rec.userData.upper;
  const v = cone(up, 0.08, 0.22, toon('#ffffff'), 0, 0.6, 0.2, 3);
  v.rotation.x = Math.PI; v.scale.z = 0.3;
  for (const s of [-1, 1]) { const b = cone(up, 0.045, 0.08, toon(C.red), s * 0.045, 0.7, 0.22, 8); b.rotation.z = s * Math.PI / 2; }
  rbox(up, 0.1, 0.035, 0.012, 0.005, toon(C.gold), 0.11, 0.5, 0.215);
  const recCard = makeIdCard();
  recCard.position.set(0.14, 0.56, 0.4);
  recCard.rotation.x = -0.5;
  up.add(recCard); // revisa un DNI

  // visitante dejando la mochila sobre el mostrador
  const v1 = makeStanding({ type: 'youngM', body: '#3b7be8', handPos: [V(-0.17, 0.44, 0.34), V(0.17, 0.44, 0.34)] });
  v1.position.set(0.45, 0, 0.85);
  v1.rotation.y = Math.PI;
  add2(v1);
  const bag = makeBackpack('#ff8a1f');
  bag.position.set(0, 0.5, 0.44);
  v1.userData.upper.add(bag);

  // señora mostrando el DNI
  const v2 = makeStanding({ type: 'grandma', handPos: [null, V(0.18, 0.66, 0.3)] });
  v2.position.set(-0.75, 0, 0.95);
  v2.rotation.y = Math.PI - 0.3;
  add2(v2);
  const card2 = makeIdCard();
  card2.position.set(0.18, 0.74, 0.33);
  card2.scale.setScalar(1.3);
  v2.userData.upper.add(card2);

  // chica esperando con la mochila puesta y el DNI en la mano
  const v3 = makeStanding({ type: 'youngW', body: '#3fae49', handPos: [null, V(0.3, 0.42, 0.18)] });
  v3.position.set(1.05, 0, 1.75);
  v3.rotation.y = Math.PI + 0.6;
  add2(v3);
  const bag3 = makeBackpack('#7b3fc4');
  bag3.position.set(0, 0.38, -0.3);
  v3.userData.upper.add(bag3);
  const card3 = makeIdCard();
  card3.position.set(0.3, 0.48, 0.22);
  card3.rotation.x = -0.4;
  v3.userData.upper.add(card3);
}

// =============================================================
//  Mapa de seguridad (al lado del cajero, a su izquierda)
// =============================================================
const EXTS = [[152, 143], [338, 143], [712, 138], [1132, 205], [1132, 428], [132, 510], [368, 510]];

function drawPlan(ctx, w, h) {
  const ox = 30, oy = 112, s = 1.0;
  const tx = (x) => ox + (x - BUILDING.x1) * s, ty = (y) => oy + (y - BUILDING.y1) * s;
  // papel cuadriculado
  ctx.fillStyle = '#fbf6e6'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#ece3c8'; ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  // título
  ctx.fillStyle = '#e8342f'; rr(ctx, 30, 18, 520, 64, 12); ctx.fill();
  txt(ctx, 'PLANO DE SEGURIDAD', 290, 52, { size: 46, fill: '#fff', lw: 0 });
  ctx.fillStyle = '#1b1f3b'; ctx.font = '600 22px Fredoka, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Planta baja · Sala de juegos', 570, 58);
  // sala
  ctx.fillStyle = '#ffffff'; ctx.fillRect(tx(45), ty(120), 1100 * s, 408 * s);
  const rect = (r, fill, label) => {
    const [x1, y1, x2, y2] = r;
    ctx.fillStyle = fill; ctx.fillRect(tx(x1), ty(y1), (x2 - x1) * s, (y2 - y1) * s);
    ctx.strokeStyle = '#1b1f3b'; ctx.lineWidth = 2; ctx.strokeRect(tx(x1), ty(y1), (x2 - x1) * s, (y2 - y1) * s);
    if (label) { ctx.fillStyle = '#1b1f3b'; ctx.font = '600 15px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, tx((x1 + x2) / 2), ty((y1 + y2) / 2) + 5); }
  };
  rect(MAP_RECTS.guard, '#dfe6ff', 'Seguridad');
  rect(MAP_RECTS.staff, '#ffe2c4', 'Personal');
  rect(MAP_RECTS.escalatorTop, '#e6e9f2', '→ Escalera mecánica →');
  rect(MAP_RECTS.escalatorBottom, '#e6e9f2', '← Escalera mecánica ←');
  rect(MAP_RECTS.stairs, '#f6e3e1', 'Escalera →');
  rect(MAP_RECTS.atm, '#d9f5d9', 'Cajero');
  rect(MAP_RECTS.elevator, '#eeeeee', 'Ascensor');
  rect(MAP_RECTS.caja, '#f1e3d3', 'Caja');
  rect(MAP_RECTS.vending, '#cfeef6', '');
  // escalones de la escalera
  ctx.strokeStyle = '#1b1f3b'; ctx.lineWidth = 1;
  for (let x = 395; x < 600; x += 12) { ctx.beginPath(); ctx.moveTo(tx(x), ty(452)); ctx.lineTo(tx(x), ty(518)); ctx.stroke(); }
  // ruleta
  ctx.beginPath(); ctx.arc(tx(ROULETTE.x), ty(ROULETTE.y), 47 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#ffe1de'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#1b1f3b'; ctx.stroke();
  ctx.fillStyle = '#1b1f3b'; ctx.font = '600 16px Fredoka, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Ruleta', tx(ROULETTE.x), ty(ROULETTE.y) + 5);
  // tragamonedas
  const slot = (x, y, col) => {
    ctx.fillStyle = col; ctx.fillRect(tx(x) - 8, ty(y) - 8, 16, 16);
    ctx.strokeStyle = '#1b1f3b'; ctx.lineWidth = 2; ctx.strokeRect(tx(x) - 8, ty(y) - 8, 16, 16);
    ctx.beginPath(); ctx.arc(tx(x), ty(y), 3.5, 0, Math.PI * 2); ctx.stroke();
  };
  SLOTS.forEach(([x, y]) => slot(x, y, '#ffffff'));
  MEGA_SLOTS.forEach(([x, y]) => slot(x, y, '#e7dcff'));
  // paredes
  ctx.lineWidth = 7; ctx.strokeStyle = '#1b1f3b';
  ctx.beginPath();
  ctx.moveTo(tx(45), ty(272)); ctx.lineTo(tx(45), ty(120)); ctx.lineTo(tx(1145), ty(120));
  ctx.lineTo(tx(1145), ty(528)); ctx.lineTo(tx(45), ty(528)); ctx.lineTo(tx(45), ty(376));
  ctx.stroke();
  // circulación (punteada)
  ctx.setLineDash([10, 8]); ctx.lineWidth = 3; ctx.strokeStyle = '#2c4fb5';
  ctx.beginPath(); ctx.moveTo(tx(50), ty(324)); ctx.lineTo(tx(170), ty(324)); ctx.lineTo(tx(200), ty(260)); ctx.lineTo(tx(700), ty(270)); ctx.lineTo(tx(760), ty(450)); ctx.lineTo(tx(880), ty(455)); ctx.stroke();
  ctx.setLineDash([]);
  // salida
  ctx.fillStyle = '#1f9a4a'; rr(ctx, tx(52), ty(296), 92, 56, 8); ctx.fill();
  txt(ctx, 'SALIDA', tx(98), ty(316), { size: 20, fill: '#fff', lw: 0 });
  txt(ctx, '◀ ▬', tx(98), ty(338), { size: 20, fill: '#fff', lw: 0 });
  // matafuegos
  for (const [x, y] of EXTS) {
    ctx.fillStyle = '#e8342f'; rr(ctx, tx(x) - 6, ty(y) - 10, 12, 20, 4); ctx.fill();
    ctx.strokeStyle = '#1b1f3b'; ctx.lineWidth = 2; ctx.stroke();
  }
  // cámaras
  const camIcon = (x, y, a) => {
    ctx.save(); ctx.translate(tx(x), ty(y)); ctx.rotate(a);
    ctx.fillStyle = 'rgba(44,79,181,.18)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 38, -0.5, 0.5); ctx.fill();
    ctx.fillStyle = '#2c4fb5'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
  DOME_CAMS.forEach(([x, y], i) => camIcon(x, y, i * 1.3));
  ATM_CAMS.forEach((x) => camIcon(x, 520, -Math.PI / 2));
  // usted está aquí
  const ux = tx(953), uy = ty(512);
  ctx.fillStyle = '#e8342f'; ctx.beginPath(); ctx.arc(ux, uy, 13, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = '#e8342f'; rr(ctx, ux - 96, uy - 62, 192, 34, 8); ctx.fill();
  txt(ctx, 'USTED ESTÁ AQUÍ', ux, uy - 44, { size: 20, fill: '#fff', lw: 0 });
  // norte
  ctx.fillStyle = '#1b1f3b'; ctx.beginPath(); ctx.moveTo(tx(1100), ty(62) - 10); ctx.lineTo(tx(1088), ty(62) + 22); ctx.lineTo(tx(1112), ty(62) + 22); ctx.fill();
  txt(ctx, 'N', tx(1100), ty(62) - 26, { size: 22, fill: '#1b1f3b', lw: 0 });
  // referencias
  const lx = 1162, ly = 112;
  ctx.fillStyle = '#ffffff'; rr(ctx, lx, ly, 216, 408, 12); ctx.fill();
  ctx.strokeStyle = '#1b1f3b'; ctx.lineWidth = 3; ctx.stroke();
  txt(ctx, 'REFERENCIAS', lx + 108, ly + 30, { size: 24, fill: '#1b1f3b', lw: 0 });
  const items = [
    ['slot', 'Tragamonedas'], ['ruleta', 'Ruleta'], ['ext', 'Matafuegos'], ['cam', 'Cámara'],
    ['exit', 'Salida'], ['you', 'Usted está aquí'], ['path', 'Circulación'],
  ];
  ctx.textAlign = 'left';
  items.forEach(([k2, label], i) => {
    const y = ly + 72 + i * 48, x = lx + 30;
    if (k2 === 'slot') { ctx.fillStyle = '#fff'; ctx.fillRect(x - 8, y - 8, 16, 16); ctx.strokeStyle = '#1b1f3b'; ctx.lineWidth = 2; ctx.strokeRect(x - 8, y - 8, 16, 16); }
    if (k2 === 'ruleta') { ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fillStyle = '#ffe1de'; ctx.fill(); ctx.stroke(); }
    if (k2 === 'ext') { ctx.fillStyle = '#e8342f'; rr(ctx, x - 6, y - 10, 12, 20, 4); ctx.fill(); }
    if (k2 === 'cam') { ctx.fillStyle = '#2c4fb5'; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); }
    if (k2 === 'exit') { ctx.fillStyle = '#1f9a4a'; rr(ctx, x - 12, y - 9, 24, 18, 4); ctx.fill(); }
    if (k2 === 'you') { ctx.fillStyle = '#e8342f'; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill(); }
    if (k2 === 'path') { ctx.setLineDash([6, 5]); ctx.strokeStyle = '#2c4fb5'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y); ctx.stroke(); ctx.setLineDash([]); }
    ctx.fillStyle = '#1b1f3b'; ctx.font = '600 20px Fredoka, sans-serif';
    ctx.fillText(label, x + 26, y + 7);
  });
}

export function buildSecurityMap(root) {
  const mx = 17.9, my = 2.25;
  const tex = canvasTex(1400, 560, drawPlan);
  rbox(root, 3.05, 1.35, 0.08, 0.03, toon(C.ink), mx, my, ZB - 0.04);
  rbox(root, 3.15, 1.45, 0.05, 0.03, toon(C.gold), mx, my, ZB - 0.02);
  const p = plane(root, 2.9, 1.16, glow('#ddd5c3', { map: tex }), mx, my, ZB - 0.09);
  p.rotation.y = Math.PI;
  p.castShadow = false;
  // luz de cuadro arriba del mapa
  rbox(root, 1.6, 0.08, 0.14, 0.03, toon('#2a2c38'), mx, my + 0.88, ZB - 0.18);
  box(root, 1.5, 0.02, 0.06, glow('#fff3c0'), mx, my + 0.84, ZB - 0.2).castShadow = false;
  cyl(root, 0.015, 0.015, 0.2, toon('#2a2c38'), mx - 0.6, my + 0.88, ZB - 0.1, 6).rotation.x = Math.PI / 2;
  cyl(root, 0.015, 0.015, 0.2, toon('#2a2c38'), mx + 0.6, my + 0.88, ZB - 0.1, 6).rotation.x = Math.PI / 2;
}

// =============================================================
//  Tragamonedas descompuesta + técnico con mameluco verde
// =============================================================
export function buildRepair(root, R, slot) {
  const s = slot.userData.slot;
  s.broken = true;
  const out = canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#14161f'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.15})`; ctx.fillRect(0, Math.random() * h, w, 2); }
    ctx.fillStyle = '#ffd23a'; rr(ctx, 20, 80, w - 40, 96, 12); ctx.fill();
    txt(ctx, 'FUERA DE', w / 2, 112, { size: 34, fill: '#1b1f3b', lw: 0 });
    txt(ctx, 'SERVICIO', w / 2, 148, { size: 34, fill: '#1b1f3b', lw: 0 });
    txt(ctx, '⚠', w / 2, 46, { size: 48, fill: '#ff5a3a', lw: 0 });
  });
  s.screen.material.map = out;
  s.screen.material.needsUpdate = true;
  s.tex = out;

  // puerta del gabinete abierta, con cables y placa adentro
  const cavity = plane(slot, 0.66, 0.46, toon('#0d0e14'), 0, 0.46, 0.378);
  cavity.castShadow = false;
  rbox(slot, 0.4, 0.22, 0.02, 0.01, toon('#1f7a3a'), -0.05, 0.5, 0.38);
  const wireCols = ['#e8342f', '#3b9bff', '#ffd23a'];
  wireCols.forEach((col, i) => {
    const pts = [V(-0.2 + i * 0.12, 0.62, 0.385), V(-0.15 + i * 0.14, 0.4, 0.44), V(-0.1 + i * 0.12, 0.25, 0.4)];
    add(slot, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.012, 6), toon(col)).castShadow = false;
  });
  const hinge = new THREE.Group();
  hinge.position.set(-0.39, 0.46, 0.39);
  hinge.rotation.y = -1.25;
  slot.add(hinge);
  rbox(hinge, 0.78, 0.55, 0.04, 0.03, toon('#3a3f58'), 0.39, 0, 0);
  rbox(hinge, 0.06, 0.06, 0.03, 0.01, toon(C.steel), 0.7, 0, 0.03);
  // chispas
  const sparks = [];
  for (let i = 0; i < 6; i++) {
    const m = glow('#ffe14a', { unique: true });
    const sp = sph(slot, 0.018, m, 0, 0, 0, 6, 4);
    sp.castShadow = false;
    dynamic(sp);
    sparks.push({ sp, ph: Math.random() * 10 });
  }
  R.updaters.push((t) => {
    for (const k of sparks) {
      const c = (t * 2.2 + k.ph) % 1;
      const on = Math.sin(t * 23 + k.ph * 5) > 0.2 && c < 0.6;
      k.sp.visible = on;
      k.sp.position.set(Math.sin(k.ph * 3) * 0.12, 0.58 + c * 0.25, 0.42 + c * 0.25);
    }
  });

  // la banqueta quedaba entre el técnico y el gabinete (parecía pegada a su
  // cintura): con la máquina fuera de servicio, la sacamos
  // (se quita de la escena: bakeStatic fusiona la geometría aunque esté oculta)
  slot.userData.stool?.removeFromParent();

  // posición del frente de la máquina en el mundo
  slot.updateMatrixWorld(true);
  const W = (x, y, z) => slot.localToWorld(V(x, y, z));

  // técnico con mameluco verde oscuro, gorra y llave inglesa
  const green = '#2e4a2c';
  const tech = makeStanding({
    type: 'staff', hat: green, body: green, pants: green,
    handPos: [V(-0.22, 0.12, 0.42), V(0.24, 0.32, 0.36)],
  });
  const tp = W(-0.85, 0, 0.95);
  tech.position.set(tp.x, 0, tp.z);
  // que mire hacia el gabinete abierto
  const look = W(0, 0, 0.4);
  tech.rotation.y = Math.atan2(look.x - tp.x, look.z - tp.z);
  root.add(tech);
  R.updaters.push(tech.userData.update);
  const up = tech.userData.upper;
  rbox(up, 0.16, 0.08, 0.012, 0.01, toon('#ffffff'), -0.1, 0.55, 0.225); // parche con nombre
  // cinturón: anillo que sigue la forma redondeada del torso (no una placa cuadrada)
  const belt = cyl(up, 0.256, 0.238, 0.06, toon('#1d1e26'), 0, 0.12, 0, 24);
  belt.scale.z = 0.86;
  rbox(up, 0.07, 0.05, 0.02, 0.008, toon(C.gold), 0, 0.12, 0.212); // hebilla
  rbox(up, 0.12, 0.14, 0.05, 0.02, toon('#3a5a36'), 0.12, 0.3, 0.24); // bolsillo
  // llave inglesa en la mano derecha (que se mueve como ajustando)
  const wrench = new THREE.Group();
  wrench.position.set(0.24, 0.32, 0.36);
  up.add(wrench);
  rbox(wrench, 0.03, 0.03, 0.26, 0.01, toon(C.steel), 0, 0, 0.12);
  tor(wrench, 0.04, 0.014, toon(C.steel), 0, 0, 0.27, Math.PI * 1.5, 10).rotation.x = Math.PI / 2;
  dynamic(wrench);
  R.updaters.push((t) => { wrench.rotation.z = Math.sin(t * 4) * 0.5; });

  // caja de herramientas abierta y cono de precaución
  const tb = W(0.7, 0, 1.05);
  const box2 = new THREE.Group();
  box2.position.set(tb.x, 0, tb.z);
  box2.rotation.y = slot.rotation.y + 0.4;
  root.add(box2);
  rbox(box2, 0.5, 0.24, 0.26, 0.03, toon(C.red), 0, 0.12, 0);
  const lid = rbox(box2, 0.5, 0.03, 0.26, 0.015, toon(C.redDark), 0, 0.34, -0.12);
  lid.rotation.x = -1.2;
  rbox(box2, 0.04, 0.03, 0.2, 0.01, toon(C.steel), -0.1, 0.26, 0);
  cyl(box2, 0.015, 0.015, 0.22, toon('#ffd23a'), 0.08, 0.27, 0, 6).rotation.x = Math.PI / 2;
  const cp = W(-0.2, 0, 1.5);
  cone(root, 0.16, 0.5, toon(C.orange), cp.x, 0.27, cp.z, 16);
  cyl(root, 0.135, 0.155, 0.07, toon('#ffffff'), cp.x, 0.24, cp.z, 16);
  rbox(root, 0.38, 0.03, 0.38, 0.01, toon(C.orange), cp.x, 0.015, cp.z);
}
