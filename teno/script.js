(function(){
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: solid background once the hero scrolls away ---------- */
  var header = document.getElementById('siteHeader');
  var hero = document.querySelector('.hero');
  if(header && hero){
    // Measured once, before any scrolling, while the header is still in its
    // tall "unscrolled" state — this is the buffer used to decide the
    // switch point. To make the switch happen earlier/later on purpose,
    // add or subtract a fixed number of pixels here, e.g. `headerHeight + 40`.
    var headerHeight = header.getBoundingClientRect().height;
    var ticking = false;
    function updateHeaderState(){
      var heroBottom = hero.getBoundingClientRect().bottom;
      header.classList.toggle('scrolled', heroBottom <= headerHeight);
      ticking = false;
    }
    window.addEventListener('scroll', function(){
      if(!ticking){ requestAnimationFrame(updateHeaderState); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', function(){
      if(!header.classList.contains('scrolled')){
        headerHeight = header.getBoundingClientRect().height;
      }
    });
    updateHeaderState();
  }

  /* ---------- Mobile nav drawer ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var mobileNav = document.getElementById('mobileNav');
  var navBackdrop = document.getElementById('navBackdrop');
  var navClose = document.getElementById('navClose');

  function openNav(){
    mobileNav.classList.add('is-open');
    navBackdrop.classList.add('is-open');
    menuBtn.classList.add('is-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    mobileNav.setAttribute('aria-hidden', 'false');
  }
  function closeNav(){
    mobileNav.classList.remove('is-open');
    navBackdrop.classList.remove('is-open');
    menuBtn.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('aria-hidden', 'true');
  }
  if(menuBtn && mobileNav && navBackdrop && navClose){
    menuBtn.addEventListener('click', function(){
      mobileNav.classList.contains('is-open') ? closeNav() : openNav();
    });
    navClose.addEventListener('click', closeNav);
    navBackdrop.addEventListener('click', closeNav);
    mobileNav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', closeNav);
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') closeNav();
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && !reduceMotion){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.18 });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
  }

  /* ---------- Lineup: continuous left-flowing marquee ---------- */
  var track = document.getElementById('lineupTrack');
  var originalItems = Array.prototype.slice.call(track.querySelectorAll('.lineup-item'));

  // Duplicate the set once so the track can loop seamlessly (skipped under
  // reduced-motion, where the list stays static and finite).
  var items = originalItems;
  if(!reduceMotion){
    originalItems.forEach(function(el){
      track.appendChild(el.cloneNode(true));
    });
    items = Array.prototype.slice.call(track.querySelectorAll('.lineup-item'));
  }

  function currentIndex(){
    var trackRect = track.getBoundingClientRect();
    var center = trackRect.left + trackRect.width / 2;
    var closest = 0, minDist = Infinity;
    items.forEach(function(it, i){
      var r = it.getBoundingClientRect();
      var itemCenter = r.left + r.width / 2;
      var dist = Math.abs(itemCenter - center);
      if(dist < minDist){ minDist = dist; closest = i; }
    });
    return closest;
  }

  function setActiveByIndex(idx){
    items.forEach(function(it, i){
      it.classList.toggle('active', i === idx);
    });
  }

  function refreshActive(){ setActiveByIndex(currentIndex()); }

  if(reduceMotion){
    // 動きを減らす設定: 流さずに6色を並べて表示する(CSS側で折り返し表示)
    setActiveByIndex(0);
  } else {
    // Continuous auto-scroll: the track drifts left on its own, wrapping
    // seamlessly at the halfway point (where the clone set begins).
    var SPEED = 32; // px per second — slow, ambient drift
    var paused = false;
    var resumeTimer = null;
    var lastTs = null;
    var halfWidth = track.scrollWidth / 2;

    // 位置は小数のまま、この変数で持つ。
    // scrollLeft に毎フレーム 0.5px 前後を「足す」と、ブラウザが1px未満を切り捨てるため
    // Safari や高リフレッシュレート(120Hz等)の画面では位置が進まず、止まって見えていた
    var pos = track.scrollLeft;

    function step(ts){
      if(lastTs === null) lastTs = ts;
      var dt = Math.min(ts - lastTs, 100); // タブ復帰時などに一気に飛ばないよう上限をつける
      lastTs = ts;

      if(!paused){
        pos += (SPEED * dt) / 1000;
        if(pos >= halfWidth){
          pos -= halfWidth;
        }
        track.scrollLeft = pos;
        refreshActive();
      }
      requestAnimationFrame(step);
    }

    function pause(){
      paused = true;
      clearTimeout(resumeTimer);
    }
    function scheduleResume(delay){
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function(){
        // ドラッグやボタンで動かした位置から続きを流す
        pos = track.scrollLeft;
        if(pos >= halfWidth) pos -= halfWidth;
        paused = false;
        lastTs = null;
      }, delay);
    }

    // Pause only for an actual grab/drag or wheel scroll — hovering alone
    // should not stop the drift (that's handled purely via CSS now).
    track.addEventListener('pointerdown', pause, { passive: true });
    track.addEventListener('pointerup', function(){ scheduleResume(1200); }, { passive: true });
    track.addEventListener('pointercancel', function(){ scheduleResume(1200); }, { passive: true });
    track.addEventListener('wheel', function(){ pause(); scheduleResume(1500); }, { passive: true });


    // Keep the wrap point accurate if fonts/images finish loading late.
    window.addEventListener('resize', function(){ halfWidth = track.scrollWidth / 2; });
    window.addEventListener('load', function(){ halfWidth = track.scrollWidth / 2; });

    setActiveByIndex(0);
    requestAnimationFrame(step);
  }

  /* ---------- ページの先頭へ戻るボタン: ヒーローを過ぎたら現れる ---------- */
  var toTop = document.getElementById('toTop');
  if(toTop && hero){
    var setTop = function(){ toTop.classList.toggle('is-show', hero.getBoundingClientRect().bottom < 0); };
    window.addEventListener('scroll', setTop, { passive: true });
    setTop();
    toTop.addEventListener('click', function(e){
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- クーポンバナー: ヒーローを過ぎたら右下に出す / フッターが見えたら隠す ---------- */
  var coupon = document.getElementById('coupon');
  var couponClose = document.getElementById('couponClose');
  var couponCode = document.getElementById('couponCode');
  var foot = document.getElementById('siteFoot');
  if(coupon && hero){
    var closed = false;
    try { closed = sessionStorage.getItem('tenoCouponClosed') === '1'; } catch(e){}
    var updateCoupon = function(){
      if(closed){ coupon.classList.remove('is-show'); return; }
      var pastHero = hero.getBoundingClientRect().bottom < window.innerHeight * 0.4;
      var footVisible = foot && foot.getBoundingClientRect().top < window.innerHeight;
      coupon.classList.toggle('is-show', pastHero && !footVisible);
    };
    window.addEventListener('scroll', updateCoupon, { passive: true });
    window.addEventListener('resize', updateCoupon);
    updateCoupon();

    couponClose.addEventListener('click', function(){
      closed = true;
      try { sessionStorage.setItem('tenoCouponClosed', '1'); } catch(e){}
      updateCoupon();
    });

    // コードをコピーして、ボタンの表示を一時的に「COPIED」に変える(画面下の案内とは重ねない)
    var codeHTML = couponCode.innerHTML;
    var codeTimer;
    couponCode.addEventListener('click', function(){
      var code = couponCode.getAttribute('data-code');
      var done = function(){
        couponCode.textContent = 'COPIED';
        var st = document.getElementById('couponStatus');
        if(st) st.textContent = 'クーポンコード ' + code + ' をコピーしました';
        couponCode.classList.add('is-copied');
        clearTimeout(codeTimer);
        codeTimer = setTimeout(function(){
          couponCode.innerHTML = codeHTML;
          couponCode.classList.remove('is-copied');
        }, 1800);
      };
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(code).then(done, done);
      } else { done(); }
    });
  }
})();
