// Personajes: jugadores "poroto" y la moza con la bandeja de cafés
import * as THREE from 'three';
import { C, toon, glow, rbox, cyl, sph, tor, cap, limb, cone, dynamic, rand, add, canvasTex, plane } from './util.js';

// =============================================================
//  Jugadores. Origen = asiento (sentados) o cadera (de pie).
//  Mira hacia +z local.
//  type: 'grandma' (señora mayor), 'grandpa' (señor mayor),
//        'youngW' / 'youngM' (jóvenes) o 'staff' (con gorra).
// =============================================================
const SKINS = ['#ffd2b0', '#f1b98f', '#e9b48f', '#c98b5e', '#ffe0c7'];
const GRAY_HAIR = ['#eeeef3', '#d4d4dc', '#c9c3d9', '#b9b9c4', '#f2ead8'];
const YOUNG_HAIR = ['#3b2314', '#1d1d26', '#e0a23a', '#b8432b', '#6b4a2b'];
const CARDIGANS = ['#c9a0dc', '#f4a6b8', '#8fd3c7', '#f2c46d', '#a3c4f3', '#e98a6e', '#b5d98a'];
const GRANDPA_TOPS = ['#6b4f3a', '#2f4f7a', '#4f6b3a', '#7a2f3a', '#5a5a6a'];
const YOUNG_TOPS = ['#e8342f', '#3b7be8', '#ff8a1f', '#7b3fc4', '#2fb8c4', '#ff5fa2'];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
// pantalla de la tragamonedas vista desde el asiento (coords del jugador sentado)
const ARM_GEO = new THREE.CapsuleGeometry(0.06, 1, 4, 10), ARM_UP = V3(0, 1, 0), armDir = V3(0, 0, 0);
const SCREEN = V3(-0.14, 0.78, 0.66), TAP_FROM = V3(-0.2, 0.7, 0.42), SCRATCH = V3(0.0, 1.0, 0.67);

// Lata de cerveza (blanca y celeste, como la de la foto)
let canTex = null;
export function makeCan() {
  canTex ||= canvasTex(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#f7f7f4'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, h * 0.45, 0, h);
    g.addColorStop(0, '#5ab4ea'); g.addColorStop(1, '#1f6fc0');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, h * 0.62);
    for (let x = 0; x <= w; x += 8) ctx.lineTo(x, h * 0.58 + Math.sin(x / 18) * 5);
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
    ctx.font = 'italic 44px "Lilita One"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff';
    for (const x of [64, 192]) {
      ctx.strokeText('Quilmes', x, h * 0.52); ctx.fillStyle = '#16326e'; ctx.fillText('Quilmes', x, h * 0.52);
      ctx.beginPath(); ctx.arc(x, h * 0.2, 9, 0, Math.PI * 2); ctx.fillStyle = '#c9a25a'; ctx.fill();
    }
    ctx.fillStyle = '#ffffff'; ctx.font = '600 11px "Fredoka"';
    ctx.fillText('CERVEZA ARGENTINA', 64, h * 0.75); ctx.fillText('CERVEZA ARGENTINA', 192, h * 0.75);
  });
  const g = new THREE.Group();
  const body = cyl(g, 0.042, 0.042, 0.14, toon('#ffffff', { map: canTex }), 0, 0.07, 0, 20);
  body.castShadow = false;
  cyl(g, 0.036, 0.042, 0.015, toon('#d3d8e4'), 0, 0.147, 0, 20);
  cyl(g, 0.036, 0.04, 0.01, toon('#d3d8e4'), 0, -0.004, 0, 20);
  return g;
}

