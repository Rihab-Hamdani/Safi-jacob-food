/* Safi Jacob Food: menu, cart, branches, checkout (demo), tuto, hold-to-bake. Plain JS. */
(function () {
  'use strict';
  var M = window.SJF_MENU;
  /* une seule photo par catégorie : la même pour tous les plats de la catégorie */
  var CAT_IMG = { tacos: 'n_tacos', libanais: 'n_libanais', mlawi: 'banner_food', chapati: 'n_chapati', makloub: 'n_makloub', baguette: 'n_baguette', pizza: 'n_pizza', extras: 's_frites' };
  M.products.forEach(function (p) { if (CAT_IMG[p.cat]) p.image = CAT_IMG[p.cat]; });
  var BRANCHES = [
    /* zones : villes livrées par chaque resto (Monastir : à confirmer avec le restaurant) */
    { id: 'monastir', name: 'Monastir', ar: 'المنستير', phone: '+216 55 602 220', code: 'MON', video: 'assets/video/branch-monastir.mp4', poster: 'assets/video/branch-monastir.jpg',
      address: 'QRCG+QJ7, Monastir', maps: 'https://www.google.com/maps/search/?api=1&query=QRCG%2BQJ7%20Monastir%2C%20Tunisie', zones: ['Monastir'] },
    { id: 'lamta', name: 'Lamta', ar: 'لمطة', phone: '+216 25 602 647', code: 'LMT', video: 'assets/video/branch-lamta.mp4', poster: 'assets/video/branch-lamta.jpg',
      address: 'Lamta 5099, Monastir', maps: 'https://maps.app.goo.gl/3LZ3e82n9sCWEq1eA', zones: ['Lamta', 'Sayada', 'Ksar Hellal'] }
  ];
  /* Demo settings, not confirmed by the restaurant */
  var DEMO = { delivery: true, fee: 2, minimum: 10, prep: '20 à 30 min' };
  var IMG = function (n) { return 'assets/img/' + n + '.webp'; };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var dt = function (n) { return (Math.round(n * 1000) / 1000).toFixed(3).replace(/\.?0+$/, '').replace('.', ',') + ' DT'; };
  var round = function (n) { return Math.round(n * 1000) / 1000; };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var WEBM = (function () { var v = document.createElement('video'); return !!v.canPlayType && v.canPlayType('video/webm; codecs="vp9"') !== ''; })();
  var vsrc = function (v) { return WEBM ? v.dataset.src.replace(/\.mp4$/, '.webm') : v.dataset.src; };
  var ICON = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="flex:none;color:var(--accent);margin-top:2px"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>'
  };
  var catOf = function (id) { return M.categories.filter(function (c) { return c.id === id; })[0]; };
  var prodOf = function (id) { return M.products.filter(function (p) { return p.id === id; })[0]; };
  var supOf = function (id) { return M.supplements.filter(function (s) { return s.id === id; })[0]; };
  var fromPrice = function (p) { return p.sizes ? Math.min.apply(null, p.sizes.map(function (s) { return s.price; })) : p.price; };
  var base = function (p, sizeId) { if (!p.sizes) return p.price; var s = p.sizes.filter(function (x) { return x.id === sizeId; })[0] || p.sizes[0]; return s.price; };
  var unit = function (l) { var p = prodOf(l.productId); if (!p) return 0; return round(base(p, l.sizeId) + (l.gratine ? M.gratine : 0) + l.extras.reduce(function (t, id) { return t + ((supOf(id) || {}).price || 0); }, 0)); };
  var title = function (l) { var p = prodOf(l.productId); var c = catOf(p.cat); return p.cat === 'extras' ? p.name : c.label + ' ' + p.name; };
  var details = function (l) {
    var p = prodOf(l.productId), d = [];
    if (p.variant) d.push(p.variant);
    if (l.sizeId && p.sizes) d.push((p.sizes.filter(function (s) { return s.id === l.sizeId; })[0] || {}).label);
    if (l.gratine) d.push('Gratiné');
    if (l.sauces.length) d.push('Sauce : ' + l.sauces.join(', '));
    if (l.extras.length) d.push('+ ' + l.extras.map(function (id) { return supOf(id).label; }).join(', '));
    return d;
  };

  /* ───── state (per-viewer convenience only) ───── */
  var KEY = 'sjf-site-v1';
  var S = { branch: null, cart: [] };
  try { var raw = localStorage.getItem(KEY); if (raw) { var o = JSON.parse(raw); S.branch = o.branch || null; S.cart = Array.isArray(o.cart) ? o.cart.filter(function (l) { return prodOf(l.productId); }) : []; } } catch (e) { /* storage unavailable */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }
  var count = function () { return S.cart.reduce(function (t, l) { return t + l.qty; }, 0); };
  var subtotal = function () { return round(S.cart.reduce(function (t, l) { return t + unit(l) * l.qty; }, 0)); };
  var sig = function (l) { return [l.productId, l.sizeId || '', l.gratine ? 'g' : '', l.sauces.slice().sort().join(','), l.extras.slice().sort().join(','), l.note || ''].join('|'); };

  function addLine(line) {
    var ex = S.cart.filter(function (l) { return sig(l) === sig(line); })[0];
    if (ex) ex.qty += line.qty; else S.cart.push(Object.assign({ key: Math.random().toString(36).slice(2, 9) }, line));
    save(); refreshCart(true);
    toast(line.qty + ' × ' + title(line) + ' ajouté', true);
  }

  /* ───── cart button / mobile bar ───── */
  function refreshCart(bump) {
    var n = count(), btn = $('#cartBtn');
    $('#cartCount').textContent = n;
    $('#cartLabel').textContent = n ? dt(subtotal()) : 'Panier';
    btn.classList.toggle('has', n > 0);
    btn.setAttribute('aria-label', 'Panier : ' + n + ' article' + (n > 1 ? 's' : '') + (n ? ', ' + dt(subtotal()) : ''));
    if (bump) { btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump'); }
    var mb = $('#mbar'); mb.classList.toggle('on', n > 0);
    $('#mbarTxt').textContent = n + ' article' + (n > 1 ? 's' : '') + ' · Voir le panier';
    $('#mbarTot').textContent = dt(subtotal());
    if ($('#dlgCart').classList.contains('open')) renderCart();
  }

  /* ───── toast ───── */
  var toastT;
  function toast(text, withCart) {
    var t = $('#toast'); $('#toastTxt').textContent = text; $('#toastBtn').hidden = !withCart;
    t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 3200);
  }
  $('#toastBtn').addEventListener('click', function () { $('#toast').classList.remove('on'); openDlg('dlgCart'); renderCart(); });

  /* ───── dialogs ───── */
  var lastFocus = {};
  function openDlg(id) {
    var d = document.getElementById(id);
    lastFocus[id] = document.activeElement;
    d.classList.add('open'); d.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add('show'); }); });
    setTimeout(function () { var f = d.querySelector('[data-autofocus]') || d.querySelector('.panel'); f && f.focus(); }, 60);
  }
  function closeDlg(id) {
    var d = document.getElementById(id);
    if (!d.classList.contains('open')) return;
    d.classList.remove('show'); d.setAttribute('aria-hidden', 'true');
    setTimeout(function () {
      d.classList.remove('open');
      if (!document.querySelector('.dlg.open')) document.body.style.overflow = '';
    }, reduce.matches ? 0 : 420);
    var lf = lastFocus[id]; if (lf && lf.focus) lf.focus();
  }
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-close]'); if (!c) return;
    var d = c.closest('.dlg'); if (d) closeDlg(d.id);
  });
  document.addEventListener('keydown', function (e) {
    var open = Array.prototype.slice.call(document.querySelectorAll('.dlg.open')).pop();
    if (!open) return;
    if (e.key === 'Escape') { closeDlg(open.id); return; }
    if (e.key === 'Tab') {
      var f = open.querySelectorAll('button:not([disabled]),[href],input,textarea,[tabindex]:not([tabindex="-1"])');
      f = Array.prototype.filter.call(f, function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ───── menu ───── */
  var cat = 'signatures', q = '';
  var norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  function renderChips() {
    $('#chips').innerHTML = M.categories.map(function (c) {
      var on = c.id === cat && !q;
      return '<button class="chip" role="tab" aria-selected="' + on + '" data-cat="' + c.id + '">' + esc(c.label) + '</button>';
    }).join('');
  }
  function list() {
    if (q) {
      var n = norm(q);
      return M.products.filter(function (p) { return norm([p.name, p.variant || '', catOf(p.cat).label].concat(p.ingredients || []).join(' ')).indexOf(n) > -1; });
    }
    return cat === 'signatures' ? M.products.filter(function (p) { return p.signature; }) : M.products.filter(function (p) { return p.cat === cat; });
  }
  function renderMenu() {
    renderChips();
    var c = catOf(cat), items = list();
    var listMode = q || cat !== 'signatures';
    if (q) $('#catHead').innerHTML = '<div><span class="mono" style="color:var(--accent)">Recherche</span><h3>« ' + esc(q) + ' »</h3><p>' + items.length + ' résultat' + (items.length > 1 ? 's' : '') + '</p></div>';
    else if (cat === 'signatures') $('#catHead').innerHTML = '<div><span class="ar" lang="ar">' + esc(c.ar) + '</span><h3>' + esc(c.label) + '</h3><p>' + esc(c.blurb) + '</p></div>';
    else $('#catHead').innerHTML = '<div class="cat-banner"><div class="cb-img"><img src="' + IMG(CAT_IMG[cat]) + '" alt="' + esc(c.label) + '"></div>' +
      '<div class="cb-txt"><span class="ar" lang="ar">' + esc(c.ar) + '</span><h3>' + esc(c.label) + '</h3><p>' + esc(c.blurb) + '</p>' +
      '<span class="mono cb-count">' + items.length + ' choix · dès ' + dt(Math.min.apply(null, items.map(fromPrice))) + '</span></div></div>';
    var grid = $('#grid'); grid.className = listMode ? 'mlist' : 'grid';
    if (!items.length) {
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><h4>Rien trouvé</h4><p style="color:var(--text-secondary)">Essayez « chawarma », « escalope » ou « thon ».</p></div>';
      return;
    }
    if (listMode) {
      var lastVariant = null;
      grid.innerHTML = items.map(function (p, i) {
        var cc = catOf(p.cat);
        var label = (p.cat === 'extras' ? '' : cc.label + ' ') + p.name + (p.variant ? ' ' + p.variant : '');
        var head = '';
        if (!q && p.variant && p.variant !== lastVariant) { head = '<h4 class="mgroup">' + esc(p.variant) + '</h4>'; }
        if (!q) lastVariant = p.variant || null;
        return head + '<div class="mrow" style="--i:' + Math.min(i, 12) + '">' +
          (q ? '<img class="mthumb" src="' + IMG(p.image) + '" alt="" loading="lazy">' : '') +
          '<button class="mopen" data-open="' + p.id + '" aria-label="' + esc(label) + ', ' + (p.sizes ? 'à partir de ' : '') + dt(fromPrice(p)) + '. Voir le détail">' +
          '<span class="mname">' + (q ? '<small>' + esc(cc.label) + (p.variant ? ' · ' + esc(p.variant) : '') + '</small>' : '') + esc(p.name) + (p.signature ? ' <em class="badge">Signature</em>' : '') + '</span>' +
          '<span class="ming">' + esc(p.ingredients ? p.ingredients.join(', ') : 'Recette maison. Choisissez sauce et suppléments.') + '</span></button>' +
          '<span class="mprice">' + (p.sizes ? p.sizes.map(function (z) { return '<span><small>' + z.label + '</small>' + dt(z.price) + '</span>'; }).join('') : dt(p.price)) + '</span>' +
          '<button class="add" data-open="' + p.id + '" aria-label="Ajouter ' + esc(label) + '">' + ICON.plus + '</button></div>';
      }).join('');
      return;
    }
    grid.innerHTML = items.map(function (p, i) {
      var cc = catOf(p.cat);
      var label = cc.label + ' ' + p.name + (p.variant ? ' ' + p.variant : '');
      return '<article class="card" style="--i:' + Math.min(i, 10) + '">' +
        '<button class="open" data-open="' + p.id + '" aria-label="' + esc(label) + ', à partir de ' + dt(fromPrice(p)) + '. Voir le détail"></button>' +
        '<div class="ph"><img src="' + IMG(p.image) + '" alt="" loading="lazy">' +
        '<div class="badges"><span class="badge dark">' + esc(cc.label) + '</span></div></div>' +
        '<div class="meta"><h4>' + esc(cc.label) + ' ' + esc(p.name) + '</h4><p class="ing">' + esc(p.ingredients ? p.ingredients.join(', ') : '') + '</p>' +
        '<div class="row"><span class="price">' + (p.sizes ? '<small>dès</small>' : '') + dt(fromPrice(p)) + '</span></div></div>' +
        '<button class="add" data-open="' + p.id + '" aria-label="Ajouter ' + esc(label) + '">' + ICON.plus + '</button></article>';
    }).join('');
  }
  $('#chips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]'); if (!b) return;
    cat = b.dataset.cat; q = ''; $('#q').value = '';
    renderMenu();
    b = $('#chips [data-cat="' + cat + '"]'); b && b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth' });
    var top = $('#catHead').getBoundingClientRect().top + scrollY - 170;
    if (scrollY > top) scrollTo({ top: top, behavior: reduce.matches ? 'auto' : 'smooth' });
  });
  var qT; $('#q').addEventListener('input', function (e) { clearTimeout(qT); qT = setTimeout(function () { q = e.target.value.trim(); renderMenu(); }, 120); });
  $('#grid').addEventListener('click', function (e) { var b = e.target.closest('[data-open]'); if (b) openProduct(prodOf(b.dataset.open)); });

  /* supplements strip */
  $('#suppList').innerHTML = M.supplements.map(function (s) {
    var lab = s.label;
    return '<figure class="supp-item rv" style="margin:0"><img src="' + IMG(s.image) + '" alt="' + esc(lab) + '" loading="lazy"><div><b>' + esc(lab) + '</b><span>+' + dt(s.price) + '</span></div></figure>';
  }).join('');

  /* ───── product sheet ───── */
  var P = null;
  function openProduct(p, edit) {
    P = { p: p, edit: edit || null, sizeId: edit ? edit.sizeId : (p.sizes ? p.sizes[p.sizes.length - 1].id : undefined), gratine: edit ? !!edit.gratine : false,
      sauces: edit ? edit.sauces.slice() : [], extras: edit ? edit.extras.slice() : [], note: edit ? edit.note || '' : '', qty: edit ? edit.qty : 1 };
    renderProduct(); openDlg('dlgProduct');
  }
  function renderProduct() {
    var p = P.p, c = catOf(p.cat);
    var u = unit({ productId: p.id, sizeId: P.sizeId, gratine: P.gratine, extras: P.extras });
    var h = '<div class="pd"><div class="pd-img"><img src="' + IMG(p.image) + '" alt="' + esc(c.label + ' ' + p.name) + '"><button class="icon-btn" data-close aria-label="Fermer">' + ICON.x + '</button></div>' +
      '<div class="pd-body"><div class="pd-scroll"><div class="pd-top"><div><span class="mono" style="color:var(--accent)">' + esc(c.label + (p.variant ? ' · ' + p.variant : '')) + '</span>' +
      '<h2 id="pdTitle">' + esc(p.name) + '</h2></div><button class="icon-btn" data-close aria-label="Fermer">' + ICON.x + '</button></div>' +
      '<span class="price">' + dt(base(p, P.sizeId)) + '</span>';
    if (p.ingredients) h += '<ul class="ings" aria-label="Ingrédients">' + p.ingredients.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    if (p.sizes) h += '<fieldset><legend>Taille</legend><div class="sizes">' + p.sizes.map(function (s) { return '<button class="size" data-size="' + s.id + '" aria-pressed="' + (P.sizeId === s.id) + '"><b>' + s.label + '</b><span>' + dt(s.price) + '</span></button>'; }).join('') + '</div></fieldset>';
    if (p.cat === 'tacos') h += '<fieldset><legend class="sr">Option</legend><button class="toggle" data-gratine aria-pressed="' + P.gratine + '"><span><b>Gratiné</b><small>Fromage fondu sur le dessus</small></span><span>+' + dt(M.gratine) + '</span></button></fieldset>';
    if (p.cat !== 'pizza' && p.cat !== 'extras') h += '<fieldset><legend>Sauces</legend><p class="hint">Jusqu\'à 3, incluses</p><div class="opts">' + M.sauces.map(function (s) { var on = P.sauces.indexOf(s) > -1; return '<button class="opt" data-sauce="' + esc(s) + '" aria-pressed="' + on + '"' + (!on && P.sauces.length >= 3 ? ' disabled' : '') + '>' + esc(s) + '</button>'; }).join('') + '</div></fieldset>';
    if (p.cat !== 'extras') h += '<fieldset><legend>Suppléments</legend><div class="sup-grid">' + M.supplements.map(function (s) { return '<button class="sup" data-sup="' + s.id + '" aria-pressed="' + (P.extras.indexOf(s.id) > -1) + '"><span>' + esc(s.label) + '</span><em>+' + dt(s.price) + '</em></button>'; }).join('') + '</div></fieldset>';
    h += '<fieldset><legend><label for="pdNote">Une précision ?</label></legend><textarea id="pdNote" rows="2" maxlength="140" placeholder="Ex. : sans oignon, bien piquant">' + esc(P.note) + '</textarea></fieldset>';
    h += '</div><div class="pd-foot"><div class="stepper"><button data-qty="-1" aria-label="Diminuer la quantité">−</button><span aria-live="polite">' + P.qty + '</span><button data-qty="1" aria-label="Augmenter la quantité">+</button></div>' +
      '<button class="btn" data-submit data-autofocus><span>' + (P.edit ? 'Mettre à jour' : 'Ajouter au panier') + '</span><span>' + dt(u * P.qty) + '</span></button></div></div></div>';
    var panel = $('#pdPanel'), sc = panel.querySelector('.pd-scroll'), top = sc ? sc.scrollTop : 0;
    panel.innerHTML = h;
    sc = panel.querySelector('.pd-scroll'); if (sc) sc.scrollTop = top;
  }
  $('#pdPanel').addEventListener('input', function (e) { if (e.target.id === 'pdNote') P.note = e.target.value; });
  $('#pdPanel').addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t || !P) return;
    var keep = document.activeElement && document.activeElement.dataset ? Object.keys(t.dataset)[0] : null;
    if (t.dataset.size) P.sizeId = t.dataset.size;
    else if ('gratine' in t.dataset) P.gratine = !P.gratine;
    else if (t.dataset.sauce) { var i = P.sauces.indexOf(t.dataset.sauce); if (i > -1) P.sauces.splice(i, 1); else if (P.sauces.length < 3) P.sauces.push(t.dataset.sauce); }
    else if (t.dataset.sup) { var j = P.extras.indexOf(t.dataset.sup); if (j > -1) P.extras.splice(j, 1); else P.extras.push(t.dataset.sup); }
    else if (t.dataset.qty) P.qty = Math.max(1, P.qty + +t.dataset.qty);
    else if ('submit' in t.dataset) {
      var line = { productId: P.p.id, sizeId: P.sizeId, gratine: P.gratine, sauces: P.sauces, extras: P.extras, note: P.note.trim() || undefined, qty: P.qty };
      var editKey = P.edit && P.edit.key;
      closeDlg('dlgProduct');
      if (editKey) { var L = S.cart.filter(function (l) { return l.key === editKey; })[0]; Object.assign(L, line); save(); refreshCart(); setTimeout(function () { openDlg('dlgCart'); renderCart(); }, 300); return; }
      if (!S.branch) { pendingLine = line; setTimeout(function () { openBranch(); }, 300); return; }
      addLine(line); return;
    } else return;
    var sel = keep ? '[data-' + keep + '="' + (t.dataset[keep] || '') + '"]' : null;
    renderProduct();
    var again = sel && $('#pdPanel ' + sel); if (again) again.focus();
  });

  /* ───── branches ───── */
  var pendingLine = null, afterBranch = null;
  function branchCards() {
    return BRANCHES.map(function (b, i) {
      var on = S.branch === b.id;
      return '<div class="bwrap"><button class="branch' + (on ? ' sel' : '') + '" data-branch="' + b.id + '" aria-pressed="' + on + '" aria-label="Commander au resto de ' + b.name + '">' +
        '<video muted loop playsinline preload="none" poster="' + b.poster + '" data-src="' + b.video + '" aria-hidden="true" tabindex="-1"></video>' +
        '<span class="mono" style="color:var(--accent)">0' + (i + 1) + ' · Resto</span><span class="tagsel">Sélectionné</span>' +
        '<span><span class="ar" lang="ar" style="display:block">' + b.ar + '</span><span class="name" style="display:block">' + b.name + '</span>' +
        '<span class="info"><span>' + b.phone + '</span><span class="go">Commander ici →</span></span></span></button>' +
        '<div class="baddr"><span>' + esc(b.address) + '</span><a href="' + b.maps + '" target="_blank" rel="noopener">Itinéraire →</a>' +
        '<span class="zones">Livraison : <b>' + b.zones.join(', ') + '</b></span></div></div>';
    }).join('');
  }
  function renderBranches() {
    $('#branches').innerHTML = branchCards(); $('#branchesDlg').innerHTML = branchCards();
    document.querySelectorAll('.branch video').forEach(function (v) { vio.observe(v); });
    $('#footPhones').innerHTML = BRANCHES.map(function (b) { return '<p><b>' + b.name + '</b> ' + b.phone + '</p><p class="addr"><a href="' + b.maps + '" target="_blank" rel="noopener">' + esc(b.address) + '</a> · livre ' + b.zones.join(', ') + '</p>'; }).join('') + '<p>Livraison à domicile et à emporter.</p>';
  }
  var vio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting && !reduce.matches) { if (!v.src) v.src = vsrc(v); v.play().catch(function () {}); } else v.pause();
    });
  }, { threshold: 0.15 });
  function openBranch() { openDlg('dlgBranch'); }
  function pickBranch(id) {
    var prev = S.branch; S.branch = id; save(); renderBranches();
    closeDlg('dlgBranch');
    var b = BRANCHES.filter(function (x) { return x.id === id; })[0];
    if (pendingLine) { addLine(pendingLine); pendingLine = null; }
    else if (prev && prev !== id && S.cart.length) toast('Resto ' + b.name + ' choisi. Votre panier est gardé, la carte est la même.');
    else if (prev !== id) toast('Resto ' + b.name + ' choisi.');
    if (afterBranch) { var f = afterBranch; afterBranch = null; setTimeout(f, 350); }
    else if (!pendingLine && document.activeElement && document.activeElement.closest && document.activeElement.closest('#restos')) {
      var g = $('#carte'); g && g.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth' });
    }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-branch]'); if (!b) return;
    var inRestos = !!b.closest('#restos');
    pickBranch(b.dataset.branch);
    if (inRestos) { var g = $('#carte'); setTimeout(function () { g.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth' }); }, 200); }
  });

  /* ───── cart ───── */
  function renderCart() {
    var b = BRANCHES.filter(function (x) { return x.id === S.branch; })[0];
    var n = count();
    var h = '<div class="c-head"><div><h2>Votre panier</h2><span style="color:var(--text-secondary);font-size:14px">' + n + ' article' + (n > 1 ? 's' : '') + '</span></div><button class="icon-btn" data-close aria-label="Fermer le panier">' + ICON.x + '</button></div>' +
      '<button class="c-branch" data-cbranch><span><span class="mono" style="color:var(--text-secondary)">Commande pour</span><b>' + (b ? 'Resto ' + b.name : 'Choisir un resto') + '</b></span><span class="go">Changer</span></button>';
    if (!S.cart.length) {
      h += '<div class="c-list"><div class="c-empty"><h3>Panier vide</h3><p>Un makloub, un tacos gratiné, une pizza Jacob. Par quoi on commence ?</p><button class="btn" data-close data-tocarte>Voir la carte</button></div></div>';
    } else {
      h += '<ul class="c-list">' + S.cart.map(function (l) {
        var p = prodOf(l.productId), d = details(l);
        return '<li class="c-item"><img src="' + IMG(p.image) + '" alt=""><div class="t"><h3>' + esc(title(l)) + '<span>' + dt(unit(l) * l.qty) + '</span></h3>' +
          (d.length ? '<p>' + esc(d.join(' · ')) + '</p>' : '') + (l.note ? '<p><em>« ' + esc(l.note) + ' »</em></p>' : '') +
          '<div class="acts"><div class="stepper sm"><button data-dec="' + l.key + '" aria-label="Retirer un ' + esc(title(l)) + '">−</button><span>' + l.qty + '</span><button data-inc="' + l.key + '" aria-label="Ajouter un ' + esc(title(l)) + '">+</button></div>' +
          '<div><button class="icon-btn" data-edit="' + l.key + '" aria-label="Modifier ' + esc(title(l)) + '">' + ICON.edit + '</button><button class="icon-btn" data-del="' + l.key + '" aria-label="Supprimer ' + esc(title(l)) + '">' + ICON.trash + '</button></div></div></div></li>';
      }).join('');
      var inCart = S.cart.map(function (l) { return l.productId; });
      var sugg = [M.products.filter(function (p) { return p.cat === 'extras'; })[0]].concat(M.products.filter(function (p) { return p.signature; })).filter(function (p) { return inCart.indexOf(p.id) < 0; }).slice(0, 4);
      if (sugg.length) h += '<li class="c-sugg"><h4>Avec ça ?</h4><div class="row">' + sugg.map(function (p) { return '<button data-sugg="' + p.id + '"><img src="' + IMG(p.image) + '" alt=""><b>' + esc(p.cat === 'extras' ? p.name : catOf(p.cat).label + ' ' + p.name) + '</b><span>' + dt(fromPrice(p)) + '</span></button>'; }).join('') + '</div></li>';
      h += '</ul><div class="c-foot"><div class="tot"><span style="color:var(--text-secondary)">Sous-total</span><b>' + dt(subtotal()) + '</b></div><button class="btn" data-checkout><span>Passer la commande</span>' + ICON.arrow + '</button></div>';
    }
    $('#cartPanel').innerHTML = h;
  }
  $('#cartPanel').addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;
    var k, L;
    if ((k = t.dataset.inc)) { L = S.cart.filter(function (l) { return l.key === k; })[0]; L.qty++; }
    else if ((k = t.dataset.dec)) { L = S.cart.filter(function (l) { return l.key === k; })[0]; L.qty--; if (L.qty <= 0) S.cart = S.cart.filter(function (l) { return l.key !== k; }); }
    else if ((k = t.dataset.del)) S.cart = S.cart.filter(function (l) { return l.key !== k; });
    else if ((k = t.dataset.edit)) { L = S.cart.filter(function (l) { return l.key === k; })[0]; closeDlg('dlgCart'); setTimeout(function () { openProduct(prodOf(L.productId), L); }, 300); return; }
    else if ((k = t.dataset.sugg)) { closeDlg('dlgCart'); setTimeout(function () { openProduct(prodOf(k)); }, 300); return; }
    else if ('cbranch' in t.dataset) { closeDlg('dlgCart'); afterBranch = function () { openDlg('dlgCart'); renderCart(); }; setTimeout(openBranch, 300); return; }
    else if ('checkout' in t.dataset) { closeDlg('dlgCart'); if (!S.branch) { afterBranch = openCheckout; setTimeout(openBranch, 300); } else setTimeout(openCheckout, 300); return; }
    else if ('tocarte' in t.dataset) { setTimeout(function () { $('#carte').scrollIntoView({ behavior: 'smooth' }); }, 300); return; }
    else return;
    save(); refreshCart(); renderCart();
    var again = k && ($('#cartPanel [data-' + Object.keys(t.dataset)[0] + '="' + k + '"]')); if (again) again.focus();
  });
  $('#cartBtn').addEventListener('click', function () { renderCart(); openDlg('dlgCart'); });
  $('#mbarBtn').addEventListener('click', function () { renderCart(); openDlg('dlgCart'); });

  /* ───── checkout (demo, JS-only success state) ───── */
  var CO = { mode: 'emporter', name: '', phone: '', address: '', zone: '', note: '', tried: false };
  var validPhone = function (raw) { var d = raw.replace(/[\s.\-()]/g, '').replace(/^(\+216|00216)/, ''); return /^[234579]\d{7}$/.test(d); };
  function coErrors() {
    return { name: CO.name.trim().length < 2 ? 'Indiquez votre prénom.' : '', phone: !validPhone(CO.phone) ? 'Numéro tunisien à 8 chiffres, par exemple 55 123 456.' : '',
      address: CO.mode === 'livraison' && CO.address.trim().length < 6 ? 'Indiquez une adresse précise (rue, quartier, repère).' : '',
      zone: CO.mode === 'livraison' && zonesOf().indexOf(CO.zone) < 0 ? 'Choisissez votre ville.' : '' };
  }
  function zonesOf() { var b = BRANCHES.filter(function (x) { return x.id === S.branch; })[0]; return b ? b.zones : []; }
  function zoneField(er) {
    var z = zonesOf(); if (z.length === 1 && !CO.zone) CO.zone = z[0];
    return '<div class="field wide' + (CO.tried && er.zone ? ' bad' : '') + '" role="radiogroup" aria-labelledby="zLab"><label id="zLab">Ville de livraison *</label><div class="zsel">' +
      z.map(function (v) { return '<button type="button" class="opt" data-zone="' + esc(v) + '" aria-pressed="' + (CO.zone === v) + '"' + (CO.tried && er.zone ? ' aria-invalid="true"' : '') + '>' + esc(v) + '</button>'; }).join('') +
      '</div><div class="err">' + (er.zone || '') + '</div><p class="hint" style="margin:8px 0 0">Le resto ' + (BRANCHES.filter(function (x) { return x.id === S.branch; })[0] || {}).name + ' livre ' + z.join(', ') + '.</p></div>';
  }
  function openCheckout() { if (!S.cart.length) return; CO.tried = false; renderCheckout(); openDlg('dlgCheckout'); $('#coPanel').scrollTop = 0; }
  function renderCheckout() {
    var b = BRANCHES.filter(function (x) { return x.id === S.branch; })[0];
    var fee = CO.mode === 'livraison' ? DEMO.fee : 0, total = round(subtotal() + fee), below = CO.mode === 'livraison' && subtotal() < DEMO.minimum;
    var er = coErrors(), bad = function (k) { return CO.tried && er[k] ? ' bad' : ''; };
    $('#coPanel').innerHTML = '<div class="co"><div class="co-top"><button class="back-link" data-close>' + ICON.back.replace('<svg', '<svg width="18" height="18"') + ' La carte</button><img src="assets/img/logo.png" alt="Safi Jacob Food"><span style="width:80px"></span></div>' +
      '<form class="co-grid" id="coForm" novalidate><div><h1>Presque <span class="hl">prêt.</span></h1>' +
      '<div class="note">' + ICON.info + '<span><b>Démo :</b> la commande n\'est pas transmise au restaurant et aucun paiement n\'est demandé.</span></div>' +
      '<h2><span>01</span> Restaurant</h2><div class="box"><span><b>Resto ' + b.name + '</b><small>' + b.phone + '</small></span><button type="button" class="mono" style="color:var(--accent)" data-cobranch>Changer</button></div>' +
      '<h2><span>02</span> Comment ?</h2><div class="modes" role="radiogroup" aria-label="Mode de commande">' +
      '<button type="button" class="mode" role="radio" aria-checked="' + (CO.mode === 'emporter') + '" data-mode="emporter"><b>À emporter</b><small>Retrait au resto ' + b.name + '</small></button>' +
      (DEMO.delivery ? '<button type="button" class="mode" role="radio" aria-checked="' + (CO.mode === 'livraison') + '" data-mode="livraison"><b>Livraison</b><small>Frais ' + dt(DEMO.fee) + ', minimum ' + dt(DEMO.minimum) + ' (démo)</small></button>' : '') +
      '</div><p style="color:var(--text-secondary);font-size:14px;margin:8px 0 0">Préparation indicative : ' + DEMO.prep + ' (démo)</p>' +
      '<h2><span>03</span> Vos coordonnées</h2><div class="fields">' +
      '<div class="field' + bad('name') + '"><label for="coName">Prénom *</label><input id="coName" autocomplete="given-name" value="' + esc(CO.name) + '" placeholder="Votre prénom" aria-invalid="' + !!(CO.tried && er.name) + '" aria-describedby="eName"><div class="err" id="eName">' + er.name + '</div></div>' +
      '<div class="field' + bad('phone') + '"><label for="coPhone">Téléphone *</label><div class="tel"><span>+216</span><input id="coPhone" type="tel" inputmode="tel" autocomplete="tel-national" value="' + esc(CO.phone) + '" placeholder="55 123 456" aria-invalid="' + !!(CO.tried && er.phone) + '" aria-describedby="ePhone"></div><div class="err" id="ePhone">' + er.phone + '</div></div>' +
      (CO.mode === 'livraison' ? zoneField(er) : '') + (CO.mode === 'livraison' ? '<div class="field wide' + bad('address') + '"><label for="coAddr">Adresse de livraison *</label><input id="coAddr" autocomplete="street-address" value="' + esc(CO.address) + '" placeholder="Rue, quartier, repère" aria-invalid="' + !!(CO.tried && er.address) + '" aria-describedby="eAddr"><div class="err" id="eAddr">' + er.address + '</div></div>' : '') +
      '<div class="field wide"><label for="coNote">Note pour la commande (facultatif)</label><textarea id="coNote" rows="2" placeholder="Ex. : sonner à l\'interphone">' + esc(CO.note) + '</textarea></div></div></div>' +
      '<aside class="sum"><div class="torn"><b>Récapitulatif</b></div><ul>' + S.cart.map(function (l) { return '<li><span><em>' + l.qty + '×</em> ' + esc(title(l)) + '</span><span>' + dt(unit(l) * l.qty) + '</span></li>'; }).join('') + '</ul>' +
      '<dl><div><dt>Sous-total</dt><dd>' + dt(subtotal()) + '</dd></div>' + (fee ? '<div><dt>Livraison (démo)</dt><dd>' + dt(fee) + '</dd></div>' : '') + '<div class="grand"><dt>Total</dt><dd>' + dt(total) + '</dd></div></dl>' +
      '<p class="min' + (below ? ' on' : '') + '">Livraison à partir de ' + dt(DEMO.minimum) + '. Il manque ' + dt(round(DEMO.minimum - subtotal())) + '.</p>' +
      '<div class="go"><button class="btn" type="submit" id="coSubmit"><span>Confirmer la commande</span><span>' + dt(total) + '</span></button></div></aside></form></div>';
  }
  $('#coPanel').addEventListener('input', function (e) {
    var id = e.target.id;
    if (id === 'coName') CO.name = e.target.value; else if (id === 'coPhone') CO.phone = e.target.value; else if (id === 'coAddr') CO.address = e.target.value; else if (id === 'coNote') CO.note = e.target.value;
    if (CO.tried) {
      var er = coErrors(), map = { coName: ['name', 'eName'], coPhone: ['phone', 'ePhone'], coAddr: ['address', 'eAddr'] }[id];
      if (map) { var f = e.target.closest('.field'); f.classList.toggle('bad', !!er[map[0]]); $('#' + map[1]).textContent = er[map[0]]; e.target.setAttribute('aria-invalid', !!er[map[0]]); }
    }
  });
  $('#coPanel').addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;
    if (t.dataset.zone) { CO.zone = t.dataset.zone; renderCheckout(); var zb = $('#coPanel [data-zone="' + CO.zone + '"]'); zb && zb.focus(); return; }
    if (t.dataset.mode) { CO.mode = t.dataset.mode; renderCheckout(); var m = $('#coPanel [data-mode="' + CO.mode + '"]'); m && m.focus(); }
    else if ('cobranch' in t.dataset) { afterBranch = function () { if (zonesOf().indexOf(CO.zone) < 0) CO.zone = ''; renderCheckout(); }; openBranch(); }
    else if ('again' in t.dataset) { closeDlg('dlgCheckout'); setTimeout(function () { $('#carte').scrollIntoView({ behavior: 'smooth' }); }, 300); }
  });
  $('#coPanel').addEventListener('submit', function (e) {
    e.preventDefault(); CO.tried = true;
    var er = coErrors(), below = CO.mode === 'livraison' && subtotal() < DEMO.minimum;
    if (er.name || er.phone || er.address || er.zone || below) { renderCheckout(); var f = $('#coPanel [aria-invalid="true"]'); f && f.focus(); return; }
    var btn = $('#coSubmit'); btn.disabled = true; btn.firstChild.textContent = 'Envoi…';
    setTimeout(function () {
      var b = BRANCHES.filter(function (x) { return x.id === S.branch; })[0];
      var fee = CO.mode === 'livraison' ? DEMO.fee : 0, total = round(subtotal() + fee);
      var ref = 'SJ-' + b.code + '-' + Math.floor(1000 + Math.random() * 9000);
      var lines = S.cart.slice();
      $('#coPanel').innerHTML = '<div class="done"><img src="assets/img/logo.png" alt="Safi Jacob Food" style="height:72px;width:auto;margin:0 auto"><svg class="check" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54"/><path d="M38 62 L54 77 L84 45"/></svg>' +
        '<h1>C\'est <span class="hl">parti.</span></h1><p style="color:var(--text-secondary);font-size:19px;margin:0">Merci ' + esc(CO.name.trim()) + '. Commande ' + (CO.mode === 'livraison' ? 'livrée à ' + esc(CO.zone) : 'à emporter') + ', resto ' + b.name + '.</p>' +
        '<div class="ref"><div class="torn"><span class="mono">Référence</span><b>' + ref + '</b></div><ul>' + lines.map(function (l) { return '<li><span>' + l.qty + '× ' + esc(title(l)) + '</span><span>' + dt(unit(l) * l.qty) + '</span></li>'; }).join('') + '</ul>' +
        '<div class="grand"><span style="font:400 22px/1 var(--f-display);text-transform:uppercase">Total</span><b>' + dt(total) + '</b></div></div>' +
        '<div class="note" style="text-align:left">' + ICON.info + '<span><b>Commande de démonstration.</b> Elle n\'a pas été transmise. En production, le resto ' + b.name + ' la recevrait tout de suite sur son écran de commandes.</span></div>' +
        '<button class="btn" data-again style="margin-top:26px;width:100%">Nouvelle commande</button></div>';
      $('#coPanel').scrollTop = 0;
      S.cart = []; save(); refreshCart();
    }, 1000);
  });

  /* ───── tuto steps ───── */
  var steps = Array.prototype.slice.call(document.querySelectorAll('.step'));
  var figs = Array.prototype.slice.call(document.querySelectorAll('.tuto-visual figure'));
  var stepnum = $('#stepnum'), rail = $('.steps .rail b'), curStep = 0;
  function setStep(i) {
    if (i === curStep) return; curStep = i;
    steps.forEach(function (s, n) { s.classList.toggle('on', n === i); });
    figs.forEach(function (f, n) { f.classList.toggle('on', n === i); });
    playFig();
    stepnum.textContent = '0' + (i + 1);
  }
  var railV = -1;
  function tutoScroll() {
    var mid = innerHeight * 0.5, best = 0;
    steps.forEach(function (s, n) { if (s.getBoundingClientRect().top < mid) best = n; });
    setStep(best);
    var box = $('#steps').getBoundingClientRect();
    var v = Math.round(Math.min(1, Math.max(0, (mid - box.top) / box.height)) * 100) / 100;
    if (v !== railV) { rail.style.setProperty('--rp', v); railV = v; }
  }
  /* vidéos de cuisine : seule l'étape affichée joue, et seulement si la section est visible */
  function playFig() {
    figs.forEach(function (f, n) {
      var v = f.querySelector('video'); if (!v) return;
      if (n === curStep && tutoOn && !reduce.matches && innerWidth >= 980) { if (!v.src) v.src = vsrc(v); v.play().catch(function () {}); } else v.pause();
    });
  }
  document.querySelectorAll('.mob-img video').forEach(function (v) { vio.observe(v); });
  var tutoOn = false;
  new IntersectionObserver(function (e) { tutoOn = e[0].isIntersecting; if (tutoOn) tutoScroll(); playFig(); }).observe($('#tuto'));
  addEventListener('scroll', function () { if (tutoOn) tutoScroll(); }, { passive: true });

  /* ───── hold to bake (the interactive moment) ───── */
  var hold = $('#hold'), bake = $('#bake'), hp = 0, holding = false, hraf = null, hlast = 0, baked = false;
  function hstep(now) {
    var d = Math.min(64, now - (hlast || now)); hlast = now;
    if (holding) hp = Math.min(1, hp + d / 1600); else hp = Math.max(0, hp - d / 900);
    hold.style.setProperty('--hp', hp.toFixed(3));
    if (hp >= 1 && !baked) { baked = true; holding = false; bake.classList.add('ok'); hold.querySelector('.core').textContent = 'Prêt'; }
    if ((holding || hp > 0) && !(baked && hp >= 1)) hraf = requestAnimationFrame(hstep); else { hraf = null; hlast = 0; }
  }
  function hstart(e) { if (baked) return; if (e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') return; if (e.repeat) return; e.preventDefault(); if (reduce.matches) { hp = 1; hold.style.setProperty('--hp', 1); baked = true; bake.classList.add('ok'); hold.querySelector('.core').textContent = 'Prêt'; return; } holding = true; if (!hraf) hraf = requestAnimationFrame(hstep); }
  function hend() { holding = false; if (!hraf && hp > 0 && !baked) hraf = requestAnimationFrame(hstep); }
  hold.addEventListener('pointerdown', hstart); hold.addEventListener('keydown', hstart);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { hold.addEventListener(ev, hend); });
  hold.addEventListener('keyup', hend);
  hold.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  /* ───── tickers ───── */
  var words = ['Makloub', 'Mlawi', 'Tacos', 'Chapati', 'Libanais', 'Baguette farcie', 'Pizza'];
  var one = words.map(function (w) { return '<span>' + w + '</span><span class="x">✕</span>'; }).join('');
  var row = ''; for (var r = 0; r < 6; r++) row += one;
  $('#ticker').innerHTML = row + row; $('#ticker2').innerHTML = row + row;

  /* ───── reveal + nav + pause ───── */
  var rio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
  function observeRv() { document.querySelectorAll('.rv:not(.in)').forEach(function (el) { rio.observe(el); }); }
  var nav = $('#nav'), navSolid = null;
  function navCheck() { var s = scrollY > 40; if (s !== navSolid) { nav.classList.toggle('solid', s); navSolid = s; } }
  addEventListener('scroll', navCheck, { passive: true });
  document.addEventListener('visibilitychange', function () { document.body.classList.toggle('paused', document.hidden); });
  function pinToFinalStates() { document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); }); document.querySelectorAll('.branch video').forEach(function (v) { v.pause(); }); }
  reduce.addEventListener && reduce.addEventListener('change', function (e) { if (e.matches) pinToFinalStates(); else observeRv(); });

  renderMenu(); renderBranches(); refreshCart(); navCheck(); observeRv(); tutoScroll();
  if (reduce.matches) pinToFinalStates();
})();
