/* ==========================================================================
   Ai3 新官網 · 右下角的小貴哥
   - 首頁：往下捲過 Hero，貴哥從舞台縮小飛到右下角（對話泡泡跟著過去）；捲回上面再飛回舞台。
           點右下角的貴哥 → 捲回最上面跟他聊。
   - 其他頁：一進來貴哥就站在右下角跟你打招呼；點他打開小對話窗（打字或按麥克風問）。
   依賴：config.js、（其他頁）guige-svg.js 提供 window.GUIGE_SVG；之後才載入 avatar.js、voice-bot.js
   ========================================================================== */
(function () {
  "use strict";
  const cfg = window.AI3_CONFIG = window.AI3_CONFIG || {};
  if (cfg.dock === false) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof gsap !== "undefined";
  const heroStage = document.getElementById("stage");
  const home = !!(heroStage && document.getElementById("guige"));
  if (!home && !window.GUIGE_SVG) return;

  const state = window.AI3Dock = { docked: !home, home };
  const emit = () => window.dispatchEvent(new CustomEvent("ai3:dock", { detail: { docked: state.docked } }));

  const SOUND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path class="w1" d="M15.5 8.5a5 5 0 0 1 0 7"/><path class="w2" d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  const MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/></svg>';
  const SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const SAY = '<div class="say" id="say"><div class="say__head"><b>貴哥</b><button class="say__sound" id="saySound" type="button" aria-pressed="false" aria-label="開啟貴哥的聲音">' + SOUND + '<span>開聲音</span></button></div><p class="say__text" id="sayText" aria-live="polite"></p></div>';
  const ASK = ["Ai3 有哪些產品？", "服務過哪些客戶？", "導入要多久？", "怎麼聯絡你們？"];
  const PANEL = '<div class="gdock__panel" id="gdockPanel" role="dialog" aria-label="跟貴哥聊聊" aria-hidden="true">' +
    '<div class="gdock__head"><span class="gdock__dot"></span><b>貴哥</b><small>Ai3 人工智能</small><button class="gdock__x" type="button" aria-label="關閉對話">×</button></div>' +
    '<div class="gdock__log" id="voiceLog" aria-live="polite"></div>' +
    '<div class="gdock__chips">' + ASK.map(q => '<button type="button" class="chip" data-ask="' + q + '">' + q + '</button>').join("") + '</div>' +
    '<div class="gdock__bar"><button class="gdock__mic" id="micBtn" type="button" aria-label="按一下用說的問貴哥" aria-pressed="false">' + MIC + '</button>' +
    '<input id="voiceInput" type="text" placeholder="打字問貴哥…" autocomplete="off" aria-label="輸入問題"><button class="gdock__send" id="voiceSend" type="button" aria-label="送出">' + SEND + '</button></div>' +
    '<p class="gdock__hint" id="voiceHint" hidden></p></div>';

  const dock = document.createElement("div");
  dock.className = "gdock" + (home ? " gdock--home" : "");
  dock.innerHTML = (home ? "" : PANEL) +
    '<div class="gdock__say"></div>' +
    '<button class="gdock__btn" type="button" aria-label="' + (home ? "回到上面跟貴哥聊天" : "跟貴哥聊聊") + '">' +
    '<span class="gdock__disc" aria-hidden="true"><i></i><i></i></span><span class="gdock__fig"></span>' +
    '<span class="gdock__tip">' + (home ? "跟我聊聊" : "問貴哥") + '</span></button>';
  document.body.appendChild(dock);
  const fig = dock.querySelector(".gdock__fig"), slot = dock.querySelector(".gdock__say"), btn = dock.querySelector(".gdock__btn");

  /* ---------------- 對話泡泡：有新字幕就出現，安靜 7 秒後收起 ---------------- */
  let hideT = null, watched = null;
  function watchSay() {
    const t = document.getElementById("sayText"); if (!t || t === watched) return; watched = t;
    new MutationObserver(() => {
      if (!state.docked || !t.textContent) return;
      dock.classList.add("is-talking"); clearTimeout(hideT);
      hideT = setTimeout(() => dock.classList.remove("is-talking"), t.classList.contains("is-typing") ? 9000 : 7000);
    }).observe(t, { childList: true, characterData: true, subtree: true });
  }

  if (home) {
    /* ================= 首頁：捲過 Hero 就縮到右下角 ================= */
    const guige = document.getElementById("guige"), say = document.getElementById("say");
    const back = { gp: guige.parentNode, gn: guige.nextSibling, sp: say && say.parentNode, sn: say && say.nextSibling };
    let ready = false;
    function setDocked(on) {
      if (on === state.docked) return;
      state.docked = on;
      const first = guige.getBoundingClientRect();
      if (hasGsap) gsap.killTweensOf(guige);
      if (on) { fig.appendChild(guige); say && slot.appendChild(say); }
      else { back.gp.insertBefore(guige, back.gn); say && back.sp.insertBefore(say, back.sn); dock.classList.remove("is-talking"); }
      dock.classList.toggle("is-on", on); document.body.classList.toggle("has-gdock", on);
      const last = guige.getBoundingClientRect();
      if (hasGsap && !reduce && last.width && first.width) {
        gsap.fromTo(guige, { x: first.left - last.left, y: first.top - last.top, scale: first.width / last.width, transformOrigin: "0 0" },
          { x: 0, y: 0, scale: 1, duration: 0.85, ease: "power3.inOut", clearProps: "transform,transformOrigin" });
      } else if (hasGsap) gsap.set(guige, { clearProps: "transform" });
      if (on && window.AiAvatar && Math.random() < 0.6) setTimeout(() => window.AiAvatar.wave && window.AiAvatar.wave(), 900);
      emit();
    }
    let raf = 0;
    const check = () => {
      raf = 0; if (!ready) return;
      const ae = document.activeElement;
      if (ae && ae.id === "voiceInput" && !state.docked) return;   // 手機正在首頁輸入框打字（鍵盤彈出、畫面上推）時不要把貴哥收走
      const r = heroStage.getBoundingClientRect(), vh = window.innerHeight;
      if (!state.docked && r.bottom < vh * 0.42) setDocked(true);
      else if (state.docked && r.bottom > vh * 0.62) setDocked(false);
    };
    window.addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(check); }, { passive: true });
    window.addEventListener("resize", () => { if (!raf) raf = requestAnimationFrame(check); });
    const arm = () => { if (ready) return; ready = true; check(); };
    window.addEventListener("ai3:intro", () => setTimeout(arm, 1600));
    setTimeout(arm, 4000);
    watchSay();
    btn.addEventListener("click", () => {
      const L = window.__lenis;
      L ? L.scrollTo(0, { duration: 1.4 }) : window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      setTimeout(() => { const i = document.getElementById("voiceInput"); i && i.focus({ preventScroll: true }); }, 1300);
    });
    emit();
    return;
  }

  /* ================= 其他頁：貴哥一直站在右下角 ================= */
  dock.id = "stage"; dock.setAttribute("data-state", "idle"); dock.setAttribute("data-emotion", "happy");
  fig.innerHTML = '<div class="guige" id="guige" data-emotion="happy">' + window.GUIGE_SVG + '</div>';
  slot.innerHTML = SAY;
  document.body.classList.add("has-gdock");

  // 依頁面換開場白：同一次瀏覽的第一頁打招呼，之後每頁一句跟這頁有關的話
  const path = location.pathname;
  const ctx = /\/products\//.test(path) ? ["explaining", "想知道哪個產品適合你？點我直接問。"]
    : /\/solutions\//.test(path) ? ["idea", "告訴我你的產業，我幫你找做法和案例。"]
    : /\/cases\//.test(path) ? ["proud", "想看哪個產業的案例？問我就好。"]
    : /\/about\//.test(path) ? ["warm", "想多認識 Ai3？有問題直接問我。"]
    : /\/insights\//.test(path) ? ["curious", "想找哪則消息或文章？我可以幫你。"]
    : /\/contact\//.test(path) ? ["welcome", "想直接聊聊？也可以先問我，我馬上回答。"]
    : ["happy", "需要幫忙嗎？點我就能問。"];
  let seen = false; try { seen = sessionStorage.getItem("ai3_gdock") === "1"; sessionStorage.setItem("ai3_gdock", "1"); } catch (e) { /* 無痕模式 */ }
  cfg.greetLines = seen ? [ctx] : [["greeting", "嗨，我是貴哥！"], ctx];
  cfg.chatterLines = cfg.dockChatter || [
    ["curious", "有問題可以點我，打字或用說的都行。"],
    ["proud", "Ai3 已經服務超過一百家企業與機關。"],
    ["idea", "想看展示，可以回首頁跟我用聲音聊。"]
  ];
  cfg.chatterMax = cfg.chatterMax || 2;
  cfg.greetDelay = 1800;   // 等貴哥從右下角彈出來再開口
  cfg.greeting = cfg.dockGreeting || "嗨，我是貴哥。想問產品、案例或怎麼導入，直接打字或按麥克風問我。";

  const panel = dock.querySelector(".gdock__panel");
  const open = on => {
    dock.classList.toggle("is-open", on); panel.setAttribute("aria-hidden", String(!on));
    btn.setAttribute("aria-expanded", String(on));
    if (on) { dock.classList.remove("is-talking"); setTimeout(() => { const i = document.getElementById("voiceInput"); i && i.focus({ preventScroll: true }); }, 250); }
    try { sessionStorage.setItem("ai3_gdock_open", on ? "1" : "0"); } catch (e) { /* 無痕模式 */ }
  };
  btn.addEventListener("click", () => open(!dock.classList.contains("is-open")));
  dock.querySelector(".gdock__x").addEventListener("click", () => open(false));
  document.addEventListener("keydown", e => { if (e.key === "Escape" && dock.classList.contains("is-open")) open(false); });
  watchSay();
  // 上一頁對話窗開著，換頁後也保持開著
  let wasOpen = false; try { wasOpen = sessionStorage.getItem("ai3_gdock_open") === "1"; } catch (e) { /* 無痕模式 */ }

  // 進場：從右下角彈出來，揮揮手
  const show = () => {
    dock.classList.add("is-on");
    if (hasGsap && !reduce) gsap.from(fig, { y: 60, scale: 0.4, opacity: 0, transformOrigin: "50% 100%", duration: 0.9, ease: "back.out(1.7)", clearProps: "transform,opacity" });
    setTimeout(() => { window.AiAvatar && window.AiAvatar.wave && window.AiAvatar.wave(); }, 700);
    if (wasOpen) open(true);
  };
  if (document.readyState === "complete") setTimeout(show, 500); else window.addEventListener("load", () => setTimeout(show, 500));
  emit();
})();
