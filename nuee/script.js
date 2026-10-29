(() => {

    const loadingScreen = document.querySelector(".loading-screen");
    const hero = document.querySelector(".hero");

    /* =========================
       ローディング → ヒーローを表示
    ========================= */

    const finishLoading = () => {
        setTimeout(() => {
            loadingScreen.classList.add("is-hidden");
            hero.classList.add("is-visible");
        }, 1500);
    };

    if (document.readyState === "complete") {
        finishLoading();
    } else {
        window.addEventListener("load", finishLoading);
    }


    /* =========================
       スクロールで現れる動き
       画面に入ると is-visible を付け、出ると外す(何度でも再生される)
    ========================= */

    const reveal = (selector, rootMargin) => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle("is-visible", entry.isIntersecting);
            });
            // COLLECTIONの色が変わったときなどに、ナビの色も合わせ直す
            if (typeof onScroll === "function") onScroll();
        }, { rootMargin });

        document.querySelectorAll(selector).forEach((el) => observer.observe(el));
    };

    reveal(".collection-item, .objects, .cta, .collection", "0px 0px 20% 0px");
    // 見出し(COLLECTION / OBJECTS)が画面に入ったら、ほんのり照らす
    const glowObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => entry.target.classList.toggle("is-lit", entry.isIntersecting));
    }, { rootMargin: "0px 0px -25% 0px" });
    document.querySelectorAll(".section-heading.has-glow").forEach((el) => glowObserver.observe(el));

    // 文字と写真は1つのグループとして、間隔を保ったまま同時に右からスライドさせる。
    // 文字が実際に画面へ入ったら、セクションに is-in を付けて両方を動かす
    const statement = document.querySelector(".brand-statement");
    const statementText = document.querySelector(".statement-text");
    if (statement && statementText) {
        new IntersectionObserver((entries) => {
            entries.forEach((entry) => statement.classList.toggle("is-in", entry.isIntersecting));
        }, { rootMargin: "0px 0px -15% 0px" }).observe(statementText);
    }
    reveal(".about", "0px");


    /* =========================
       スクロールインジケーター
       ・点の位置 = ページ全体の進み具合
       ・上の数字 = 画面の中央にあるセクション
       ・暗い背景(ヒーロー画像 / OBJECTS / フッター)の上では色を反転
    ========================= */

    const indicator = document.querySelector(".scroll-indicator");
    const line = indicator.querySelector(".scroll-line");
    const dot = indicator.querySelector(".scroll-dot");
    const numberTop = indicator.querySelector(".scroll-number-top");
    const numberBottom = indicator.querySelector(".scroll-number-bottom");

    // ヒーローは main の外(ナビより上)にあるので、別に足して数える
    const sections = document.querySelectorAll(".hero, main > section");
    // ヒーロー画像の上でも色を反転させる
    const darkAreas = document.querySelectorAll(".hero, .statement-image, .objects, .footer");

    const pad = (n) => String(n).padStart(2, "0");

    // 下の数字は、セクションの数に合わせて自動で決める
    numberBottom.textContent = pad(sections.length);

    const coversCenter = (el, center) => {
        const rect = el.getBoundingClientRect();
        return rect.top <= center && rect.bottom >= center;
    };



    /* ナビの状態
       ・is-stuck      : PC=ナビが最上部に固定された / スマホ=ヒーローを過ぎた(ロゴと背景が現れる)
       ・is-translucent: ナビの真下が、背景色の違うセクション */
    const header = document.querySelector(".header");
    const mobileQuery = window.matchMedia("(max-width: 768px)");
    const tintedAreas = document.querySelectorAll(".collection, .objects, .footer");

    const updateHeader = () => {
        const headerH = header.offsetHeight;

        const stuck = mobileQuery.matches
            ? hero.getBoundingClientRect().bottom <= headerH
            : header.getBoundingClientRect().top <= 0.5;
        header.classList.toggle("is-stuck", stuck);

        // ナビの下端のすぐ下にあるセクションで判定する
        // COLLECTION は色が付いているとき(is-visible)だけ
        const probe = headerH + 1;
        const under = stuck && Array.from(tintedAreas).find((el) => {
            if (el.classList.contains("collection") && !el.classList.contains("is-visible")) return false;
            const rect = el.getBoundingClientRect();
            return rect.top <= probe && rect.bottom >= probe;
        });
        header.classList.toggle("is-translucent", Boolean(under));
        // COLLECTIONの上ではベージュ、暗いセクションの上ではブラウンの半透明に切り替える
        const onCollection = Boolean(under) && under.classList.contains("collection");
        header.classList.toggle("is-beige", onCollection);
        header.classList.toggle("is-dark", Boolean(under) && !onCollection);
    };

    const update = () => {
        const center = window.innerHeight / 2;
        updateHeader();

        // 点の位置: 線の長さから点の大きさを引いた分だけ動く
        const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
        const travel = line.clientHeight - dot.offsetHeight;
        dot.style.transform = `translateX(-50%) translateY(${progress * travel}px)`;

        // 色の反転
        const onDark = Array.from(darkAreas).some((el) => coversCenter(el, center));
        indicator.classList.toggle("is-light", onDark);

        // 現在のセクション番号
        let current = 1;
        sections.forEach((section, index) => {
            if (section.getBoundingClientRect().top <= center) {
                current = index + 1;
            }
        });
        numberTop.textContent = pad(current);
    };

    // スクロール中は、1フレームに1回だけ計算する
    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            update();
            ticking = false;
        });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();


    /* =========================
       スマホメニューの開閉
       ハンバーガー ⇄ ×。リンクを押す / Esc / PC幅に戻すと閉じる
    ========================= */

    const menuButton = header.querySelector(".menu-button");
    const navLinks = header.querySelectorAll(".nav a");

    const setMenu = (open) => {
        header.classList.toggle("is-open", open);
        document.documentElement.classList.toggle("is-menu-open", open);
        menuButton.setAttribute("aria-expanded", String(open));
        menuButton.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    };

    menuButton.addEventListener("click", () => {
        setMenu(!header.classList.contains("is-open"));
    });

    navLinks.forEach((link) => link.addEventListener("click", () => setMenu(false)));

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && header.classList.contains("is-open")) {
            setMenu(false);
            menuButton.focus();
        }
    });

    mobileQuery.addEventListener("change", (e) => {
        if (!e.matches) setMenu(false);
        update();
    });

})();