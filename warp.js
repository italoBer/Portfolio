/* Transição em hiperespaço entre a home e a página de projetos.
   Uso: <a href="..." data-warp>…</a> e um <script src="warp.js"> em cada página. */
(function () {
  var KEY = 'warp:arrive';
  var reduced = function () { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; };

  function makeStage() {
    var c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    c.setAttribute('data-warp-stage', '');
    c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:9999;pointer-events:none;opacity:0';
    document.body.appendChild(c);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    function fit() { c.width = Math.floor(innerWidth * dpr); c.height = Math.floor(innerHeight * dpr); }
    fit();
    window.addEventListener('resize', fit);
    c._off = function () { window.removeEventListener('resize', fit); };
    return c;
  }

  var running = false;

  // Desmonta qualquer sobra: canvas, trava de scroll e classe de estado.
  // Nunca derruba uma animação em curso.
  function teardown(force) {
    if (running && !force) return;
    document.querySelectorAll('canvas[data-warp-stage]').forEach(function (c) {
      if (c._off) c._off();
      c.remove();
    });
    document.documentElement.style.removeProperty('overflow');
    document.documentElement.classList.remove('warp-arriving');
    if (document.body) document.body.classList.remove('warping');
  }

  function seed(n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: 0.08 + Math.random() * 0.92, g: Math.random() < 0.16 });
    return a;
  }

  function run(dir, done) {
    if (reduced()) { done && done(); return; }
    running = true;
    var c = makeStage(), ctx = c.getContext('2d');
    var S = seed(330), dur = dir === 'out' ? 820 : 1150, t0 = 0;

    function frame(now) {
      // t0 só no primeiro quadro: o intervalo entre o clique e a primeira
      // pintura não conta, então a animação nunca começa "no meio"
      if (!t0) { t0 = now; requestAnimationFrame(frame); return; }
      var p = Math.min(1, (now - t0) / dur);
      var speed, veil;
      if (dir === 'out') {
        // já parte com risco visível, e o véu entra depois das estrelas
        speed = 0.018 + Math.pow(p, 2.1) * 0.13;
        veil = Math.min(1, Math.pow(p, 0.55) * 1.15);
      } else {
        speed = 0.148 * Math.pow(1 - p, 2.6) + 0.002;
        veil = Math.max(0, 1 - Math.pow(p, 1.7));
      }

      var w = c.width, h = c.height, cx = w / 2, cy = h / 2, f = Math.max(w, h) * 0.62;
      c.style.opacity = veil;
      ctx.fillStyle = 'rgba(5,5,5,' + (dir === 'out' ? 0.34 : 0.3) + ')';
      ctx.fillRect(0, 0, w, h);
      ctx.lineCap = 'round';

      for (var i = 0; i < S.length; i++) {
        var s = S[i];
        s.z -= speed;
        if (s.z <= 0.03) { s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; s.z = 1; s.g = Math.random() < 0.16; continue; }
        var zb = Math.min(1, s.z + speed * 3.4);
        var x1 = cx + (s.x * f) / s.z, y1 = cy + (s.y * f) / s.z;
        var x2 = cx + (s.x * f) / zb, y2 = cy + (s.y * f) / zb;
        var t = 1 - s.z;
        ctx.strokeStyle = s.g ? 'rgba(14,154,40,' + (0.35 + t * 0.6) + ')' : 'rgba(255,255,255,' + (0.28 + t * 0.7) + ')';
        ctx.lineWidth = (0.6 + t * 2.4) * (c.width / innerWidth);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }

      // Fecha escurecendo, já no fim e sem clarão
      if (dir === 'out' && p > 0.88) {
        var q = (p - 0.88) / 0.12;
        ctx.fillStyle = 'rgba(5,5,5,' + q * 0.9 + ')';
        ctx.fillRect(0, 0, w, h);
      }

      if (p < 1) { requestAnimationFrame(frame); return; }
      if (dir === 'out') {
        // navega e, se a ida não acontecer (bfcache, cancelamento), destrava
        done && done();
        setTimeout(function () { running = false; teardown(true); }, 2500);
      } else {
        running = false;
        teardown(true);
        done && done();
      }
    }
    requestAnimationFrame(frame);
  }

  function go(url) {
    try { sessionStorage.setItem(KEY, '1'); } catch (err) {}
    if (reduced()) { location.href = url; return; }
    document.documentElement.style.setProperty('overflow', 'hidden');
    // desliga o desfoque do header: com ele ligado o navegador recompõe a
    // tela inteira a cada quadro e a transição engasga
    document.body.classList.add('warping');
    run('out', function () { location.href = url; });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-warp]');
    if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    go(a.href);
  });

  // Clique duplo em um link de âncora leva pra página cheia
  document.addEventListener('dblclick', function (e) {
    var a = e.target.closest && e.target.closest('[data-warp-dbl]');
    if (!a) return;
    e.preventDefault();
    go(a.dataset.warpDbl);
  });

  // Voltar pelo botão do navegador restaura a página do cache: nunca deixar sobra
  // Só o retorno pelo cache do navegador limpa à força; carga normal não mexe
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    try { sessionStorage.removeItem(KEY); } catch (err) {}
    running = false;
    teardown(true);
  });

  function arrive() {
    var flagged = false;
    try { flagged = sessionStorage.getItem(KEY) === '1'; sessionStorage.removeItem(KEY); } catch (err) {}
    if (!flagged || reduced()) { teardown(true); return; }
    document.documentElement.classList.add('warp-arriving');
    document.body.classList.add('warping');
    run('in', function () { document.body.classList.remove('warping'); });
    // a página surge por baixo dos riscos, em vez de esperar o fim
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { document.documentElement.classList.remove('warp-arriving'); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrive);
  else arrive();
})();