export function makePatron(o = {}) {
  const type = o.type || (o.hat ? 'staff' : 'grandma');
  const g = new THREE.Group();
  const old = type === 'grandma' || type === 'grandpa';
  const bodyCol = o.body || (type === 'grandma' ? pick(CARDIGANS) : type === 'grandpa' ? pick(GRANDPA_TOPS) : pick(YOUNG_TOPS));
  const skin = toon(o.skin || pick(SKINS));
  const hair = toon(o.hair || (old ? pick(GRAY_HAIR) : pick(YOUNG_HAIR)));
  const body = toon(bodyCol);

  const torso = cap(g, 0.26, 0.28, body, 0, 0.36, 0);
  torso.scale.set(1, 1, 0.85);
  const head = new THREE.Group();
  head.position.set(0, 0.92, 0.02);
  g.add(head);
  sph(head, 0.23, skin, 0, 0, 0, 22, 16);
  // ojos
  const eye = toon('#1a1a22');
  for (const s of [-1, 1]) {
    const e = sph(head, 0.04, eye, s * 0.08, 0.03, 0.195, 12, 10);
    e.scale.set(0.75, old ? 0.9 : 1.15, 0.5);
    sph(head, 0.013, glow('#ffffff'), s * 0.07, 0.05, 0.215, 8, 6);
  }
  sph(head, 0.05, skin, 0, -0.03, 0.23, 12, 10);
  const smile = tor(head, 0.035, 0.009, toon('#8a3a2a'), 0, -0.1, 0.2, Math.PI, 10);
  smile.rotation.z = Math.PI;

  if (type === 'staff') {
    const h = add(head, new THREE.SphereGeometry(0.245, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), hair, 0, 0.02, -0.02);
    h.rotation.x = -0.35;
    if (o.hat) {
      cyl(head, 0.235, 0.24, 0.12, toon(o.hat), 0, 0.15, 0, 20);
      rbox(head, 0.3, 0.03, 0.18, 0.015, toon(o.hat), 0, 0.1, 0.2);
      sph(head, 0.04, toon(C.gold), 0, 0.17, 0.235, 10, 8);
    }
  }
  if (old) {
    // anteojos
    const frame = toon(type === 'grandma' ? pick(['#b8862a', '#8a3a7a', '#2a2a36']) : '#2a2a36');
    for (const s of [-1, 1]) {
      tor(head, 0.058, 0.011, frame, s * 0.085, 0.03, 0.212, Math.PI * 2, 16);
      const lens = sph(head, 0.052, toon('#e8f6ff', { opacity: 0.35 }), s * 0.085, 0.03, 0.205, 12, 8);
      lens.scale.z = 0.2; lens.castShadow = false;
    }
    rbox(head, 0.05, 0.012, 0.012, 0.004, frame, 0, 0.04, 0.215);
    // mejillas
    for (const s of [-1, 1]) {
      const b = sph(head, 0.035, toon('#ff9aa8', { opacity: 0.6 }), s * 0.13, -0.06, 0.16, 10, 8);
      b.scale.set(1, 0.6, 0.3); b.castShadow = false;
    }
  }
  if (type === 'grandma') {
    // pelo blanco enrulado (a veces con rodete)
    const cap0 = add(head, new THREE.SphereGeometry(0.245, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), hair, 0, 0.03, -0.02);
    cap0.rotation.x = -0.3;
    const curls = [[-0.17, 0.1, 0.08], [-0.2, 0.0, -0.02], [0.17, 0.1, 0.08], [0.2, 0.0, -0.02], [-0.09, 0.2, 0.1], [0.09, 0.2, 0.1], [0, 0.22, 0.04],
      [-0.14, 0.14, -0.12], [0.14, 0.14, -0.12], [0, 0.12, -0.19], [-0.18, -0.06, -0.1], [0.18, -0.06, -0.1]];
    for (const [x, y, z] of curls) sph(head, 0.075, hair, x, y, z, 10, 8);
    if (Math.random() < 0.5) {
      sph(head, 0.1, hair, 0, 0.27, -0.08, 12, 10);
      tor(head, 0.06, 0.015, toon(pick(['#ff5fa2', '#7b3fc4', '#3b7be8'])), 0, 0.22, -0.1, Math.PI * 2, 12).rotation.x = Math.PI / 2.4;
    }
    // aros de perla
    for (const s of [-1, 1]) sph(head, 0.022, toon('#fff8ee'), s * 0.225, -0.06, 0.02, 8, 6);
    // collar de perlas, cuello de blusa y botones
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.15 + (0.7 * i) / 8);
      sph(g, 0.022, toon('#fff8ee'), Math.cos(a) * 0.15, 0.66 - Math.sin(a) * 0.05, 0.12 + Math.sin(a) * 0.06, 8, 6);
    }
    for (const s of [-1, 1]) {
      const col = sph(g, 0.08, toon('#ffffff'), s * 0.08, 0.7, 0.15, 10, 8);
      col.scale.set(1, 0.4, 0.6); col.rotation.z = s * 0.4;
    }
    for (let i = 0; i < 3; i++) sph(g, 0.018, toon('#ffffff'), 0, 0.55 - i * 0.12, 0.22 - i * 0.005, 8, 6);
  } else if (type === 'grandpa') {
    // pelado con pelo gris a los costados + bigote
    for (const s of [-1, 1]) {
      const sh = sph(head, 0.09, hair, s * 0.2, 0.02, -0.06, 10, 8);
      sh.scale.set(0.6, 0.9, 1.3);
    }
    const back = sph(head, 0.12, hair, 0, -0.02, -0.17, 12, 8);
    back.scale.set(1.5, 0.8, 0.6);
    const mus = cap(head, 0.03, 0.12, hair, 0, -0.07, 0.215);
    mus.rotation.z = Math.PI / 2;
    if (Math.random() < 0.5) {
      const boina = sph(head, 0.25, toon(pick(['#2f3a5a', '#5a3a2a', '#3a4a3a'])), 0, 0.16, -0.02, 18, 10);
      boina.scale.set(1.05, 0.35, 1.1);
      rbox(head, 0.26, 0.025, 0.1, 0.012, toon('#2a2a36'), 0, 0.12, 0.22);
    }
  } else if (type === 'youngW') {
    const h = add(head, new THREE.SphereGeometry(0.248, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), hair, 0, 0.02, -0.02);
    h.rotation.x = -0.4;
    const long = cap(head, 0.17, 0.32, hair, 0, -0.18, -0.1);
    long.scale.set(1.25, 1, 0.6);
    for (const x of [-0.1, 0, 0.1]) { const b = sph(head, 0.075, hair, x, 0.14, 0.16, 10, 8); b.scale.set(1.1, 0.7, 0.8); }
    for (const s of [-1, 1]) { const l = rbox(head, 0.05, 0.01, 0.01, 0.004, eye, s * 0.088, 0.075, 0.19); l.rotation.z = s * 0.4; }
  } else if (type === 'youngM') {
    const h = add(head, new THREE.SphereGeometry(0.248, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), hair, 0, 0.03, -0.02);
    h.rotation.x = -0.3;
    for (const [x, z] of [[-0.1, 0.1], [0, 0.13], [0.1, 0.1], [-0.05, 0], [0.06, 0.02]]) cone(head, 0.06, 0.13, hair, x, 0.24, z, 8);
  }

  // manos (guantes blancos)
  const glove = toon('#ffffff');
  const hands = [];
  for (const s of [-1, 1]) hands.push(sph(g, 0.085, glove, s * 0.22, 0.5, 0.26, 14, 10));
  const rest = hands.map((h) => h.position.clone());
  if (o.standing) {
    hands.forEach((h, i) => { h.position.set((i ? 1 : -1) * 0.31, 0.32, 0.04); rest[i].copy(h.position); });
  }
  if (o.handPos) o.handPos.forEach((p, i) => { if (p) { hands[i].position.copy(p); rest[i].copy(p); } });
  // brazos con manga del color de la ropa, del hombro a cada mano. Se
  // reacomodan en cada cuadro, así siguen a la mano en cualquier gesto.
  const arms = hands.map((h, i) => {
    const m = new THREE.Mesh(ARM_GEO, body);
    m.castShadow = true;
    m.userData.shoulder = V3((i ? 1 : -1) * 0.2, 0.6, 0.04);
    g.add(m);
    return m;
  });
  const placeArms = () => arms.forEach((m, i) => {
    const sh = m.userData.shoulder;
    armDir.subVectors(hands[i].position, sh);
    const d = armDir.length();
    const len = Math.max(0.04, d - 0.06); // termina justo dentro del guante
    m.position.copy(sh).addScaledVector(armDir, (0.5 * len) / d);
    m.quaternion.setFromUnitVectors(ARM_UP, armDir.normalize());
    m.scale.set(1, len / 1.12, 1);
  });
  let can = null;
  if (o.beer) { can = makeCan(); can.scale.setScalar(1.3); g.add(can); }
  dynamic(g);
  const phase = Math.random() * 10;
  const sip = V3(0.06, 0.8, 0.26);
  const canBase = o.standing ? V3(0.27, 0.42, 0.16) : V3(0.24, 0.62, 0.3);
  g.userData.hands = hands;
  g.userData.head = head;
  placeArms();
  g.userData.update = (t) => { animate(t); placeArms(); };
  const animate = (t) => {
    head.rotation.z = Math.sin(t * 1.3 + phase) * 0.06;
    head.position.y = 0.92 + Math.abs(Math.sin(t * 2 + phase)) * 0.015;
    torso.scale.y = 1 + Math.sin(t * 2 + phase) * 0.02;
    // gestos sobre la pantalla de la tragamonedas (jugadores sentados):
    //  'scratch' rasca la pantalla rápido; 'tap' le da golpecitos de a ratos
    //  (con la mano derecha, hands[0]: es la que se ve desde la cámara de la parada 4)
    if (o.act) {
      if (o.act === 'scratch') {
        // arriba de la pantalla (si no, la tapa el jugador de al lado desde la cámara)
        hands[0].position.set(SCRATCH.x + Math.sin(t * 17 + phase) * 0.07, SCRATCH.y + Math.sin(t * 8.5) * 0.03, SCRATCH.z);
        head.rotation.x = 0.12; // inclinada hacia la pantalla
      } else if (o.act === 'tap') {
        const c = (t * 0.55 + phase) % 1;
        const k = c < 0.45 ? Math.max(0, Math.sin((c / 0.45) * Math.PI * 4)) : 0; // tanda de 4 golpecitos
        hands[0].position.lerpVectors(TAP_FROM, SCREEN, Math.pow(k, 0.6));
        head.rotation.z += k * 0.04;
      }
      hands[1].position.y = rest[1].y + Math.max(0, Math.sin(t * 5 + phase)) * 0.04;
      return;
    }
    if (o.still) return;
    if (o.standing) {
      hands.forEach((h, i) => { h.position.y = rest[i].y + Math.sin(t * 1.5 + phase + i) * 0.015; });
    } else {
      hands[0].position.y = rest[0].y + Math.max(0, Math.sin(t * 5 + phase)) * 0.06;
      if (!can) hands[1].position.y = rest[1].y + Math.max(0, Math.sin(t * 4 + phase + 2)) * 0.05;
    }
    if (can) {
      // toma un trago cada tanto
      const c = (t * 0.22 + phase) % 1;
      const k = c < 0.15 ? Math.sin((c / 0.15) * Math.PI) : 0;
      hands[1].position.copy(canBase).lerp(sip, k);
      can.position.copy(hands[1].position).add(V3(-0.02, 0.02, 0.05));
      can.rotation.x = -k * 1.2;
      head.rotation.x = -k * 0.25;
    }
  };
  return g;
}

