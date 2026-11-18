// Construcción del casino a partir del croquis
import * as THREE from 'three';
import {
  C, X, Z, P, deg, toon, glow, rbox, box, cyl, sph, tor, cap, plane, cone, add, canvasTex, redraw, txt, rr,
  dynamic, bakeStatic, rand,
} from './util.js';
import { SLOTS, MEGA_SLOTS, ROULETTE, WORKER_PATH, HALL, NICHE } from './layout.js';
import { makeSlot, updateSlots, spinSlot, makeRoulette, makePozo, makeVending, makeCashStation } from './props.js';
import { makePatron, makeWorker, makeCrutchPlayer, makeHearts, makeStanding } from './characters.js';
import { buildFacade, DOOR_HALF, XH } from './facade.js';
import { buildCameras } from './security.js';
import { buildReception, buildSecurityMap, buildRepair, buildNotebookReader } from './scenes.js';
import { SLIDES } from './slides.js';

const H = 5.5;          // altura del cielorraso
const WALL_T = 0.3;
const XL = X(45), XR = X(1145), ZT = Z(120), ZB = Z(528);
const HZ1 = Z(HALL.y1), HZ2 = Z(HALL.y2); // lados norte y sur del hall
// Escalera (no mecánica): un solo tramo que sube desde el lado de la
// entrada (oeste) hacia adentro (este) hasta el primer piso.
const STAIR = (() => {
  const n = 24, run = 0.55, rise = H / 24;
  const start = X(388);
  return { n, run, rise, start, end: start + n * run, holeX: start + run * 14 - 0.2 };
})();

export function buildWorld(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const R = { root, updaters: [], clickables: [], slots: [], doors: { open: 0, target: 0 } };

  lights(scene);
  floorAndCeiling(root, R);
  walls(root);
  buildFacade(root, R);
  const staffDoor = staffRoom(root);
  escalators(root, R);
  stairs(root);
  decor(root, R);
  buildCameras(root, R);

  // ---- Máquina expendedora (al lado de la escalera mecánica) ----
  const vending = makeVending();
  vending.position.set(X(376), 0, Z(232));
  vending.rotation.y = -Math.PI / 2; // frente hacia el oeste
  root.add(vending);
  R.vending = vending;
  R.updaters.push(vending.userData.update);
  R.clickables.push({ obj: vending.userData.hit, tip: 'Comprar algo', action: () => vending.userData.buy() });

  // ---- Alfombras bajo los bancos nuevos (ex mesa de juego y ex barra) ----
  rbox(root, 7.0, 0.03, 4.4, 0.01, toon(C.gold), X(372), 0.015, Z(322));
  rbox(root, 6.8, 0.035, 4.2, 0.01, toon('#1f3384'), X(372), 0.018, Z(322));
  rbox(root, 4.6, 0.03, 7.6, 0.01, toon(C.gold), X(239), 0.015, Z(340));
  rbox(root, 4.4, 0.035, 7.4, 0.01, toon('#1f3384'), X(239), 0.018, Z(340));

  // ---- Pozo MEGA ----
  const pozo = makePozo();
  pozo.position.set(X(550), 0, Z(256));
  root.add(pozo);
  R.updaters.push(pozo.userData.update);
  rbox(root, 9.2, 0.03, 4.2, 0.01, toon(C.gold), X(549), 0.015, Z(318));
  rbox(root, 9.0, 0.035, 4.0, 0.01, toon('#4b1d9a'), X(549), 0.018, Z(318));
  for (const [px, py, yaw] of MEGA_SLOTS) {
    const s = makeSlot(0, { mega: true });
    s.position.copy(P(px, py));
    s.rotation.y = deg(yaw);
    root.add(s);
    R.slots.push(s);
  }

  // ---- Ruleta ----
  const roulette = makeRoulette();
  roulette.position.copy(P(ROULETTE.x, ROULETTE.y));
  root.add(roulette);
  R.roulette = roulette;
  R.updaters.push(roulette.userData.update);
  R.clickables.push({ obj: roulette.userData.hit, tip: '¡Girar la ruleta!', action: () => roulette.userData.spin() });

  // ---- Tragamonedas ----
  for (const [px, py, yaw, skin] of SLOTS) {
    const s = makeSlot(skin);
    s.position.copy(P(px, py));
    s.rotation.y = deg(yaw);
    root.add(s);
    R.slots.push(s);
  }
  R.slots.forEach((s) => R.clickables.push({ obj: s.userData.hit, tip: '¡Girar!', action: () => spinSlot(s) }));
  R.updaters.push((t, dt) => updateSlots(R.slots, t, dt));

  // ---- Caja, ascensor y cajero ----
  cashier(root, R);
  elevator(root, R);
  const cash = makeCashStation();
  cash.position.set(X(882), 0, Z(500) + 0.35);
  cash.rotation.y = Math.PI;
  root.add(cash);
  R.cash = cash;
  R.updaters.push(cash.userData.update);
  cash.userData.hits.forEach((k) => R.clickables.push({ obj: k, tip: 'Cobrar ticket', action: () => cash.userData.pay() }));

  // ---- Jugadores ----
  patrons(root, R, roulette);

  // ---- Escenas de las paradas nuevas ----
  buildReception(root, R);
  buildSecurityMap(root);
  buildRepair(root, R, R.slots[8 + 23]); // tragamonedas descompuesta (fila junto a la escalera)
  // joven con el cuaderno en la ruleta (última parada)
  R.notebook = buildNotebookReader(root, R, roulette.position, SLIDES.find((s) => s.type === 'notebook')?.notebook);

  // ---- Moza ----
  const worker = makeWorker();
  root.add(worker.root);
  worker.setPath(WORKER_PATH.map(([x, y]) => P(x, y)));
  R.worker = worker;
  R.staffDoor = staffDoor;
  R.updaters.push((t, dt) => worker.update(t, dt));
  R.clickables.push({
    obj: worker.root, tip: '¡Hola!', action: () => { worker.hop(); R.onWorkerClick?.(); },
  });

  // ---- Puertas: animación ----
  R.updaters.push((t, dt) => {
    const d = R.doors;
    d.open += (d.target - d.open) * (1 - Math.exp(-4 * dt));
    for (const p of d.panels) p.rotation.y = p.userData.base + p.userData.dir * d.open * p.userData.angle;
    staffDoor.rotation.y = staffDoor.userData.base + staffDoor.userData.open * deg(95);
    staffDoor.userData.open += ((staffDoor.userData.target || 0) - staffDoor.userData.open) * (1 - Math.exp(-5 * dt));
  });

  bakeStatic(root);
  return R;
}

