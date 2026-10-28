(function(){
  var root = document.documentElement;
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var N = slides.length;
  var works = document.getElementById('works'), aboutEl = document.getElementById('about');
  var live = document.getElementById('live');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function clamp(x){ return Math.min(1, Math.max(0, x)); }
  function ease(x){ return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

  /* ---- 作品カード: 説明 / デスクトップ / レスポンシブ をボタンで切り替える ---- */
  var LABEL = { desc: 'explanation', desk: 'desktop', mob: 'responsive' };
  function setView(slide, v){
    slide.setAttribute('data-view', v);
    if (v === 'mob') setPhone(slide, 0);
    var L = slide.querySelector('.side-l'), R = slide.querySelector('.side-r');
    // 左のボタン: 説明へ(デスクトップ時) / デスクトップへ戻る(レスポンシブ時) / 説明を見ている間は隠す
    var lt = v === 'desk' ? 'desc' : (v === 'mob' ? 'desk' : null);
    var rt = v === 'desk' ? 'mob' : (v === 'desc' ? 'desk' : null);
    [[L, lt], [R, rt]].forEach(function(p){
      var b = p[0], t = p[1];
      if (!t) { b.setAttribute('data-hide', ''); b.setAttribute('tabindex', '-1'); b.setAttribute('aria-hidden', 'true'); return; }
      b.removeAttribute('data-hide'); b.removeAttribute('tabindex'); b.removeAttribute('aria-hidden');
      b.setAttribute('data-to', t);
      b.querySelector('.lbl').textContent = LABEL[t];
      b.setAttribute('aria-label', LABEL[t]);
      var tp = b.querySelector('textPath');
      // 区切りの「·」の前後は消えないスペース(\u00a0)にして、円の継ぎ目でも点が単語にくっつかないようにする
      if (tp) tp.textContent = new Array(Math.max(2, Math.round(26 / (LABEL[t].length + 3))) + 1).join(LABEL[t] + '\u00a0\u00a0·\u00a0\u00a0');
    });
    var panes = { desc: '.pane-desc', desk: '.pane-desk', mob: '.pane-mob' };
    Object.keys(panes).forEach(function(k){
      var p = slide.querySelector(panes[k]);
      if (k === v) p.removeAttribute('inert'); else p.setAttribute('inert', '');
    });
  }
  /* ---- スマホ: レスポンシブ表示は1枚ずつ大きく(下のドットで何枚目か表示) ---- */
  var mqMob = window.matchMedia('(max-width: 820px)');
  function setPhone(slide, k){
    var phs = slide.querySelectorAll('.pane-mob .ph');
    if (!phs.length) return;
    k = Math.max(0, Math.min(phs.length - 1, k));
    slide.phIdx = k;
    Array.prototype.forEach.call(phs, function(p, i){ p.classList.toggle('on', i === k); p.style.setProperty('--d', i - k); });
    Array.prototype.forEach.call(slide.querySelectorAll('.ph-dots button'), function(d, i){ d.setAttribute('aria-current', i === k ? 'true' : 'false'); });
  }
  slides.forEach(function(s){
    var phs = s.querySelectorAll('.pane-mob .ph');
    if (phs.length > 1) {
      var dots = document.createElement('span');
      dots.className = 'ph-dots';
      Array.prototype.forEach.call(phs, function(_, i){
        var b = document.createElement('button');
        b.type = 'button'; b.setAttribute('aria-label', 'スマホ画面 ' + (i + 1) + '枚目');
        b.addEventListener('click', function(){ setPhone(s, i); });
        dots.appendChild(b);
      });
      s.querySelector('.pane-mob .screen').appendChild(dots);
    }
    setPhone(s, 0);

    /* ---- カードを左右にスワイプして切り替え(ボタンと同じ動き)
       指を左へ → 右側の画面へ(説明 → デスクトップ → スマホ1・2・3)、指を右へ → 戻る ---- */
    var card = s.querySelector('.card'), sx = 0, sy = 0, tracking = false;
    card.addEventListener('touchstart', function(e){
      if (e.touches.length !== 1) { tracking = false; return; }
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
    }, { passive: true });
    card.addEventListener('touchend', function(e){
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
      var v = s.getAttribute('data-view'), multi = mqMob.matches && phs.length > 1;
      if (dx < 0) {
        if (v === 'desc') setView(s, 'desk');
        else if (v === 'desk') setView(s, 'mob');
        else if (v === 'mob' && multi) setPhone(s, s.phIdx + 1);
      } else {
        if (v === 'mob' && multi && s.phIdx > 0) setPhone(s, s.phIdx - 1);
        else if (v === 'mob') setView(s, 'desk');
        else if (v === 'desk') setView(s, 'desc');
      }
    }, { passive: true });
  });

  slides.forEach(function(s){
    setView(s, 'desk');
    s.querySelectorAll('.side-btn').forEach(function(b){
      b.addEventListener('click', function(){ var t = b.getAttribute('data-to'); if (t) setView(s, t); });
    });
  });

  var active = -1;
  function setActive(i){
    if (i === active) return;
    active = i;
    slides.forEach(function(s, k){
      if (k === i) { s.removeAttribute('inert'); s.removeAttribute('aria-hidden'); }
      else { s.setAttribute('inert', ''); s.setAttribute('aria-hidden', 'true'); if (s.getAttribute('data-view') !== 'desk') setView(s, 'desk'); }
    });
    live.textContent = (i + 1) + ' / ' + N;
  }

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.topbar nav a'));
  var ticking = false, sm = window.scrollY, nowEl = document.getElementById('now'), nowTxt = 'intro';
  function setNow(t){
    if (!nowEl || t === nowTxt) return;
    nowTxt = t; nowEl.classList.add('sw');
    setTimeout(function(){ nowEl.textContent = t; nowEl.classList.remove('sw'); }, 260);
  }
  // 100svh を px で測る(スマホのアドレスバーに左右されない)
  var probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100svh;visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  var footEl = document.getElementById('foot');
  var shown = false;
  function metrics(){
    var vh = probe.offsetHeight || window.innerHeight;
    var m = { vh: vh, W1: vh * .75, W2: vh * .75, F: vh * .4, step: vh * .85 };
    m.endS = m.W1 + (N - 1) * m.step;
    return m;
  }
  function update(){
    var m = metrics(), vh = m.vh, sy = window.scrollY;
    root.style.setProperty('--W1', m.W1 + 'px'); root.style.setProperty('--W2', m.W2 + 'px');
    root.style.setProperty('--F', m.F + 'px'); root.style.setProperty('--step', m.step + 'px');
    // なめらかに追従する
    if (reduce.matches) sm = sy; else { sm += (sy - sm) * .14; if (Math.abs(sy - sm) < .4) sm = sy; }
    ticking = sm !== sy;
    if (ticking) requestAnimationFrame(update);
    var maxS = Math.max(1, document.documentElement.scrollHeight - vh);
    root.style.setProperty('--pp', clamp(sy / maxS).toFixed(4));

    // 画面の切り替え: ヒーロー→作品 (w1) / 作品→About (w2) / 下の帯が中央から広がる (f)
    var w1 = ease(clamp(sm / m.W1)), w2 = ease(clamp((sm - m.endS) / m.W2)), ff = ease(clamp((sy - m.endS - m.W2) / m.F));
    root.style.setProperty('--hs', clamp(sm / m.W1).toFixed(4));
    root.style.setProperty('--w1', w1.toFixed(4));
    root.style.setProperty('--w2', w2.toFixed(4));
    root.style.setProperty('--f', ff.toFixed(4));
    works.querySelector('.stage').style.visibility = (w1 <= .001 || w2 >= .999) ? 'hidden' : 'visible';
    aboutEl.style.visibility = w2 <= .001 ? 'hidden' : 'visible';
    footEl.classList.toggle('on', ff > .85);

    // 作品: 1枚ずつ下から上がる
    var pp = Math.min(Math.max(sm - m.W1, 0), m.step * (N - 1));
    var f = pp / m.step, t = [], i;
    for (i = 0; i < N; i++) {
      var x = i === 0 ? 1 : ease(clamp((f - (i - 1) - .12) / .76));
      if (reduce.matches) x = x > .5 ? 1 : 0;
      t.push(x);
    }
    var idx = 0;
    for (i = 0; i < N; i++) {
      slides[i].style.zIndex = i + 1;
      slides[i].querySelector('.wk').style.setProperty('--t', t[i].toFixed(4));
      var c = clamp((t[i] - .6) / .4) * (i < N - 1 ? clamp(1 - t[i + 1] / .35) : 1);
      slides[i].querySelector('.wk').style.setProperty('--c', c.toFixed(3));
      slides[i].style.visibility = (i < N - 1 && t[i + 1] >= .999) ? 'hidden' : 'visible';
      if (i > 0 && t[i] > .5) idx = i;
    }
    setActive(idx);

    // 紺の面が右上のナビに届いたらピンクに。左端の縦ラベルは、もっと早く
    root.classList.toggle('dark', w1 > .8 && w2 < .8);
    root.classList.toggle('dl', w1 > .06 && w2 < .06);
    if (w2 > .3) rv.forEach(function(el){ el.classList.add('in'); });

    var cur = w1 < .5 ? 0 : (w2 > .5 ? N + 1 : idx + 1);
    navLinks.forEach(function(a){ a.classList.toggle('on', a.getAttribute('href') === (cur === N + 1 ? '#about' : (cur >= 1 ? '#works' : '#none'))); });
    setNow(cur === 0 ? 'intro' : (cur === N + 1 ? 'about' : 'works 0' + cur));
  }
  function onScroll(){ if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  var rv = document.querySelectorAll('.rv,.split');
  // ナビ: 章の位置へなめらかに移動(章が重なって配置されているため)
  // ナビや back to top で移動するときは、スクロールスナップを一時的に外す
  // (外さないと、途中のカードで必ず止まる設定に引っかかり、目的の位置まで行けない)
  var snapTimer = null;
  function goTo(y){
    var html = document.documentElement;
    html.style.scrollSnapType = 'none';
    clearTimeout(snapTimer);
    window.scrollTo({ top: y, behavior: reduce.matches ? 'auto' : 'smooth' });
    var check = function(){
      if (Math.abs(window.scrollY - y) < 3) { html.style.scrollSnapType = ''; window.removeEventListener('scroll', onArrive); clearTimeout(snapTimer); }
    };
    var onArrive = function(){ check(); };
    window.addEventListener('scroll', onArrive, { passive: true });
    snapTimer = setTimeout(function(){ html.style.scrollSnapType = ''; window.removeEventListener('scroll', onArrive); }, 2500);
    check();
  }
  document.querySelectorAll('a[href="#works"],a[href="#about"],a[href="#top"]').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      var m = metrics(), h = a.getAttribute('href');
      goTo(h === '#top' ? 0 : (h === '#works' ? m.W1 + 2 : m.endS + m.W2 + 2));
    });
  });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  /* ---- スマホ: スクロールスナップ。止まる位置(ファーストビュー・5枚のカード・about・最後)に印を置き、
     どんなに強くスワイプしても、必ず1画面ずつ止まるようにする(CSSの scroll-snap-stop: always) ---- */
  var snapBox = document.createElement('div');
  snapBox.className = 'snaps'; snapBox.setAttribute('aria-hidden', 'true');
  document.body.appendChild(snapBox);
  function placeSnaps(){
    var m = metrics(), tops = [0], i;
    for (i = 0; i < N; i++) tops.push(m.W1 + i * m.step + 2);
    tops.push(m.endS + m.W2 + 2);
    tops.push(Math.max(0, document.documentElement.scrollHeight - m.vh));
    snapBox.innerHTML = tops.map(function(t){ return '<i style="top:' + Math.round(t) + 'px"></i>'; }).join('');
  }
  placeSnaps();
  window.addEventListener('resize', placeSnaps);
  window.addEventListener('load', placeSnaps);

  /* ---- 作品サイトの「← portfolio」から戻ったとき(#nuee など)は、その作品のスライドを表示する ---- */
  var WORK_IDS = ['nuee', 'teno', 'fonce', 'mido', 'timer'];
  var backTo = WORK_IDS.indexOf(location.hash.slice(1));
  if (backTo > -1) {
    var mb = metrics();
    window.scrollTo({ top: mb.W1 + backTo * mb.step + 2, behavior: 'instant' });
    sm = window.scrollY;
    history.replaceState(null, '', location.pathname + location.search);
    update();
  }

  /* ---- 表示切り替え: スライド / 一覧(グリッド) ---- */
  var gridView = document.getElementById('gridView');
  var modeBtns = Array.prototype.slice.call(document.querySelectorAll('.vt-btn'));
  function setMode(mode){
    var grid = mode === 'grid';
    root.classList.toggle('gridmode', grid);
    gridView.hidden = !grid;
    modeBtns.forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === mode)); });
    slides.forEach(function(s){ if (grid) s.setAttribute('inert', ''); });
    if (!grid) { active = -1; update(); }
  }
  modeBtns.forEach(function(b){ b.addEventListener('click', function(){ setMode(b.getAttribute('data-mode')); }); });
  // Escで一覧を閉じて、スライドに戻る
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && root.classList.contains('gridmode')) setMode('slide'); });
})();