// Persona de pie: piernas + el mismo cuerpo de los jugadores. Origen en los pies.
export function makeStanding(o = {}) {
  const root = new THREE.Group();
  const pants = toon(o.pants || (o.type === 'grandma' ? pick(['#5a5a7a', '#7a5a6a', '#3a4a6a']) : o.type === 'youngW' ? '#2f4f9a' : '#2a2c3a'));
  const shoe = toon('#2a2020');
  const legs = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(s * 0.11, 0.78, 0);
    root.add(leg);
    cap(leg, 0.085, 0.55, pants, 0, -0.36, 0);
    rbox(leg, 0.14, 0.09, 0.26, 0.04, shoe, 0, -0.73, 0.05);
    legs.push(leg);
  }
  if (o.type === 'grandma') {
    const skirt = add(root, new THREE.CylinderGeometry(0.24, 0.32, 0.42, 18), toon(o.skirt || pick(['#6a4a8a', '#3a5a8a', '#8a4a5a'])), 0, 0.6, 0);
    skirt.scale.z = 0.85;
  }
  const upper = makePatron({ ...o, standing: true });
  upper.position.y = 0.74;
  root.add(upper);
  root.userData.upper = upper;
  root.userData.legs = legs;
  root.userData.update = upper.userData.update;
  dynamic(root);
  return root;
}