// =============================================================
function lights(scene) {
  // Es de noche: afuera hay luna y faroles; adentro el techo tapa la luna
  // (proyecta sombra) y la sala queda iluminada sólo con luces artificiales.
  scene.add(new THREE.HemisphereLight('#8d86d8', '#3a1d4a', 0.78));
  // luz de luna (adentro no llega porque el techo la tapa)
  const sun = new THREE.DirectionalLight('#9fb4ff', 0.7);
  sun.position.set(-14, 34, 9);
  sun.target.position.set(-4, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const s = sun.shadow.camera;
  s.left = -38; s.right = 38; s.top = 22; s.bottom = -22; s.near = 5; s.far = 80;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);

  // [x, y, z, color, intensidad, alcance]
  const pts = [
    [X(850), 3.6, Z(307), '#ffae6b', 30, 14],   // ruleta
    [X(550), 3.4, Z(318), '#c77dff', 24, 12],   // Pozo MEGA
    [X(372), 3.3, Z(322), '#ffc98a', 18, 11],   // banco junto a la expendedora
    [X(239), 3.3, Z(340), '#ffc98a', 16, 10],   // banco de la ex barra
    [X(376) - 1.8, 2.8, Z(232), '#8fe8ff', 6, 6],  // expendedora
    [X(110), 3.2, 0, '#ffd8a0', 14, 9],         // hall de entrada
    [(XH + XL) / 2, 3.3, -1.2, '#ffe6c4', 9, 9],   // hall ampliado (recepción)
    [X(560), 3.2, Z(425), '#ffcf9a', 16, 11],   // moza / escalera
    [X(900), 3.3, Z(175), '#ff9fd0', 16, 12],   // fila superior derecha
    [X(1030), 3.2, Z(300), '#9fb0ff', 12, 10],  // grupo derecho
    [X(882), 3.4, Z(440), '#c8ffb0', 9, 8],     // cajero
  ];
  for (const [x, y, z, col, i, d] of pts) {
    const l = new THREE.PointLight(col, i, d, 1.6);
    l.position.set(x, y, z);
    scene.add(l);
  }
}

