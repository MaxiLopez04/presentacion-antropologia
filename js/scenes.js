// Escenas de las paradas nuevas: recepción del hall, mapa de seguridad
// y la tragamonedas descompuesta con el técnico.
import * as THREE from 'three';
import { C, X, Z, toon, glow, rbox, box, cyl, sph, tor, plane, cone, add, canvasTex, redraw, txt, rr, dynamic, limb } from './util.js';
import { makeStanding, makePatron, makeBackpack, makeIdCard } from './characters.js';
import { BUILDING, HALL, NICHE, SLOTS, MEGA_SLOTS, ROULETTE, MAP_RECTS, DOME_CAMS, ATM_CAMS } from './layout.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ZB = Z(528) - 0.15; // cara interna de la pared sur

// =============================================================
//  Hall: recepción + seguridad empotradas en la pared izquierda, con
//  guardarropa y gente dejando la mochila / mostrando el DNI
// =============================================================
export function buildReception(root, R) {
  // Recepción y seguridad en un solo bloque empotrado en la pared norte del
  // hall (izquierda al entrar): revestimiento de madera, techo bajo con LED,
  // barra cerrada de punta a punta. El personal entra por un pasillo interno
  // con puerta del lado del casino (cara este del bloque).
  const nx1 = X(NICHE.x1), nsp = X(NICHE.split), nce = X(NICHE.counterEnd), nx2 = X(NICHE.x2) - 0.15;
  const nw = nx2 - nx1, cx = (nx1 + nx2) / 2;
  const zf = Z(HALL.y1);              // plano de la pared (abertura)
  const zb = zf - NICHE.depth;        // fondo del bloque
  const ah = NICHE.height;
  const zm = (zf + zb) / 2;
  const recC = (nx1 + nsp) / 2, secC = (nsp + nce) / 2;
  const wood = toon('#b9824f'), woodL = toon('#d9b98c'), woodD = toon('#8a5a34');
  box(root, nw, 0.03, NICHE.depth, toon('#d8cbb4'), cx, 0.0, zm).castShadow = false;   // piso
  box(root, nw + 0.2, 0.2, NICHE.depth + 0.15, wood, cx, -0.1, zm).castShadow = false; // base
  box(root, nw + 0.2, ah, 0.2, wood, cx, ah / 2, zb - 0.1);                              // fondo
  box(root, 0.2, ah, NICHE.depth + 0.15, wood, nx1 - 0.1, ah / 2, zm + 0.075);          // costado oeste (hasta la cara de la pared)
  box(root, nw + 0.2, 0.14, NICHE.depth - 0.15, toon('#f2ebe0'), cx, ah + 0.07, zm - 0.075); // techo (termina en el dintel)
  // listones verticales en el fondo (como el revestimiento de la foto)
  for (let x = nx1 + 0.25; x < nx2 - 0.1; x += 0.3) box(root, 0.03, ah, 0.02, woodD, x, ah / 2, zb + 0.005);
  // tabique bajo entre recepción y seguridad (deja pasar detrás de la barra)
  box(root, 0.1, ah, NICHE.depth - 1.15, wood, nsp, ah / 2, zb + (NICHE.depth - 1.15) / 2);
  // tabique del pasillo del personal (separa la barra del pasillo hacia la puerta)
  box(root, 0.1, ah, NICHE.depth - 1.0, wood, nce + 0.05, ah / 2, zf + 0.15 - (NICHE.depth - 1.0) / 2);
  // tira de LED en el techo y en las esquinas del fondo
  box(root, nce - nx1 - 0.3, 0.04, 0.08, glow('#ffd79a'), (nx1 + nce) / 2, ah - 0.02, zf - 0.3).castShadow = false;
  for (const x of [nx1 + 0.05, nsp - 0.08, nsp + 0.08, nce - 0.05]) box(root, 0.04, ah - 0.1, 0.04, glow('#ffd79a'), x, ah / 2, zb + 0.05).castShadow = false;
  for (const [x, i] of [[recC, 7], [secC, 6]]) {
    const l = new THREE.PointLight('#ffd9a8', i, 6, 1.6);
    l.position.set(x, ah - 0.45, zf - 0.9);
    root.add(l);
  }
  // marco de madera clara alrededor de la abertura
  const fz = zf + 0.15 + 0.06;
  for (const x of [nx1 - 0.09, nce + 0.09]) rbox(root, 0.18, ah + 0.18, 0.12, 0.03, woodL, x, (ah + 0.18) / 2, fz);
  rbox(root, nce - nx1 + 0.36, 0.18, 0.12, 0.03, woodL, (nx1 + nce) / 2, ah + 0.09, fz);

  // carteles sobre la abertura (mismo estilo para recepción y seguridad)
  const plate = (title, sub) => canvasTex(640, 200, (ctx, w, h) => {
    ctx.fillStyle = '#1b1f3b'; rr(ctx, 0, 0, w, h, 24); ctx.fill();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 8; rr(ctx, 8, 8, w - 16, h - 16, 18); ctx.stroke();
    txt(ctx, title, w / 2, 74, { size: 76, fill: C.yellow, lw: 0 });
    txt(ctx, sub, w / 2, 148, { font: 'Fredoka', weight: '600', size: 33, fill: '#ffffff', lw: 0 });
  });
  const signTex = plate('RECEPCIÓN', 'Dejá tu mochila · Mostrá tu DNI');
  const secTex = plate('SEGURIDAD', 'Cámaras · Control de acceso');
  for (const [x, tex] of [[recC, signTex], [secC, secTex]]) {
    rbox(root, 2.75, 0.95, 0.06, 0.04, toon(C.gold), x, ah + 0.85, zf + 0.18);
    plane(root, 2.6, 0.81, glow('#e8e0d0', { map: tex }), x, ah + 0.85, zf + 0.215).castShadow = false;
  }

  // ---------- barra cerrada de punta a punta ----------
  const bl = nce - nx1, bc = (nx1 + nce) / 2, bz = zf - 0.05;
  rbox(root, bl, 1.0, 0.6, 0.06, toon('#4a2c20'), bc, 0.5, bz);
  rbox(root, bl + 0.1, 0.07, 0.72, 0.03, toon('#efe3c8'), bc, 1.04, bz);
  rbox(root, bl, 0.06, 0.62, 0.02, toon(C.gold), bc, 0.06, bz);
  box(root, bl - 0.1, 0.03, 0.03, glow('#ffd79a'), bc, 0.13, bz + 0.31).castShadow = false; // LED al pie

  // ---------- guardarropa con mochilas (detrás de la recepcionista) ----------
  const gw = nsp - nx1 - 0.7, gh = 2.2, cols = 5, rows = 3, cw = (gw - 0.2) / cols, ch = (gh - 0.2) / rows;
  const sz = zb + 0.21, gx = recC - 0.05;
  // casilleros abiertos: fondo, marco exterior, estantes y divisiones
  const lockerD = toon('#6a4630');
  box(root, gw, gh, 0.04, toon('#4a2e1e'), gx, gh / 2, zb + 0.02);
  for (const x of [gx - gw / 2 + 0.05, gx + gw / 2 - 0.05]) box(root, 0.1, gh, 0.42, lockerD, x, gh / 2, sz);
  box(root, gw, 0.1, 0.42, lockerD, gx, 0.05, sz);
  box(root, gw, 0.1, 0.42, lockerD, gx, gh - 0.05, sz);
  for (let i = 1; i < cols; i++) box(root, 0.05, gh - 0.2, 0.44, toon('#8a5e3c'), gx - (gw - 0.2) / 2 + i * cw, gh / 2, sz + 0.01);
  for (let j = 1; j < rows; j++) box(root, gw - 0.2, 0.05, 0.44, toon('#8a5e3c'), gx, 0.1 + j * ch, sz + 0.01);
  const bagCols = ['#e8342f', '#3b7be8', '#3fae49', '#ff8a1f', '#7b3fc4', '#2fb8c4', '#ff5fa2', '#f2c46d'];
  let k = 0;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    if ((i + j * 3) % 4 === 3) continue; // algunos casilleros vacíos
    const b = makeBackpack(bagCols[k++ % bagCols.length]);
    b.scale.setScalar(0.85);
    b.position.set(gx - (gw - 0.2) / 2 + cw * (i + 0.5), 0.1 + ch * j + 0.24, sz + 0.12);
    root.add(b);
  }
  const lbl = canvasTex(400, 90, (ctx, w, h) => {
    ctx.fillStyle = C.yellow; rr(ctx, 0, 0, w, h, 16); ctx.fill();
    txt(ctx, 'GUARDARROPA', w / 2, h / 2 + 3, { size: 50, fill: C.ink, lw: 0 });
  });
  plane(root, 1.3, 0.3, glow('#e8e0d0', { map: lbl }), gx, gh + 0.4, zb + 0.02).castShadow = false;

  // ---------- seguridad: muro de monitores y escritorio ----------
  rbox(root, 2.3, 1.05, 0.08, 0.03, toon(C.ink), secC - 0.35, 1.85, zb + 0.05);
  const feeds = [];
  for (let i = 0; i < 6; i++) {
    const sx = secC - 0.35 + ((i % 3) - 1) * 0.74, sy = 2.08 - Math.floor(i / 3) * 0.48;
    const tex = cctvTex(i);
    feeds.push(tex);
    plane(root, 0.68, 0.42, glow('#ffffff', { map: tex }), sx, sy, zb + 0.1).castShadow = false;
  }
  // las cámaras se actualizan unas 4 veces por segundo (hora, gente, REC)
  let feedT = 0;
  R.updaters.push((t) => {
    if (t - feedT < 0.25) return;
    feedT = t;
    for (const tex of feeds) redraw(tex, t);
  });
  rbox(root, 2.2, 0.78, 0.55, 0.04, wood, secC - 0.35, 0.39, zb + 0.3);
  rbox(root, 2.3, 0.05, 0.62, 0.02, toon('#efe3c8'), secC - 0.35, 0.8, zb + 0.32);
  // silla vacía frente a los monitores
  cyl(root, 0.2, 0.22, 0.06, toon(C.ink), secC - 0.5, 0.52, zb + 0.95, 14);
  cyl(root, 0.03, 0.03, 0.5, toon('#c9cfd8'), secC - 0.5, 0.25, zb + 0.95, 8);
  // detector de metales de mano sobre la barra
  const wand = rbox(root, 0.07, 0.04, 0.32, 0.02, toon(C.ink), secC + 0.3, 1.1, bz + 0.05);
  wand.rotation.y = 0.5;

  // ---------- puerta del personal (cara este, del lado del casino) ----------
  const ex = X(NICHE.x2), dzc = zf - NICHE.depth / 2;
  for (const s of [-1, 1]) rbox(root, 0.36, 2.4, 0.12, 0.03, woodL, ex, 1.2, dzc + s * 0.6);
  rbox(root, 0.36, 0.14, 1.32, 0.03, woodL, ex, 2.37, dzc);
  rbox(root, 0.06, 2.25, 1.06, 0.02, toon('#9a6338'), ex + 0.08, 1.125, dzc);
  sph(root, 0.045, toon(C.gold), ex + 0.13, 1.05, dzc + 0.38, 10, 8);
  const staffTex = canvasTex(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#1b1f3b'; rr(ctx, 0, 0, w, h, 18); ctx.fill();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 6; rr(ctx, 6, 6, w - 12, h - 12, 14); ctx.stroke();
    txt(ctx, 'SOLO PERSONAL', w / 2, h / 2 + 4, { size: 60, fill: C.yellow, lw: 0 });
  });
  const st = plane(root, 1.3, 0.33, glow('#e8e0d0', { map: staffTex }), ex + 0.19, 2.7, dzc);
  st.rotation.y = Math.PI / 2;
  st.castShadow = false;

  // Lo de la recepción va en un grupo: +z local es hacia el centro del hall.
  const rc = new THREE.Group();
  rc.position.set(recC, 0, bz);
  root.add(rc);
  const desk = new THREE.Group();
  rc.add(desk);
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
//  Imagen de cámara de seguridad para los monitores (canvas animado):
//  escena simple en verde de visión nocturna, gente que camina, nombre de
//  la cámara, hora que avanza, "REC" que titila, líneas de barrido.
// =============================================================
const CCTV = [
  ['CAM 01', 'ENTRADA'], ['CAM 02', 'SALA A'], ['CAM 03', 'RULETA'],
  ['CAM 04', 'CAJERO'], ['CAM 05', 'CAJA'], ['CAM 06', 'CALLE'],
];
function cctvTex(i) {
  const [cam, name] = CCTV[i];
  const dark = '#143826', mid = '#3f7a56', light = '#9fe0b6', hi = '#dcffe6';
  const person = (ctx, x, y, s) => {
    ctx.fillStyle = light;
    ctx.beginPath(); ctx.arc(x, y - 30 * s, 6 * s, 0, Math.PI * 2); ctx.fill();
    rr(ctx, x - 7 * s, y - 23 * s, 14 * s, 23 * s, 5 * s); ctx.fill();
  };
  return canvasTex(256, 160, (ctx, w, h, t = 0) => {
    ctx.fillStyle = dark; ctx.fillRect(0, 0, w, h);
    // piso en perspectiva con baldosas
    ctx.fillStyle = '#1f4a33';
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w, h); ctx.lineTo(w * 0.72, h * 0.42); ctx.lineTo(w * 0.28, h * 0.42); ctx.fill();
    ctx.strokeStyle = 'rgba(127,196,154,.18)'; ctx.lineWidth = 1;
    for (let k = 0; k <= 8; k++) {
      ctx.beginPath(); ctx.moveTo(w * 0.28 + (w * 0.44 * k) / 8, h * 0.42); ctx.lineTo((w * k) / 8, h); ctx.stroke();
    }
    for (let k = 1; k <= 5; k++) {
      const y = h * 0.42 + (h * 0.58) * Math.pow(k / 5, 1.6);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    // objetos según la cámara
    ctx.fillStyle = mid;
    if (i === 0) { // puerta de vidrio y mostrador
      ctx.strokeStyle = light; ctx.lineWidth = 3; ctx.strokeRect(w * 0.36, h * 0.12, w * 0.28, h * 0.32);
      ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.12); ctx.lineTo(w * 0.5, h * 0.44); ctx.stroke();
      ctx.fillStyle = mid; ctx.fillRect(w * 0.02, h * 0.5, w * 0.22, h * 0.16);
    } else if (i === 1) { // fila de tragamonedas
      for (let k = 0; k < 5; k++) {
        const x = 18 + k * 46;
        ctx.fillStyle = mid; rr(ctx, x, h * 0.18, 34, h * 0.36, 4); ctx.fill();
        ctx.fillStyle = (Math.floor(t * 2) + k) % 3 ? '#5f9c78' : hi; ctx.fillRect(x + 6, h * 0.25, 22, 14);
      }
    } else if (i === 2) { // mesa de ruleta
      ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.62, w * 0.3, h * 0.17, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = light; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.6, w * 0.13, h * 0.07, 0, 0, Math.PI * 2); ctx.stroke();
      const a = t * 3;
      ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.6); ctx.lineTo(w * 0.5 + Math.cos(a) * w * 0.13, h * 0.6 + Math.sin(a) * h * 0.07); ctx.stroke();
    } else if (i === 3) { // cajero automático
      rr(ctx, w * 0.4, h * 0.16, w * 0.2, h * 0.5, 4); ctx.fill();
      ctx.fillStyle = hi; ctx.fillRect(w * 0.43, h * 0.22, w * 0.14, h * 0.1);
      ctx.fillStyle = light; ctx.fillRect(w * 0.45, h * 0.4, w * 0.1, h * 0.03);
    } else if (i === 4) { // caja con ventanilla
      ctx.fillRect(w * 0.1, h * 0.36, w * 0.8, h * 0.18);
      ctx.strokeStyle = light; ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) ctx.strokeRect(w * (0.16 + k * 0.25), h * 0.14, w * 0.18, h * 0.2);
    } else { // calle con palmera y auto que pasa
      ctx.fillStyle = '#10241a'; ctx.fillRect(0, h * 0.42, w, h * 0.3);
      ctx.fillStyle = light;
      for (let k = 0; k < 6; k++) ctx.fillRect(((k * 50 + t * 10) % (w + 40)) - 20, h * 0.56, 22, 3);
      ctx.fillStyle = mid; ctx.fillRect(w * 0.12, h * 0.1, 6, h * 0.35);
      ctx.beginPath(); ctx.arc(w * 0.12 + 3, h * 0.12, 18, 0, Math.PI * 2); ctx.fill();
      const cx = ((t * 40) % (w + 120)) - 60;
      ctx.fillStyle = mid; rr(ctx, cx, h * 0.47, 54, 18, 6); ctx.fill();
      ctx.fillStyle = hi; ctx.fillRect(cx + 50, h * 0.52, 5, 4);
    }
    // gente caminando
    const n = i === 5 ? 1 : 2;
    for (let k = 0; k < n; k++) {
      const ph = i * 1.7 + k * 2.9;
      const x = w * (0.5 + 0.38 * Math.sin(t * 0.25 + ph)), y = h * (0.78 + 0.12 * Math.sin(ph));
      person(ctx, x, y, 0.9 + 0.3 * Math.sin(ph));
    }
    // ruido, líneas de barrido y viñeteado
    for (let k = 0; k < 60; k++) {
      ctx.fillStyle = `rgba(200,245,214,${Math.random() * 0.12})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 1);
    }
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // textos
    ctx.font = '22px "VT323", monospace'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillStyle = hi; ctx.fillText(`${cam}  ${name}`, 8, 6);
    const s = 23 * 3600 + 41 * 60 + Math.floor(t);
    const hh = String(Math.floor(s / 3600) % 24).padStart(2, '0'), mm = String(Math.floor(s / 60) % 60).padStart(2, '0'), ss = String(s % 60).padStart(2, '0');
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText(`${hh}:${mm}:${ss}`, w - 8, h - 4);
    if (Math.floor(t * 1.5) % 2 === 0) {
      ctx.fillStyle = '#ff3b3b'; ctx.beginPath(); ctx.arc(w - 46, 16, 5, 0, Math.PI * 2); ctx.fill();
      ctx.textBaseline = 'top'; ctx.fillText('REC', w - 8, 6);
    }
  });
}

// =============================================================
//  Joven en la ruleta con un cuaderno abierto (última parada).
//  Las hojas muestran el texto de slides.js (notebook.left / right).
//  Devuelve el centro y la normal de las hojas, para encuadrar la cámara.
// =============================================================
export function buildNotebookReader(root, R, rouletteCenter, content = {}) {
  // banqueta del lado este de la ruleta: mira hacia el centro y, detrás,
  // hacia el Pozo MEGA (el mismo sentido que la cámara de la parada 2)
  const kid = makePatron({
    type: 'youngM', body: '#2fb8c4', hair: '#3b2314', still: true,
    handPos: [V(-0.17, 0.33, 0.42), V(0.17, 0.33, 0.42)], // sosteniéndolo desde abajo
  });
  kid.position.set(rouletteCenter.x + 4.45, 0.75, rouletteCenter.z);
  kid.rotation.y = -Math.PI / 2; // mira al oeste
  root.add(kid);
  R.updaters.push(kid.userData.update);

  // cuaderno abierto en las manos, inclinado hacia su cara
  const W = 0.46, Hh = 0.29;
  const nb = new THREE.Group();
  nb.position.set(0, 0.47, 0.42);
  nb.rotation.x = -0.45;
  kid.add(nb);
  rbox(nb, W + 0.02, 0.012, Hh + 0.02, 0.005, toon('#1f3a8a'), 0, -0.008, 0); // tapas
  const tex = canvasTex(2048, 1290, (ctx, w, h) => drawNotebook(ctx, w, h, content));
  // material sin luz: así no se tiñe con las luces de colores de la ruleta
  const pages = plane(nb, W, Hh, glow('#ebe8e2', { map: tex }), 0, 0.002, 0);
  pages.rotation.set(-Math.PI / 2, 0, Math.PI); // texto derecho visto desde el joven
  pages.castShadow = false;
  // espiral en el lomo
  const wire = toon('#c9cfd8');
  for (let z = -Hh / 2 + 0.015; z < Hh / 2 - 0.01; z += 0.018) tor(nb, 0.009, 0.0018, wire, 0, 0.004, z, Math.PI * 2, 10);
  // lápiz apoyado en el borde de abajo de la hoja derecha
  const pen = cyl(nb, 0.004, 0.004, 0.14, toon(C.yellow), -0.13, 0.008, -0.128, 8);
  pen.rotation.set(0, 0.08, Math.PI / 2);

  kid.updateMatrixWorld(true);
  const center = nb.localToWorld(V(0, 0.002, 0));
  const normal = V(0, 1, 0).applyQuaternion(nb.getWorldQuaternion(new THREE.Quaternion())).normalize();
  return { center, normal, tex };
}

// Dibuja las dos hojas: renglones azules, margen rojo, título subrayado y
// el texto con letra manuscrita sobre los renglones. Si no entra, achica la letra.
function drawNotebook(ctx, w, h, content) {
  const half = w / 2;
  const top = 150, bottom = h - 40;   // primer renglón y límite de abajo
  const pad = 145, padR = 70;          // margen izquierdo (después de la línea roja) y derecho
  const maxW = half - pad - padR;

  // Arma los renglones de una hoja para un tamaño de letra (corta palabras)
  const layout = (p, size) => {
    ctx.font = `500 ${size}px "Caveat", cursive`;
    const rows = [];
    for (const raw of p?.lines || []) {
      const bullet = raw.startsWith('- ');
      const text = bullet ? raw.slice(2) : raw;
      if (!text.trim()) { rows.push({ text: '', indent: 0 }); continue; }
      const indent = bullet ? size * 0.8 : 0;
      let line = '', first = true;
      for (const word of text.split(/\s+/)) {
        const test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width > maxW - indent && line) {
          rows.push({ text: line, indent, bullet: bullet && first });
          first = false; line = word;
        } else line = test;
      }
      rows.push({ text: line, indent, bullet: bullet && first });
    }
    return rows;
  };
  // El interlineado depende de la letra, y los renglones del cuaderno se
  // dibujan con ese mismo interlineado: así cada línea de texto queda
  // apoyada sobre su renglón. Se elige la letra más grande que entre.
  let size = 60, lh, L, Rr;
  for (; size >= 24; size -= 2) {
    lh = Math.round(size * 1.12);
    L = layout(content.left, size);
    Rr = layout(content.right, size);
    if (top + Math.max(L.length, Rr.length) * lh <= bottom) break;
  }

  ctx.fillStyle = '#fbf7ea'; ctx.fillRect(0, 0, w, h);
  // sombra suave hacia el lomo
  for (const [x0, dir] of [[half, -1], [half, 1]]) {
    const g = ctx.createLinearGradient(x0, 0, x0 + dir * 90, 0);
    g.addColorStop(0, 'rgba(120,100,60,.28)'); g.addColorStop(1, 'rgba(120,100,60,0)');
    ctx.fillStyle = g; ctx.fillRect(Math.min(x0, x0 + dir * 90), 0, 90, h);
  }
  // renglones (el primero, en "top", es el del título)
  ctx.strokeStyle = 'rgba(80,130,200,.35)'; ctx.lineWidth = 3;
  for (let y = top; y < h - 20; y += lh) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(220,70,70,.45)'; ctx.lineWidth = 3;
  for (const x of [120, half + 120]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  // agujeros del espiral
  ctx.fillStyle = '#d9d2bd';
  for (let y = 40; y < h; y += 72) for (const x of [half - 26, half + 26]) { ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill(); }

  const ink = '#1d2f7a';
  const page = (p, rows, x0) => {
    if (!p) return;
    const left = x0 + pad;
    ctx.fillStyle = ink; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    // título, apoyado sobre el primer renglón
    ctx.font = `700 ${Math.round(size * 1.35)}px "Caveat", cursive`;
    ctx.fillText(p.title || '', left, top - 8);
    const tw = ctx.measureText(p.title || '').width;
    ctx.strokeStyle = ink; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(left, top - 2); ctx.quadraticCurveTo(left + tw / 2, top + 4, left + tw, top - 4); ctx.stroke();
    // cada línea de texto apoyada sobre el renglón siguiente
    ctx.font = `500 ${size}px "Caveat", cursive`;
    rows.forEach((r, i) => {
      const y = top + lh * (i + 1) - Math.max(4, size * 0.1);
      if (r.bullet) { ctx.beginPath(); ctx.arc(left + size * 0.25, y - size * 0.28, size * 0.11, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillText(r.text, left + r.indent, y);
    });
  };
  page(content.left, L, 0);
  page(content.right, Rr, half);
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
