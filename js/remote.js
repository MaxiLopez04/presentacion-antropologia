// Control remoto (celular): se conecta a la presentación por PeerJS
(function () {
  const PEER_PREFIX = 'paseocasino-';
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  let code = (params.get('c') || '').toUpperCase();
  let peer = null, conn = null, retryTimer = null, state = null;

  function setStatus(text, kind) {
    $('status-text').textContent = text;
    $('status').className = 'status ' + (kind || '');
  }
  const buzz = () => { try { navigator.vibrate && navigator.vibrate(25); } catch (e) {} };

  function send(msg) {
    if (conn && conn.open) { conn.send(msg); buzz(); }
    else setStatus('Sin conexión', 'err');
  }

  function render(st) {
    state = st;
    const pad = (n) => String(n).padStart(2, '0');
    $('lcd').textContent = `${pad(st.current)}/${pad(st.total)}`;
    $('title').textContent = st.title;
    $('prev').disabled = st.current <= 0;
    $('next').disabled = st.current >= st.total;
    // interacciones
    const acts = $('actions');
    acts.innerHTML = '';
    if (!st.actions.length) acts.innerHTML = '<p class="empty">Esta parada no tiene interacciones.</p>';
    st.actions.forEach((a) => {
      const b = document.createElement('button');
      b.className = 'chip action';
      b.textContent = a.label;
      b.onclick = () => send({ type: 'action', id: a.id });
      acts.appendChild(b);
    });
    // paradas
    const sl = $('slides');
    sl.innerHTML = '';
    st.slides.forEach((s) => {
      const b = document.createElement('button');
      b.className = 'chip' + (s.i === st.current ? ' on' : '');
      b.innerHTML = `<small>${s.i === 0 ? 'PORTADA' : 'PARADA ' + pad(s.i)}</small>`;
      b.appendChild(document.createTextNode(s.title));
      b.onclick = () => send({ type: 'go', i: s.i });
      sl.appendChild(b);
    });
  }

  function scheduleRetry() {
    clearTimeout(retryTimer);
    retryTimer = setTimeout(connect, 2500);
  }

  function connect() {
    if (!peer || peer.destroyed) { startPeer(); return; }
    if (peer.disconnected) { peer.reconnect(); return; }
    setStatus('Buscando la presentación…');
    conn = peer.connect(PEER_PREFIX + code.toLowerCase(), { reliable: true });
    conn.on('open', () => {
      setStatus('Conectado', 'ok');
      $('main').classList.remove('hidden');
      $('join').classList.add('hidden');
      keepAwake();
    });
    conn.on('data', (d) => { if (d && d.type === 'state') render(d); });
    conn.on('close', () => { setStatus('Se cortó. Reconectando…', 'err'); scheduleRetry(); });
    conn.on('error', () => { setStatus('Error. Reconectando…', 'err'); scheduleRetry(); });
  }

  function startPeer() {
    if (!window.Peer) { setStatus('Sin internet', 'err'); return; }
    peer = new window.Peer({ debug: 0 });
    peer.on('open', connect);
    // si en unos segundos no se conectó al servidor, reintentar desde cero
    const p = peer;
    setTimeout(() => { if (p === peer && !p.open && !p.destroyed) { p.destroy(); startPeer(); } }, 8000);
    peer.on('disconnected', () => setTimeout(() => !peer.destroyed && peer.reconnect(), 1500));
    peer.on('error', (err) => {
      if (err.type === 'peer-unavailable') setStatus('No encuentro la presentación. ¿Está abierta?', 'err');
      else setStatus('Error de conexión (' + err.type + ')', 'err');
      scheduleRetry();
    });
  }

  // que la pantalla del celular no se apague mientras presentás
  let lock = null;
  async function keepAwake() {
    try { if ('wakeLock' in navigator && !lock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } } catch (e) {}
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      keepAwake();
      if (code && (!conn || !conn.open)) connect();
    }
  });

  // botones
  $('prev').onclick = () => send({ type: 'prev' });
  $('next').onclick = () => send({ type: 'next' });
  document.querySelectorAll('[data-cmd]').forEach((b) => { b.onclick = () => send({ type: b.dataset.cmd }); });
  // deslizar con el dedo también cambia de diapositiva
  let tx = null;
  document.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 80) send({ type: dx < 0 ? 'next' : 'prev' });
    tx = null;
  });

  function join() {
    const v = $('code-input').value.trim().toUpperCase();
    if (v.length < 5) return;
    code = v;
    history.replaceState(null, '', '?c=' + code);
    connect();
  }
  $('join-btn').onclick = join;
  $('code-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') join(); });

  if (code) startPeer();
  else { $('join').classList.remove('hidden'); setStatus('Sin conectar'); }
})();