// =============================================================
function floorAndCeiling(root, R) {
  // alfombra roja con flores azules / violetas (como en el video)
  const carpet = canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#c83a2c'; ctx.fillRect(0, 0, w, h);
    // textura de fondo
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(255,140,90,.25)' : 'rgba(120,20,20,.25)';
      const x = (i * 97) % w, y = (i * 53 + (i % 7) * 31) % h;
      ctx.fillRect(x, y, 6, 3);
    }
    const burst = (x, y, r, c1, c2) => {
      ctx.save(); ctx.translate(x, y);
      for (let k = 0; k < 10; k++) {
        ctx.rotate(Math.PI / 5);
        ctx.beginPath(); ctx.ellipse(r * 0.55, 0, r * 0.45, r * 0.13, 0, 0, Math.PI * 2);
        ctx.fillStyle = k % 2 ? c1 : c2; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2); ctx.fillStyle = '#ffb347'; ctx.fill();
      ctx.restore();
    };
    const pts = [[64, 64], [320, 64], [192, 192], [448, 192], [64, 320], [320, 320], [192, 448], [448, 448]];
    pts.forEach(([x, y], i) => {
      for (const [dx, dy] of [[0, 0], [512, 0], [-512, 0], [0, 512], [0, -512]]) {
        burst(x + dx, y + dy, i % 2 ? 46 : 38, i % 3 ? '#3b4bb8' : '#6a3fb0', '#2c3a96');
      }
    });
    // ramitas
    ctx.strokeStyle = '#ff9a5a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const [x, y] of [[192, 64], [448, 64], [64, 192], [320, 192], [192, 320], [448, 320], [64, 448], [320, 448]]) {
      ctx.beginPath(); ctx.moveTo(x - 18, y + 10); ctx.quadraticCurveTo(x, y - 18, x + 18, y + 6); ctx.stroke();
    }
  });
  carpet.wrapS = carpet.wrapT = THREE.RepeatWrapping;
  carpet.repeat.set(1 / 4, 1 / 4);

  const fs = new THREE.Shape();
  fs.moveTo(XL, -ZB); fs.lineTo(XR, -ZB); fs.lineTo(XR, -ZT); fs.lineTo(XL, -ZT);
  fs.lineTo(XL, -HZ1); fs.lineTo(XH, -HZ1); fs.lineTo(XH, -HZ2); fs.lineTo(XL, -HZ2); fs.closePath(); // + hall ampliado
  const floor = add(root, new THREE.ShapeGeometry(fs), toon('#ffffff', { map: carpet }), 0, 0, 0);
  floor.rotation.x = -Math.PI / 2;
  floor.castShadow = false;

  // hall de entrada: piso de azulejos blancos (desde la puerta hasta la línea de vidrio)
  const TILE = 0.6;
  const tileTex = canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#f7f6f2'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(210,214,224,.35)');
    ctx.fillStyle = g; ctx.fillRect(6, 6, w - 12, h - 12);
    ctx.strokeStyle = '#c6c8d2'; ctx.lineWidth = 8; ctx.strokeRect(0, 0, w, h);
  });
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
  const hx1 = XH + WALL_T / 2, hx2 = X(118);
  tileTex.repeat.set((hx2 - hx1) / TILE, (HZ2 - HZ1) / TILE);
  const tilesFloor = plane(root, hx2 - hx1, HZ2 - HZ1, toon('#ffffff', { map: tileTex }), (hx1 + hx2) / 2, 0.012, (HZ1 + HZ2) / 2);
  tilesFloor.rotation.x = -Math.PI / 2;
  tilesFloor.castShadow = false;

  // cielorraso claro con spots
  const ceilTex = canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#e9e7f1'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d6d3e3'; ctx.lineWidth = 4; ctx.strokeRect(0, 0, w, h);
    ctx.beginPath(); ctx.arc(w / 2, h / 2, 14, 0, Math.PI * 2); ctx.fillStyle = '#fffbe6'; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = '#b9b6c8'; ctx.stroke();
  });
  ceilTex.wrapS = ceilTex.wrapT = THREE.RepeatWrapping;
  ceilTex.repeat.set(1 / 3, 1 / 3);
  const cs = new THREE.Shape();
  cs.moveTo(XL, ZT); cs.lineTo(XL, HZ1); cs.lineTo(XH, HZ1); cs.lineTo(XH, HZ2); cs.lineTo(XL, HZ2); // + hall ampliado
  cs.lineTo(XL, ZB); cs.lineTo(XR, ZB); cs.lineTo(XR, ZT); cs.closePath();
  // huecos: escalera mecánica y los dos extremos de la escalera
  const holes = [
    [-1.5, X(702), ZT + WALL_T / 2, Z(217) + 0.05],
    [STAIR.holeX, X(692), Z(450), ZB - WALL_T / 2],
  ];
  for (const [x1, x2, z1, z2] of holes) {
    const ch = new THREE.Path();
    ch.moveTo(x1, z1); ch.lineTo(x2, z1); ch.lineTo(x2, z2); ch.lineTo(x1, z2); ch.closePath();
    cs.holes.push(ch);
    const up = add(root, new THREE.BoxGeometry(x2 - x1, 3.5, z2 - z1), toon('#fff0cc', { side: THREE.BackSide, emissive: '#ffd890', ei: 0.4 }), (x1 + x2) / 2, H + 1.75, (z1 + z2) / 2);
    up.castShadow = false;
  }
  const spotTex = canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, 26);
    g.addColorStop(0, '#fff6d8'); g.addColorStop(0.55, '#ffe0a0'); g.addColorStop(1, '#000');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w / 2, h / 2, 26, 0, Math.PI * 2); ctx.fill();
  });
  spotTex.wrapS = spotTex.wrapT = THREE.RepeatWrapping;
  spotTex.repeat.set(1 / 3, 1 / 3);
  const ceilMat = toon('#c9c6dc', { map: ceilTex, unique: true });
  ceilMat.emissive = new THREE.Color('#ffffff');
  ceilMat.emissiveMap = spotTex;
  ceilMat.emissiveIntensity = 1.6;
  const ceil = add(root, new THREE.ShapeGeometry(cs), ceilMat, 0, H, 0);
  ceil.rotation.x = Math.PI / 2;
  ceil.castShadow = true; // tapa el sol: adentro sólo hay luz artificial

  // charcos de luz cálida en el piso, debajo de cada spot del techo
  const poolTex = canvasTex(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,190,110,0.55)'); g.addColorStop(0.5, 'rgba(255,150,80,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
  const poolMat = new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const poolGeo = new THREE.PlaneGeometry(2.6, 2.6);
  poolGeo.rotateX(-Math.PI / 2);
  const spots = [];
  for (let x = Math.ceil((XH - 1.5) / 3) * 3 + 1.5; x < XR - 0.5; x += 3) {
    for (let z = Math.ceil((ZT - 1.5) / 3) * 3 + 1.5; z < ZB - 0.5; z += 3) {
      // en el hall no: sobre los azulejos blancos encandilan
      if (x > X(118) + 0.5 && z > ZT + 0.5) spots.push([x, z]);
    }
  }
  const pools = new THREE.InstancedMesh(poolGeo, poolMat, spots.length);
  const dm = new THREE.Object3D();
  spots.forEach(([x, z], i) => { dm.position.set(x, 0.025, z); dm.updateMatrix(); pools.setMatrixAt(i, dm.matrix); });
  pools.frustumCulled = false;
  pools.renderOrder = 1;
  root.add(pools);

  // cielorraso suspendido con luz LED azul (cove)
  const soffit = toon('#f2f0f7');
  const led = glow('#38b8ff');
  const cove = (x1, x2, z1, z2) => {
    const w = 0.7, hh = 0.38, y = H - hh / 2;
    const parts = [
      [x2 - x1 + w * 2, z1 - w / 2, 'x'], [x2 - x1 + w * 2, z2 + w / 2, 'x'],
      [z2 - z1, x1 - w / 2, 'z'], [z2 - z1, x2 + w / 2, 'z'],
    ];
    for (const [len, pos, axis] of parts) {
      if (axis === 'x') {
        box(root, len, hh, w, soffit, (x1 + x2) / 2, y, pos).castShadow = false;
        box(root, len - w, 0.06, 0.08, led, (x1 + x2) / 2, H - hh - 0.02, pos + (pos < (z1 + z2) / 2 ? w / 2 : -w / 2)).castShadow = false;
      } else {
        box(root, w, hh, len, soffit, pos, y, (z1 + z2) / 2).castShadow = false;
        box(root, 0.08, 0.06, len + w, led, pos + (pos < (x1 + x2) / 2 ? w / 2 : -w / 2), H - hh - 0.02, (z1 + z2) / 2).castShadow = false;
      }
    }
  };
  cove(X(745), X(1000), Z(215), Z(400));   // sobre la ruleta
  cove(X(455), X(650), Z(280), Z(372));    // sobre el Pozo MEGA
  cove(X(200), X(445), Z(268), Z(410));    // sobre los bancos de tragamonedas de la izquierda
}


