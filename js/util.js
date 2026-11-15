// Utilidades: coordenadas, materiales "toon", geometrías y texturas
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------- Coordenadas del croquis -> metros ----------
export const PXM = 20;          // 20 px del croquis = 1 metro
export const OX = 595, OY = 324; // centro de la sala en px
export const X = (px) => (px - OX) / PXM;
export const Z = (py) => (py - OY) / PXM;
export const P = (px, py, h = 0) => new THREE.Vector3(X(px), h, Z(py));
export const toPx = (v) => ({ x: v.x * PXM + OX, y: v.z * PXM + OY });
export const deg = (d) => (d * Math.PI) / 180;

// ---------- Paleta ----------
export const C = {
  ink: '#1b1f3b',
  wall: '#2c4fb5',
  wallDark: '#21388a',
  wains: '#3b2a80',
  gold: '#f4b52b',
  red: '#e8342f',
  redDark: '#a8211f',
  orange: '#ff8a1f',
  yellow: '#ffd23a',
  green: '#3fae49',
  felt: '#2f9a46',
  wood: '#c0703a',
  woodDark: '#7a3f1c',
  teal: '#5fd0d8',
  sky: '#9fdcf0',
  cream: '#fff1d0',
  white: '#ffffff',
  black: '#23232e',
  steel: '#a9b5c9',
  purple: '#7b3fc4',
  pink: '#ff5fa2',
  blue: '#3b7be8',
  skin: '#ffd2b0',
};

// ---------- Materiales ----------
const gradientMap = (() => {
  const data = new Uint8Array([95, 155, 215, 255]);
  const t = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
})();

