// Fachada del casino (según la foto de la entrada) + puertas de vidrio
import * as THREE from 'three';
import { C, X, Z, toon, glow, rbox, box, cyl, sph, tor, plane, cone, add, canvasTex, redraw, txt, rr, dynamic } from './util.js';
import { META } from './slides.js';

const H = 5.5;
const XL = X(45), ZT = Z(120), ZB = Z(528);
export const FX = XL - 2.2;          // plano de la fachada (2,2 m delante de la pared)
export const DOOR_HALF = 2.6;        // puerta central: z -2.6 .. 2.6
const BAY = [3.7, 7.4];              // arcos laterales (con escaleras que suben)
const TOP = 8.6;                     // altura de la baranda superior
const Z0 = ZT - 0.3, Z1 = ZB + 0.3;  // ancho total de la fachada

const SAND = '#dcc28e', SAND_D = '#c7a873', SAND_L = '#eadbb0', PLINTH = '#b6976a';

export function buildFacade(root, R) {
  // de noche la fachada está bañada por reflectores cálidos (toque de emisivo)
  const lit = { emissive: '#ff9a4a', ei: 0.11 };
  const sand = toon(SAND, lit), sandD = toon(SAND_D, lit), sandL = toon(SAND_L, lit);
  const depth = XL - FX;

  // ---------- bloques macizos entre la fachada y la pared ----------
  const solids = [[Z0, -BAY[1]], [-BAY[0], -DOOR_HALF], [DOOR_HALF, BAY[0]], [BAY[1], Z1]];
  for (const [a, b] of solids) box(root, depth, H + 0.3, b - a, sand, FX + depth / 2, (H + 0.3) / 2, (a + b) / 2);
  // losa sobre pórtico y arcos
  box(root, depth, 0.4, Z1 - Z0, sandD, FX + depth / 2, H + 0.1, 0);
  // piso del pórtico
  rbox(root, depth + 0.4, 0.06, 2 * BAY[1], 0.02, toon('#9b8f87'), FX + depth / 2, 0.03, 0);

  // ---------- frente: muro con aberturas ----------
  const t = 0.45, fx = FX - t / 2;
  const openings = [[-BAY[1], -BAY[0], 4.6], [-DOOR_HALF, DOOR_HALF, 4.2], [BAY[0], BAY[1], 4.6]];
  // tramos verticales entre aberturas (pilastras gruesas)
  for (const [a, b] of solids) box(root, t, TOP - 1.2, b - a, sand, fx, (TOP - 1.2) / 2, (a + b) / 2);
  // dinteles
  for (const [a, b, h] of openings) box(root, t, TOP - 1.2 - h, b - a, sand, fx, (h + TOP - 1.2) / 2, (a + b) / 2);
  // zócalo
  for (const [a, b] of solids) box(root, t + 0.12, 0.7, b - a, toon(PLINTH), fx, 0.35, (a + b) / 2);

  // pilastras con capitel
  const pil = [-9.4, -BAY[1] - 0.45, -BAY[0] + 0.55, DOOR_HALF * -1 - 0.0, DOOR_HALF, BAY[0] - 0.55, BAY[1] + 0.45, 9.4];
  const pilZ = [-9.6, -8.0, -3.15, 3.15, 8.0, 9.6];
  for (const z of pilZ) {
    rbox(root, 0.3, 5.2, 0.85, 0.05, sandL, fx - 0.3, 2.95, z);
    rbox(root, 0.42, 0.7, 1.0, 0.06, toon(PLINTH), fx - 0.32, 0.35, z);
    rbox(root, 0.45, 0.25, 1.05, 0.06, sandL, fx - 0.34, 5.6, z);
    // volutas del capitel
    for (const s of [-1, 1]) {
      const v = tor(root, 0.11, 0.045, sandD, fx - 0.5, 5.45, z + s * 0.36, Math.PI * 2, 14);
      v.rotation.y = Math.PI / 2;
    }
    // remate en forma de cartela
    rbox(root, 0.25, 0.75, 0.55, 0.12, sandL, fx - 0.33, 6.25, z);
    sph(root, 0.12, sandD, fx - 0.45, 6.3, z, 12, 8);
  }
  void pil;

  // ---------- friso con guirnaldas ----------
  rbox(root, 0.3, 0.18, Z1 - Z0, 0.04, sandL, fx - 0.25, 5.85, 0);
  const garland = (z1, z2) => {
    const mid = (z1 + z2) / 2, w = (z2 - z1) / 2;
    const g = tor(root, w, 0.07, sandD, fx - 0.3, 6.55, mid, Math.PI, 20);
    g.rotation.set(0, Math.PI / 2, Math.PI);
    g.scale.set(1, 0.45, 1);
    for (const s of [-1, 1]) sph(root, 0.13, sandL, fx - 0.32, 6.55, mid + s * w, 12, 8);
    const ros = sph(root, 0.17, sandL, fx - 0.33, 6.5, mid, 14, 10);
    ros.scale.x = 0.5;
    tor(root, 0.17, 0.04, sandD, fx - 0.38, 6.5, mid, Math.PI * 2, 18).rotation.y = Math.PI / 2;
  };
  for (const [a, b] of [[-9.2, -8.4], [-7.6, -4.0], [-2.7, -0.9], [0.9, 2.7], [4.0, 7.6], [8.4, 9.2]]) garland(a, b);

  // cartel del friso (letras plateadas)
  const silverText = (s, size) => canvasTex(1024, 160, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.letterSpacing = '10px';
    ctx.font = `${size}px "Lilita One"`;
    // achicar la letra si el texto no entra
    const fit = Math.min(1, (w - 40) / ctx.measureText(s).width);
    ctx.font = `${Math.floor(size * fit)}px "Lilita One"`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(60,45,20,.45)';
    ctx.fillText(s, w / 2 + 5, h / 2 + 8);
    const g = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.8);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#c9cfd8'); g.addColorStop(0.55, '#8f98a6'); g.addColorStop(1, '#e6eaf0');
    ctx.fillStyle = g;
    ctx.lineWidth = 6; ctx.strokeStyle = '#5d6470';
    ctx.strokeText(s, w / 2, h / 2 + 4);
    ctx.fillText(s, w / 2, h / 2 + 4);
  });
  const topSign = plane(root, 9.5, 1.5, glow('#ffffff', { map: silverText(META.facadeTop || 'CASINOS', 120), opacity: 0.999 }), fx - 0.3, 6.15, 0);
  topSign.rotation.y = -Math.PI / 2;
  topSign.castShadow = false;

  // ---------- cornisa ----------
  rbox(root, 0.5, 0.18, Z1 - Z0 + 0.3, 0.05, sandD, fx - 0.25, TOP - 1.25, 0);
  rbox(root, 0.75, 0.22, Z1 - Z0 + 0.5, 0.06, sandL, fx - 0.33, TOP - 1.05, 0);
  for (let z = Z0 + 0.3; z < Z1; z += 0.55) rbox(root, 0.32, 0.14, 0.16, 0.03, sandD, fx - 0.55, TOP - 1.22, z);
  rbox(root, 0.95, 0.16, Z1 - Z0 + 0.7, 0.05, sand, fx - 0.4, TOP - 0.86, 0);

  // ---------- baranda (balaustrada) ----------
  const by = TOP - 0.78;
  const posts = [Z0 + 0.4, -8.0, -3.15, 3.15, 8.0, Z1 - 0.4];
  for (const z of posts) {
    rbox(root, 0.6, 1.25, 0.65, 0.06, sand, fx - 0.15, by + 0.62, z);
    rbox(root, 0.7, 0.14, 0.75, 0.04, sandL, fx - 0.15, by + 1.3, z);
  }
  const bal = sandL;
  for (let i = 0; i < posts.length - 1; i++) {
    const a = posts[i] + 0.45, b = posts[i + 1] - 0.45;
    const n = Math.max(2, Math.round((b - a) / 0.32));
    for (let k = 0; k <= n; k++) {
      const z = a + ((b - a) * k) / n;
      cyl(root, 0.055, 0.07, 0.8, bal, fx - 0.15, by + 0.45, z, 8);
      sph(root, 0.1, bal, fx - 0.15, by + 0.38, z, 10, 8);
    }
    rbox(root, 0.38, 0.12, b - a + 0.3, 0.04, sandL, fx - 0.15, by + 0.9, (a + b) / 2);
    rbox(root, 0.38, 0.1, b - a + 0.3, 0.03, sandD, fx - 0.15, by + 0.05, (a + b) / 2);
  }
  // edificio de atrás (vidriado)
  box(root, 6, 2.6, Z1 - Z0 - 4, toon('#e9e2d2'), FX + 5, TOP + 0.6, 0);
  for (let z = -7; z <= 7; z += 2.0) {
    plane(root, 1.5, 1.4, toon('#ffd890', { emissive: '#ffbf5a', ei: 0.9 }), FX + 1.99, TOP + 0.7, z).rotation.y = -Math.PI / 2;
  }

  // ---------- marquesina de vidrio + letras CASINO ----------
  const canopy = new THREE.Group();
  canopy.position.set(fx - 0.25, 4.35, 0);
  root.add(canopy);
  const metal = toon('#4a4f5c');
  const glass = rbox(canopy, 1.9, 0.05, 6.8, 0.02, toon('#cfe9f5', { opacity: 0.45 }), -0.95, 0, 0);
  glass.castShadow = false;
  box(canopy, 1.95, 0.12, 0.08, metal, -0.97, -0.06, -3.4);
  box(canopy, 1.95, 0.12, 0.08, metal, -0.97, -0.06, 3.4);
  box(canopy, 0.08, 0.16, 6.9, metal, -1.9, -0.06, 0);
  for (const z of [-3.4, -1.15, 1.15, 3.4]) {
    box(canopy, 1.9, 0.08, 0.05, metal, -0.95, -0.05, z);
    const rod = cyl(canopy, 0.025, 0.025, 2.2, metal, -0.95, 0.75, z, 6);
    rod.rotation.z = -0.95;
  }
  const casinoTex = silverText(META.facadeMain || 'CASINO', 150);
  const cs = plane(root, 6.0, 0.95, glow('#ffffff', { map: casinoTex, opacity: 0.999 }), fx - 0.27, 4.95, 0);
  cs.rotation.y = -Math.PI / 2;
  cs.castShadow = false;
  // pantallas sobre la puerta (como en la foto)
  for (const z of [-1.2, 1.2]) {
    rbox(root, 0.08, 0.5, 1.3, 0.03, toon(C.ink), XL - 0.25, 3.6, z);
    plane(root, 1.2, 0.42, glow('#5fd0ff'), XL - 0.3, 3.6, z).rotation.y = -Math.PI / 2;
  }
  // faroles de pared
  for (const z of [-9.6, 9.6, -3.15, 3.15]) {
    rbox(root, 0.2, 0.32, 0.18, 0.04, toon('#2b2e38'), fx - 0.52, 4.2, z);
    sph(root, 0.1, glow('#fff3c0'), fx - 0.6, 4.08, z, 10, 8).castShadow = false;
  }

  // ---------- escaleras que suben en los arcos laterales ----------
  for (const dir of [-1, 1]) {
    const zStart = dir * (BAY[0] + 0.1);
    const n = 11, run = 0.32, rise = 0.33;
    for (let i = 0; i < n; i++) {
      const top = rise * (i + 1);
      const zc = zStart + dir * (run * i + run / 2);
      box(root, depth - 0.2, top, run, toon('#a59c94'), FX + depth / 2 + 0.05, top / 2, zc);
      box(root, depth - 0.2, 0.04, 0.06, toon(C.yellow), FX + depth / 2 + 0.05, top + 0.02, zc - dir * (run / 2 - 0.03));
    }
    // baranda negra siguiendo la pendiente
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push(new THREE.Vector3(FX + 0.45, rise * i + 1.0, zStart + dir * run * i));
    add(root, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.035, 6), toon('#1c1d24'));
    for (let i = 0; i <= n; i += 2) cyl(root, 0.02, 0.02, 1.0, toon('#1c1d24'), FX + 0.45, rise * i + 0.5, zStart + dir * run * i, 6);
    // interior del arco
    box(root, 0.1, H, BAY[1] - BAY[0] - 0.02, toon('#bfa577'), XL - 0.3, H / 2, dir * (BAY[0] + BAY[1]) / 2);
  }

  // ---------- puertas de vidrio (pared y línea interior) ----------
  const panels = [];
  const lineX = [XL, X(118)];
  for (const x of lineX) {
    const p1 = doorPanel(DOOR_HALF, 3.0);
    p1.position.set(x, 0, -DOOR_HALF);
    p1.userData.base = 0; p1.userData.dir = 1;
    const p2 = doorPanel(DOOR_HALF, 3.0);
    p2.position.set(x, 0, DOOR_HALF);
    p2.rotation.y = Math.PI;
    p2.userData.base = Math.PI; p2.userData.dir = -1;
    root.add(p1, p2);
    panels.push(p1, p2);
  }
  R.doors.panels = panels;
  // línea interior: vidrios fijos a los costados + viga
  const frame = toon('#4aa3d8');
  const ix = X(118), dz1 = Z(210), dz2 = Z(440);
  for (const [a, b] of [[dz1, -DOOR_HALF], [DOOR_HALF, dz2]]) {
    const g = box(root, 0.05, 3.0, b - a, toon('#c9f0ff', { opacity: 0.28 }), ix, 1.5, (a + b) / 2);
    g.castShadow = false;
    box(root, 0.12, 3.0, 0.12, frame, ix, 1.5, a);
    box(root, 0.12, 3.0, 0.12, frame, ix, 1.5, b);
    box(root, 0.12, 0.14, b - a, frame, ix, 0.07, (a + b) / 2);
  }
  box(root, 0.2, 0.25, dz2 - dz1, frame, ix, 3.12, (dz1 + dz2) / 2);
  // alfombra del hall
  rbox(root, X(118) - XL + 1.2, 0.03, 2 * DOOR_HALF - 0.4, 0.01, toon(C.red), (XL + X(118)) / 2 + 0.4, 0.015, 0);

  // ---------- vereda, calle, palmeras, rejas ----------
  const tiles = canvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#c29a8a'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#b38a7a'; ctx.fillRect(0, 0, w / 2, h / 2); ctx.fillRect(w / 2, h / 2, w / 2, h / 2);
    ctx.strokeStyle = '#9a7466'; ctx.lineWidth = 4; ctx.strokeRect(0, 0, w, h);
  });
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping;
  tiles.repeat.set(5, 32);
  const side = plane(root, 8, 50, toon('#ffffff', { map: tiles }), FX - 4, 0.0, 0);
  side.rotation.x = -Math.PI / 2; side.castShadow = false;
  const road = plane(root, 30, 50, toon('#4a4757'), FX - 23, -0.02, 0);
  road.rotation.x = -Math.PI / 2; road.castShadow = false;
  rbox(root, 0.35, 0.16, 50, 0.05, toon('#e3dcd2'), FX - 8, 0.06, 0);
  for (let i = -5; i <= 5; i++) {
    const d = plane(root, 0.22, 2, glow('#8a8678'), FX - 15, -0.01, i * 4.5);
    d.rotation.x = -Math.PI / 2; d.castShadow = false;
  }
  for (const z of [-8.75, -3.15, 3.15, 9.0]) palm(root, FX - 2.6, z, z === 3.15 ? 1.08 : 1);
  for (const dir of [-1, 1]) fence(root, FX - 1.5, dir * BAY[0] - dir * 0.2, dir * BAY[1] + dir * 0.4);
  bench(root, FX - 4.2, -8.0);
  // cartel de calle
  const st = canvasTex(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#1f7a3a'; rr(ctx, 0, 0, w, h, 20); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; rr(ctx, 10, 10, w - 20, h - 20, 14); ctx.stroke();
    txt(ctx, 'Gral. Alvear', w / 2, h / 2 + 4, { font: 'Fredoka', weight: '700', size: 62, fill: '#fff', lw: 0 });
  });
  const post = new THREE.Group();
  post.position.set(FX - 7.4, 0, -11.5);
  root.add(post);
  cyl(post, 0.06, 0.07, 3.2, toon('#3a3f55'), 0, 1.6, 0, 10);
  rbox(post, 0.06, 0.5, 1.9, 0.04, toon('#1f7a3a'), 0, 3.0, 0.9);
  const p1 = plane(post, 1.8, 0.45, glow('#ffffff', { map: st }), -0.035, 3.0, 0.9);
  p1.rotation.y = -Math.PI / 2; p1.castShadow = false;
  nightOutside(root, fx);
}