// =============================================================
function walls(root) {
  const wall = toon('#d7d5e6');
  const wains = toon('#5b3b2c');
  const trim = toon(C.gold);
  const seg = (x1, z1, x2, z2, y0 = 0, y1 = H) => {
    const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    const lx = Math.abs(x2 - x1) || WALL_T, lz = Math.abs(z2 - z1) || WALL_T;
    box(root, lx, y1 - y0, lz, wall, cx, (y0 + y1) / 2, cz);
    if (y0 === 0) {
      // (zócalo y moldura apenas más largos que la pared, para que sus
      // extremos no queden en el mismo plano que los de la pared y titilen)
      box(root, lx + (lx === WALL_T ? 0.08 : 0.01), 1.1, lz + (lz === WALL_T ? 0.08 : 0.01), wains, cx, 0.55, cz);
      box(root, lx + (lx === WALL_T ? 0.12 : 0.02), 0.08, lz + (lz === WALL_T ? 0.12 : 0.02), trim, cx, 1.12, cz);
    }
  };
  seg(XL - WALL_T / 2, ZT, XR + WALL_T / 2, ZT);
  seg(XL - WALL_T / 2, ZB, XR + WALL_T / 2, ZB);
  seg(XR, ZT, XR, ZB);
  seg(XL, HZ2, XL, ZB);
  // hall ampliado hacia la calle: paredes laterales y nueva pared de entrada
  // pared norte con la abertura del nicho de la recepción (scenes.js)
  seg(XH - WALL_T / 2, HZ1, X(NICHE.x1) - 0.2, HZ1);
  seg(X(NICHE.x1), HZ1, X(NICHE.counterEnd), HZ1, NICHE.height, H);
  seg(X(NICHE.counterEnd) + 0.1, HZ1, X(NICHE.x2) + WALL_T / 2, HZ1);
  // cara este del bloque (dentro del casino) con la puerta del personal
  const ex = X(NICHE.x2), dzc = HZ1 - NICHE.depth / 2;
  seg(ex, ZT, ex, dzc - 0.55);
  seg(ex, dzc + 0.55, ex, HZ1);
  seg(ex, dzc - 0.55, ex, dzc + 0.55, 2.3, H);
  seg(XH - WALL_T / 2, HZ2, XL, HZ2);
  seg(XH, HZ1, XH, -DOOR_HALF);
  seg(XH, DOOR_HALF, XH, HZ2);
  seg(XH, -DOOR_HALF, XH, DOOR_HALF, 3.0, H);

  // tiras de LED azul en las paredes
  const neon = (x1, z1, x2, z2) => {
    const lx = Math.abs(x2 - x1) || 0.06, lz = Math.abs(z2 - z1) || 0.06;
    const m = box(root, lx, 0.07, lz, glow('#38b8ff'), (x1 + x2) / 2, 4.55, (z1 + z2) / 2);
    m.castShadow = false;
  };
  neon(X(NICHE.x2) + 0.4, ZT + 0.2, X(350), ZT + 0.2);
  neon(X(710), ZT + 0.2, XR - 0.5, ZT + 0.2);
  neon(XL + 0.5, ZB - 0.2, X(380), ZB - 0.2);
  neon(X(700), ZB - 0.2, X(1040), ZB - 0.2);
  neon(XR - 0.2, Z(165), XR - 0.2, Z(445));
}


// =============================================================
function staffRoom(root) {
  const x1 = X(52), x2 = X(122), z1 = Z(437), z2 = Z(528) - 0.1;
  const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
  const w = x2 - x1, d = z2 - z1;
  const hh = 3.1;
  rbox(root, w, hh, d, 0.06, toon('#ff9f43'), cx, hh / 2, cz);
  rbox(root, w + 0.12, 0.15, d + 0.12, 0.05, toon(C.red), cx, hh + 0.05, cz);
  // marco de puerta en la cara este
  const dz = Z(454);
  rbox(root, 0.14, 2.4, 1.3, 0.04, toon(C.ink), x2 + 0.02, 1.2, dz);
  const door = new THREE.Group();
  door.position.set(x2 + 0.1, 0, dz - 0.55);
  root.add(door);
  rbox(door, 0.07, 2.2, 1.08, 0.03, toon('#c96d22'), 0, 1.1, 0.54);
  rbox(door, 0.08, 0.5, 0.6, 0.03, toon('#ffd23a'), 0.01, 1.7, 0.54);
  sph(door, 0.05, toon(C.gold), 0.06, 1.05, 0.95, 10, 8);
  door.userData.base = 0;
  door.userData.open = 0;
  dynamic(door);
  const tex = canvasTex(512, 128, (ctx, w2, h2) => {
    ctx.fillStyle = C.ink; rr(ctx, 0, 0, w2, h2, 18); ctx.fill();
    txt(ctx, 'SOLO PERSONAL', w2 / 2, h2 / 2 + 4, { size: 60, fill: C.yellow, lw: 0 });
  });
  const s = plane(root, 1.5, 0.37, glow('#ffffff', { map: tex }), x2 + 0.08, 2.65, dz);
  s.rotation.y = Math.PI / 2;
  s.castShadow = false;
  return door;
}