// Señor mayor jugando sentado, con la pierna enyesada y las muletas
// apoyadas en la consola. Origen = asiento, mira hacia +z.
export function makeCrutchPlayer(o = {}) {
  // side: de qué lado quedan las muletas (1 = +x local, -1 = -x local)
  const side = o.side ?? 1;
  const root = new THREE.Group();
  const p = makePatron({ type: 'grandpa', ...o });
  root.add(p);
  // pierna enyesada estirada hacia el costado
  limb(root, V3(side * 0.12, 0.08, 0.12), V3(side * 0.42, -0.25, 0.42), 0.1, toon('#f4f4f0'));
  // muletas apoyadas contra el costado de la máquina
  const metal = toon('#c9d2de');
  const rubber = toon('#2a2a30');
  for (const k of [0, 1]) {
    const foot = V3(side * (0.66 + k * 0.1), -0.73, 0.15 + k * 0.08);
    const top = V3(side * (0.5 + k * 0.03), 0.95, 0.58 + k * 0.05);
    limb(root, foot, top, 0.03, metal);
    sph(root, 0.045, rubber, foot.x, foot.y, foot.z, 8, 6);
    const pad = cap(root, 0.05, 0.16, rubber, top.x, top.y + 0.04, top.z);
    pad.rotation.x = Math.PI / 2;
    const hp = foot.clone().lerp(top, 0.62);
    const handle = cyl(root, 0.025, 0.025, 0.16, rubber, hp.x, hp.y, hp.z - 0.06, 8);
    handle.rotation.x = Math.PI / 2;
  }
  dynamic(root);
  root.userData.update = p.userData.update;
  return root;
}

