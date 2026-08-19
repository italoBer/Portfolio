/* Astronauta perdido (easter egg da home).
   Aparece sozinho depois de um tempo, atravessa o cosmos na diagonal das estrelas cadentes, girando de leve.
   Você pode agarrar com o mouse e arremessar: se passar perto do sol, a gravidade
   da estrela o suga, o sol dá um pulso e ele desaparece de vez (só volta no F5).
   Fica preso à tela (position: fixed), então o scroll não o arrasta. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || window.innerWidth <= 900 || !('PointerEvent' in window)) return;

  var css = document.createElement('style');
  css.textContent = '.astro{position:fixed;z-index:58;width:52px;height:52px;left:0;top:0;' +
    'cursor:grab;opacity:0;transition:opacity 1.6s ease;will-change:transform;' +
    'filter:drop-shadow(0 0 7px rgba(255,255,255,0.16))}' +
    '.astro.on{opacity:.9}.astro.grab{cursor:grabbing;opacity:1}' +
    '.astro img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}' +
    '.astro .calmo{transform:scale(.88)}' +
    '.astro .open{display:none}.astro.aberto .calmo{display:none}' +
    '.astro.aberto .open{display:block}' +
    '.astro.gone{transition:opacity .45s ease}' +
    '.helmet{position:fixed;z-index:58;left:0;top:0;width:34px;height:34px;opacity:0;' +
    'pointer-events:none;filter:drop-shadow(0 0 7px rgba(255,255,255,0.2))}' +
    '.helmet img{width:100%;height:100%;object-fit:contain;display:block}';
  document.head.appendChild(css);

  var el = document.createElement('div');
  el.className = 'astro';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<img class="calmo" src="uploads/astronauta-descanso.png?v=2" alt="" draggable="false">' +
    '<img class="open" src="uploads/astronauta-aberto.png?v=2" alt="" draggable="false">';
  document.body.appendChild(el);

  var W = function () { return window.innerWidth; }, H = function () { return window.innerHeight; };
  var a = { x: 0, y: 0, vx: 0, vy: 0, rot: 0, vrot: 0.12, s: 1, alive: true, held: false };

  function respawn() {
    /* entra pela esquerda, um pouco abaixo do topo, na mesma diagonal das
       estrelas cadentes: esquerda para a direita, descendo de leve */
    a.x = -90;
    a.y = H() * 0.1 + Math.random() * H() * 0.22;
    a.vx = 0.42 + Math.random() * 0.16;
    a.vy = 0.2 + Math.random() * 0.1;
    a.vrot = (Math.random() - 0.5) * 0.3;
    a.s = 1;
    el.classList.add('on');
  }

  function draw() {
    el.style.transform = 'translate(' + a.x.toFixed(1) + 'px,' + a.y.toFixed(1) + 'px) ' +
      'rotate(' + a.rot.toFixed(1) + 'deg) scale(' + a.s.toFixed(3) + ')';
  }

  /* ---- arrastar e arremessar ---- */
  var grab = { dx: 0, dy: 0, lx: 0, ly: 0, t: 0, id: null };

  el.addEventListener('pointerdown', function (e) {
    if (!a.alive) return;
    a.held = true; grab.id = e.pointerId;
    grab.dx = e.clientX - a.x; grab.dy = e.clientY - a.y;
    grab.lx = e.clientX; grab.ly = e.clientY; grab.t = performance.now();
    a.vx = a.vy = 0;
    el.classList.add('grab');
    el.classList.add('aberto');
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  el.addEventListener('pointermove', function (e) {
    if (!a.held || e.pointerId !== grab.id) return;
    var now = performance.now(), dt = Math.max(8, now - grab.t);
    a.x = e.clientX - grab.dx; a.y = e.clientY - grab.dy;
    /* velocidade do gesto em px por frame (~16ms) */
    a.vx = (e.clientX - grab.lx) / dt * 16;
    a.vy = (e.clientY - grab.ly) / dt * 16;
    a.vrot = a.vx * 0.5;
    grab.lx = e.clientX; grab.ly = e.clientY; grab.t = now;
  });

  function release(e) {
    if (!a.held || (e && e.pointerId !== grab.id)) return;
    a.held = false; grab.id = null;
    el.classList.remove('grab');
    thrown = true;
    /* solto parado: continua a queda mansa em vez de congelar */
    if (Math.hypot(a.vx, a.vy) < 0.3) { a.vx = (Math.random() - 0.5) * 0.2; a.vy = 0.25; }
    var m = 14;
    a.vx = Math.max(-m, Math.min(m, a.vx));
    a.vy = Math.max(-m, Math.min(m, a.vy));
  }
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);

  /* ---- o sol cospe o capacete no auge da supernova ---- */
  var swallowed = false, spat = false;
  function spitHelmet() {
    if (!swallowed || spat) return;
    var sun = window.SKY && window.SKY.sun ? window.SKY.sun() : null;
    if (!sun) return;
    spat = true;
    var h = document.createElement('div');
    h.className = 'helmet';
    h.setAttribute('aria-hidden', 'true');
    h.innerHTML = '<img src="uploads/astronauta-capacete.png?v=2" alt="" draggable="false">';
    document.body.appendChild(h);
    /* sai pelo lado com mais tela livre, subindo de leve */
    var dir = sun.x < W() / 2 ? 1 : -1;
    var ang = (-0.55 + Math.random() * 0.5) * (dir > 0 ? 1 : -1);
    var sp = 1.9 + Math.random() * 0.7;
    var hx = sun.x - 15, hy = sun.y - 15,
        hvx = Math.cos(ang) * sp * dir, hvy = Math.sin(ang) * sp - 0.4,
        rot = 0, vrot = (Math.random() - 0.5) * 5, sc = 0.2, t0 = performance.now();
    (function fly(now) {
      var e = now - t0;
      if (sc < 1) sc = Math.min(1, 0.2 + e / 260);
      hx += hvx; hy += hvy; rot += vrot;
      h.style.transform = 'translate(' + hx.toFixed(1) + 'px,' + hy.toFixed(1) + 'px) ' +
        'rotate(' + rot.toFixed(1) + 'deg) scale(' + sc.toFixed(2) + ')';
      h.style.opacity = e < 200 ? (e / 200 * 0.9).toFixed(2) : '0.9';
      if (hx > -80 && hx < W() + 80 && hy > -120 && hy < H() + 120) requestAnimationFrame(fly);
      else h.remove();
    })(t0);
  }

  /* ---- fim: sugado pela estrela ---- */
  function consume(sun) {
    a.alive = false;
    swallowed = true;
    if (window.SKY) window.SKY.onBig = spitHelmet;
    el.classList.remove('on');
    el.classList.add('gone', 'aberto');
    if (window.SKY && window.SKY.nova) window.SKY.nova();
    var t0 = performance.now(), x0 = a.x, y0 = a.y, s0 = a.s;
    (function fade(now) {
      var p = Math.min(1, (now - t0) / 420);
      a.x = x0 + (sun.x - 26 - x0) * p;
      a.y = y0 + (sun.y - 26 - y0) * p;
      a.s = s0 * (1 - p); a.rot += 14;
      draw();
      if (p < 1) requestAnimationFrame(fade);
      else el.remove();
    })(t0);
  }

  var thrown = false, last = performance.now();
  function tick(now) {
    if (!a.alive) return;
    var k = Math.min(3, (now - last) / 16.7); last = now;

    if (!a.held) {
      var cy0 = a.y + 26;
      /* nada acontece fora da tela: ninguém veria */
      var sun = cy0 > 0 && cy0 < H() && window.SKY && window.SKY.live && window.SKY.live() ? window.SKY.sun() : null;
      if (sun) {
        var cx = a.x + 26, cy = cy0;
        var dx = sun.x - cx, dy = sun.y - cy, d = Math.hypot(dx, dy) || 1;
        /* flutuando de leve ele quase não sente a estrela; arremessado, sim */
        var reach = sun.r + (thrown ? 260 : 46);
        if (d < sun.r * 0.8) { consume(sun); return; }
        if (d < reach) {
          /* quanto mais perto, mais forte o puxão */
          var g = 0.9 * Math.pow(1 - d / reach, 2) + 0.05;
          a.vx += dx / d * g * k;
          a.vy += dy / d * g * k;
          /* e menor ele fica: some na distância enquanto cai na estrela */
          if (thrown) {
            var want = 1 - 0.94 * Math.pow(1 - d / reach, 1.2);
            a.s += (want - a.s) * Math.min(1, 0.12 * k);
          }
        } else if (a.s < 1) {
          a.s += (1 - a.s) * Math.min(1, 0.05 * k);
        }
      }
      /* sem gravidade: a velocidade fica como está e o balanço entra só como
         deslocamento, sem poder inverter o sentido da travessia */
      a.x += (a.vx + Math.sin(now / 2600) * 0.12) * k;
      a.y += (a.vy + Math.cos(now / 3300) * 0.1) * k;
      a.rot += a.vrot * k;
      a.vrot *= 0.9995;

      /* saiu da tela por qualquer lado: volta a entrar pela esquerda */
      if (a.x > W() + 120 || a.x < -260 || a.y > H() + 140 || a.y < -260) {
        thrown = false; el.classList.remove('aberto'); respawn();
      }
    }

    draw();
    requestAnimationFrame(tick);
  }

  setTimeout(function () {
    if (document.body.dataset.theme !== 'cosmos' && window.scrollY > H() * 2) return;
    respawn(); draw();
    requestAnimationFrame(tick);
  }, 9000);
})();
