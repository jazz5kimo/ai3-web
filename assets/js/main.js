/* ==========================================================================
   Ai3 新官網 · 互動主程式
   套件：GSAP 3 + ScrollTrigger（捲動動畫）、Lenis（平滑捲動）、
         Swiper 11（案例輪播）、vanilla-tilt（卡片 3D 傾斜）
   ========================================================================== */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 760px)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const hasGsap = typeof gsap !== "undefined";
  if (hasGsap && typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);

  /* ---------------- Lenis 平滑捲動 ---------------- */
  let lenis = null;
  if (!reduce && typeof Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    window.__lenis = lenis;
    if (hasGsap) {
      lenis.on("scroll", () => ScrollTrigger.update());
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  // 站內錨點走 Lenis
  $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    const id = a.getAttribute("href"); if (id.length < 2) return;
    const el = $(id); if (!el) return;
    e.preventDefault();
    closeNav();
    lenis ? lenis.scrollTo(el, { offset: -70 }) : el.scrollIntoView({ behavior: "smooth" });
  }));

  /* ---------------- Preloader → Hero 開場（唯一一段編排動畫） ---------------- */
  const pre = $("#preloader");
  const chars = splitChars($(".hero h1"));
  const intro = () => {
    if (!hasGsap || reduce || !pre) { pre && pre.remove(); chars.forEach(c => (c.style.opacity = 1)); setTimeout(() => window.dispatchEvent(new Event("ai3:intro")), 300); return; }
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.to(pre, { opacity: 0, duration: 0.6, delay: 0.5, onComplete: () => pre.remove() })
      .from(chars, { yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.025 }, "-=0.25")
      .from([".hero__kicker", ".hero__rotate", ".hero__lead", ".voice__panel", ".hero__more"], { y: 24, opacity: 0, duration: 0.8, stagger: 0.08 }, "-=0.6")
      .from(".stage__floor", { opacity: 0, duration: 1.2 }, "-=1.1")
      .from(".figure__disc", { scaleX: 0.2, opacity: 0, duration: 0.9, ease: "expo.out" }, "-=1")
      .from([".figure__beam", ".figure__halo"], { opacity: 0, duration: 1.2 }, "-=0.8")
      .from(".guige", { yPercent: 18, opacity: 0, duration: 1.1, ease: "back.out(1.5)" }, "-=1")
      .from(".figure__tags span", { scale: 0, opacity: 0, duration: 0.6, stagger: 0.1, ease: "back.out(2.2)" }, "-=0.5")
      .add(() => window.dispatchEvent(new Event("ai3:intro")));
  };
  if (document.readyState === "complete") intro(); else window.addEventListener("load", intro);

  function splitChars(el) {
    if (!el) return [];
    const out = [];
    const walk = parent => Array.from(parent.childNodes).forEach(node => {   // 快照迭代；遇到 <span class="l"> 這類分行容器就往內走
      if (node.nodeType === 1) { walk(node); return; }
      if (node.nodeType !== 3 || !node.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      [...node.textContent].forEach(ch => {
        if (ch === "\n") return;
        const s = document.createElement("span");
        s.className = "char"; s.textContent = ch === " " ? " " : ch;
        frag.appendChild(s); out.push(s);
        frag.appendChild(document.createTextNode("\u200b")); // 零寬空白：讓 inline-block 字元之間可以換行
      });
      node.replaceWith(frag);
    });
    walk(el);
    return out;
  }

  /* ---------------- Header ---------------- */
  const header = $("#header");
  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 24);
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  const burger = $("#burger"), nav = $("#nav");
  function closeNav() { if (!nav) return; nav.classList.remove("is-open"); burger && burger.setAttribute("aria-expanded", "false"); lenis && lenis.start(); }
  burger && burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
    lenis && (open ? lenis.stop() : lenis.start());
  });

  /* ---------------- 進度條 ---------------- */
  const bar = $("#progress");
  if (bar && hasGsap) gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

  /* ---------------- 每個區塊進場一次 ---------------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -12% 0px" });
  $$(".reveal").forEach(el => io.observe(el));

  /* ---------------- 卡片：滑鼠光暈 ＋ 3D 傾斜 ---------------- */
  $$(".card").forEach(card => card.addEventListener("pointermove", e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
    card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
  }));
  if (!isMobile && !reduce && typeof VanillaTilt !== "undefined") {
    VanillaTilt.init($$(".card"), { max: 4, speed: 600, glare: false, scale: 1.01, perspective: 1400 });
  }

  /* ---------------- 數字滾動 ---------------- */
  $$("[data-count]").forEach(el => {
    const end = parseFloat(el.getAttribute("data-count"));
    const suffix = el.getAttribute("data-suffix") || "";
    const run = () => {
      if (!hasGsap || reduce) { el.textContent = end + suffix; return; }
      const o = { v: 0 };
      gsap.to(o, { v: end, duration: 1.8, ease: "power2.out", onUpdate: () => (el.textContent = Math.round(o.v) + suffix) });
    };
    new IntersectionObserver((en, obs) => { if (en[0].isIntersecting) { run(); obs.disconnect(); } }, { threshold: 0.6 }).observe(el);
  });

  /* ---------------- 運作方式：訊號在管線上流動 ---------------- */
  const pipe = $("#pipeline");
  if (pipe && hasGsap && !reduce) {
    const dots = $$(".signal", pipe);
    const path = $("#pipePath");
    dots.forEach((d, i) => {
      gsap.to(d, { duration: 4, repeat: -1, ease: "none", delay: i * 1.3,
        motionPath: undefined,
        onUpdate: function () {
          const p = this.progress(); const len = path.getTotalLength(); const pt = path.getPointAtLength(p * len);
          d.setAttribute("cx", pt.x); d.setAttribute("cy", pt.y);
        } });
    });
    $$(".node", pipe).forEach((n, i) => gsap.to(n, { scale: 1.06, transformOrigin: "50% 50%", duration: 1.2, yoyo: true, repeat: -1, ease: "sine.inOut", delay: i * 0.4 }));
  }

  /* ---------------- 成功案例 Swiper ---------------- */
  if (typeof Swiper !== "undefined" && $(".cases .swiper")) {
    new Swiper(".cases .swiper", {
      slidesPerView: 1.1, spaceBetween: 16, grabCursor: true, speed: 700,
      autoplay: reduce ? false : { delay: 4500, disableOnInteraction: false },
      pagination: { el: ".swiper-pagination", clickable: true },
      breakpoints: { 760: { slidesPerView: 2, spaceBetween: 18 }, 1100: { slidesPerView: 3, spaceBetween: 20 } }
    });
  }

  /* ---------------- 年表：水平釘住捲動（桌機） ---------------- */
  const tl = $("#timeline");
  if (tl && hasGsap && !isMobile && !reduce) {
    const amount = () => tl.scrollWidth - window.innerWidth;
    gsap.to(tl, { x: () => -amount(), ease: "none",
      scrollTrigger: { trigger: "#tlPin", start: "center 54%", end: () => "+=" + amount(), pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: self => { const b = document.getElementById("timelineBar"); if (b) b.style.transform = "scaleX(" + self.progress.toFixed(3) + ")"; } } });
  }

  /* ---------------- Hero 背景視差 ---------------- */
  if (hasGsap && !reduce) {
    gsap.to(".aurora", { yPercent: 18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }

  // 字型（Noto Sans TC）常在 load 之後才到，換字型會改變版面高度：到了就重算所有捲動位置
  const refresh = () => hasGsap && typeof ScrollTrigger !== "undefined" && ScrollTrigger.refresh();
  window.addEventListener("load", () => { refresh(); setTimeout(refresh, 1500); setTimeout(refresh, 4000); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(refresh, 60));
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", () => setTimeout(refresh, 60));
})();