// =============================================================
function escalators(root, R) {
  const x0 = X(357), L = X(702) - X(357);
  const Hrise = H + 0.2;
  const a = 3.2, b = L - 1.2;
  const y = (x) => (x <= a ? 0 : x >= b ? Hrise : ((x - a) / (b - a)) * Hrise);
  const lanes = [
    { z: (Z(128) + Z(170)) / 2, dir: 1 },
    { z: (Z(175) + Z(217)) / 2, dir: -1 },
  ];
  const w = 1.9;
  const stepGeo = new THREE.BoxGeometry(0.42, 0.16, w - 0.35);
  const stepMat = toon('#59607a');
  const N = Math.ceil(L / 0.42);

  for (const lane of lanes) {
    const g = new THREE.Group();
    g.position.set(x0, 0, lane.z);
    root.add(g);
    // cuerpo lateral (perfil extruido)
    const sh = new THREE.Shape();
    sh.moveTo(0, 0); sh.lineTo(a + 0.6, 0); sh.lineTo(L, Hrise - 1.2); sh.lineTo(L, Hrise + 0.12);
    sh.lineTo(b, Hrise + 0.12); sh.lineTo(a, 0.12); sh.lineTo(0, 0.12); sh.closePath();
    for (const s of [-1, 1]) {
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: false });
      const m = add(g, geo, toon('#8d98c4'), 0, 0, s * (w / 2) - 0.08);
      m.castShadow = true;
      // balaustrada de vidrio
      const bs = new THREE.Shape();
      const pts = [0.3, a, b, L - 0.2];
      bs.moveTo(pts[0], y(pts[0]) + 0.15);
      for (const px of pts.slice(1)) bs.lineTo(px, y(px) + 0.15);
      for (const px of pts.slice().reverse()) bs.lineTo(px, y(px) + 1.0);
      bs.closePath();
      const bg = add(g, new THREE.ExtrudeGeometry(bs, { depth: 0.04, bevelEnabled: false }), toon('#c9f0ff', { opacity: 0.3 }), 0, 0, s * (w / 2 - 0.05) - 0.02);
      bg.castShadow = false;
      // pasamanos
      const curvePts = [];
      for (let i = 0; i <= 40; i++) { const px = 0.3 + (i / 40) * (L - 0.5); curvePts.push(new THREE.Vector3(px, y(px) + 1.05, s * (w / 2 - 0.03))); }
      add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curvePts), 120, 0.05, 8), toon(C.ink), 0, 0, 0);
      // luz lateral
      const lightPts = curvePts.map((p) => new THREE.Vector3(p.x, p.y - 0.88, s * (w / 2 + 0.09)));
      add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lightPts), 120, 0.025, 6), glow(lane.dir > 0 ? '#5fe8ff' : C.pink), 0, 0, 0).castShadow = false;
    }
    // placa de acceso
    rbox(g, 1.2, 0.05, w, 0.02, toon(C.steel), 0.6, 0.03, 0);
    // escalones animados
    const steps = new THREE.InstancedMesh(stepGeo, stepMat, N);
    steps.castShadow = true; steps.receiveShadow = true; steps.frustumCulled = false;
    g.add(steps);
    const dummy = new THREE.Object3D();
    R.updaters.push((t) => {
      for (let i = 0; i < N; i++) {
        let s = (i * 0.42 + t * 0.45 * lane.dir) % L;
        if (s < 0) s += L;
        dummy.position.set(s, y(s) + 0.06, 0);
        dummy.updateMatrix();
        steps.setMatrixAt(i, dummy.matrix);
      }
      steps.instanceMatrix.needsUpdate = true;
    });
    // flecha en el piso
    const arrowTex = canvasTex(256, 128, (ctx, w2, h2) => {
      ctx.clearRect(0, 0, w2, h2);
      txt(ctx, lane.dir > 0 ? 'SUBE ▲' : 'BAJA ▼', w2 / 2, h2 / 2 + 4, { size: 54, fill: C.yellow, lw: 8 });
    });
    const sign = plane(g, 1.3, 0.65, glow('#ffffff', { map: arrowTex, opacity: 0.999 }), -0.75, 0.02, 0);
    sign.rotation.order = 'YXZ';
    sign.rotation.set(-Math.PI / 2, -Math.PI / 2, 0);
    sign.castShadow = false;
  }

  // Pared que cierra el hueco debajo de las escaleras mecánicas (una "cuña"
  // maciza desde el piso hasta la parte de abajo de la escalera)
  const zN = ZT + WALL_T / 2, zS = (Z(175) + Z(217)) / 2 + 0.95;
  const under = new THREE.Shape();
  under.moveTo(a + 0.6, 0);
  under.lineTo(L, 0);
  under.lineTo(L, Hrise - 1.22);
  under.closePath();
  const wedge = add(root, new THREE.ExtrudeGeometry(under, { depth: zS - zN, bevelEnabled: false }), toon('#d7d5e6'), x0, 0, zN);
  wedge.receiveShadow = true;
  // zócalo de madera y LED azul siguiendo la pendiente, del lado de la sala
  const slope = (Hrise - 1.22) / (L - a - 0.6);
  const xs = x0 + a + 0.6 + 1.1 / slope;
  box(root, x0 + L - xs, 1.1, 0.06, toon('#5b3b2c'), (xs + x0 + L) / 2, 0.55, zS + 0.03);
  rbox(root, x0 + L - xs, 0.08, 0.1, 0.02, toon(C.gold), (xs + x0 + L) / 2, 1.12, zS + 0.04);
  const ledPts = [new THREE.Vector3(x0 + a + 0.6 + 0.3, 0.12, zS + 0.03), new THREE.Vector3(x0 + L - 0.05, Hrise - 1.22 - 0.1, zS + 0.03)];
  add(root, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ledPts), 8, 0.03, 6), glow('#38b8ff')).castShadow = false;
}

