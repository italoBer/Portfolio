/* Ruído nas palavras: clique em qualquer palavra dos títulos grandes.
   Também monta o nome a partir de ruído quando a página abre. */
(function () {
  var noise = '#$%&/|<>[]{}=+*01';
  var reduced = function () { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; };

  function splitWords(root) {
    if (!root || root.dataset.split === '1') return;
    root.dataset.split = '1';
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (!node.nodeValue.trim()) return;
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (chunk) {
        if (!chunk) return;
        if (/^\s+$/.test(chunk)) { frag.appendChild(document.createTextNode(chunk)); return; }
        var span = document.createElement('span');
        span.className = 'gw';
        span.textContent = chunk;
        frag.appendChild(span);
      });
      node.parentNode.replaceChild(frag, node);
    });
  }

  function glitchOnce(el, dur) {
    if (!el || el._busy || reduced()) return;
    var target = el.dataset.t || el.textContent;
    el.dataset.t = target;
    el._busy = true;
    // Trava a largura: os caracteres de ruído são mais largos e reflowariam a linha
    el.style.width = el.getBoundingClientRect().width + 'px';
    el.classList.add('glitching');
    document.body.classList.add('glitching');
    var d = dur || 420, t0 = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - t0) / d);
      var shown = Math.floor(p * target.length), out = target.slice(0, shown);
      for (var i = shown; i < target.length; i++) {
        out += target[i] === ' ' ? ' ' : noise[Math.floor(Math.random() * noise.length)];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(tick);
      else {
        el.textContent = target;
        el._busy = false;
        el.classList.remove('glitching');
        el.style.width = '';
        if (!document.querySelector('.gw.glitching, .glitch-text.glitching')) document.body.classList.remove('glitching');
      }
    }
    requestAnimationFrame(tick);
  }

  function boot(el, delay) {
    if (!el || reduced()) return;
    el.classList.add('booting');
    setTimeout(function () {
      glitchOnce(el, 760);
      setTimeout(function () { el.classList.remove('booting'); splitWords(el); }, 800);
    }, delay || 0);
  }

  window.Glitch = { splitWords: splitWords, once: glitchOnce, boot: boot };

  function init() {
    document.querySelectorAll('[data-glitch-words]').forEach(splitWords);
    document.querySelectorAll('[data-glitch-boot]').forEach(function (el, i) { boot(el, i * 120); });
    document.addEventListener('click', function (e) {
      var w = e.target.closest && e.target.closest('.gw');
      if (w) glitchOnce(w);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
