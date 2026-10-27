(function () {
  var root = document.documentElement;
  root.classList.add('js');

  var header = document.getElementById('siteHeader');
  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('menu');

  function setMenu(open, keepFocus) {
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
    if (open) { menu.querySelector('a').focus(); }
    else if (!keepFocus) { btn.focus(); }
  }
  btn.addEventListener('click', function () {
    setMenu(btn.getAttribute('aria-expanded') !== 'true');
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) { setMenu(false, true); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); }
  });
  // メニューの外側(ぼかした背景)を押したら閉じる
  var backdrop = document.getElementById('menuBackdrop');
  if (backdrop) { backdrop.addEventListener('click', function () { setMenu(false, true); }); }

  // 画面に入ったら一度だけ現れる演出(what is FONCÉ、ラインナップ)
  var reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.25 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  // 大きなロゴがヒーローから外れたら、ヘッダーに小さなロゴを出す
  var logo = document.getElementById('heroLogo');
  if ('IntersectionObserver' in window && logo) {
    new IntersectionObserver(function (entries) {
      header.classList.toggle('is-scrolled', !entries[0].isIntersecting);
    }, { rootMargin: '-64px 0px 0px 0px' }).observe(logo);
  } else {
    header.classList.add('is-scrolled');
  }
})();