// Corazones flotando (para la pareja)
export function makeHearts() {
  const root = new THREE.Group();
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, -0.12);
  heartShape.bezierCurveTo(-0.02, -0.09, -0.16, -0.02, -0.16, 0.06);
  heartShape.bezierCurveTo(-0.16, 0.14, -0.06, 0.17, 0, 0.09);
  heartShape.bezierCurveTo(0.06, 0.17, 0.16, 0.14, 0.16, 0.06);
  heartShape.bezierCurveTo(0.16, -0.02, 0.02, -0.09, 0, -0.12);
  const hg = new THREE.ExtrudeGeometry(heartShape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3 });
  hg.center();
  const hearts = [];
  const cols = ['#ff3b6b', '#ff7aa2', '#e8342f'];
  for (let i = 0; i < 3; i++) {
    const h = add(root, hg, toon(cols[i], { emissive: cols[i], ei: 0.35 }), (i - 1) * 0.35, (i % 2) * 0.2, 0);
    h.castShadow = false;
    hearts.push(h);
  }
  dynamic(root);
  root.userData.update = (t) => {
    hearts.forEach((h, i) => {
      h.position.y = (i % 2) * 0.2 + Math.sin(t * 2 + i * 1.7) * 0.08;
      h.rotation.y = Math.sin(t * 1.5 + i) * 0.5;
      h.scale.setScalar((i === 1 ? 1.3 : 0.9) * (1 + Math.max(0, Math.sin(t * 6 + i)) * 0.12));
    });
  };
  return root;
}

