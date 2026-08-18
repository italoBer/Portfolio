/* Português / inglês na mesma página.
   Cada elemento traduzível carrega data-en (HTML da versão inglesa).
   Variantes: data-en-ph (placeholder), data-en-title, data-en-aria (aria-label).
   O PT original fica guardado em memória, nunca duplicado no HTML.
   Na troca manual, o texto passa por ruído (mesma linguagem visual do site). */
(function () {
  var KEY = 'ib-lang';
  var noise = '#$%&/|<>[]{}=+*01';
  var lang = 'pt', applied = null, els = [], attrs = [];

  function reduced() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  function detect() {
    var s = null;
    try { s = localStorage.getItem(KEY); } catch (e) {}
    if (s === 'pt' || s === 'en') return s;
    var l = (navigator.languages && navigator.languages[0]) || navigator.language || 'pt';
    return /^pt/i.test(l) ? 'pt' : 'en';
  }

  function collect() {
    els = []; attrs = [];
    document.querySelectorAll('[data-en]').forEach(function (el) {
      els.push({ el: el, pt: el.innerHTML, en: el.getAttribute('data-en') });
    });
    [['data-en-ph', 'placeholder'], ['data-en-title', 'title'], ['data-en-aria', 'aria-label']]
      .forEach(function (pair) {
        document.querySelectorAll('[' + pair[0] + ']').forEach(function (el) {
          attrs.push({ el: el, attr: pair[1], pt: el.getAttribute(pair[1]) || '', en: el.getAttribute(pair[0]) });
        });
      });
  }

  function resplit(el) {
    if (el.dataset.split !== '1') return;
    el.dataset.split = '';
    var s = window.__splitWords || (window.Glitch && window.Glitch.splitWords);
    if (s) s(el);
  }

  function swap(o) {
    o.el.innerHTML = lang === 'en' ? o.en : o.pt;
    if (o.el.dataset.t != null) o.el.dataset.t = o.el.textContent;
    resplit(o.el);
  }

  function swapAttr(o) { o.el.setAttribute(o.attr, lang === 'en' ? o.en : o.pt); }

  function textNodes(el) {
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), a = [];
    while (w.nextNode()) if (w.currentNode.nodeValue.trim()) a.push(w.currentNode);
    return a;
  }

  /* phase 'out': texto real vira ruído. phase 'in': ruído vira texto real. */
  function scramble(el, phase, dur, done) {
    var ns = textNodes(el).map(function (n) { return { n: n, t: n.nodeValue }; });
    if (!ns.length) { done(); return; }
    var t0 = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - t0) / dur);
      var q = phase === 'out' ? 1 - p : p;
      ns.forEach(function (o) {
        var t = o.t, keep = Math.floor(q * t.length), out = t.slice(0, keep);
        for (var i = keep; i < t.length; i++) {
          out += /\s/.test(t[i]) ? t[i] : noise[(Math.random() * noise.length) | 0];
        }
        o.n.nodeValue = out;
      });
      if (p < 1) requestAnimationFrame(tick);
      else { if (phase === 'in') ns.forEach(function (o) { o.n.nodeValue = o.t; }); done(); }
    }
    requestAnimationFrame(tick);
  }

  function markSwitch() {
    document.querySelectorAll('.lang-switch [data-lang]').forEach(function (b) {
      var on = b.getAttribute('data-lang') === lang;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function finish() {
    document.body.classList.remove('glitching', 'lang-swap');
    window.dispatchEvent(new Event('resize'));
  }

  function apply(next, animate) {
    if (next === applied) return;
    lang = next; applied = next;
    document.documentElement.lang = next === 'en' ? 'en' : 'pt-BR';
    markSwitch();
    attrs.forEach(swapAttr);

    if (!animate || reduced()) { els.forEach(swap); return; }

    document.body.classList.add('glitching', 'lang-swap');
    var vh = window.innerHeight, jobs = [], rest = [];
    els.forEach(function (o) {
      var r = o.el.getBoundingClientRect();
      if (r.width && r.bottom > -140 && r.top < vh + 140) jobs.push({ o: o, top: r.top, h: r.height });
      else rest.push(o);
    });
    rest.forEach(swap);
    if (!jobs.length) { finish(); return; }
    jobs.sort(function (a, b) { return a.top - b.top; });
    var pending = jobs.length, closed = false;
    function close() {
      if (closed) return;
      closed = true;
      jobs.forEach(function (j) { j.o.el.style.minHeight = ''; });
      finish();
    }
    /* Rede de seguranca: se a aba sair de foco no meio, o rAF congela.
       Ao voltar (ou passado o tempo limite) o texto entra de uma vez. */
    var guard = setTimeout(function () {
      if (closed) return;
      els.forEach(swap);
      close();
    }, 1400);
    jobs.forEach(function (j, i) {
      j.o.el.style.minHeight = j.h + 'px';
      setTimeout(function () {
        scramble(j.o.el, 'out', 170, function () {
          swap(j.o);
          scramble(j.o.el, 'in', 260, function () {
            j.o.el.style.minHeight = '';
            if (--pending === 0) { clearTimeout(guard); close(); }
          });
        });
      }, Math.min(i * 26, 320));
    });
  }

  function set(next) {
    if (next === lang) return;
    try { localStorage.setItem(KEY, next); } catch (e) {}
    apply(next, true);
  }

  collect();
  apply(detect(), false);
  document.documentElement.classList.remove('i18n-wait');

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.lang-switch [data-lang]');
    if (b) set(b.getAttribute('data-lang'));
  });

  window.I18N = {
    get lang() { return lang; },
    set: set,
    t: function (pt, en) { return lang === 'en' ? en : pt; }
  };
})();
