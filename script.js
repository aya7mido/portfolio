// ===== アコーディオン（Q&A） =====
document.querySelectorAll('.acc-q').forEach((btn) => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isOpen = item.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
  });
});

// ===== スライダー（にっき） =====
const slides = document.querySelectorAll('.slide');
let current = 0;

function showSlide(index) {
  current = (index + slides.length) % slides.length;
  slides.forEach((s, i) => s.classList.toggle('active', i === current));
}

document.querySelector('.prev').addEventListener('click', () => showSlide(current - 1));
document.querySelector('.next').addEventListener('click', () => showSlide(current + 1));

// ===== サイドメニュー：表示中のセクションをハイライト =====
// 画面の上から45%の高さの線を、いちばん最近こえたセクションを「いま」とする（毎回かんたんに計算するので、押した順番に関係なく正しく切り替わる）
const menuLinks = document.querySelectorAll('.side-menu ol a, .drawer ol a');
const targets = [...menuLinks]
  .map((a) => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);

function setActive(id) {
  menuLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
}

let lockUntil = 0;   // メニューを押した直後は、スムーススクロールが終わるまで、押した項目のまま
function updateActive() {
  if (performance.now() < lockUntil) return;
  if (window.scrollY < 100) { setActive(''); return; }   // ページ最上部では、どれも選ばない
  const line = window.innerHeight * 0.45;
  let current = '';
  targets.forEach((t) => { if (t.getBoundingClientRect().top <= line) current = t.id; });
  setActive(current);
}
let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { ticking = false; updateActive(); });
}, { passive: true });
window.addEventListener('resize', updateActive);
window.addEventListener('scrollend', () => { lockUntil = 0; updateActive(); });
menuLinks.forEach((a) => a.addEventListener('click', () => {
  setActive(a.getAttribute('href').slice(1));
  lockUntil = performance.now() + 1500;                 // scrollend に対応していないブラウザ向けの保険
  setTimeout(updateActive, 1550);
}));
updateActive();

// 少しスクロールしたら、「scroll」の案内を「top」に変え、NEWSを消す
window.addEventListener('scroll', () => document.body.classList.toggle('scrolled', window.scrollY > 60), { passive: true });

// NEWSの高さを、MENUと同じにそろえる
const sideMenu = document.querySelector('.side-menu:not(.side-news)');
const sideNews = document.querySelector('.side-news');
function syncSideHeight() {
  if (sideMenu && sideNews) sideNews.style.height = sideMenu.offsetHeight + 'px';
}
syncSideHeight();
window.addEventListener('resize', syncSideHeight);
window.addEventListener('load', syncSideHeight);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncSideHeight);

// ===== ファーストビュー：「おいで！」を3回押すと猫が全身出てくる =====
const hero = document.querySelector('.hero');
const callBtn = document.querySelector('.call-btn');
const callLabel = callBtn.querySelector('.call-label');
const retryBtns = document.querySelectorAll('.retry-btn');   // 中（カードのなか）と外（広い画面）の2つ
const retryBtn = {
  classList: { add: (c) => retryBtns.forEach((b) => b.classList.add(c)), remove: (c) => retryBtns.forEach((b) => b.classList.remove(c)) },
  addEventListener: (ev, fn) => retryBtns.forEach((b) => b.addEventListener(ev, fn)),
};
const heroCat = document.querySelector('.hero .cat');
heroCat.querySelector('.cat-tail').addEventListener('animationend', () => heroCat.classList.remove('wag'));
const LAST_STAGE = 3;   // 0: のぞいている → 1 → 2 → 3: 全身
let stage = 0;
let busy = false;       // アニメーション中の連打を防ぐ

callBtn.addEventListener('click', () => {
  // 手がぽんと押して、ボタンもへこむ（アニメが終わったら外す）
  callBtn.classList.remove('pressed'); void callBtn.offsetWidth; callBtn.classList.add('pressed');
  setTimeout(() => callBtn.classList.remove('pressed'), 450);
  if (busy) return;

  if (stage < LAST_STAGE) {
    stage += 1;
    hero.dataset.stage = stage;
    busy = true;
    setTimeout(() => {
      busy = false;
      // 3回目で全身が出たら、ボタンはプロフィールへの案内に変わる
      if (stage === LAST_STAGE) {
        callLabel.textContent = 'みどりって？';
        callBtn.classList.add('is-know');   // ボタンを大きく・緑に
        retryBtn.classList.add('show');    // 「もう1回」を出す
        heroCat.classList.add('wag');      // 猫が出きったら、しっぽを2回ほど振る
      }
    }, 1000);
  } else {
    document.querySelector('#profile').scrollIntoView({ behavior: 'smooth' });
  }
});