// =============================================================
//  Moza: mujer joven de traje negro con bandeja de cafés
//  Origen en los pies, mira hacia +z local.
// =============================================================
export function makeWorker() {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  dynamic(root);

  const suit = toon('#1c1c26');
  const shirt = toon('#ffffff');
  const skin = toon(C.skin);
  const hair = toon('#3b2314');
  const glove = toon('#ffffff');

  // piernas con pivote en la cadera
  const legs = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.1, 0.84, 0);
    body.add(pivot);
    cap(pivot, 0.075, 0.6, suit, 0, -0.38, 0);
    rbox(pivot, 0.13, 0.09, 0.25, 0.04, toon('#0d0d12'), 0, -0.79, 0.04);
    legs.push(pivot);
  }
  rbox(body, 0.36, 0.22, 0.24, 0.09, suit, 0, 0.86, 0);
  // torso (saco)
  const torso = cap(body, 0.2, 0.3, suit, 0, 1.13, 0);
  torso.scale.set(1.05, 1, 0.78);
  // camisa en V + moño
  const v = cone(body, 0.075, 0.22, shirt, 0, 1.25, 0.145, 3);
  v.rotation.set(Math.PI, 0, 0);
  v.scale.z = 0.3;
  const bowMat = toon(C.red);
  for (const s of [-1, 1]) {
    const b = cone(body, 0.045, 0.08, bowMat, s * 0.045, 1.335, 0.16, 8);
    b.rotation.z = s * Math.PI / 2;
  }
  sph(body, 0.022, bowMat, 0, 1.335, 0.165, 8, 6);
  rbox(body, 0.09, 0.035, 0.012, 0.005, toon(C.gold), 0.1, 1.2, 0.155);
  // botones
  sph(body, 0.016, toon(C.gold), 0, 1.05, 0.158, 8, 6);
  sph(body, 0.016, toon(C.gold), 0, 0.97, 0.15, 8, 6);
  // cuello y cabeza
  cyl(body, 0.055, 0.06, 0.1, skin, 0, 1.4, 0, 12);
  const head = new THREE.Group();
  head.position.set(0, 1.62, 0.01);
  body.add(head);
  const face = sph(head, 0.22, skin, 0, 0, 0, 24, 18);
  face.scale.set(1, 0.97, 0.95);
  // pelo
  const hairCap = add(head, new THREE.SphereGeometry(0.236, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), hair, 0, 0.02, -0.015);
  hairCap.rotation.x = -0.42;
  for (const [x, y, z, r] of [[-0.11, 0.13, 0.15, 0.075], [0, 0.15, 0.16, 0.08], [0.11, 0.13, 0.15, 0.075], [-0.18, 0.02, 0.08, 0.07], [0.18, 0.02, 0.08, 0.07]]) {
    const b = sph(head, r, hair, x, y, z, 12, 10);
    b.scale.set(1.1, 0.7, 0.8);
  }
  // cola de caballo
  const pony = new THREE.Group();
  pony.position.set(0, 0.17, -0.18);
  head.add(pony);
  tor(pony, 0.045, 0.018, toon(C.red), 0, 0, 0, Math.PI * 2, 12).rotation.x = Math.PI / 2;
  const tail = cap(pony, 0.07, 0.22, hair, 0, -0.13, -0.06);
  tail.rotation.x = 0.35;
  sph(pony, 0.06, hair, 0, -0.3, -0.13, 12, 10);
  // cara
  const eye = toon('#1a1a22');
  for (const s of [-1, 1]) {
    const e = sph(head, 0.036, eye, s * 0.075, 0.0, 0.195, 12, 10);
    e.scale.set(0.75, 1.25, 0.45);
    sph(head, 0.012, glow('#ffffff'), s * 0.066, 0.022, 0.212, 8, 6);
    const lash = rbox(head, 0.06, 0.012, 0.012, 0.005, eye, s * 0.088, 0.045, 0.19);
    lash.rotation.z = s * 0.4;
    const blush = sph(head, 0.035, toon('#ff8fa3', { opacity: 0.7 }), s * 0.125, -0.055, 0.17, 10, 8);
    blush.scale.set(1, 0.6, 0.3);
    blush.castShadow = false;
  }
  const smile = tor(head, 0.05, 0.012, toon('#a8211f'), 0, -0.07, 0.2, Math.PI, 12);
  smile.rotation.z = Math.PI;
  // brazos sosteniendo la bandeja
  for (const s of [-1, 1]) {
    const sh = new THREE.Vector3(s * 0.24, 1.3, 0);
    const el = new THREE.Vector3(s * 0.27, 1.06, 0.1);
    const hd = new THREE.Vector3(s * 0.17, 1.08, 0.33);
    limb(body, sh, el, 0.06, suit);
    limb(body, el, hd, 0.055, suit);
    sph(body, 0.075, glove, hd.x, hd.y - 0.01, hd.z, 14, 10);
  }
  // bandeja
  const tray = new THREE.Group();
  tray.position.set(0, 1.12, 0.36);
  body.add(tray);
  cyl(tray, 0.3, 0.29, 0.025, toon('#d8dde6'), 0, 0, 0, 32);
  tor(tray, 0.3, 0.014, toon('#eef2f8'), 0, 0.015, 0, Math.PI * 2, 32).rotation.x = Math.PI / 2;
  // billete de propina doblado sobre la bandeja
  const billTex = canvasTex(256, 112, (ctx, w, h) => {
    ctx.fillStyle = '#9fd8b8'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#3f8a62'; ctx.lineWidth = 8; ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.beginPath(); ctx.arc(70, h / 2, 30, 0, Math.PI * 2); ctx.fillStyle = '#d8f0e2'; ctx.fill();
    ctx.fillStyle = '#2f6a4a'; ctx.font = '48px "Lilita One"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('$', 70, h / 2 + 3);
    ctx.font = '40px "Lilita One"'; ctx.fillText('1000', 172, h / 2 + 3);
  });
  const billMat = toon('#ffffff', { map: billTex, side: THREE.DoubleSide });
  const bill = new THREE.Group();
  bill.position.set(0.0, 0.016, 0.21);
  bill.rotation.y = 0.25;
  tray.add(bill);
  const b1 = plane(bill, 0.11, 0.09, billMat, -0.055, 0, 0);
  b1.rotation.x = -Math.PI / 2;
  b1.geometry = b1.geometry.clone();
  b1.geometry.attributes.uv.array.set([0, 1, 0.5, 1, 0, 0, 0.5, 0]);
  const fold = new THREE.Group();
  fold.rotation.z = 0.45;
  bill.add(fold);
  const b2 = plane(fold, 0.11, 0.09, billMat, 0.055, 0, 0);
  b2.rotation.x = -Math.PI / 2;
  b2.geometry = b2.geometry.clone();
  b2.geometry.attributes.uv.array.set([0.5, 1, 1, 1, 0.5, 0, 1, 0]);
  b1.castShadow = b2.castShadow = false;

  const steamMats = [];
  const steam = [];
  for (const [x, z] of [[-0.11, -0.1], [0.11, -0.1], [-0.11, 0.1], [0.11, 0.1]]) {
    cyl(tray, 0.065, 0.06, 0.012, shirt, x, 0.02, z, 18);
    cyl(tray, 0.05, 0.04, 0.075, shirt, x, 0.065, z, 18);
    cyl(tray, 0.046, 0.046, 0.006, toon('#6b3a1e'), x, 0.1, z, 18);
    const hnd = tor(tray, 0.022, 0.007, shirt, x + 0.055, 0.068, z, Math.PI * 2, 10);
    hnd.rotation.y = Math.PI / 2;
    for (let k = 0; k < 2; k++) {
      const m = glow('#ffffff', { opacity: 0.5, unique: true });
      steamMats.push(m);
      const sp = sph(tray, 0.025, m, x, 0.13, z, 8, 6);
      sp.castShadow = false;
      steam.push({ sp, m, x, z, ph: Math.random() + k * 0.5 });
    }
  }

  // ---------------- Comportamiento ----------------
  const state = { walking: false, dist: 0, curve: null, len: 0, speed: 3.0, done: false, hop: 0, wave: 0 };
  const tmp = new THREE.Vector3();
  const tan = new THREE.Vector3();

  function setPathPose(u) {
    state.curve.getPointAt(u, tmp);
    state.curve.getTangentAt(u, tan);
    root.position.set(tmp.x, 0, tmp.z);
    root.rotation.y = Math.atan2(tan.x, tan.z);
  }

  const api = {
    root, tray, head,
    setPath(points) {
      state.curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
      state.len = state.curve.getLength();
    },
    start() {
      state.dist = 0; state.walking = true; state.done = false;
      root.visible = true;
      setPathPose(0);
    },
    placeAtEnd() {
      state.dist = state.len; state.walking = false; state.done = true;
      root.visible = true;
      setPathPose(1);
      legs.forEach((l) => (l.rotation.x = 0));
      body.position.y = 0;
    },
    hide() { root.visible = false; state.walking = false; },
    get walking() { return state.walking; },
    get done() { return state.done; },
    get duration() { return state.len / state.speed; },
    hop() { state.hop = 1; },
    // posición de cámara "delante" de ella
    framing(dist = 2.0, side = 0.45, h = 1.5) {
      const fwd = new THREE.Vector3(Math.sin(root.rotation.y), 0, Math.cos(root.rotation.y));
      const right = new THREE.Vector3(fwd.z, 0, -fwd.x);
      const pos = root.position.clone().addScaledVector(fwd, dist).addScaledVector(right, side);
      pos.y = h;
      const target = root.position.clone().addScaledVector(fwd, 0.25);
      target.y = 1.32;
      return { pos, target };
    },
    endFraming(dist, side, h) {
      const keepD = state.dist, keepW = state.walking, keepV = root.visible;
      setPathPose(1);
      const f = api.framing(dist, side, h);
      if (keepD < state.len) setPathPose(Math.min(1, keepD / state.len));
      state.walking = keepW; root.visible = keepV;
      return f;
    },
    update(t, dt) {
      if (!root.visible) return;
      let walkAmt = 0;
      if (state.walking) {
        state.dist = Math.min(state.len, state.dist + state.speed * dt);
        setPathPose(state.dist / state.len);
        walkAmt = 1;
        if (state.dist >= state.len) { state.walking = false; state.done = true; state.hop = 0.6; }
      }
      const ph = state.dist * 4.2;
      legs[0].rotation.x = Math.sin(ph) * 0.55 * walkAmt;
      legs[1].rotation.x = -Math.sin(ph) * 0.55 * walkAmt;
      // rebote al caminar + saltito
      if (state.hop > 0) state.hop = Math.max(0, state.hop - dt * 1.6);
      const hopY = Math.sin(state.hop * Math.PI) * 0.12;
      body.position.y = Math.abs(Math.sin(ph)) * 0.045 * walkAmt + hopY;
      body.rotation.z = Math.sin(ph) * 0.04 * walkAmt;
      tray.rotation.z = -body.rotation.z;
      head.rotation.z = walkAmt ? Math.sin(ph) * 0.05 : Math.sin(t * 1.4) * 0.06;
      head.rotation.x = walkAmt ? 0 : Math.sin(t * 0.9) * 0.03;
      pony.rotation.x = Math.sin(ph * 0.5 + t * 2) * 0.25 * walkAmt + Math.sin(t * 2) * 0.05;
      pony.rotation.z = Math.cos(ph) * 0.2 * walkAmt;
      if (!walkAmt) body.scale.y = 1 + Math.sin(t * 2.2) * 0.008;
      // vapor
      for (const s of steam) {
        const k = (t * 0.6 + s.ph) % 1;
        s.sp.position.set(s.x + Math.sin(t * 3 + s.ph * 6) * 0.015, 0.12 + k * 0.22, s.z);
        s.sp.scale.setScalar(0.6 + k * 1.2);
        s.m.opacity = 0.55 * (1 - k);
      }
    },
  };
  root.visible = false;
  return api;
}