// カーソル: 7つの角の星。少し遅れてついてきて、動いた方向にくるっと回る。ナビやボタンの上では大きくなる
(function(){
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  var star = document.querySelector('.cur-star');
  if (!star) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tx = -100, ty = -100, x = -100, y = -100, rot = 0, running = false, root = document.documentElement;
  function loop(){
    var dx = tx - x, dy = ty - y;
    x += dx * (reduce ? 1 : .28); y += dy * (reduce ? 1 : .28);
    if (!reduce) rot += dx * .6;
    star.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + rot.toFixed(1) + 'deg)';
    if (Math.abs(dx) > .1 || Math.abs(dy) > .1) requestAnimationFrame(loop); else running = false;
  }
  window.addEventListener('pointermove', function(e){
    if (e.pointerType && e.pointerType !== 'mouse') return;
    tx = e.clientX; ty = e.clientY;
    root.classList.add('cur-on', 'has-cursor');
    var t = e.target.closest ? e.target : document.body;
    root.classList.toggle('cur-card', !!t.closest('.card'));
    root.classList.toggle('cur-hover', !!t.closest('.topbar a,.side-btn,.chip,.foot a,.vt-btn,.gv-card'));
    if (!running) { running = true; requestAnimationFrame(loop); }
  }, { passive: true });
  document.addEventListener('pointerleave', function(){ root.classList.remove('cur-on'); });
  document.addEventListener('pointerenter', function(){ root.classList.add('cur-on'); });
})();

// マウスに合わせたロゴの視差と、両脇ボタンの吸い寄せ
(function(){
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement;
  window.addEventListener('pointermove', function(e){
    root.style.setProperty('--mx', (e.clientX / innerWidth * 2 - 1).toFixed(3));
    root.style.setProperty('--my', (e.clientY / innerHeight * 2 - 1).toFixed(3));
  }, { passive: true });
})();