const matCache = new Map();
export function toon(color, o = {}) {
  const key = `t|${color}|${o.emissive || ''}|${o.ei ?? 1}|${o.opacity ?? 1}|${o.side ?? 0}|${o.map?.uuid || ''}`;
  if (!o.unique && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshToonMaterial({ color, gradientMap });
  if (o.emissive) { m.emissive = new THREE.Color(o.emissive); m.emissiveIntensity = o.ei ?? 1; }
  if (o.opacity !== undefined && o.opacity < 1) { m.transparent = true; m.opacity = o.opacity; m.depthWrite = false; }
  if (o.side) m.side = o.side;
  if (o.map) m.map = o.map;
  if (!o.unique) matCache.set(key, m);
  return m;
}

export function glow(color, o = {}) {
  const key = `g|${color}|${o.opacity ?? 1}|${o.map?.uuid || ''}|${o.side ?? 0}`;
  if (!o.unique && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshBasicMaterial({ color, toneMapped: false });
  if (o.map) m.map = o.map;
  if (o.opacity !== undefined && o.opacity < 1) { m.transparent = true; m.opacity = o.opacity; m.depthWrite = false; }
  if (o.side) m.side = o.side;
  if (!o.unique) matCache.set(key, m);
  return m;
}

// ---------- Geometrías (cacheadas) ----------
const geoCache = new Map();
function cached(key, make) {
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g;
}
export function rboxG(w, h, d, r = 0.05, seg = 2) {
  r = Math.max(0.0005, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
  return cached(`rb${w}|${h}|${d}|${r}|${seg}`, () => new RoundedBoxGeometry(w, h, d, seg, r));
}

export function add(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
export const rbox = (p, w, h, d, r, mat, x, y, z, seg) => add(p, rboxG(w, h, d, r, seg), mat, x, y, z);
export const box = (p, w, h, d, mat, x, y, z) =>
  add(p, cached(`b${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d)), mat, x, y, z);
export const cyl = (p, rt, rb, h, mat, x, y, z, seg = 24, open = false) =>
  add(p, cached(`c${rt}|${rb}|${h}|${seg}|${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)), mat, x, y, z);
export const sph = (p, r, mat, x, y, z, ws = 20, hs = 14) =>
  add(p, cached(`s${r}|${ws}|${hs}`, () => new THREE.SphereGeometry(r, ws, hs)), mat, x, y, z);
export const tor = (p, R, r, mat, x, y, z, arc = Math.PI * 2, rs = 32) =>
  add(p, cached(`t${R}|${r}|${arc}|${rs}`, () => new THREE.TorusGeometry(R, r, 10, rs, arc)), mat, x, y, z);
export const cap = (p, r, len, mat, x, y, z) =>
  add(p, cached(`k${r}|${len}`, () => new THREE.CapsuleGeometry(r, len, 6, 14)), mat, x, y, z);
export const plane = (p, w, h, mat, x, y, z) =>
  add(p, cached(`p${w}|${h}`, () => new THREE.PlaneGeometry(w, h)), mat, x, y, z);
export const cone = (p, r, h, mat, x, y, z, seg = 24, open = false) =>
  add(p, cached(`n${r}|${h}|${seg}|${open}`, () => new THREE.ConeGeometry(r, h, seg, 1, open)), mat, x, y, z);

// Cápsula entre dos puntos (brazos, piernas)
const UP = new THREE.Vector3(0, 1, 0);
export function limb(p, a, b, r, mat) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = add(p, new THREE.CapsuleGeometry(r, Math.max(0.001, len), 5, 12), mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(UP, dir.normalize());
  return m;
}

// ---------- Texturas de canvas ----------
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.userData.ctx = ctx;
  t.userData.draw = draw;
  return t;
}
export function redraw(tex, ...args) {
  const ctx = tex.userData.ctx;
  tex.userData.draw(ctx, ctx.canvas.width, ctx.canvas.height, ...args);
  tex.needsUpdate = true;
}

export function txt(ctx, s, x, y, o = {}) {
  const { font = 'Lilita One', size = 60, fill = '#fff', stroke = C.ink, lw = 8, align = 'center', base = 'middle', weight = '' } = o;
  ctx.font = `${weight} ${size}px "${font}"`;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  ctx.lineJoin = 'round';
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.strokeText(s, x, y); }
  ctx.fillStyle = fill;
  ctx.fillText(s, x, y);
}
export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// Caja invisible para detectar clicks
const hitMat = new THREE.MeshBasicMaterial({ visible: false });
export function hitbox(p, w, h, d, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hitMat);
  m.position.set(x, y, z);
  m.userData.dynamic = true;
  p.add(m);
  return m;
}

// ---------- Marcas ----------
export function dynamic(obj) { obj.userData.dynamic = true; return obj; }
export function noShadow(obj) { obj.traverse((o) => { if (o.isMesh) o.castShadow = false; }); return obj; }

// Fusiona toda la geometría estática por material (muchas menos draw calls)
export function bakeStatic(root) {
  root.updateMatrixWorld(true);
  const groups = new Map();
  const remove = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material)) return;
    for (let p = o; p; p = p.parent) if (p.userData.dynamic) return;
    let g = o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.index) {
      const n = g.attributes.position.count;
      const idx = new (n > 65535 ? Uint32Array : Uint16Array)(n);
      for (let i = 0; i < n; i++) idx[i] = i;
      g.setIndex(new THREE.BufferAttribute(idx, 1));
    }
    g.clearGroups();
    g.applyMatrix4(o.matrixWorld);
    const key = o.material.uuid + (o.castShadow ? '|c' : '|n');
    if (!groups.has(key)) groups.set(key, { mat: o.material, cast: o.castShadow, geos: [] });
    groups.get(key).geos.push(g);
    remove.push(o);
  });
  remove.forEach((o) => o.removeFromParent());
  for (const { mat, cast, geos } of groups.values()) {
    const merged = mergeGeometries(geos, false);
    if (!merged) continue;
    const m = new THREE.Mesh(merged, mat);
    m.castShadow = cast && !mat.transparent;
    m.receiveShadow = true;
    m.matrixAutoUpdate = false;
    root.add(m);
  }
}

export const ease = {
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
};
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));
export const rand = (a, b) => a + Math.random() * (b - a);