// Mochila (origen en el centro)
export function makeBackpack(color = '#e8342f') {
  const g = new THREE.Group();
  const main = toon(color);
  const dark = toon('#2a2c38');
  rbox(g, 0.34, 0.42, 0.18, 0.08, main, 0, 0, 0, 3);
  rbox(g, 0.26, 0.17, 0.07, 0.04, toon(color, { emissive: '#000000' }), 0, -0.08, 0.1);
  rbox(g, 0.27, 0.025, 0.02, 0.01, dark, 0, 0.0, 0.135);
  tor(g, 0.05, 0.015, dark, 0, 0.23, 0, Math.PI, 10).rotation.y = Math.PI / 2;
  for (const s of [-1, 1]) rbox(g, 0.05, 0.36, 0.03, 0.015, dark, s * 0.09, 0, -0.1);
  return g;
}

// DNI (tarjeta celeste con foto)
let dniTex = null;
export function makeIdCard() {
  dniTex ||= canvasTex(172, 108, (ctx, w, h) => {
    ctx.fillStyle = '#cfe8f6'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#5a9cc9'; ctx.fillRect(0, 0, w, 18);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('DNI · ARGENTINA', 8, 13);
    ctx.fillStyle = '#e9c9a8'; ctx.fillRect(10, 28, 44, 56);
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(10, 28, 44, 16);
    ctx.fillStyle = '#7a8aa0';
    for (let i = 0; i < 4; i++) ctx.fillRect(64, 32 + i * 14, 90 - i * 12, 6);
  });
  const g = new THREE.Group();
  rbox(g, 0.12, 0.078, 0.006, 0.003, toon('#ffffff'), 0, 0, 0);
  const face = plane(g, 0.112, 0.07, toon('#ffffff', { map: dniTex }), 0, 0, 0.0035);
  face.castShadow = false;
  const back = plane(g, 0.112, 0.07, toon('#ffffff', { map: dniTex }), 0, 0, -0.0035);
  back.rotation.y = Math.PI; back.castShadow = false;
  return g;
}