// =============================================================
function stairs(root) {
  // Un solo tramo: arranca a nivel del piso del lado de la entrada y
  // sube hacia el este, entrando al primer piso por el hueco del techo.
  const x2 = X(692), z1 = Z(450), z2 = ZB - WALL_T / 2;
  const w = z2 - z1, cz = (z1 + z2) / 2;
  const { n, run, rise, start, end } = STAIR;
  const stone = toon('#efe3c8');
  const runner = toon(C.red);
  const nose = toon(C.gold);
  const glass = toon('#c9f0ff', { opacity: 0.25 });
  const rail = toon('#2a2c38');
  const railPts = [];
  for (let i = 0; i < n; i++) {
    const top = rise * (i + 1);
    const xc = start + run * i + run / 2;
    box(root, run, top, w, stone, xc, top / 2, cz);
    box(root, run, 0.02, w - 1.0, runner, xc, top + 0.01, cz);
    box(root, 0.06, 0.04, w, nose, xc - run / 2 + 0.03, top + 0.02, cz);
    railPts.push(new THREE.Vector3(xc, top + 1.0, z1 + 0.08));
    const g = box(root, run, 0.85, 0.03, glass, xc, top + 0.5, z1 + 0.08);
    g.castShadow = false;
    if (i % 3 === 0) cyl(root, 0.03, 0.03, 1.0, toon(C.steel), xc, top + 0.5, z1 + 0.08, 8);
  }
  add(root, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts), 80, 0.045, 8), rail);
  // descanso superior (ya en el primer piso)
  box(root, x2 - end, H, w, stone, (end + x2) / 2, H / 2, cz);
  // cartel al pie de la escalera
  const tex = canvasTex(512, 128, (ctx, w2, h2) => {
    ctx.fillStyle = C.ink; rr(ctx, 0, 0, w2, h2, 20); ctx.fill();
    txt(ctx, 'ESCALERA → 1° PISO', w2 / 2, h2 / 2 + 4, { size: 58, fill: C.yellow, lw: 0 });
  });
  const s = plane(root, 2.8, 0.7, glow('#ffffff', { map: tex }), start + 2.2, 2.6, ZB - WALL_T / 2 - 0.02);
  s.rotation.y = Math.PI;
  s.castShadow = false;
}

// =============================================================
// =============================================================
function cashier(root, R) {
  const x1 = X(1088), x2 = XR - WALL_T / 2, z1 = ZT + WALL_T / 2, z2 = Z(160);
  const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2, w = x2 - x1, d = z2 - z1;
  rbox(root, w, 1.15, d, 0.06, toon(C.woodDark), cx, 0.575, cz);
  rbox(root, w + 0.15, 0.08, d + 0.15, 0.03, toon(C.gold), cx, 1.18, cz);
  for (let i = 0; i <= 10; i++) cyl(root, 0.018, 0.018, 1.2, toon(C.gold), x1 + 0.1 + (i * (w - 0.2)) / 10, 1.8, z2 + 0.02, 6);
  for (let i = 0; i <= 6; i++) cyl(root, 0.018, 0.018, 1.2, toon(C.gold), x1 - 0.02, 1.8, z1 + 0.1 + (i * (d - 0.2)) / 6, 6);
  rbox(root, w + 0.2, 0.3, d + 0.2, 0.08, toon(C.red), cx, 2.5, cz);
  const tex = canvasTex(256, 128, (ctx, w2, h2) => {
    ctx.fillStyle = C.yellow; rr(ctx, 0, 0, w2, h2, 20); ctx.fill();
    txt(ctx, 'CAJA', w2 / 2, h2 / 2 + 4, { size: 80, fill: C.red, lw: 8 });
  });
  rbox(root, 1.6, 0.8, 0.12, 0.08, toon(C.ink), cx, 3.15, z2 + 0.05);
  plane(root, 1.5, 0.72, glow('#ffffff', { map: tex }), cx, 3.15, z2 + 0.115).castShadow = false;
  const cashierBean = makePatron({ body: '#2f9a46', hat: '#2f9a46' });
  cashierBean.position.set(cx + 0.3, 0.55, cz - 0.1);
  root.add(cashierBean);
  R.updaters.push(cashierBean.userData.update);
}

function elevator(root, R) {
  const x1 = X(1047), x2 = XR - WALL_T / 2, z1 = Z(448), z2 = ZB - WALL_T / 2;
  const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
  rbox(root, x2 - x1, H, z2 - z1, 0.06, toon(C.steel), cx, H / 2, cz);
  const dz = Z(477);
  rbox(root, 0.16, 2.8, 2.0, 0.06, toon(C.gold), x1 - 0.02, 1.4, dz);
  const doorMat = toon('#d3dbe8');
  const doors = [];
  for (const s of [-1, 1]) {
    const d = rbox(root, 0.06, 2.5, 0.8, 0.02, doorMat, x1 - 0.1, 1.25, dz + s * 0.4);
    dynamic(d);
    doors.push(d);
  }
  const ind = canvasTex(256, 96, (ctx, w, h, floorN = 'PB') => {
    ctx.fillStyle = '#1a0f0f'; ctx.fillRect(0, 0, w, h);
    txt(ctx, '▲ ' + floorN, w / 2, h / 2 + 4, { font: 'VT323', size: 72, fill: '#ff5a3a', lw: 0 });
  });
  const s = plane(root, 0.8, 0.3, glow('#ffffff', { map: ind }), x1 - 0.11, 3.0, dz);
  s.rotation.y = -Math.PI / 2;
  s.castShadow = false;
  rbox(root, 0.08, 0.4, 0.2, 0.03, toon(C.ink), x1 - 0.06, 1.2, dz - 1.25);
  sph(root, 0.04, glow('#7dff6a'), x1 - 0.11, 1.28, dz - 1.25, 10, 8);
  sph(root, 0.04, glow('#ffd23a'), x1 - 0.11, 1.12, dz - 1.25, 10, 8);
  // abrir / cerrar al hacer click
  let open = 0, target = 0;
  R.clickables.push({ obj: doors[0], tip: 'Llamar al ascensor', action: () => { target = target ? 0 : 1; } });
  R.clickables.push({ obj: doors[1], tip: 'Llamar al ascensor', action: () => { target = target ? 0 : 1; } });
  R.updaters.push((t, dt) => {
    open += (target - open) * (1 - Math.exp(-3 * dt));
    doors[0].position.z = dz - 0.4 - open * 0.75;
    doors[1].position.z = dz + 0.4 + open * 0.75;
  });
}