// ---------- noche: cielo, luna, estrellas, faroles y reflectores ----------
function nightOutside(root, fx) {
  // cielo con degradé
  const skyTex = canvasTex(16, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#04061a'); g.addColorStop(0.42, '#141a4a'); g.addColorStop(0.5, '#3a2a62'); g.addColorStop(1, '#120e24');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
  const sky = add(root, new THREE.SphereGeometry(150, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, depthWrite: false, toneMapped: false }), 0, 0, 0);
  sky.castShadow = false; sky.receiveShadow = false;
  sky.userData.dynamic = true;
  // estrellas
  const n = 500, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, el = 0.12 + Math.random() * 1.3;
    pos.set([Math.cos(a) * Math.cos(el) * 140, Math.sin(el) * 140, Math.sin(a) * Math.cos(el) * 140], i * 3);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  root.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, toneMapped: false })));
  // luna
  const moon = sph(root, 4, glow('#fff6d8'), 60, 74, -30, 24, 16);
  moon.castShadow = false;
  // faroles de calle con charco de luz
  const poolTex = canvasTex(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,200,120,0.6)'); g.addColorStop(0.5, 'rgba(255,160,80,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
  const poolMat = new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const pole = toon('#2b2e38');
  for (const z of [-13, -6, 6, 13]) {
    const x = FX - 7.6;
    cyl(root, 0.07, 0.1, 4.6, pole, x, 2.3, z, 10);
    const arm = cyl(root, 0.04, 0.04, 0.9, pole, x + 0.4, 4.55, z, 8);
    arm.rotation.z = Math.PI / 2;
    rbox(root, 0.45, 0.14, 0.3, 0.06, pole, x + 0.8, 4.5, z);
    const bulb = rbox(root, 0.36, 0.06, 0.22, 0.03, glow('#fff0c0'), x + 0.8, 4.42, z);
    bulb.castShadow = false;
    const pool = add(root, new THREE.PlaneGeometry(6, 6), poolMat, x + 0.8, 0.03, z);
    pool.rotation.x = -Math.PI / 2; pool.castShadow = false; pool.renderOrder = 1;
    pool.userData.dynamic = true;
  }
  // reflectores en el piso que bañan la fachada (conos de luz falsos)
  const beamTex = canvasTex(64, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, h, 0, 0);
    g.addColorStop(0, 'rgba(255,190,110,0.4)'); g.addColorStop(1, 'rgba(255,160,80,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(w * 0.4, h); ctx.lineTo(w * 0.6, h); ctx.lineTo(w, 0); ctx.lineTo(0, 0); ctx.fill();
  });
  const beamMat = new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide });
  for (const z of [-9.6, -8.0, -3.15, 3.15, 8.0, 9.6]) {
    rbox(root, 0.3, 0.14, 0.3, 0.05, pole, fx - 0.7, 0.07, z);
    sph(root, 0.08, glow('#fff0c0'), fx - 0.62, 0.17, z, 8, 6).castShadow = false;
    const beam = add(root, new THREE.PlaneGeometry(1.6, 7.2), beamMat, fx - 0.66, 3.7, z);
    beam.rotation.y = -Math.PI / 2; beam.castShadow = false; beam.renderOrder = 2;
    beam.userData.dynamic = true;
  }
  // luz cálida real sobre la vereda y la fachada
  for (const z of [-6, 6]) {
    const l = new THREE.PointLight('#ffc88a', 20, 16, 1.6);
    l.position.set(FX - 3.5, 3.6, z);
    root.add(l);
  }
}

