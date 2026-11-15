// =============================================================
//  Control remoto: la notebook (esta página) espera conexiones del
//  celular usando PeerJS (conexión directa, sin servidor propio).
//  El celular abre remote.html escaneando el QR.
// =============================================================
export const PEER_PREFIX = 'paseocasino-';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function store(key, val) {
  try {
    if (val === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, val);
  } catch (e) { /* sin almacenamiento */ }
  return null;
}
const newCode = () => Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

export function initRemote({ getState, onCommand }) {
  const $ = (id) => document.getElementById(id);
  const modal = $('remote-modal');
  const dot = $('remote-dot');
  const statusEl = $('remote-status');
  let peer = null;
  let code = store('casino-remote-code') || newCode();
  let retries = 0;
  const conns = new Set();

  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  $('remote-warn').classList.toggle('hidden', !isLocal);

  function setStatus(text, kind = '') {
    statusEl.textContent = text;
    statusEl.className = 'remote-status ' + kind;
    dot.className = 'remote-dot ' + (conns.size ? 'on' : peer && !peer.destroyed ? 'wait' : '');
  }

  function remoteUrl() {
    const u = new URL('remote.html', location.href);
    u.search = '?c=' + code;
    u.hash = '';
    return u.toString();
  }

  function drawQR() {
    $('remote-code').textContent = code;
    const box = $('remote-qr');
    if (!window.qrcode) { box.textContent = remoteUrl(); return; }
    const qr = window.qrcode(0, 'M');
    qr.addData(remoteUrl());
    qr.make();
    box.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 1, scalable: true });
  }

  function send(conn, msg) { try { if (conn.open) conn.send(msg); } catch (e) { /* ignorar */ } }
  function broadcast() {
    if (!conns.size) return;
    const st = { type: 'state', ...getState() };
    conns.forEach((c) => send(c, st));
  }

  function start() {
    if (peer && !peer.destroyed) return;
    if (!window.Peer) { setStatus('No se pudo cargar la conexión (¿hay internet?).', 'err'); return; }
    store('casino-remote-code', code);
    store('casino-remote-on', '1');
    setStatus('Conectando…');
    peer = new window.Peer(PEER_PREFIX + code.toLowerCase(), { debug: 0 });
    const p = peer;
    setTimeout(() => { if (p === peer && !p.open && !p.destroyed) { p.destroy(); start(); } }, 9000);
    peer.on('open', () => { retries = 0; setStatus('Listo: escaneá el QR con el celular.'); });
    peer.on('connection', (conn) => {
      conn.on('open', () => {
        conns.add(conn);
        setStatus('📱 Celular conectado', 'ok');
        send(conn, { type: 'state', ...getState() });
        // si el panel del QR está abierto, cerrarlo solo
        setTimeout(() => modal.classList.add('hidden'), 900);
      });
      conn.on('data', (d) => { if (d && typeof d === 'object') onCommand(d); });
      const drop = () => { conns.delete(conn); setStatus(conns.size ? '📱 Celular conectado' : 'Esperando al celular…', conns.size ? 'ok' : ''); };
      conn.on('close', drop);
      conn.on('error', drop);
    });
    peer.on('disconnected', () => { if (!peer.destroyed) setTimeout(() => peer.reconnect(), 1500); });
    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        // el código quedó "tomado" (p. ej. al recargar): reintentar y si no, usar otro
        peer.destroy();
        retries++;
        if (retries > 3) { code = newCode(); retries = 0; drawQR(); }
        setTimeout(start, 2500);
        setStatus('Reconectando…');
        return;
      }
      if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') {
        setStatus('Sin conexión con el servidor. Reintentando…', 'err');
        setTimeout(() => { if (peer.destroyed) start(); else peer.reconnect(); }, 3000);
        return;
      }
      setStatus('Error de conexión: ' + err.type, 'err');
    });
  }

  function open() {
    drawQR();
    modal.classList.remove('hidden');
    start();
  }
  $('btn-remote').addEventListener('click', open);
  $('remote-close').addEventListener('click', () => modal.classList.add('hidden'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

  // si ya se usó antes, dejar la conexión lista para que el celular se reconecte solo
  if (store('casino-remote-on') === '1') {
    const boot = () => (window.Peer ? start() : setTimeout(boot, 300));
    boot();
  }

  return {
    open,
    toggle: () => (modal.classList.contains('hidden') ? open() : modal.classList.add('hidden')),
    broadcast,
  };
}