// =============================================================
function plant(root, x, z, s = 1) {
  cyl(root, 0.32 * s, 0.25 * s, 0.55 * s, toon(C.orange), x, 0.275 * s, z, 18);
  tor(root, 0.32 * s, 0.04 * s, toon(C.red), x, 0.55 * s, z, Math.PI * 2, 18).rotation.x = Math.PI / 2;
  const leaf = toon('#3fae49');
  for (const [dx, dy, dz, r] of [[0, 0.95, 0, 0.42], [0.25, 0.8, 0.1, 0.3], [-0.22, 0.85, -0.12, 0.32], [0.05, 1.25, 0.05, 0.28]]) {
    sph(root, r * s, leaf, x + dx * s, dy * s, z + dz * s, 14, 10);
  }
}

function lamp(root, x, z, col = C.orange, h = 3.65) {
  cyl(root, 0.012, 0.012, H - h, toon(C.ink), x, (H + h) / 2, z, 6);
  const shade = cone(root, 0.5, 0.38, toon(col), x, h, z, 24, true);
  shade.material = toon(col, { side: THREE.DoubleSide });
  sph(root, 0.13, glow('#fff3c0'), x, h - 0.12, z, 12, 10).castShadow = false;
  tor(root, 0.5, 0.025, toon(C.gold), x, h - 0.19, z, Math.PI * 2, 24).rotation.x = Math.PI / 2;
}

function poster(root, x, y, z, rotY, w, h, draw, tilt = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  root.add(g);
  const tex = canvasTex(Math.round(w * 200), Math.round(h * 200), draw);
  const p = plane(g, w, h, toon('#ffffff', { map: tex }), 0, 0, 0);
  p.rotation.z = tilt;
  p.castShadow = false;
  for (const [tx, ty, r] of [[-w / 2 + 0.1, h / 2 - 0.05, 0.6], [w / 2 - 0.1, h / 2 - 0.05, -0.6]]) {
    const t = plane(g, 0.28, 0.09, toon('#ffeeaa', { opacity: 0.85 }), tx, ty, 0.01);
    t.rotation.z = r + tilt;
    t.castShadow = false;
  }
}

function decor(root, R) {

  // columnas con LED azul (como en el video)
  const ledCol = (x, z, rotY) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    root.add(g);
    rbox(g, 0.9, H, 0.35, 0.05, toon('#2a2c3a'), 0, H / 2, 0);
    for (const s of [-1, 1]) box(g, 0.06, H - 0.6, 0.06, glow('#38b8ff'), s * 0.3, H / 2, 0.18).castShadow = false;
  };
  ledCol(XR - 0.3, Z(180), -Math.PI / 2);
  ledCol(XR - 0.3, Z(400), -Math.PI / 2);
  ledCol(X(162), ZT + 0.32, 0);
  ledCol(X(720), ZB - 0.32, Math.PI);

  // paneles de madera con cuadros
  const painting = (draw) => canvasTex(512, 320, draw);
  const sunset = painting((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffb44a'); g.addColorStop(0.55, '#e8603a'); g.addColorStop(1, '#7a2c22');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(w * 0.65, h * 0.45, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b2420';
    ctx.beginPath(); ctx.moveTo(0, h * 0.75); ctx.quadraticCurveTo(w * 0.3, h * 0.5, w * 0.55, h * 0.72); ctx.quadraticCurveTo(w * 0.8, h * 0.6, w, h * 0.7); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
  });
  const abstract = painting((ctx, w, h) => {
    ctx.fillStyle = '#2b3a8f'; ctx.fillRect(0, 0, w, h);
    const cols = ['#e8342f', '#ffd23a', '#5fd0d8', '#ff8a1f', '#ffffff'];
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = cols[i % cols.length];
      ctx.beginPath(); ctx.arc((i * 137) % w, (i * 71) % h, 20 + (i % 4) * 14, 0, Math.PI * 2); ctx.fill();
    }
  });
  const woodWall = (x, z, len, rotY, tex) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    root.add(g);
    rbox(g, len, 4.3, 0.14, 0.03, toon("#4a2c20"), 0, 2.15, 0);
    for (let k = -len / 2 + 0.6; k < len / 2; k += 0.6) box(g, 0.03, 4.1, 0.02, toon('#3a2218'), k, 2.15, 0.075);
    rbox(g, 3.6, 2.3, 0.1, 0.03, toon(C.gold), 0, 2.6, 0.1);
    plane(g, 3.4, 2.1, toon("#ffffff", { map: tex }), 0, 2.6, 0.16).castShadow = false;
  };
  woodWall(X(255), ZB - WALL_T / 2 - 0.08, 11, Math.PI, sunset);
  woodWall(XR - WALL_T / 2 - 0.08, Z(300), 6, -Math.PI / 2, abstract);

  // pósters chicos
  poster(root, X(1021), 3.0, ZB - WALL_T / 2 - 0.02, Math.PI, 1.2, 1.2, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 22; ctx.strokeStyle = C.red;
    ctx.beginPath(); ctx.arc(w / 2, h / 2 - 10, 80, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w / 2 - 56, h / 2 - 66); ctx.lineTo(w / 2 + 56, h / 2 + 46); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.fillRect(w / 2 - 50, h / 2 - 18, 80, 16);
    txt(ctx, 'NO FUMAR', w / 2, h - 28, { size: 34, fill: C.ink, lw: 0 });
  }, 0.05);
  poster(root, X(900), 3.5, ZT + WALL_T / 2 + 0.02, 0, 2.6, 1.0, (ctx, w, h) => {
    ctx.fillStyle = C.purple; ctx.fillRect(0, 0, w, h);
    txt(ctx, 'JACKPOT!', w / 2, h / 2 + 6, { size: 120, fill: C.yellow, lw: 14 });
  }, -0.03);
  poster(root, X(118) + 0.2, 3.75, 0, Math.PI / 2, 3.2, 0.8, (ctx, w, h) => {
    ctx.fillStyle = C.teal; ctx.fillRect(0, 0, w, h);
    txt(ctx, '¡BIENVENIDOS!', w / 2, h / 2 + 6, { size: 96, fill: '#fff', lw: 14 });
  }, 0);

  // matafuegos (según el croquis)
  const ext = (px, py, wall) => {
    const v = P(px, py);
    const off = 0.25;
    if (wall === 'n') v.z = ZT + WALL_T / 2 + off;
    if (wall === 's') v.z = ZB - WALL_T / 2 - off;
    if (wall === 'e') v.x = XR - WALL_T / 2 - off;
    cyl(root, 0.11, 0.11, 0.5, toon(C.red), v.x, 0.6, v.z, 14);
    sph(root, 0.11, toon(C.red), v.x, 0.85, v.z, 14, 8);
    cyl(root, 0.04, 0.04, 0.12, toon(C.ink), v.x, 0.98, v.z, 8);
    rbox(root, 0.2, 0.04, 0.05, 0.01, toon(C.ink), v.x + 0.08, 1.03, v.z);
  };
  ext(152, 143, 'n'); ext(338, 143, 'n'); ext(712, 138, 'n'); ext(1132, 205, 'e');
  ext(1132, 428, 'e'); ext(132, 510, 's'); ext(368, 510, 's');

  plant(root, X(130), Z(415), 1.1);
  plant(root, X(1110), Z(430), 1.2);
  plant(root, X(700), Z(268), 1.0);
}