function doorPanel(width, height) {
  const g = new THREE.Group();
  const frame = toon('#2d3140');
  const glass = rbox(g, 0.04, height - 0.12, width - 0.12, 0.01, toon('#c9f0ff', { opacity: 0.28 }), 0, height / 2, width / 2);
  glass.castShadow = false;
  box(g, 0.1, height, 0.1, frame, 0, height / 2, 0.05);
  box(g, 0.1, height, 0.1, frame, 0, height / 2, width - 0.05);
  box(g, 0.1, 0.1, width, frame, 0, height - 0.05, width / 2);
  box(g, 0.1, 0.16, width, frame, 0, 0.08, width / 2);
  cyl(g, 0.025, 0.025, 1.0, toon('#c9cfd8'), 0.09, 1.1, width - 0.3, 8);
  cyl(g, 0.025, 0.025, 1.0, toon('#c9cfd8'), -0.09, 1.1, width - 0.3, 8);
  return dynamic(g);
}

// Palmera cartoon: tronco de anillos + hojas caídas
function palm(root, x, z, s = 1) {
  const trunk = toon('#8a6a4a'), ring = toon('#6f523a');
  const h = 9.5 * s, segs = 14;
  const lean = 0.35;
  let top = new THREE.Vector3();
  for (let i = 0; i < segs; i++) {
    const k = i / segs;
    const y = k * h + h / segs / 2;
    const px = x - lean * k * k, r = 0.22 - 0.08 * k;
    cyl(root, r * 0.92, r, h / segs + 0.02, trunk, px, y, z, 10);
    tor(root, r * 0.95, 0.03, ring, px, k * h, z, Math.PI * 2, 12).rotation.x = Math.PI / 2;
    top.set(px, h, z);
  }
  const leaf = toon('#3f9a3a'), leafD = toon('#2f7a2c');
  sph(root, 0.32, toon('#6f523a'), top.x, top.y, top.z, 12, 10);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    const g = new THREE.Group();
    g.position.copy(top);
    g.rotation.y = a;
    root.add(g);
    // hoja: varias esferas aplastadas en arco
    for (let k = 1; k <= 6; k++) {
      const d = k * 0.42;
      const yy = -0.06 * k * k + 0.25 * k;
      const lf = sph(g, 0.3 - k * 0.025, k % 2 ? leaf : leafD, d, yy * 0.5, 0, 10, 6);
      lf.scale.set(1.5, 0.18, 0.75);
      lf.rotation.z = -0.25 * k + 0.4;
    }
  }
}

