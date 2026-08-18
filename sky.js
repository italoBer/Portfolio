/* Céu interativo (só em telas largas, onde a arte tem presença):
   1. Clique no sol: pulso de supernova, um anel branco que atravessa as órbitas.
   2. Planetas como navegação: hover mostra o nome da seção, clique desce até ela.
   O hit test é geométrico (converte as coordenadas do SVG para a tela), então
   nada aqui recebe pointer-events nem fica na frente do conteúdo. */
(function () {
  var group = document.getElementById('cosmosSunGroup');
  if (!group) return;

  var SUN = { x: 440, y: 470 };
  var PLANETS = [
    { id: 'cosmosPlanet1', to: '#projeto',  pt: 'Projetos', en: 'Projects' },
    { id: 'cosmosPlanet2', to: '#stack',    pt: 'Stack',    en: 'Stack' },
    { id: 'cosmosPlanet3', to: '#aprendendo', pt: 'Estudos', en: 'Studies' },
    { id: 'cosmosPlanet4', to: '#sobre',    pt: 'Sobre',    en: 'About' }
  ].map(function (p) {
    var el = document.getElementById(p.id);
    if (el) { p.el = el; p.r = parseFloat(el.getAttribute('r')); p.fill = el.getAttribute('fill'); }
    return p;
  }).filter(function (p) { return p.el; });

  var reduced = function () { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var live = function () { return window.innerWidth > 900 && document.body.dataset.theme === 'cosmos'; };
  var label = null, hot = null, hotKey = null;
  var pointer = { x: -1, y: -1 }, queued = false;

  function name(p) { return window.I18N ? window.I18N.t(p.pt, p.en) : p.pt; }

  function screenPos() {
    var m = group.getScreenCTM();
    if (!m) return null;
    var to = function (x, y) { return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }; };
    return { at: to, scale: Math.sqrt(m.a * m.a + m.b * m.b) };
  }

  function hit(px, py) {
    if (!live()) return null;
    var s = screenPos();
    if (!s) return null;
    var i, p, q, d;
    for (i = 0; i < PLANETS.length; i++) {
      p = PLANETS[i];
      q = s.at(+p.el.getAttribute('cx'), +p.el.getAttribute('cy'));
      d = Math.hypot(px - q.x, py - q.y);
      if (d < Math.max(24, p.r * 3.4 * s.scale)) return { planet: p, x: q.x, y: q.y };
    }
    q = s.at(SUN.x, SUN.y);
    if (Math.hypot(px - q.x, py - q.y) < Math.max(64, 52 * s.scale)) return { sun: true, x: q.x, y: q.y };
    return null;
  }

  /* Só conta clique/hover em área vazia: texto, cards e links seguem intactos */
  var PASS = { BODY: 1, HTML: 1, SECTION: 1, HEADER: 1, FOOTER: 1, MAIN: 1 };
  function emptySpot(x, y) {
    var el = document.elementFromPoint(x, y);
    if (!el) return false;
    if (PASS[el.tagName]) return true;
    return el.classList.contains('container') || el.classList.contains('hero-grid') ||
           el.classList.contains('about') || el.classList.contains('contact') ||
           el.classList.contains('proj-grid') || el.classList.contains('process');
  }

  function ensureLabel() {
    if (label) return label;
    label = document.createElement('div');
    label.className = 'sky-label';
    label.setAttribute('aria-hidden', 'true');
    document.body.appendChild(label);
    return label;
  }

  function setHot(h) {
    var key = h ? (h.planet || 'sun') : null;
    if (hotKey === key) { if (h && h.planet) place(h); return; }
    hotKey = key;
    if (hot) { hot.el.setAttribute('r', hot.r); hot.el.setAttribute('fill', hot.fill); }
    hot = h && h.planet ? h.planet : null;
    document.documentElement.classList.toggle('sky-hot', !!key);
    if (hot) {
      hot.el.setAttribute('r', (hot.r * 1.7).toFixed(1));
      hot.el.setAttribute('fill', '#0e9a28');
      ensureLabel().textContent = name(hot);
      place(h);
      label.classList.add('on');
    } else if (label) {
      label.classList.remove('on');
    }
  }

  function place(h) {
    if (!label) return;
    label.style.left = h.x.toFixed(0) + 'px';
    label.style.top = h.y.toFixed(0) + 'px';
  }

  function check() {
    queued = false;
    if (pointer.x < 0) return;
    var h = hit(pointer.x, pointer.y);
    if (h && !emptySpot(pointer.x, pointer.y)) h = null;
    setHot(h);
  }

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    pointer.x = e.clientX; pointer.y = e.clientY;
    if (!queued) { queued = true; requestAnimationFrame(check); }
  }, { passive: true });

  window.addEventListener('scroll', function () {
    if (hot) setHot(null);
    pointer.x = -1;
  }, { passive: true });

  document.addEventListener('click', function (e) {
    if (e.target.closest('a, button, input, textarea, label, .gw, .mission-item, .proj-card')) return;
    var h = hit(e.clientX, e.clientY);
    if (!h || !emptySpot(e.clientX, e.clientY)) return;
    if (h.planet) {
      var t = document.querySelector(h.planet.to);
      if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY, behavior: 'smooth' });
      setHot(null);
    } else {
      nova();
    }
  });

  /* ---------- Pulso da luz do sol ----------
     Clique 1 e 2: explosãozinha e volta.
     Cliques 3 a 5: explode, suga a explosão de volta e encolhe antes de voltar.
     Clique 6: supernova, a luz cresce aos poucos até quase a última órbita
     e depois volta ao normal. Aí a contagem reinicia. */
  var light = document.getElementById('sunLight');
  var clicks = 0, cur = 1, token = 0;

  var outCubic = function (p) { return 1 - Math.pow(1 - p, 3); };
  var inOut = function (p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  var outBack = function (p) { var c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };

  var halo = light && light.firstElementChild;
  function setScale(s) {
    cur = s;
    /* O halo já é enorme: em escala grande ele é clareado pra virar clarão,
       não um lençol branco por cima da arte. */
    if (halo) halo.setAttribute('opacity', Math.max(0.3, Math.min(1, 1 - (s - 1) * 0.26)).toFixed(3));
    if (s === 1) { light.removeAttribute('transform'); return; }
    var k = (1 - s);
    light.setAttribute('transform', 'translate(' + (SUN.x * k).toFixed(2) + ' ' + (SUN.y * k).toFixed(2) + ') scale(' + s.toFixed(4) + ')');
  }

  /* Cada clique novo assume o comando, partindo da escala atual:
     clicar em rajada carrega a estrela em vez de ignorar o clique.
     O último valor da sequência é onde a luz FICA (a estrela vai ficando
     menor a cada clique, até a supernova devolver o tamanho normal). */
  function run(seq, after) {
    var id = ++token, i = 0, t0 = performance.now(), end = seq[seq.length - 1][1];
    seq[0][0] = cur;
    function tick(now) {
      if (id !== token) return;
      var s = seq[i], p = Math.min(1, (now - t0) / s[2]);
      setScale(s[0] + (s[1] - s[0]) * s[3](p));
      if (p < 1) { requestAnimationFrame(tick); return; }
      i++;
      if (i < seq.length) { t0 = now; requestAnimationFrame(tick); return; }
      setScale(end);
      if (after) after();
    }
    requestAnimationFrame(tick);
  }

  /* Tamanho em que a estrela descansa depois de cada clique */
  var REST = [1, 0.93, 0.85, 0.75, 0.65, 0.55];
  var idleTimer = null;

  function relax() {
    clicks = 0;
    if (cur !== 1) run([[cur, 1, 1100, inOut]]);
  }

  function nova() {
    if (!light) return;
    clicks++;
    clearTimeout(idleTimer);

    if (reduced()) {
      var id = ++token, rest = clicks >= 6 ? 1 : REST[clicks];
      setScale(cur * 1.22);
      setTimeout(function () { if (id === token) setScale(rest); }, 240);
      if (clicks >= 6) clicks = 0;
      else idleTimer = setTimeout(relax, 8000);
      return;
    }

    var seq, big = clicks >= 6, r = big ? 1 : REST[clicks];
    if (clicks < 3) {
      /* explosãozinha e volta, um pouco menor do que estava */
      seq = [[cur, cur * 1.45, 240, outCubic], [cur * 1.45, r * 0.9, 340, inOut], [r * 0.9, r, 320, outBack]];
    } else if (!big) {
      /* explode, segura, suga tudo de volta e assenta menor ainda */
      seq = [[cur, cur * 2.1, 210, outCubic], [cur * 2.1, cur * 1.75, 160, inOut],
             [cur * 1.75, r * 0.5, 560, inOut], [r * 0.5, r * 1.14, 420, outCubic], [r * 1.14, r, 300, inOut]];
    } else {
      /* supernova: contrai, cresce aos poucos até quase a última órbita e colapsa */
      seq = [[cur, cur * 0.72, 380, inOut], [cur * 0.72, 2.2, 560, outCubic], [2.2, 3.6, 900, inOut],
             [3.6, 3.35, 320, inOut], [3.35, 0.8, 1000, inOut], [0.8, 1, 460, outBack]];
    }

    var sky = document.getElementById('starfield');
    if (big && sky) {
      setTimeout(function () { sky.classList.add('flare'); }, 800);
      setTimeout(function () { sky.classList.remove('flare'); }, 2200);
    }
    /* no auge da supernova, quem estiver ouvindo pode devolver algo (o capacete) */
    if (big) setTimeout(function () {
      if (window.SKY && typeof window.SKY.onBig === 'function') window.SKY.onBig();
    }, 2100);

    run(seq, function () {
      if (big) clicks = 0;
      else idleTimer = setTimeout(relax, 8000);
    });
  }

  /* Ponte para o astronauta (astronaut.js): onde o sol está na tela agora,
     o raio da luz e como disparar um pulso. */
  window.SKY = {
    live: live,
    nova: nova,
    onBig: null,
    sun: function () {
      var s = screenPos();
      if (!s) return null;
      var q = s.at(SUN.x, SUN.y);
      q.r = Math.max(40, 46 * s.scale * cur);
      return q;
    }
  };
})();