// =============================================================
function patrons(root, R, roulette) {
  // La mayoría son señoras mayores; algunos señores mayores y algún joven.
  const add = (pt) => { root.add(pt); R.updaters.push(pt.userData.update); return pt; };
  const seatAt = (slot, o, make = makePatron) => {
    slot.updateMatrixWorld(true);
    const p = slot.userData.seat.clone();
    slot.localToWorld(p);
    const pt = make(o);
    pt.position.copy(p);
    pt.rotation.y = slot.rotation.y + Math.PI;
    add(pt);
  };
  // [índice en R.slots (las 8 del Pozo MEGA van primero), opciones]
  const G = { type: 'grandma' }, P = { type: 'grandpa' };
  [
    // [6] la señora al lado del señor con muletas rasca la pantalla
    [1, G], [6, { type: 'grandma', act: 'scratch' }], [8 + 1, G], [8 + 7, P], [8 + 11, G], [8 + 16, G], [8 + 22, P],
    [8 + 26, G], [8 + 29, G], [8 + 33, { type: 'youngM' }], [8 + 38, G], [8 + 40, G], [8 + 42, P], [8 + 45, G],
    [8 + 50, G], [8 + 51, P], [8 + 53, G], [8 + 55, G], [8 + 56, { type: 'grandpa', act: 'tap' }] /* golpea la pantalla (fondo de la parada 4) */, [8 + 58, G],
  ].forEach(([i, o]) => R.slots[i] && seatAt(R.slots[i], o));
  // señor con muletas jugando en la máquina del Pozo MEGA más cercana a la cámara
  seatAt(R.slots[7], { side: -1 }, makeCrutchPlayer);
  // en la ruleta, mirando hacia el centro
  const c = roulette.position;
  const atRoulette = (angDeg, obj) => {
    const a = deg(angDeg);
    obj.position.set(c.x + Math.cos(a) * 4.45, 0.75, c.z + Math.sin(a) * 4.45);
    obj.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a));
    return add(obj);
  };
  [[72, P], [108, G], [144, P], [252, G]].forEach(([a, o]) => atRoulette(a, makePatron(o)));
  // pareja joven apostando juntos en la ruleta, con corazones arriba
  const him = atRoulette(180, makePatron({ type: 'youngM', body: '#3b7be8' }));
  const her = atRoulette(198, makePatron({ type: 'youngW', body: '#ff5fa2', hair: '#6b3a1e' }));
  him.rotation.y += 0.12;
  her.rotation.y -= 0.12;
  {
    // banqueta extra para ella (igual a las de la ruleta)
    const a = deg(198);
    const st = new THREE.Group();
    st.position.set(c.x + Math.cos(a) * 4.45, 0, c.z + Math.sin(a) * 4.45);
    st.rotation.y = Math.atan2(Math.cos(a), Math.sin(a));
    root.add(st);
    const chrome = toon('#d3d8e4'), black = toon('#1d1e26');
    cyl(st, 0.28, 0.32, 0.05, chrome, 0, 0.025, 0, 20);
    cyl(st, 0.05, 0.05, 0.6, chrome, 0, 0.33, 0, 10);
    tor(st, 0.22, 0.024, chrome, 0, 0.32, 0, Math.PI * 2, 20).rotation.x = Math.PI / 2;
    cyl(st, 0.28, 0.28, 0.13, black, 0, 0.68, 0, 24);
    rbox(st, 0.5, 0.45, 0.09, 0.04, black, 0, 1.0, 0.27);
  }
  const hearts = makeHearts();
  const ah = deg(189);
  hearts.position.set(c.x + Math.cos(ah) * 4.6, 2.35, c.z + Math.sin(ah) * 4.6);
  hearts.rotation.y = Math.atan2(-Math.cos(ah), -Math.sin(ah)) + Math.PI;
  add(hearts);
  // dos personas de pie tomando cerveza (mirando hacia la cámara)
  const beer1 = makeStanding({ type: 'grandma', beer: true });
  beer1.position.set(7.0, 0, 3.0);
  beer1.rotation.y = 1.9;
  add(beer1);
  const beer2 = makeStanding({ type: 'grandpa', beer: true });
  beer2.position.set(2.9, 0, -0.55);
  beer2.rotation.y = -0.2;
  add(beer2);
}