function fence(root, x, z1, z2) {
  const iron = toon('#1c1d24');
  const len = Math.abs(z2 - z1), zc = (z1 + z2) / 2;
  const n = Math.round(len / 0.16);
  for (let i = 0; i <= n; i++) {
    const z = Math.min(z1, z2) + (i * len) / n;
    cyl(root, 0.015, 0.015, 1.7, iron, x, 0.85, z, 5);
    cone(root, 0.035, 0.1, iron, x, 1.75, z, 6);
  }
  for (const y of [0.15, 1.2, 1.55]) box(root, 0.04, 0.04, len, iron, x, y, zc);
  for (let z = Math.min(z1, z2) + 0.25; z < Math.max(z1, z2) - 0.1; z += 0.5) {
    const c = tor(root, 0.1, 0.012, iron, x, 1.38, z, Math.PI * 2, 12);
    c.rotation.y = Math.PI / 2;
  }
  // postes y retorno hacia la fachada
  for (const z of [z1, z2]) {
    rbox(root, 0.12, 2.0, 0.12, 0.02, iron, x, 1.0, z);
    sph(root, 0.08, iron, x, 2.05, z, 10, 8);
    box(root, FX - x, 0.04, 0.04, iron, (x + FX) / 2, 1.2, z);
    box(root, FX - x, 0.04, 0.04, iron, (x + FX) / 2, 0.15, z);
    for (let k = 1; k < 7; k++) cyl(root, 0.015, 0.015, 1.7, iron, x + ((FX - x) * k) / 7, 0.85, z, 5);
  }
}

function bench(root, x, z) {
  const stone = toon('#e8e2d6');
  rbox(root, 0.55, 0.12, 2.0, 0.04, stone, x, 0.48, z);
  rbox(root, 0.45, 0.45, 0.25, 0.04, stone, x, 0.22, z - 0.75);
  rbox(root, 0.45, 0.45, 0.25, 0.04, stone, x, 0.22, z + 0.75);
}
