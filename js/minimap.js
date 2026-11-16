// Minimapa dibujado a partir del croquis (coordenadas en px)
import { BUILDING, SLOTS, MEGA_SLOTS, ROULETTE, MARKERS, MAP_RECTS, WORKER_PATH, DOME_CAMS, ATM_CAMS } from './layout.js';
import { toPx } from './util.js';

export function createMinimap(canvas, onMarker) {
  const W = 260, Hh = 97;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = Hh * dpr;
  const ctx = canvas.getContext('2d');
  const s = W / (BUILDING.x2 - BUILDING.x1 + 20);
  const tx = (x) => (x - BUILDING.x1 + 10) * s;
  const ty = (y) => (y - BUILDING.y1 + 4) * s;
  const rect = ([x1, y1, x2, y2], fill) => { ctx.fillStyle = fill; ctx.fillRect(tx(x1), ty(y1), (x2 - x1) * s, (y2 - y1) * s); };

  let current = 0;

  function draw(camPos, camDir) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, Hh);
    // sala
    ctx.fillStyle = '#3a1d6e';
    ctx.fillRect(tx(BUILDING.x1), ty(BUILDING.y1), (BUILDING.x2 - BUILDING.x1) * s, (BUILDING.y2 - BUILDING.y1) * s);
    ctx.strokeStyle = '#1b1f3b'; ctx.lineWidth = 2.5;
    ctx.strokeRect(tx(BUILDING.x1), ty(BUILDING.y1), (BUILDING.x2 - BUILDING.x1) * s, (BUILDING.y2 - BUILDING.y1) * s);
    // entrada
    ctx.fillStyle = '#5fd0f0';
    ctx.fillRect(tx(BUILDING.x1) - 2, ty(210), 4, (440 - 210) * s);
    // bloques
    rect(MAP_RECTS.guard, '#2346a8');
    rect(MAP_RECTS.staff, '#ff9f43');
    rect(MAP_RECTS.escalatorTop, '#a9b5c9');
    rect(MAP_RECTS.escalatorBottom, '#a9b5c9');
    rect(MAP_RECTS.vending, '#8fd6ea');
    rect(MAP_RECTS.stairs, '#e8342f');
    rect(MAP_RECTS.atm, '#3fae49');
    rect(MAP_RECTS.elevator, '#a9b5c9');
    rect(MAP_RECTS.caja, '#7a3f1c');
    // ruleta
    ctx.beginPath(); ctx.arc(tx(ROULETTE.x), ty(ROULETTE.y), 47 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#e8342f'; ctx.fill();
    // tragamonedas
    ctx.fillStyle = '#ff8a1f';
    for (const [x, y] of SLOTS) ctx.fillRect(tx(x) - 2.5, ty(y) - 2.5, 5, 5);
    ctx.fillStyle = '#c38bff';
    for (const [x, y] of MEGA_SLOTS) ctx.fillRect(tx(x) - 3, ty(y) - 3, 6, 6);
    // cámaras de seguridad
    ctx.fillStyle = '#1b1f3b';
    for (const [x, y] of DOME_CAMS) { ctx.beginPath(); ctx.arc(tx(x), ty(y), 2.2, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ff2a2a';
    for (const x of ATM_CAMS) { ctx.beginPath(); ctx.arc(tx(x), ty(524), 2.2, 0, Math.PI * 2); ctx.fill(); }
    // recorrido de la moza
    ctx.setLineDash([3, 3]); ctx.strokeStyle = '#ff5a5a'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    WORKER_PATH.forEach(([x, y], i) => (i ? ctx.lineTo(tx(x), ty(y)) : ctx.moveTo(tx(x), ty(y))));
    ctx.stroke(); ctx.setLineDash([]);
    // marcas
    for (const m of MARKERS) {
      const on = m.slide === current;
      ctx.beginPath(); ctx.arc(tx(m.x), ty(m.y), on ? 8 : 6.5, 0, Math.PI * 2);
      ctx.fillStyle = on ? '#ffd23a' : '#ffffff'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#1b1f3b'; ctx.stroke();
      ctx.fillStyle = '#1b1f3b'; ctx.font = '700 9px Fredoka, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(m.slide), tx(m.x), ty(m.y) + 0.5);
    }
    // cámara
    if (camPos) {
      const p = toPx(camPos);
      const cx = Math.max(2, Math.min(W - 2, tx(p.x))), cy = ty(p.y);
      const a = Math.atan2(camDir.z, camDir.x);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 22, -0.45, 0.45); ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-4, -5); ctx.lineTo(-4, 5); ctx.closePath();
      ctx.fillStyle = '#ffd23a'; ctx.fill(); ctx.strokeStyle = '#1b1f3b'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }
  }

  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * W, my = ((e.clientY - r.top) / r.height) * Hh;
    let best = null, bd = 14;
    for (const m of MARKERS) {
      const d = Math.hypot(tx(m.x) - mx, ty(m.y) - my);
      if (d < bd) { bd = d; best = m; }
    }
    if (best) onMarker(best.slide);
  });

  return { draw, setCurrent: (i) => (current = i) };
}
