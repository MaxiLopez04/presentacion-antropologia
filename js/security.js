// Cámaras de seguridad: domos en el techo y cámaras de pared
// (las tres de arriba del cajero siguen al espectador en la diapositiva 6)
import * as THREE from 'three';
import { X, Z, toon, glow, rbox, cyl, sph, tor, add, canvasTex, txt, rr, plane, dynamic } from './util.js';
import { DOME_CAMS, ATM_CAMS } from './layout.js';

const H = 5.5;
const ZB = Z(528) - 0.15; // cara interna de la pared sur
const XR = X(1145) - 0.15;
const ZT = Z(120) + 0.15;

function dome(root, x, z) {
  const g = new THREE.Group();
  g.position.set(x, H, z);
  root.add(g);
  cyl(g, 0.21, 0.21, 0.05, toon('#ececf2'), 0, -0.025, 0, 24);
  tor(g, 0.17, 0.02, toon('#d6d6e0'), 0, -0.05, 0, Math.PI * 2, 24).rotation.x = Math.PI / 2;
  const d = add(g, new THREE.SphereGeometry(0.155, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon('#2b2f3d'), 0, -0.05, 0);
  d.castShadow = false;
  sph(g, 0.03, glow('#5a6a9a'), 0.05, -0.15, 0.06, 8, 6).castShadow = false;
}

// Cámara de pared tipo "bala". Local +z apunta hacia la sala.
function wallCam(root, pos, rotY, scale = 1) {
  const g = new THREE.Group();
  g.position.copy(pos);
  g.rotation.y = rotY;
  g.scale.setScalar(scale);
  root.add(g);
  const white = toon('#f2f2f6');
  const dark = toon('#22252f');
  rbox(g, 0.2, 0.26, 0.04, 0.02, white, 0, 0, 0.02);
  const arm = cyl(g, 0.028, 0.028, 0.24, toon('#c9ced8'), 0, 0, 0.15, 10);
  arm.rotation.x = Math.PI / 2;
  sph(g, 0.05, toon('#c9ced8'), 0, 0, 0.27, 10, 8);
  const pivot = new THREE.Group();
  pivot.position.set(0, 0, 0.27);
  g.add(pivot);
  rbox(pivot, 0.17, 0.16, 0.38, 0.06, white, 0, 0.0, 0.14, 3);
  rbox(pivot, 0.22, 0.03, 0.44, 0.015, white, 0, 0.1, 0.16);
  const ring = cyl(pivot, 0.065, 0.065, 0.04, dark, 0, 0, 0.34, 18);
  ring.rotation.x = Math.PI / 2;
  const lens = cyl(pivot, 0.045, 0.045, 0.012, glow('#2d4a8a'), 0, 0, 0.362, 18);
  lens.rotation.x = Math.PI / 2;
  lens.castShadow = false;
  sph(pivot, 0.016, glow('#9fd0ff'), 0.012, 0.014, 0.37, 8, 6).castShadow = false;
  const ledMat = glow('#ff2a2a', { unique: true });
  sph(pivot, 0.018, ledMat, 0.055, -0.05, 0.33, 8, 6).castShadow = false;
  dynamic(pivot);
  return { pivot, ledMat };
}

export function buildCameras(root, R) {
  for (const [px, py] of DOME_CAMS) dome(root, X(px), Z(py));

  const cams = [];
  // las tres de arriba del cajero (pared sur, mirando hacia la sala)
  ATM_CAMS.forEach((px, i) => {
    const c = wallCam(root, new THREE.Vector3(X(px), 4.05, ZB), Math.PI, 1.6);
    c.home = new THREE.Vector3(X(px) + (i - 1) * 2.5, 0.8, ZB - 6);
    c.atm = true;
    cams.push(c);
  });
  // cartel "zona vigilada"
  const tex = canvasTex(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#ffd23a'; rr(ctx, 0, 0, w, h, 18); ctx.fill();
    ctx.lineWidth = 10; ctx.strokeStyle = '#1b1f3b'; rr(ctx, 5, 5, w - 10, h - 10, 14); ctx.stroke();
    txt(ctx, '● ZONA VIGILADA', w / 2, h / 2 + 4, { size: 60, fill: '#1b1f3b', lw: 0 });
  });
  const sign = plane(root, 1.6, 0.4, glow('#ffffff', { map: tex }), X(882), 3.42, ZB - 0.02);
  sign.rotation.y = Math.PI;
  sign.castShadow = false;
  // algunas cámaras de pared en las esquinas
  for (const [x, z, ry] of [[X(150), ZT, 0.6], [X(1000), ZT, -0.5], [XR, Z(380), -Math.PI / 2 - 0.4], [X(300), ZB, Math.PI + 0.5]]) {
    const c = wallCam(root, new THREE.Vector3(x, 4.4, z), ry);
    c.home = null;
    cams.push(c);
  }

  // animación: patrullan; las del cajero miran al espectador en la diapositiva 6
  const q0 = new THREE.Quaternion();
  const look = new THREE.Vector3();
  cams.forEach((c, i) => { c.phase = i * 1.3; });
  R.updaters.push((t, dt) => {
    const watch = R.watch?.();
    for (const c of cams) {
      if (c.atm && watch) look.copy(watch);
      else if (c.home) look.set(c.home.x + Math.sin(t * 0.35 + c.phase) * 3, c.home.y, c.home.z);
      else {
        c.pivot.rotation.set(0.45, Math.sin(t * 0.3 + c.phase) * 0.7, 0);
        c.ledMat.color.set(Math.sin(t * 3 + c.phase) > 0 ? '#ff2a2a' : '#5a0a0a');
        continue;
      }
      q0.copy(c.pivot.quaternion);
      c.pivot.lookAt(look);
      const target = c.pivot.quaternion.clone();
      c.pivot.quaternion.copy(q0).slerp(target, 1 - Math.exp(-(watch && c.atm ? 5 : 2) * dt));
      c.ledMat.color.set(Math.sin(t * (watch && c.atm ? 9 : 3) + c.phase) > 0 ? '#ff2a2a' : '#5a0a0a');
    }
  });
}
