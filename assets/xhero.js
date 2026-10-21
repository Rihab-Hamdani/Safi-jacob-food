/* Hero : la recette en 4 étapes au scroll, avec de vraies photos.
   1 Pétrir (la pâte)  2 Empiler (les couches éclatées descendent)  3 Plier et dorer (le sandwich + frites).
   Pour changer une couche : modifier LAYERS (image dans assets/img/x/). */
(function () {
  'use strict';
  var LAYERS = [ // du bas vers le haut
    { img: 'pate', name: 'Pâte' },
    { img: 'harissa', name: 'Harissa' },
    { img: 'mozza', name: 'Mozzarella' },
    { img: 'chawarma', name: 'Chawarma' },
    { img: 'frites', name: 'Frites' },
    { img: 'salade', name: 'Salade & oignon' }
  ];
  /* jalons de scroll (0 → 1 sur la hauteur du hero) */
  var P = { doughOut: [.10, .2], layersIn: [.12, .24], stack: [.24, .62], finalIn: [.64, .76] };

  var hero = document.getElementById('top');
  var art = document.getElementById('xart');
  var box = document.getElementById('xLayers');
  var dough = document.getElementById('xDough'), glow = document.getElementById('xGlow'), fin = document.getElementById('xFinal');
  var subs = Array.prototype.slice.call(document.querySelectorAll('.xsub .lede'));
  var count = document.getElementById('xcount'), bar = document.getElementById('xbar'), cue = document.getElementById('cue');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var sm = function (p, r) { var t = clamp((p - r[0]) / (r[1] - r[0]), 0, 1); return t * t * (3 - 2 * t); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  var N = LAYERS.length;
  var els = LAYERS.map(function (L, i) {
    var d = document.createElement('div'); d.className = 'xly';
    var left = i % 2 === 0;
    d.innerHTML = '<img src="assets/img/x/' + L.img + '.webp" alt="">' +
      '<span class="xlab ' + (left ? 'l' : 'r') + '"><span><small>0' + (i + 1) + '</small> ' + L.name + '</span><i></i></span>';
    box.appendChild(d);
    return { el: d, lab: d.querySelector('.xlab') };
  });

  var H = 0;
  function measure() { H = art.clientHeight; }
  // y = centre de chaque couche, en fraction de la hauteur
  function yExp(i) { return .84 - i * .118; }
  function yStk(i) { return .6 - i * .04; }

  var last = {};
  function setOp(el, v, k) { v = Math.round(v * 1000) / 1000; if (last[k] !== v) { el.style.opacity = v; last[k] = v; } }

  function render(p, now) {
    if (reduce.matches) p = 1;
    var dOut = sm(p, P.doughOut), lIn = sm(p, P.layersIn), fIn = sm(p, P.finalIn);
    // 1 pâte
    setOp(dough, 1 - dOut, 'd');
    dough.style.setProperty('--s', (1 - dOut * .25).toFixed(3));
    // 2 couches
    var layerVis = lIn * (1 - fIn);
    for (var i = 0; i < N; i++) {
      var start = P.stack[0] + (N - 1 - i) * .035;
      var t = ease(clamp((p - start) / (P.stack[1] - P.stack[0] - .1), 0, 1));
      var fl = Math.sin(now / 900 + i * 1.4) * 5 * (1 - t) * (reduce.matches ? 0 : 1);
      var y = (yExp(i) + (yStk(i) - yExp(i)) * t) * H + fl - (1 - lIn) * 40 * (N - i) / N;
      els[i].el.style.transform = 'translate(-50%,' + (y - els[i].el.offsetHeight / 2).toFixed(1) + 'px)';
      setOp(els[i].el, layerVis, 'l' + i);
      setOp(els[i].lab, 1 - sm(t, [.1, .5]), 'b' + i);
    }
    // éclat de lumière quand les couches se posent, puis le sandwich
    var burst = sm(p, [P.stack[1] - .06, P.finalIn[0] + .02]) * (1 - sm(p, [P.finalIn[1], P.finalIn[1] + .12]));
    setOp(glow, burst, 'gl');
    glow.style.setProperty('--s', (.7 + .5 * burst).toFixed(3));
    setOp(fin, fIn, 'f');
    fin.style.setProperty('--s', (.9 + .1 * fIn).toFixed(3));
    // textes
    var step = p < P.layersIn[0] + .04 ? 0 : p < P.finalIn[0] + .03 ? 1 : 2;
    if (last.step !== step) {
      last.step = step;
      subs.forEach(function (s, n) { s.classList.toggle('on', n === step); s.setAttribute('aria-hidden', n === step ? 'false' : 'true'); });
      count.textContent = step + 1;
    }
    var b = Math.round(p * 40) / 40;
    if (last.bar !== b) { last.bar = b; bar.style.setProperty('--xp', b); cue.style.opacity = p < .03 ? 1 : 0; }
  }

  var target = 0, shown = 0, raf = null, lt = 0, onScreen = true;
  function progress() { var r = hero.getBoundingClientRect(), range = hero.offsetHeight - innerHeight; return range > 0 ? clamp(-r.top / range, 0, 1) : 0; }
  function tick(now) {
    var dt = Math.min(100, now - (lt || now)); lt = now;
    shown += (target - shown) * (1 - Math.pow(1 - .14, dt / 16.667));
    if (Math.abs(target - shown) < .0005) shown = target;
    render(shown, now);
    var floating = shown > P.layersIn[0] && shown < P.stack[1];
    if (onScreen && !reduce.matches && (shown !== target || floating)) raf = requestAnimationFrame(tick); else { raf = null; lt = 0; }
  }
  function kick() { target = progress(); if (raf === null && onScreen) raf = requestAnimationFrame(tick); }
  new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; if (onScreen) kick(); }).observe(hero);
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', function () { measure(); render(shown, performance.now()); kick(); }, { passive: true });
  reduce.addEventListener && reduce.addEventListener('change', function () { render(progress(), performance.now()); kick(); });
  window.addEventListener('load', function () { measure(); render(shown, performance.now()); });
  measure(); target = shown = progress(); render(shown, performance.now()); kick();
})();