// 「もう1回」：猫を壁に戻して、最初からおいでできるようにする
retryBtn.addEventListener('click', () => {
  if (busy) return;
  busy = true;
  stage = 0;
  hero.dataset.stage = 0;
  callLabel.textContent = 'おいで';
  callBtn.classList.remove('is-know');
  retryBtn.classList.remove('show');
  setTimeout(() => { busy = false; }, 1000);
});

// ===== 最下部の猫：触れる／クリックで、しっぽを1秒ふる =====
const lastCat = document.querySelector('.last-cat');
const catTail = document.querySelector('.cat-tail');
function wagTail() {
  if (lastCat.classList.contains('wag')) return;   // 振っている間は重ねない
  lastCat.classList.add('wag');
}
catTail.addEventListener('animationend', () => lastCat.classList.remove('wag'));
lastCat.addEventListener('pointerenter', wagTail);
lastCat.addEventListener('click', wagTail);        // スマホは、タップで振る

// ===== トースト：data-toast を付けたリンクは、ページを移動せず、メッセージだけ出す =====
const toastEl = document.querySelector('.toast');
let toastTimer;
document.querySelectorAll('a[data-toast]').forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    toastEl.textContent = a.dataset.toast;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
  });
});


// ===== ハンバーガーメニュー（幅1200px以下）：開く・閉じる =====
const menuToggle = document.querySelector('.menu-toggle');
const drawer = document.querySelector('.drawer');
const backdrop = document.querySelector('.drawer-backdrop');
function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', open);
  menuToggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  drawer.setAttribute('aria-hidden', !open);
  if (open) { backdrop.hidden = false; }
  else { setTimeout(() => { if (!document.body.classList.contains('menu-open')) backdrop.hidden = true; }, 300); }
}
menuToggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
backdrop.addEventListener('click', () => setMenu(false));
drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
window.addEventListener('resize', () => { if (window.innerWidth > 1200) setMenu(false); });


// ===== 「おいで」ボタンの上だけ、手のカーソル（マウスのときだけ） =====
// おいで → 手招きの手 / みどりって？ → 指さしの手。クリックすると、手もポンと動く。
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const HANDS = {
    oide: { src: 'images/hand-oide.webp', x: 0.60, y: 0.07 },   // 指先の位置（画像の幅・高さに対する割合）
    know: { src: 'images/hand-know.webp', x: 0.85, y: 0.07 },
  };
  Object.values(HANDS).forEach((h) => { const i = new Image(); i.src = h.src; });   // 先に読み込んでおく
  const hand = document.createElement('div');
  hand.className = 'hand-cursor';
  hand.innerHTML = '<img alt="" width="124" height="130">';
  document.body.appendChild(hand);
  const handImg = hand.querySelector('img');
  let kind = '';
  const place = (e) => {
    const k = callBtn.classList.contains('is-know') ? 'know' : 'oide';
    if (k !== kind) { kind = k; handImg.src = HANDS[k].src; }
    const w = hand.offsetWidth, h = hand.offsetHeight;
    hand.style.transform = `translate(${e.clientX - w * HANDS[k].x}px, ${e.clientY - h * HANDS[k].y}px)`;
  };
  callBtn.addEventListener('pointerenter', (e) => { document.body.classList.add('fake-cursor'); place(e); hand.classList.add('show'); });
  callBtn.addEventListener('pointermove', place);
  callBtn.addEventListener('pointerleave', () => { hand.classList.remove('show'); document.body.classList.remove('fake-cursor'); });
  callBtn.addEventListener('click', () => {
    hand.classList.remove('tap'); void hand.offsetWidth; hand.classList.add('tap');
    setTimeout(() => hand.classList.remove('tap'), 450);
  });
}


// 外の魚の高さを、ボタンの高さにそろえる
const retryOut = document.querySelector('.retry-out');
function placeRetryOut() {
  if (!retryOut) return;
  const r = callBtn.getBoundingClientRect();
  retryOut.style.top = (r.top + window.scrollY + r.height / 2 - retryOut.offsetHeight / 2 - 100) + 'px';
}
placeRetryOut();
window.addEventListener('resize', placeRetryOut);
window.addEventListener('load', placeRetryOut);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeRetryOut);

/* 比較用：URLの末尾に ?say=cat をつけると、「もう1回」を猫が言う版になる（決まったら <body class="say-cat"> に） */
try { const q = new URLSearchParams(location.search); if (q.get('say') === 'cat') document.body.classList.add('say-cat'); } catch (e) {}
