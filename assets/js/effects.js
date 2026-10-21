/* ==========================================================================
   Ai3 新官網 · 特效層（全站共用，每個模組都可在 config.js 的 effects 關掉）
   套件：GSAP 3 + ScrollTrigger、tsParticles 3（首頁粒子）、canvas-confetti、vanilla-tilt
   模組：particles 粒子連線｜confetti 彩帶｜tilt 舞台 3D｜headings 標題逐字進場
         magnet 磁吸按鈕｜glow 游標光暈｜cursor 自訂游標｜parallax 圖片視差
         pipeline 流程線描繪｜marquee 跑馬燈捲動速度回饋｜rotator 輪播字
         transitions 換頁轉場｜pageTitle 子頁標題逐字｜dots 區塊導航點
         top 回頂部進度環｜grain 細顆粒｜ripple 按鈕漣漪｜lightbox 圖片燈箱
         batch 卡片群組進場｜scramble 標籤解碼字｜auroraPointer 極光跟隨
   ========================================================================== */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof gsap !== "undefined";
  const hasST = hasGsap && typeof ScrollTrigger !== "undefined";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  window.AI3FX = {};
  const FX = Object.assign({
    particles: true, confetti: true, tilt: true, headings: true, magnet: true, glow: true,
    cursor: true, parallax: true, pipeline: true, marquee: true, rotator: true, transitions: true,
    pageTitle: true, dots: true, top: true, grain: true, ripple: true, lightbox: true, batch: true,
    scramble: true, auroraPointer: true,
    tone: true, heroDepth: true, voiceWave: true, manifesto: true, chapters: true, how: true, band: true, flip: true, headerAuto: true
  }, (window.AI3_CONFIG && window.AI3_CONFIG.effects) || {});
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* 進場一律看元素「真的進到畫面」（IntersectionObserver），不靠事先算好的捲動位置；
     字型晚載入、版面變高時也不會有東西卡在隱藏狀態。另有保險掃描：畫面內或已捲過的都直接顯示。 */
  const pending = new Map();   // 元素 → 顯示函式
  const io = "IntersectionObserver" in window ? new IntersectionObserver(en => {
    en.forEach(e => { if (e.isIntersecting) { const f = pending.get(e.target); if (f) { pending.delete(e.target); io.unobserve(e.target); f(); } } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  const onView = (node, show) => { if (!io) { show(); return; } pending.set(node, show); io.observe(node); };
  const sweep = () => { pending.forEach((show, node) => { const r = node.getBoundingClientRect(); if (r.top < innerHeight * 0.98) { pending.delete(node); io && io.unobserve(node); show(); } }); };
  let sweepT = null;
  window.addEventListener("scroll", () => { clearTimeout(sweepT); sweepT = setTimeout(sweep, 180); }, { passive: true });
  window.addEventListener("load", () => { setTimeout(sweep, 1800); setTimeout(sweep, 4000); });

  /* ---------------- Hero 粒子連線（首頁） ---------------- */
  if (FX.particles && typeof tsParticles !== "undefined" && $("#particles") && !reduce) {
    tsParticles.load({
      id: "particles",
      options: {
        fullScreen: { enable: false }, fpsLimit: 60, detectRetina: true,
        background: { color: "transparent" },
        particles: {
          number: { value: fine ? 56 : 28, density: { enable: true, width: 1200, height: 800 } },
          color: { value: ["#ffffff", "#9ff1ff", "#dbe8ff"] },
          shape: { type: "circle" }, opacity: { value: { min: 0.35, max: 0.8 } },
          size: { value: { min: 1.5, max: 3.5 } },
          links: { enable: true, distance: 150, color: "#ffffff", opacity: 0.28, width: 1 },
          move: { enable: true, speed: 0.7, outModes: { default: "bounce" } }
        },
        interactivity: { events: { onHover: { enable: fine, mode: "grab" }, resize: { enable: true } }, modes: { grab: { distance: 180, links: { opacity: 0.5 } } } }
      }
    });
  }

  /* ---------------- 彩帶（貴哥開心、第一次打招呼） ---------------- */
  window.AI3FX.confetti = function (strength = 1) {
    if (!FX.confetti || typeof confetti === "undefined" || reduce) return;
    const stage = $("#stage"); const r = stage ? stage.getBoundingClientRect() : { left: innerWidth * 0.7, top: innerHeight * 0.4, width: 300, height: 300 };
    const origin = { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height * 0.35) / innerHeight };
    confetti({ particleCount: Math.round(90 * strength), spread: 70, startVelocity: 38, origin, colors: ["#ffffff", "#9ff1ff", "#ffd23f", "#ff7ab6", "#00ffd0"], scalar: 0.9, ticks: 180, disableForReducedMotion: true });
  };

  /* ---------------- 舞台 3D 傾斜 ---------------- */
  if (FX.tilt && typeof VanillaTilt !== "undefined" && fine && !reduce) {
    const cards = $$(".case-card, .post, .feature, .report, .icon-tile, .step, .pain");
    if (cards.length) VanillaTilt.init(cards, { max: 6, speed: 700, glare: true, "max-glare": 0.12, scale: 1.02, perspective: 1200, gyroscope: false });
  }

  /* ---------------- 區塊標題逐字進場 ---------------- */
  function splitWords(h) {
    const words = [];
    Array.from(h.childNodes).forEach(node => {   // 快照迭代，避免 live NodeList 無限循環
      if (node.nodeType !== 3) { words.push(node); return; }
      if (!node.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      const CLOSE = "，。、！？；：」』）》〉…—,.!?;:)]}%", OPEN = "「『（《〈([{";
      const groups = []; let pre = "";
      const toks = [];
      (node.textContent.match(/[A-Za-z0-9/.\-+&]+|\s+|[\u3400-\u9fff\uf900-\ufaff]+|./gu) || []).forEach(tok => {
        if (/^[\u3400-\u9fff\uf900-\ufaff]+$/.test(tok) && tok.length > 8) toks.push(...tok); else toks.push(tok);
      });
      toks.forEach(tok => {
        if (/^\s+$/.test(tok)) { groups.push({ sp: tok }); return; }
        if (OPEN.includes(tok)) { pre += tok; return; }
        const last = groups[groups.length - 1];
        if (CLOSE.includes(tok) && last && !last.sp) { last.t += tok; return; }
        groups.push({ t: pre + tok }); pre = "";
      });
      if (pre) groups.push({ t: pre });
      groups.forEach(g => {
        if (g.sp) { frag.appendChild(document.createTextNode(g.sp)); return; }
        const w = el("span", "word", g.t); frag.appendChild(w); words.push(w);
      });
      node.replaceWith(frag);
    });
    return words;
  }
  if (FX.headings && hasST && !reduce) {
    $$(".section__head h2, .about h2").forEach(h => {
      if (h.closest(".hero")) return;
      const words = splitWords(h);
      gsap.set(words, { yPercent: 60, opacity: 0, rotateX: -40, transformOrigin: "50% 100%" });
      onView(h, () => gsap.to(words, { yPercent: 0, opacity: 1, rotateX: 0, duration: 0.7, ease: "power3.out", stagger: 0.025, overwrite: true }));
    });
  }

  /* ---------------- 子頁標題：載入時逐字浮出 ---------------- */
  if (FX.pageTitle && hasGsap && !reduce && $(".page-hero h1")) {
    const h = $(".page-hero h1"); const words = splitWords(h);
    gsap.from(words, { yPercent: 80, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.03, delay: 0.1 });
    gsap.from([".page-hero p", ".page-hero .btn", ".page-hero__img"], { y: 24, opacity: 0, duration: 0.8, stagger: 0.08, delay: 0.35, ease: "power3.out" });
  }

  /* ---------------- 磁吸按鈕 ---------------- */
  if (FX.magnet && hasGsap && fine && !reduce) {
    $$(".hero__actions .btn, .cta .btn, .mic, .page-hero .btn").forEach(b => {
      b.classList.add("btn--magnet");
      const toX = gsap.quickTo(b, "x", { duration: 0.35, ease: "power3.out" }), toY = gsap.quickTo(b, "y", { duration: 0.35, ease: "power3.out" });
      b.addEventListener("pointermove", e => { const r = b.getBoundingClientRect(); toX((e.clientX - r.left - r.width / 2) * 0.25); toY((e.clientY - r.top - r.height / 2) * 0.35); });
      b.addEventListener("pointerleave", () => { toX(0); toY(0); });
    });
  }

  /* ---------------- 游標光暈 ---------------- */
  const glow = $("#cursorGlow");
  if (FX.glow && glow && fine && !reduce && hasGsap) {
    document.body.classList.add("has-pointer");
    const gx = gsap.quickTo(glow, "x", { duration: 0.6, ease: "power2.out" }), gy = gsap.quickTo(glow, "y", { duration: 0.6, ease: "power2.out" });
    window.addEventListener("pointermove", e => { gx(e.clientX); gy(e.clientY); }, { passive: true });
  }

  /* ---------------- 自訂游標：小圓點＋外環，碰到連結放大 ---------------- */
  if (FX.cursor && fine && !reduce && hasGsap) {
    const cur = el("div", "cursor", "<i></i><b></b>"); cur.setAttribute("aria-hidden", "true"); document.body.appendChild(cur);
    document.body.classList.add("has-cursor");
    const dot = cur.querySelector("i"), ring = cur.querySelector("b");
    const dx = gsap.quickTo(dot, "x", { duration: 0.08 }), dy = gsap.quickTo(dot, "y", { duration: 0.08 });
    const rx = gsap.quickTo(ring, "x", { duration: 0.32, ease: "power3.out" }), ry = gsap.quickTo(ring, "y", { duration: 0.32, ease: "power3.out" });
    let shown = false;
    window.addEventListener("pointermove", e => {
      if (!shown) { shown = true; cur.classList.add("is-on"); }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      const t = e.target.closest && e.target.closest("a, button, .chip, .swiper, [data-cursor]");
      cur.classList.toggle("is-link", !!t);
      cur.dataset.label = (t && t.dataset.cursor) || "";
    }, { passive: true });
    window.addEventListener("pointerdown", () => cur.classList.add("is-down"));
    window.addEventListener("pointerup", () => cur.classList.remove("is-down"));
    document.addEventListener("mouseleave", () => cur.classList.remove("is-on"));
    document.addEventListener("mouseenter", () => cur.classList.add("is-on"));
  }

  /* ---------------- 圖片視差＋遮罩揭露 ---------------- */
  if (FX.parallax && hasST && !reduce) {
    $$(".about__photo img, .card__img, .page-hero__img, .split__media img, .tl__card img, .post img").forEach(img => {
      if (img.closest(".img-reveal")) return;
      const cs = getComputedStyle(img);
      const wrap = el("div", "img-reveal"); wrap.style.borderRadius = cs.borderRadius; wrap.style.boxShadow = cs.boxShadow;
      if (cs.marginBottom !== "0px") { wrap.style.marginBottom = cs.marginBottom; img.style.marginBottom = 0; }
      img.parentNode.insertBefore(wrap, img); wrap.appendChild(img); img.style.boxShadow = "none";
      gsap.set(wrap, { clipPath: "inset(0 0 100% 0)" });
      onView(wrap, () => gsap.to(wrap, { clipPath: "inset(0 0 0% 0)", duration: 1.1, ease: "power4.out", overwrite: true, onComplete: () => gsap.set(wrap, { clearProps: "clipPath" }) }));
      if (fine) gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: 0.4 } });
    });
  }

  /* ---------------- 流程線：捲到時描繪出來，節點逐一彈出 ---------------- */
  if (FX.pipeline && hasST && !reduce && $("#pipePath")) {
    const path = $("#pipePath"); const len = path.getTotalLength();
    path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
    gsap.to(path, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: "#pipeline", start: "top 80%", end: "bottom 55%", scrub: 0.5,
      onUpdate: self => { if (self.progress >= 0.999) { path.style.strokeDasharray = "6 8"; path.style.strokeDashoffset = 0; } else if (path.style.strokeDasharray === "6 8") { path.style.strokeDasharray = len; } } } });
    gsap.from($$("#pipeline .node"), { scale: 0, transformOrigin: "50% 50%", duration: 0.7, ease: "back.out(2)", stagger: 0.18, scrollTrigger: { trigger: "#pipeline", start: "top 78%", once: true } });
    gsap.from($$("#pipeline .pipe-cap"), { opacity: 0, y: 10, duration: 0.6, stagger: 0.15, scrollTrigger: { trigger: "#pipeline", start: "top 70%", once: true } });
  }

  /* ---------------- 跑馬燈：捲動越快、歪斜越大 ---------------- */
  if (FX.marquee && hasST && !reduce && $(".logos__row")) {
    const rows = $$(".logos__row");
    const skews = rows.map((r, i) => gsap.quickTo(r, "skewX", { duration: 0.5, ease: "power3.out" }));
    ScrollTrigger.create({ trigger: ".logos", start: "top bottom", end: "bottom top",
      onUpdate: self => { const v = gsap.utils.clamp(-5, 5, self.getVelocity() / 260); skews.forEach((q, i) => q(i ? -v : v)); } });
  }

  /* ---------------- 輪播字（首頁 hero） ---------------- */
  if (FX.rotator && hasGsap) {
    $$(".rotator").forEach(r => {
      const words = (r.dataset.words || "").split("|").filter(Boolean); if (!words.length) return;
      let i = 0; r.textContent = words[0];
      if (reduce) return;
      setInterval(() => {
        gsap.to(r, { yPercent: -60, opacity: 0, duration: 0.3, ease: "power2.in", onComplete: () => {
          i = (i + 1) % words.length; r.textContent = words[i];
          gsap.fromTo(r, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4, ease: "power3.out" });
        } });
      }, 2600);
    });
  }

  /* ---------------- 換頁轉場：點站內連結先拉幕，再換頁 ---------------- */
  if (FX.transitions && hasGsap && !reduce) {
    const veil = el("div", "veil"); veil.setAttribute("aria-hidden", "true"); document.body.appendChild(veil);
    if ($("#preloader")) { gsap.set(veil, { yPercent: -100 }); veil.classList.add("is-idle"); }
    else { gsap.set(veil, { yPercent: 0 }); gsap.to(veil, { yPercent: -100, duration: 0.7, ease: "power4.inOut", delay: 0.05, onComplete: () => veil.classList.add("is-idle") }); }
    window.addEventListener("pageshow", e => { if (e.persisted) gsap.set(veil, { yPercent: -100 }); });
    document.addEventListener("click", e => {
      const a = e.target.closest && e.target.closest("a[href]"); if (!a) return;
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href"); if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;
      let url; try { url = new URL(a.href, location.href); } catch (_) { return; }
      if (url.origin !== location.origin || !/\.html?$|\/$/.test(url.pathname)) return;
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      veil.classList.remove("is-idle");
      gsap.fromTo(veil, { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: "power4.inOut", onComplete: () => { location.href = url.href; } });
    });
  }

  /* ---------------- 區塊導航點（首頁，桌機） ---------------- */
  if (FX.dots && hasST && fine && $("#top") && $$("section[id]").length > 3) {
    const secs = $$("section[id]"); const nav = el("nav", "dots"); nav.setAttribute("aria-label", "頁面區塊");
    const labels = { top: "貴哥", manifesto: "為什麼", pains: "困擾", products: "產品", how: "聽想說", numbers: "數字", cases: "案例", about: "關於", news: "消息", contact: "聯絡" };
    secs.forEach(s => { const a = el("a", "", "<span>" + (labels[s.id] || s.id) + "</span><i></i>"); a.href = "#" + s.id; a.dataset.for = s.id; nav.appendChild(a);
      ScrollTrigger.create({ trigger: s, start: "top 50%", end: "bottom 50%", onToggle: self => a.classList.toggle("is-on", self.isActive) }); });
    document.body.appendChild(nav);
  }

  /* ---------------- 回頂部：帶捲動進度環 ---------------- */
  if (FX.top) {
    const btn = el("button", "totop", '<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19"/><circle class="totop__p" cx="22" cy="22" r="19"/></svg><span>↑</span>');
    btn.type = "button"; btn.setAttribute("aria-label", "回到頂部"); document.body.appendChild(btn);
    const p = btn.querySelector(".totop__p"); const C = 2 * Math.PI * 19; p.style.strokeDasharray = C;
    const upd = () => { const max = document.documentElement.scrollHeight - innerHeight; const r = max > 0 ? scrollY / max : 0; p.style.strokeDashoffset = C * (1 - r); btn.classList.toggle("is-on", scrollY > 500); };
    window.addEventListener("scroll", upd, { passive: true }); upd();
    btn.addEventListener("click", () => { const L = window.__lenis; L ? L.scrollTo(0) : window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  /* ---------------- 細顆粒（SVG 雜訊，固定在最上層、不擋點擊） ---------------- */
  if (FX.grain && !reduce) { const g = el("div", "grain"); g.setAttribute("aria-hidden", "true"); document.body.appendChild(g); }

  /* ---------------- 按鈕漣漪 ---------------- */
  if (FX.ripple && !reduce) {
    document.addEventListener("pointerdown", e => {
      const b = e.target.closest && e.target.closest(".btn, .chip"); if (!b) return;
      const r = b.getBoundingClientRect(); const s = Math.max(r.width, r.height) * 2;
      const rip = el("span", "ripple"); rip.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
      b.appendChild(rip); rip.addEventListener("animationend", () => rip.remove());
    });
  }

  /* ---------------- 圖片燈箱（文章、案例內文） ---------------- */
  if (FX.lightbox) {
    const imgs = $$(".prose img, .post-body img, .article img, .lightbox img, .gallery img"); if (imgs.length) {
      const box = el("div", "lb", '<button class="lb__x" aria-label="關閉">×</button><img alt=""><p class="lb__cap"></p>'); box.setAttribute("aria-hidden", "true"); document.body.appendChild(box);
      const im = box.querySelector("img"), cap = box.querySelector(".lb__cap");
      const close = () => { box.classList.remove("is-on"); document.body.classList.remove("lb-open"); };
      imgs.forEach(i => { i.classList.add("is-zoomable"); i.addEventListener("click", () => { im.src = i.currentSrc || i.src; cap.textContent = i.alt || (i.closest("figure") && i.closest("figure").querySelector("figcaption") || {}).textContent || ""; box.classList.add("is-on"); document.body.classList.add("lb-open"); }); });
      box.addEventListener("click", e => { if (e.target !== im) close(); });
      document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    }
  }

  /* ---------------- 卡片群組：進入視窗時依序浮現 ---------------- */
  if (FX.batch && hasST && !reduce) {
    const items = $$(".case-card, .post, .feature, .report, .icon-tile, .team, .tl, .logo-wall img, .benefit, .step, .news a, .flip, .bento .card, .spec-card, .form, .split__body, .split__media").filter(n => !n.closest(".reveal") && !n.closest(".swiper"));
    if (items.length) {
      gsap.set(items, { opacity: 0, y: 28 });
      let queue = [], qT = null;   // 同一時間進畫面的卡片排成一串依序浮現
      const flush = () => { const b = queue; queue = []; gsap.to(b, { opacity: 1, y: 0, duration: 0.75, ease: "power3.out", stagger: 0.07, overwrite: true, onComplete: () => gsap.set(b, { clearProps: "transform,opacity" }) }); };
      items.forEach(n => onView(n, () => { queue.push(n); clearTimeout(qT); qT = setTimeout(flush, 40); }));
    }
  }

  /* ---------------- 標籤解碼字：捲到時字元跳動後定住 ---------------- */
  if (FX.scramble && hasST && !reduce) {
    const CH = "01ABCDEFGHJKLMNPQRSTUVWXYZ#%&";
    $$(".card__tag, .stage__label span, .team__role, .case__client span").forEach(t => {
      const final = t.textContent; if (!final.trim() || final.length > 24) return;
      ScrollTrigger.create({ trigger: t, start: "top 92%", once: true, onEnter: () => {
        let f = 0; const total = 18;
        const tick = () => { f++; t.textContent = Array.from(final).map((c, i) => (c === " " || i < (f / total) * final.length) ? c : CH[Math.floor(Math.random() * CH.length)]).join(""); if (f < total) requestAnimationFrame(tick); else t.textContent = final; };
        tick();
      } });
    });
  }

  /* ---------------- 極光跟著滑鼠慢慢飄 ---------------- */
  if (FX.auroraPointer && hasGsap && fine && !reduce && $(".aurora")) {
    const ax = gsap.quickTo(".aurora", "x", { duration: 2.2, ease: "power2.out" }), ay = gsap.quickTo(".aurora", "y", { duration: 2.2, ease: "power2.out" });
    window.addEventListener("pointermove", e => { ax((e.clientX / innerWidth - 0.5) * 70); ay((e.clientY / innerHeight - 0.5) * 50); }, { passive: true });
  }

  /* ======================================================================
     v3：一通電話的旅程
     ====================================================================== */
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const fillBars = (box, n) => { const out = []; for (let i = 0; i < n; i++) { const b = el("i"); b.style.setProperty("--h", (28 + Math.random() * 72).toFixed(0) + "%"); b.style.setProperty("--d", (-Math.random() * 0.9).toFixed(2) + "s"); box.appendChild(b); out.push(b); } return out; };
  $$(".ui__wave[data-bars], .demo__wave[data-bars]").forEach(w => fillBars(w, +w.dataset.bars || 32));

  /* ---------------- 聲波畫布：Hero 底部跟著貴哥起伏；子頁標題區跟著滑鼠起伏 ---------------- */
  let voiceLevel = 0, pointerEnergy = 0, lastPX = 0, lastPY = 0, lastPT = 0;
  window.addEventListener("load", () => {   // avatar.js 在本檔之後載入：包一層取得即時音量
    const A = window.AiAvatar; if (!A || !A.setLevel || A.__wrapped) return;
    const orig = A.setLevel.bind(A); A.setLevel = l => { voiceLevel = +l || 0; return orig(l); }; A.__wrapped = true;
  });
  if (fine) window.addEventListener("pointermove", e => {
    const t = performance.now(), dt = Math.max(16, t - lastPT); const sp = Math.hypot(e.clientX - lastPX, e.clientY - lastPY) / dt;
    pointerEnergy = Math.min(1, pointerEnergy + sp * 0.08); lastPX = e.clientX; lastPY = e.clientY; lastPT = t;
  }, { passive: true });
  function voiceWave(canvas, opt) {
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let w = 0, h = 0, t = Math.random() * 10, amp = opt.base, visible = true;
    const resize = () => { const dpr = Math.min(window.devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); window.addEventListener("resize", resize);
    if ("IntersectionObserver" in window) new IntersectionObserver(en => { visible = en[0].isIntersecting; }).observe(canvas);
    const lines = [
      { a: 1, f: 1.4, s: 0.9, c: "rgba(255,255,255,0.78)", w: 2 },
      { a: 0.72, f: 2.2, s: -1.25, c: "rgba(159,241,255,0.62)", w: 1.5 },
      { a: 0.48, f: 3.1, s: 1.7, c: "rgba(255,255,255,0.32)", w: 1 },
      { a: 0.3, f: 4.3, s: -2.1, c: "rgba(159,241,255,0.28)", w: 1 }
    ];
    const draw = () => {
      if (!visible || !w) return;
      const target = opt.base + (opt.energy ? opt.energy() : 0);
      amp += (target - amp) * 0.07; t += 0.016;
      ctx.clearRect(0, 0, w, h);
      lines.forEach((L, k) => {
        ctx.beginPath();
        for (let x = 0; x <= w + 4; x += 4) {
          const n = x / w, env = Math.pow(Math.sin(Math.PI * n), 1.4);
          const y = h * 0.55 + Math.sin(n * Math.PI * 2 * L.f + t * L.s * 2) * Math.sin(n * Math.PI * 3.3 + t * 0.7 + k) * env * amp * L.a * h * 0.44;
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = L.c; ctx.lineWidth = L.w; ctx.stroke();
      });
    };
    if (reduce || !hasGsap) { draw(); return; }
    gsap.ticker.add(draw);
  }
  if (FX.voiceWave) {
    const hero = $("#voicewave"), stage = $("#stage");
    if (hero) voiceWave(hero, { base: 0.16, energy: () => {
      const st = stage ? stage.dataset.state : "idle";
      const talk = st === "speaking" ? 0.45 + voiceLevel * 0.6 : st === "listening" ? 0.3 + voiceLevel * 0.5 : st === "thinking" ? 0.18 : 0;
      pointerEnergy *= 0.94; return talk + pointerEnergy * 0.25;
    } });
    const ph = $(".page-hero");
    if (ph && !hero) { const c = el("canvas", "voicewave voicewave--page"); c.setAttribute("aria-hidden", "true"); ph.appendChild(c); voiceWave(c, { base: 0.12, energy: () => { pointerEnergy *= 0.95; return pointerEnergy * 0.5; } }); }
  }

  /* ---------------- 全站色調：進入深色場景時背景轉成夜藍 ---------------- */
  if (FX.tone && hasST && $("[data-tone='deep']")) {
    const tone = el("div", "tone"); tone.setAttribute("aria-hidden", "true"); document.body.prepend(tone);
    let active = 0;
    $$("[data-tone='deep']").forEach(sec => ScrollTrigger.create({ trigger: sec, start: "top 55%", end: "bottom 45%",
      onToggle: self => { active += self.isActive ? 1 : -1; const on = active > 0;
        gsap.to(tone, { opacity: on ? 1 : 0, duration: reduce ? 0 : 0.9, ease: "power2.out", overwrite: true });
        document.body.classList.toggle("is-deep", on); } }));
  }

  /* ---------------- Hero 景深：往下捲時貴哥舞台退後、文字淡出 ---------------- */
  if (FX.heroDepth && hasST && !reduce && $(".hero__stage")) {
    window.addEventListener("load", () => {
      gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 } })
        .to(".hero__copy", { y: -90, opacity: 0.12, ease: "none" }, 0)
        .to(".hero__stage", { y: 70, scale: 0.9, ease: "none" }, 0)
        .to("#voicewave", { opacity: 0, ease: "none" }, 0);
    });
  }

  /* ---------------- Header：往下捲收起、往上捲出現 ---------------- */
  if (FX.headerAuto && hasST && $("#header")) {
    const hd = $("#header");
    ScrollTrigger.create({ start: 0, end: "max", onUpdate: self => {
      const open = document.querySelector(".nav.is-open") || hd.matches(":focus-within");
      hd.classList.toggle("is-hidden", self.direction === 1 && self.scroll() > 420 && !open);
    } });
  }

  /* ---------------- 宣言：捲動時逐字亮起，下方聲波一起長出來 ---------------- */
  if (FX.manifesto && hasST && !reduce && $("#manifestoText")) {
    const p = $("#manifestoText"), text = p.textContent; p.setAttribute("aria-label", text);
    const chars = []; const frag = document.createDocumentFragment();
    [...text].forEach(ch => { const sp = el("span", "mc"); sp.textContent = ch; sp.setAttribute("aria-hidden", "true"); frag.appendChild(sp); chars.push(sp); });
    p.textContent = ""; p.appendChild(frag);
    const wave = $(".manifesto__wave"); const bars = [];
    if (wave) for (let i = 0; i < 56; i++) { const b = el("i"); wave.appendChild(b); bars.push({ el: b, h: 0.25 + Math.abs(Math.sin(i * 0.55)) * 0.55 + Math.random() * 0.2 }); }
    const paint = pr => {
      const k = pr * 1.18 * chars.length;
      chars.forEach((c, i) => { c.style.opacity = (0.14 + 0.86 * clamp01(k - i)).toFixed(3); });
      bars.forEach((b, i) => { const on = i / bars.length < pr * 1.12; b.el.style.transform = "scaleY(" + (on ? b.h : 0.08) + ")"; b.el.style.opacity = on ? 1 : 0.35; });
    };
    paint(0);
    ScrollTrigger.create({ trigger: "#manifesto", start: "top 20%", end: "bottom bottom", onUpdate: self => paint(self.progress) });
  }

  /* ---------------- 痛點翻牌：觸控點一下翻面，鍵盤 Enter／空白鍵 ---------------- */
  if (FX.flip) $$(".flip").forEach(f => {
    const tog = () => f.classList.toggle("is-flipped");
    f.addEventListener("click", e => { if (e.target.closest("a") || fine) return; tog(); });
    f.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target === f) { e.preventDefault(); tog(); } });
  });

  /* ---------------- 產品章節：捲到哪段，右邊就換哪個畫面 ---------------- */
  if (FX.chapters && $(".chapters")) {
    const chs = $$(".chapter"), screens = $$(".cv__screens .cv__screen"), tabs = $$(".cv__tabs button"), ink = $(".cv__ink");
    let cur = -1;
    const set = i => {
      if (i === cur) return; cur = i;
      chs.forEach((c, k) => c.classList.toggle("is-on", k === i));
      screens.forEach((sc, k) => sc.classList.toggle("is-on", k === i));
      tabs.forEach((tb, k) => tb.classList.toggle("is-on", k === i));
      placeInk();
    };
    const placeInk = () => { const tb = tabs[cur]; if (ink && tb) { ink.style.width = tb.offsetWidth + "px"; ink.style.transform = "translateX(" + tb.offsetLeft + "px)"; } };
    set(0); window.addEventListener("resize", placeInk); window.addEventListener("load", placeInk);
    if (hasST) chs.forEach((c, i) => ScrollTrigger.create({ trigger: c, start: "top 58%", end: "bottom 58%", onToggle: self => self.isActive && set(i) }));
    tabs.forEach((tb, i) => tb.addEventListener("click", () => { const L = window.__lenis; const tgt = chs[i]; L ? L.scrollTo(tgt, { offset: -innerHeight * 0.18 }) : tgt.scrollIntoView({ behavior: "smooth", block: "center" }); }));
  }

  /* ---------------- 聽、想、說：釘住的示範場景，捲動推進一通電話 ---------------- */
  if (FX.how && $("#how")) {
    const how = $("#how"), steps = $$(".how__steps li");
    const B = { asr: $(".demo__asr"), kb: $(".demo__kb"), inn: $(".demo__in"), out: $(".demo__out") };
    const asr = $("#demoAsr"), asrText = asr ? asr.dataset.text : "";
    const hits = $$(".demo__hits li"), intent = $(".demo__intent"), rail = $("#howRail");
    const reply = $(".demo__reply"); const rch = [];
    if (reply) { const txt = reply.textContent; reply.setAttribute("aria-label", txt); reply.textContent = ""; [...txt].forEach(c => { const sp = el("span"); sp.textContent = c; reply.appendChild(sp); rch.push(sp); }); }
    const render = p => {
      const phase = p < 0.36 ? 0 : p < 0.68 ? 1 : 2;
      steps.forEach((s, i) => s.classList.toggle("is-on", i === phase));
      const pa = clamp01((p - 0.04) / 0.27);
      if (asr) { asr.textContent = asrText.slice(0, Math.round(pa * asrText.length)); asr.classList.toggle("is-typing", pa > 0 && pa < 1); }
      const pk = clamp01((p - 0.36) / 0.26);
      if (intent) intent.style.opacity = pk > 0.04 ? 1 : 0;
      hits.forEach((h, i) => h.classList.toggle("is-hit", pk > 0.22 + i * 0.26));
      const ps = clamp01((p - 0.68) / 0.24), on = Math.round(ps * rch.length);
      rch.forEach((c, i) => c.classList.toggle("on", i < on));
      B.inn.classList.toggle("is-live", p < 0.33);
      B.asr.classList.toggle("is-live", phase === 0 && pa > 0);
      B.kb.classList.toggle("is-live", phase === 1);
      B.out.classList.toggle("is-live", phase === 2);
      B.asr.classList.toggle("is-dim", p < 0.04); B.kb.classList.toggle("is-dim", p < 0.36); B.out.classList.toggle("is-dim", p < 0.68);
      if (rail) rail.style.transform = "scaleX(" + p.toFixed(3) + ")";
    };
    const scene = window.matchMedia("(min-width: 900px) and (min-height: 621px)").matches;
    if (scene && hasST && !reduce) { render(0); ScrollTrigger.create({ trigger: how, start: "top top", end: "bottom bottom", onUpdate: self => render(self.progress) }); }
    else { how.classList.add("how--static"); render(1); steps.forEach(s => s.classList.add("is-on")); B.out.classList.remove("is-live"); }
  }

  /* ---------------- 空心字帶：平常慢慢走，捲越快走越快、還會歪 ---------------- */
  if (FX.band && hasGsap && $(".band__track")) {
    const tr = $(".band__track"); let x = 0, dir = -1, v = 0, vis = false;
    if ("IntersectionObserver" in window) new IntersectionObserver(en => { vis = en[0].isIntersecting; }).observe(tr);
    if (!reduce) {
      if (hasST) ScrollTrigger.create({ trigger: ".band", start: "top bottom", end: "bottom top", onUpdate: self => { dir = self.direction === 1 ? -1 : 1; v = Math.min(Math.abs(self.getVelocity()) / 60, 24); } });
      gsap.ticker.add(() => {
        if (!vis) return;
        x += dir * (0.7 + v); v *= 0.93;
        const W = tr.scrollWidth / 3; if (x <= -W) x += W; if (x > 0) x -= W;
        tr.style.transform = "translate3d(" + x.toFixed(1) + "px,0,0) skewX(" + (-dir * Math.min(v, 18) * 0.45).toFixed(2) + "deg)";
      });
    }
  }

  /* ---------------- 貴哥舞台：滑鼠視差（人、字卡、燈光各自不同深度） ---------------- */
  if (hasGsap && fine && !reduce && $(".figure")) {
    const fig = $(".figure"), tags = $$(".figure__tags span"), beam = $(".figure__beam"), floor = $(".stage__floor");
    const fx = gsap.quickTo(fig, "x", { duration: 1, ease: "power3.out" }), fr = gsap.quickTo(fig, "rotation", { duration: 1.2, ease: "power3.out" });
    const tq = tags.map(t => [gsap.quickTo(t, "x", { duration: 0.9, ease: "power3.out" }), gsap.quickTo(t, "y", { duration: 0.9, ease: "power3.out" }), +t.dataset.depth || 1]);
    const bq = beam ? gsap.quickTo(beam, "x", { duration: 1.6, ease: "power2.out" }) : null;
    window.addEventListener("pointermove", e => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      fx(nx * 14); fr(nx * 1.2);
      tq.forEach(([qx, qy, d]) => { qx(nx * 34 * d); qy(ny * 22 * d); });
      bq && bq(nx * -40);
      if (floor) floor.style.backgroundPositionX = (nx * -60).toFixed(1) + "px";
    }, { passive: true });
  }

  /* ---------------- 點一下就冒出聲波圈（全站） ---------------- */
  if (!reduce) document.addEventListener("pointerdown", e => {
    if (e.target.closest("input, textarea, select")) return;
    const r = el("span", "tapwave"); r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px";
    r.innerHTML = "<i></i><i></i>"; document.body.appendChild(r); setTimeout(() => r.remove(), 900);
  }, { passive: true });

  /* ---------------- 產品介面：滑鼠在上面時立體傾斜 ---------------- */
  if (hasGsap && fine && !reduce) $$(".cv__screens, .demo").forEach(box => {
    const rx = gsap.quickTo(box, "rotationX", { duration: 0.6, ease: "power3.out" }), ry = gsap.quickTo(box, "rotationY", { duration: 0.6, ease: "power3.out" });
    gsap.set(box, { transformPerspective: 1200 });
    box.addEventListener("pointermove", e => { const r = box.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 8); rx(-((e.clientY - r.top) / r.height - 0.5) * 6); });
    box.addEventListener("pointerleave", () => { rx(0); ry(0); });
  });

  /* ---------------- 關於：42001 圖框（證書／架構圖）進場掃描光；若有對照清單 #isoMap，清單指到哪一層圖就框哪一層 ----------------
     右邊清單指到哪一層，架構圖就把那一層框起來、其餘壓暗；捲動時以畫面中線經過的那一項為準 */
  (() => {
    const fig = $("#isoArch"), list = $("#isoMap"); if (!fig) return;
    if (!reduce) onView(fig, () => { fig.classList.add("is-scan"); setTimeout(() => fig.classList.remove("is-scan"), 2200); });
    if (!list) return;                       // 只有一張圖（例如證書）時就只做掃描光
    const hl = $(".iso-arch__hl", fig), tag = $("b", hl), items = $$("li", list);
    let cur = -1, held = null, scrolled = -1;
    const set = i => {
      if (i === cur) return; cur = i;
      items.forEach((li, k) => li.classList.toggle("is-on", k === i));
      if (i < 0) { fig.classList.remove("has-hl"); return; }
      hl.style.top = items[i].dataset.top + "%"; hl.style.height = items[i].dataset.h + "%";
      tag.textContent = "LAYER " + (i + 1); fig.classList.add("has-hl");
    };
    items.forEach((li, i) => {
      li.tabIndex = 0;
      const hold = () => { held = i; set(i); };
      li.addEventListener("mouseenter", hold); li.addEventListener("focus", hold); li.addEventListener("click", hold);
      li.addEventListener("blur", () => { if (held === i) { held = null; set(scrolled); } });
    });
    list.addEventListener("mouseleave", () => { held = null; set(scrolled); });
    if ("IntersectionObserver" in window) {
      const mid = new IntersectionObserver(en => {
        en.forEach(e => { if (e.isIntersecting) scrolled = items.indexOf(e.target); });
        if (held === null) set(scrolled);
      }, { rootMargin: "-42% 0px -48% 0px" });
      items.forEach(li => mid.observe(li));
    }
  })();
})();
