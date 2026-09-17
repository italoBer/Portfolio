/* Clique na foto do projeto: ela cresce ate o tamanho de leitura.
   A animacao e um FLIP na geometria (a foto voa do card para o centro) e,
   como o recorte e sempre "cover", o corte se desfaz sozinho durante o voo:
   o retangulo de destino tem a proporcao real da imagem.
   No celular o percurso e mais curto e mais rapido. */
(function () {
  var photos = document.querySelectorAll('.proj-photo');
  if (!photos.length) return;

  var css = ''
    + '.photo-veil{position:fixed;inset:0;z-index:300;background:rgba(5,5,5,.93);opacity:0;'
    + '-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px)}'
    + '.photo-flying{position:fixed;z-index:301;margin:0;object-fit:cover;filter:none;'
    + 'border:1px solid rgba(255,255,255,.1);border-radius:3px;will-change:top,left,width,height}'
    + '.photo-caption{position:fixed;z-index:302;left:0;right:0;bottom:max(1.4rem,env(safe-area-inset-bottom));'
    + 'padding:0 1.5rem;text-align:center;font-size:.78rem;line-height:1.5;color:#9a9a9a;opacity:0;pointer-events:none}'
    + '.photo-caption b{color:#0e9a28;font-weight:400}'
    + '.proj-photo{cursor:zoom-in}'
    + '.proj-photo:focus-visible{outline:1px solid #0e9a28;outline-offset:-3px}'
    + 'html.photo-open{overflow:hidden;scrollbar-gutter:stable}'
    + '@media (prefers-reduced-motion:reduce){.photo-flying{will-change:auto}}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var small = function () { return window.matchMedia('(max-width:640px)').matches; };
  var calm = function () { return window.matchMedia('(prefers-reduced-motion:reduce)').matches; };
  var T = function (pt, en) { return window.I18N ? window.I18N.t(pt, en) : pt; };

  var open = null;

  function fit(img) {
    var ar = (img.naturalWidth || 16) / (img.naturalHeight || 9);
    var mw = window.innerWidth * (small() ? 0.94 : 0.9);
    var mh = window.innerHeight * (small() ? 0.7 : 0.82);
    var w = mw, h = w / ar;
    if (h > mh) { h = mh; w = h * ar; }
    return { w: w, h: h, x: (window.innerWidth - w) / 2, y: (window.innerHeight - h) / 2 };
  }

  function show(src) {
    if (open) return;
    var from = src.getBoundingClientRect();
    var to = fit(src);
    var ms = calm() ? 1 : (small() ? 300 : 480);
    var ease = 'cubic-bezier(.22,.9,.24,1)';

    var veil = document.createElement('div');
    veil.className = 'photo-veil';

    var fly = src.cloneNode(false);
    fly.className = 'photo-flying';
    fly.removeAttribute('loading');
    fly.style.cssText += 'top:' + from.top + 'px;left:' + from.left + 'px;width:' + from.width + 'px;height:' + from.height + 'px';

    var cap = document.createElement('div');
    cap.className = 'photo-caption';
    cap.innerHTML = (src.getAttribute('alt') || '') + ' <b>' + T('· clique para fechar', '· click to close') + '</b>';

    document.body.appendChild(veil);
    document.body.appendChild(fly);
    document.body.appendChild(cap);
    document.documentElement.classList.add('photo-open');
    src.style.visibility = 'hidden';

    veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms * 0.7, easing: 'ease-out', fill: 'forwards' });
    cap.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms * 0.6, delay: ms * 0.5, easing: 'ease-out', fill: 'forwards' });
    fly.animate(
      [{ top: from.top + 'px', left: from.left + 'px', width: from.width + 'px', height: from.height + 'px' },
       { top: to.y + 'px', left: to.x + 'px', width: to.w + 'px', height: to.h + 'px' }],
      { duration: ms, easing: ease, fill: 'forwards' }
    );

    open = { src: src, veil: veil, fly: fly, cap: cap, ms: ms, ease: ease };
    veil.addEventListener('click', hide);
    fly.addEventListener('click', hide);
    fly.style.cursor = 'zoom-out';
  }

  function hide() {
    if (!open) return;
    var o = open; open = null;
    var back = o.src.getBoundingClientRect();
    var now = o.fly.getBoundingClientRect();
    var ms = o.ms * 0.85;

    o.cap.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms * 0.4, easing: 'ease-in', fill: 'forwards' });
    o.veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: 'ease-in', fill: 'forwards' });
    var a = o.fly.animate(
      [{ top: now.top + 'px', left: now.left + 'px', width: now.width + 'px', height: now.height + 'px' },
       { top: back.top + 'px', left: back.left + 'px', width: back.width + 'px', height: back.height + 'px' }],
      { duration: ms, easing: o.ease, fill: 'forwards' }
    );
    a.onfinish = a.oncancel = function () {
      o.veil.remove(); o.fly.remove(); o.cap.remove();
      document.documentElement.classList.remove('photo-open');
      o.src.style.visibility = '';
    };
  }

  photos.forEach(function (img) {
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    var base = img.getAttribute('alt') || '';
    img.setAttribute('title', T('Ampliar: ', 'Enlarge: ') + base);
    img.setAttribute('data-en-title', 'Enlarge: ' + (img.getAttribute('data-en-alt') || base));
    img.addEventListener('click', function (e) { e.stopPropagation(); show(img); });
    img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); show(img); }
    });
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
  window.addEventListener('resize', function () {
    if (!open) return;
    var to = fit(open.fly);
    open.fly.style.top = to.y + 'px'; open.fly.style.left = to.x + 'px';
    open.fly.style.width = to.w + 'px'; open.fly.style.height = to.h + 'px';
    open.fly.getAnimations().forEach(function (a) { a.cancel(); });
  });
  window.addEventListener('pageshow', function () { if (open) hide(); });
})();
