/* =========================================================
   mimi♡mellow 公式サイト 共通スクリプト
   1. ハンバーガーメニューの開閉
   2. お知らせ（トースト）
   3. NEWS の絞り込み
   4. GALLERY の拡大表示
   ========================================================= */
document.addEventListener("DOMContentLoaded", function () {

  /* ---------- 1. ハンバーガーメニュー ---------- */
  var menuBtns = document.querySelectorAll(".menu-btn");
  var menuBtn = menuBtns[0];
  var drawer = document.getElementById("drawer");
  var drawerClose = document.querySelector(".drawer-close");

  var lastMenuBtn = null;
  function openMenu(e) {
    lastMenuBtn = e && e.currentTarget;
    drawer.classList.add("open");
    drawer.removeAttribute("inert");
    menuBtns.forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
    var first = drawer.querySelector("a");
    if (first) first.focus();
  }
  function closeMenu() {
    drawer.classList.remove("open");
    drawer.setAttribute("inert", "");
    menuBtns.forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    document.body.style.overflow = "";
    if (lastMenuBtn) lastMenuBtn.focus();
  }
  if (menuBtn && drawer) {
    menuBtns.forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        if (drawer.classList.contains("open")) { closeMenu(); } else { openMenu(e); }
      });
    });
    /* パネルの外をクリックしたら閉じる */
    document.addEventListener("click", function (e) {
      if (drawer.classList.contains("open") && !drawer.contains(e.target)) closeMenu();
    });
    if (drawerClose) drawerClose.addEventListener("click", closeMenu);
    drawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { drawer.classList.remove("open"); document.body.style.overflow = ""; });
    });
  }

  /* ---------- 2. トースト ---------- */
  var toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  document.body.appendChild(toast);
  var timer;
  function showToast(message) {
    toast.innerHTML = "<span class=\"toast-heart\">♡</span>" + message;
    toast.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(function () { toast.classList.remove("show"); }, 2600);
  }
  document.querySelectorAll(".sns a").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      showToast("架空のユニットのため、" + link.getAttribute("aria-label") + " のアカウントはありません");
    });
  });
  document.querySelectorAll("[data-toast]").forEach(function (el) {
    el.addEventListener("click", function () { showToast(el.getAttribute("data-toast")); });
  });

  /* ---------- 3. NEWS の絞り込み ---------- */
  var filterBtns = document.querySelectorAll(".filter button");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var cat = btn.getAttribute("data-filter");
      filterBtns.forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      document.querySelectorAll(".news-article").forEach(function (item) {
        item.hidden = !(cat === "all" || item.getAttribute("data-cat") === cat);
      });
    });
  });

  /* ---------- 4. GALLERY の拡大表示 ---------- */
  var lightbox = document.getElementById("lightbox");
  if (lightbox) {
    var lbImg = lightbox.querySelector("img");
    var lbText = lightbox.querySelector("p");
    var lbClose = lightbox.querySelector(".lightbox-close");
    var lastBtn = null;
    function closeLightbox() {
      lightbox.classList.remove("open");
      lightbox.setAttribute("inert", "");
      document.body.style.overflow = "";
      if (lastBtn) lastBtn.focus();
    }
    document.querySelectorAll(".masonry button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var img = btn.querySelector("img");
        lastBtn = btn;
        lbImg.src = img.src;
        lbImg.alt = img.alt;
        lbText.textContent = btn.closest("figure").querySelector("figcaption").textContent.trim();
        lightbox.classList.add("open");
        lightbox.removeAttribute("inert");
        document.body.style.overflow = "hidden";
        lbClose.focus();
      });
    });
    lbClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lightbox.classList.contains("open")) closeLightbox();
    });
  }

  /* 下層ページ：スクロールしたらヘッダーに薄い背景を付ける */
  var gnav = document.querySelector(".sub .gnav");
  if (gnav) {
    var onScroll = function () { document.body.classList.toggle("scrolled", window.scrollY > gnav.offsetHeight + 40); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* Esc でメニューも閉じる */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer && drawer.classList.contains("open")) closeMenu();
  });
});
