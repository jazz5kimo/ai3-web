/* ==========================================================================
   Ai3 新官網 · 會說話的貴哥（向量分層版 v5：60+ 種表情與動作）
   SVG 分層：gg-root（全身）、gg-head（頭）> gg-face（眉、眼、嘴、腮紅、汗、符號）、
             gg-armL（左臂）> gg-handL（左手）> gg-arcs（揮手線）、gg-armR（右臂）> gg-case（公事包）、gg-torso、gg-legs
   狀態：idle / listening / thinking / speaking
   情緒：見下方 EMO 目錄（每種＝臉部組合＋固定姿勢＋一次性動作＋可選的循環動作）
   介面：window.AiAvatar = { setLevel(0~1), setState(s), setEmotion(id), wave(), showcase(), list() }
   ========================================================================== */
(function () {
  "use strict";
  const svg = document.getElementById("avatar");
  if (!svg) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof gsap !== "undefined";
  const $ = id => svg.querySelector("#" + id);
  const EYES = ["happy", "open", "wide", "closed", "flat", "x", "heart", "star", "spiral", "wink", "sleepy"];
  const MOUTHS = ["smile", "sad", "o", "flat", "wavy", "pout", "grin", "smirk", "cat", "tongue", "grit", "tiny"];
  const FXS = ["q", "excl", "hearts", "sparks", "zzz", "notes", "bulb", "cloud", "ok", "no"];
  const MARKS = ["blush", "tear", "tears", "sweat", "sweats", "anger", "shine"];
  const el = {
    root: $("gg-root"), head: $("gg-head"), armL: $("gg-armL"), handL: $("gg-handL"), arcs: $("gg-arcs"),
    armR: $("gg-armR"), kase: $("gg-case"), torso: $("gg-torso"),
    pupilL: $("gg-pupil-l"), pupilR: $("gg-pupil-r"), lids: svg.querySelectorAll(".gg-lid"),
    browL: $("gg-brow-l"), browR: $("gg-brow-r"), mouth: $("gg-mouth"),
    eyes: Object.fromEntries(EYES.map(k => [k, $("gg-eyes-" + k)])),
    mouths: Object.fromEntries(MOUTHS.map(k => [k, $("gg-mouth-" + k)])),
    fx: Object.fromEntries(FXS.map(k => [k, $("gg-" + k)])),
    marks: Object.fromEntries(MARKS.map(k => [k, $("gg-" + k)]))
  };
  const PIV = { root: "190 630", head: "200 262", armL: "160 332", handL: "72 280", armR: "288 300", kase: "298 428" };
  const stage = document.getElementById("stage");
  const bars = stage ? stage.querySelectorAll(".stage__sound i") : [];
  const bubble = stage ? stage.querySelector(".bubble") : null;

  /* 說話嘴型：每幀依音量＋口型（a／o／e／i／u／閉）重畫，所以任何表情說話時嘴巴都一定會動 */
  const NS = "http://www.w3.org/2000/svg";
  const mk = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); if (parent) parent.appendChild(n); return n; };
  const talk = (() => {
    if (!el.mouth) return null;
    const g = mk("g", { id: "gg-mouth-talk", opacity: "0" }, el.mouth);
    const clip = mk("clipPath", { id: "gg-talk-clip" }, g); const clipPath = mk("path", {}, clip);
    const cav = mk("path", { fill: "#8f3730" }, g);
    const teeth = mk("rect", { fill: "#fff", rx: "3", "clip-path": "url(#gg-talk-clip)" }, g);
    const tongue = mk("ellipse", { fill: "#e3454f", "clip-path": "url(#gg-talk-clip)" }, g);
    const lip = mk("path", { fill: "none", stroke: "#c26a5c", "stroke-width": "1.8", "stroke-linecap": "round" }, g);
    return { g, clipPath, cav, teeth, tongue, lip };
  })();
  const VIS = [  // 半寬 w、張開 h、出現權重
    { w: 19, h: 1.5, p: 0.13 }, { w: 23, h: 28, p: 0.27 }, { w: 15, h: 24, p: 0.15 },
    { w: 26, h: 15, p: 0.2 }, { w: 25, h: 10, p: 0.12 }, { w: 12, h: 13, p: 0.13 }
  ];
  const pickVis = () => { let r = Math.random(), acc = 0; for (const v of VIS) { acc += v.p; if (r <= acc) return v; } return VIS[0]; };
  let vis = VIS[0], visUntil = 0, mw = 18, mh = 1, kick = 0, talking = false;
  const CURVE = { smile: 3.5, grin: 4, cat: 3, tongue: 3, tiny: 2, smirk: 1.5, o: 0, flat: 0, wavy: 0, pout: 0, grit: 0, sad: -4 };
  function drawTalk(w, h, curve, teethH) {
    if (!talk) return;
    const cx = 196, cy = 207 - curve * 0.6, top = cy - 4 - h * 0.12, bot = cy + 2 * h;
    const d = `M${cx - w} ${cy} Q${cx} ${top} ${cx + w} ${cy} Q${cx} ${bot} ${cx - w} ${cy} Z`;
    talk.cav.setAttribute("d", d); talk.clipPath.setAttribute("d", d);
    const th = Math.min(teethH, h * 0.38);
    talk.teeth.setAttribute("x", cx - w * 0.85); talk.teeth.setAttribute("y", cy - 4); talk.teeth.setAttribute("width", w * 1.7); talk.teeth.setAttribute("height", Math.max(0, th + 3));
    talk.tongue.setAttribute("cx", cx); talk.tongue.setAttribute("cy", cy + h * 0.82); talk.tongue.setAttribute("rx", w * 0.55); talk.tongue.setAttribute("ry", Math.max(0.1, h * 0.3));
    talk.lip.setAttribute("d", `M${cx - w} ${cy} Q${cx} ${top} ${cx + w} ${cy}`);
  }
  function setTalking(on) {
    if (on === talking || !talk) return; talking = on;
    talk.g.setAttribute("opacity", on ? "1" : "0");
    MOUTHS.forEach(k => { if (el.mouths[k]) el.mouths[k].style.opacity = (!on && spec && k === spec.mouth) ? 1 : 0; });
  }
  const gaze = { x: 0, y: 0 };

  let state = "idle", emotion = "happy", spec = null, level = 0, levelT = 0, t = 0, lidBase = 0;
  let loopTl = null, actTl = null, calmTimer = null, showTimer = null;
  const mouse = { x: 0, y: 0 };
  window.addEventListener("pointermove", e => { mouse.x = e.clientX / window.innerWidth - 0.5; mouse.y = e.clientY / window.innerHeight - 0.5; }, { passive: true });
  const tw = (target, vars) => { if (hasGsap && target) gsap.to(target, Object.assign({ duration: 0.4, ease: "power2.out", overwrite: "auto" }, vars)); };
  const rot = (part, deg, dur = 0.4, extra = {}) => tw(el[part], Object.assign({ rotation: deg, svgOrigin: PIV[part], duration: dur }, extra));

  /* ======================================================================
     情緒目錄（60+）。欄位：
       eyes / lids / pupil / brows[y,左,右] / mouth / scale[寬,開] / marks / fx
       pose { head:[轉,下移], armL, handL, armR, kase, root:[下移,轉,縮放] }
       act：一次性動作   loop：持續動作   amp：說話時肢體幅度   mouthAmp：說話時嘴型幅度
     ====================================================================== */
  const D = { eyes: "happy", lids: 0, pupil: [0, 0], brows: [0, 0, 0], mouth: "smile", scale: [1, 0.8], marks: [], fx: [], pose: {}, act: "", loop: "", amp: 1, mouthAmp: 1, label: "" };
  const EMO = {
    /* —— 正向 —— */
    happy:      { label: "開心", eyes: "happy", mouth: "smile", loop: "idle" },
    joy:        { label: "超開心", eyes: "happy", mouth: "grin", brows: [-4, 0, 0], marks: ["blush"], fx: ["sparks"], pose: { head: [-3, 0], armL: -14, handL: -10, armR: -8, kase: 8 }, act: "jump3", amp: 1.6, mouthAmp: 1.25, confetti: true },
    laugh:      { label: "大笑", eyes: "happy", mouth: "grin", brows: [-3, 0, 0], marks: ["blush"], pose: { head: [-6, -4] }, loop: "laugh", amp: 1.4, mouthAmp: 1.3 },
    giggle:     { label: "偷笑", eyes: "happy", mouth: "cat", marks: ["blush"], pose: { head: [6, 2], armL: 52, handL: 22 }, loop: "giggle", amp: 0.8 },
    excited:    { label: "興奮", eyes: "star", mouth: "grin", brows: [-5, 0, 0], fx: ["sparks"], pose: { head: [-2, -2], armL: 16, handL: -34, armR: -30, kase: 18 }, act: "jump3", amp: 1.7, mouthAmp: 1.2, confetti: true },
    love:       { label: "喜歡", eyes: "heart", mouth: "cat", marks: ["blush"], fx: ["hearts"], pose: { head: [5, 0], armL: 50, handL: 10 }, loop: "sway", amp: 0.9 },
    proud:      { label: "得意", eyes: "closed", mouth: "smirk", brows: [-2, 0, 0], marks: ["shine"], pose: { head: [-5, -3], armL: 45, handL: -8, armR: -24, kase: 14, root: [0, 0, 1.02] }, act: "glasses", amp: 0.9 },
    confident:  { label: "自信", eyes: "open", lids: 0.18, mouth: "smirk", brows: [1, 4, -4], pose: { head: [-3, -2], armL: -28, handL: -20 }, act: "nod", amp: 1.1 },
    grateful:   { label: "感謝", eyes: "closed", mouth: "smile", marks: ["blush"], pose: { head: [8, 8] }, act: "bow", amp: 0.7 },
    warm:       { label: "溫暖", eyes: "happy", mouth: "tiny", marks: ["blush"], pose: { head: [4, 2] }, act: "nodSoft", amp: 0.7 },
    relieved:   { label: "鬆一口氣", eyes: "closed", mouth: "smile", marks: ["sweat"], pose: { head: [3, 3], armL: 42, handL: -18 }, act: "wipe", amp: 0.7 },
    amused:     { label: "逗趣", eyes: "wink", mouth: "smirk", pose: { head: [-9, 0] }, act: "tilt", amp: 1 },
    playful:    { label: "調皮", eyes: "wink", mouth: "tongue", marks: ["blush"], pose: { head: [-8, 0], armL: -20, handL: -30 }, act: "peek", amp: 1.2 },
    satisfied:  { label: "滿足", eyes: "closed", mouth: "cat", marks: ["blush"], pose: { head: [4, 2] }, loop: "sway", amp: 0.7 },
    cheer:      { label: "加油", eyes: "open", lids: 0, mouth: "grin", brows: [-4, 0, 0], fx: ["sparks"], pose: { head: [-4, -2], armL: 10, handL: -40, armR: -22, kase: 12 }, act: "fist", amp: 1.5, mouthAmp: 1.2 },
    agree:      { label: "同意", eyes: "happy", mouth: "smile", fx: ["ok"], act: "nod2", amp: 1 },
    okay:       { label: "了解", eyes: "open", lids: 0.05, mouth: "smile", fx: ["ok"], act: "nod", amp: 1 },
    greeting:   { label: "打招呼", eyes: "happy", mouth: "smile", act: "wave", amp: 1.1 },
    goodbye:    { label: "再見", eyes: "happy", mouth: "smile", act: "waveBow", amp: 1 },
    thanks:     { label: "謝謝你", eyes: "closed", mouth: "smile", marks: ["blush"], fx: ["hearts"], act: "bow2", amp: 0.8 },
    celebrate:  { label: "慶祝", eyes: "star", mouth: "grin", fx: ["sparks"], pose: { armL: 14, handL: -36, armR: -34, kase: 20 }, loop: "dance", amp: 1.6, mouthAmp: 1.2, confetti: true },
    dance:      { label: "跳舞", eyes: "happy", mouth: "grin", fx: ["notes"], loop: "dance", amp: 1.5 },
    sing:       { label: "唱歌", eyes: "closed", mouth: "o", scale: [1, 1.1], fx: ["notes"], pose: { head: [-6, -3], armL: 30, handL: -10 }, loop: "sway", amp: 1, mouthAmp: 1.3 },
    wink:       { label: "眨眼", eyes: "wink", mouth: "smile", pose: { head: [-5, 0], armL: -24, handL: -16 }, act: "point", amp: 1 },
    cool:       { label: "耍帥", eyes: "open", lids: 0.3, mouth: "smirk", marks: ["shine"], pose: { head: [-4, -2], armL: 44, handL: -10, root: [0, -1.5, 1] }, act: "glasses", amp: 0.8 },
    salute:     { label: "敬禮", eyes: "open", lids: 0, mouth: "smile", brows: [-2, 0, 0], pose: { head: [0, 0], armL: 36, handL: -48, root: [0, 0, 1.01] }, act: "salute", amp: 0.6 },
    welcome:    { label: "歡迎", eyes: "happy", mouth: "grin", brows: [-3, 0, 0], pose: { armL: -26, handL: -22, armR: -14, kase: 8 }, act: "present", amp: 1.2 },
    /* —— 中性／思考 —— */
    neutral:    { label: "平常", eyes: "open", lids: 0.1, mouth: "tiny", scale: [1, 0.5] },
    thinking:   { label: "思考", eyes: "open", lids: 0.05, pupil: [3, -4], brows: [-5, 0, 0], mouth: "tiny", scale: [0.7, 0.5], pose: { head: [5, -2], armL: 52, handL: 12, armR: -3, root: [0, 1.5, 1] }, loop: "ponder", amp: 0.5 },
    idea:       { label: "有想法", eyes: "wide", mouth: "o", brows: [-7, 0, 0], fx: ["bulb"], pose: { head: [-4, -4], armL: -10, handL: -40 }, act: "pop", amp: 1.3 },
    curious:    { label: "好奇", eyes: "open", lids: 0, pupil: [4, 0], brows: [-4, 0, 6], mouth: "tiny", fx: ["q"], pose: { head: [-10, 0] }, act: "tilt", amp: 1 },
    confused:   { label: "困惑", eyes: "open", lids: 0.1, pupil: [-3, 2], brows: [-2, -8, 10], mouth: "wavy", fx: ["q"], pose: { head: [8, 0], armL: 24, handL: 30 }, act: "scratch", amp: 0.8 },
    doubt:      { label: "懷疑", eyes: "flat", mouth: "smirk", brows: [0, 10, -2], pose: { head: [-7, 0], root: [0, -1, 1] }, act: "tilt", amp: 0.7 },
    serious:    { label: "認真", eyes: "open", lids: 0.22, mouth: "flat", brows: [1, 8, -8], pose: { head: [0, 0], root: [0, 0, 1.01] }, amp: 0.6, mouthAmp: 0.8 },
    focused:    { label: "專注", eyes: "open", lids: 0.12, pupil: [0, 1], mouth: "flat", brows: [-1, 4, -4], pose: { head: [0, 3], root: [-3, 0, 1.03] }, act: "leanIn", amp: 0.6 },
    explaining: { label: "說明", eyes: "open", lids: 0.05, mouth: "smile", pose: { armL: -22, handL: -26 }, loop: "explain", amp: 1.2 },
    remember:   { label: "回想", eyes: "open", lids: 0.1, pupil: [-4, -5], mouth: "tiny", brows: [-3, 0, 0], pose: { head: [-6, -2], armL: 50, handL: 14 }, act: "chin", amp: 0.5 },
    hmm:        { label: "嗯…", eyes: "open", lids: 0.25, pupil: [5, 0], mouth: "wavy", scale: [0.8, 0.8], brows: [0, 0, 6], fx: ["q"], pose: { head: [-6, 0] }, act: "tilt", amp: 0.6 },
    speechless: { label: "無言", eyes: "flat", mouth: "flat", marks: ["sweat"], pose: { head: [0, 2], armL: 10, handL: 10 }, amp: 0.4, mouthAmp: 0.6 },
    whisper:    { label: "悄悄話", eyes: "wink", mouth: "smirk", pose: { head: [6, 2], armL: 54, handL: 24, root: [-2, 2, 1.02] }, act: "leanIn", amp: 0.6, mouthAmp: 0.7 },
    /* —— 驚訝 —— */
    surprised:  { label: "驚訝", eyes: "wide", mouth: "o", brows: [-7, 0, 0], fx: ["excl"], pose: { head: [0, -3], armL: -16, handL: -12, armR: -10, kase: 10 }, act: "pop", amp: 1.3 },
    shocked:    { label: "嚇到", eyes: "wide", mouth: "o", scale: [1.1, 1.3], brows: [-8, 0, 0], marks: ["sweats"], pose: { head: [0, -4], armL: -30, handL: -40, armR: -18, kase: 16, root: [4, 0, 0.98] }, act: "shiver", amp: 1.2 },
    amazed:     { label: "驚嘆", eyes: "star", mouth: "o", brows: [-6, 0, 0], fx: ["sparks"], pose: { head: [-3, -3], armL: 40, handL: 20, root: [-3, 0, 1.03] }, act: "leanIn", amp: 1.2 },
    wow:        { label: "哇！", eyes: "wide", mouth: "grin", brows: [-7, 0, 0], fx: ["sparks", "excl"], pose: { armL: 14, handL: -36, armR: -26, kase: 16 }, act: "jump3", amp: 1.5, mouthAmp: 1.2 },
    /* —— 負向 —— */
    sad:        { label: "難過", eyes: "open", lids: 0.42, pupil: [0, 3], brows: [2, -14, 14], mouth: "sad", scale: [1, 0.7], marks: ["tear"], pose: { head: [6, 5], armL: 28, handL: 14, armR: 3, kase: 4, root: [3, 0, 1] }, amp: 0.45, mouthAmp: 0.7 },
    cry:        { label: "大哭", eyes: "closed", brows: [3, -16, 16], mouth: "sad", scale: [1.1, 1.1], marks: ["tears"], pose: { head: [8, 8], armL: 46, handL: 0, root: [4, 0, 0.98] }, loop: "sob", amp: 0.6, mouthAmp: 1.1 },
    disappointed: { label: "失望", eyes: "open", lids: 0.5, pupil: [0, 4], brows: [2, -10, 10], mouth: "sad", scale: [0.9, 0.6], fx: ["cloud"], pose: { head: [10, 10], armL: 34, handL: 16, root: [5, 0, 0.98] }, act: "slump", amp: 0.4, mouthAmp: 0.6 },
    worried:    { label: "擔心", eyes: "open", lids: 0.2, pupil: [-2, 2], brows: [2, -16, 16], mouth: "wavy", marks: ["sweat"], pose: { head: [4, 2], armL: 48, handL: 6 }, loop: "fidget", amp: 0.6, mouthAmp: 0.7 },
    nervous:    { label: "緊張", eyes: "open", lids: 0.1, pupil: [4, -1], brows: [0, -10, 10], mouth: "wavy", marks: ["sweats"], pose: { head: [-3, 0], armL: 20, handL: 20 }, loop: "shiverLoop", amp: 0.8, mouthAmp: 0.7 },
    shy:        { label: "害羞", eyes: "open", lids: 0.35, pupil: [-4, 4], brows: [1, -6, 6], mouth: "tiny", marks: ["blush", "sweat"], pose: { head: [10, 6], armL: 26, handL: 30, root: [2, 2, 0.99] }, act: "scratch", amp: 0.5, mouthAmp: 0.6 },
    awkward:    { label: "尷尬", eyes: "flat", brows: [0, -8, 8], mouth: "wavy", marks: ["sweat", "blush"], pose: { head: [6, 2], armL: 24, handL: 28 }, act: "scratchSlow", amp: 0.5, mouthAmp: 0.6 },
    sorry:      { label: "抱歉", eyes: "closed", brows: [3, -14, 14], mouth: "sad", scale: [0.8, 0.6], marks: ["sweat"], pose: { head: [10, 10], armL: 30, handL: 10 }, act: "bow2", amp: 0.5, mouthAmp: 0.6 },
    tired:      { label: "累了", eyes: "sleepy", brows: [3, -6, 6], mouth: "flat", pose: { head: [8, 8], armL: 36, handL: 10, root: [5, 0, 0.98] }, loop: "swaySlow", amp: 0.4, mouthAmp: 0.6 },
    sleepy:     { label: "想睡", eyes: "sleepy", mouth: "tiny", fx: ["zzz"], pose: { head: [12, 10], armL: 40, handL: 12, root: [6, 3, 0.98] }, loop: "swaySlow", amp: 0.3, mouthAmp: 0.5 },
    yawn:       { label: "打呵欠", eyes: "closed", mouth: "o", scale: [1.1, 1.3], brows: [-3, 0, 0], pose: { head: [-8, -4], armL: 48, handL: 16 }, act: "stretch", amp: 0.5, mouthAmp: 1.2 },
    bored:      { label: "無聊", eyes: "flat", mouth: "pout", brows: [2, -4, 4], pose: { head: [8, 4], armL: 30, handL: 20 }, loop: "swaySlow", amp: 0.4, mouthAmp: 0.6 },
    angry:      { label: "生氣", eyes: "open", lids: 0.35, brows: [0, 18, -18], mouth: "grit", marks: ["anger"], pose: { head: [-2, 0], armL: -6, handL: -18, armR: 6, kase: -6 }, act: "shakeHead", amp: 1.3, mouthAmp: 1.1 },
    annoyed:    { label: "不爽", eyes: "flat", brows: [0, 12, -12], mouth: "pout", marks: ["anger"], pose: { head: [-6, 0], armL: 8, handL: 14, root: [0, -1.5, 1] }, act: "stomp", amp: 1, mouthAmp: 0.8 },
    furious:    { label: "暴怒", eyes: "open", lids: 0.45, pupil: [0, -1], brows: [1, 24, -24], mouth: "grit", scale: [1.15, 1.1], marks: ["anger", "sweats"], pose: { head: [-3, -2], armL: -18, handL: -30, armR: -10, kase: -14, root: [0, 0, 1.03] }, loop: "rage", amp: 1.6, mouthAmp: 1.2 },
    disgusted:  { label: "嫌棄", eyes: "flat", brows: [0, -6, 14], mouth: "wavy", scale: [0.8, 0.8], pose: { head: [-10, 0], armL: -14, handL: -24, root: [3, -3, 0.98] }, act: "leanBack", amp: 0.6, mouthAmp: 0.7 },
    scared:     { label: "害怕", eyes: "wide", brows: [-4, -16, 16], mouth: "wavy", scale: [1, 1.1], marks: ["sweats"], pose: { head: [0, -2], armL: -34, handL: -46, armR: -20, kase: 18, root: [4, 0, 0.97] }, loop: "shiverLoop", amp: 1, mouthAmp: 0.9 },
    dizzy:      { label: "頭暈", eyes: "spiral", mouth: "wavy", brows: [2, -6, 6], marks: ["sweat"], pose: { head: [12, 2], armL: 36, handL: 20, root: [2, 0, 1] }, loop: "wobble", amp: 0.5, mouthAmp: 0.6 },
    faint:      { label: "昏倒", eyes: "x", mouth: "o", scale: [0.9, 0.9], brows: [3, -10, 10], marks: ["sweat"], pose: { head: [16, 6], armL: 60, handL: 30, armR: 10, kase: -10, root: [8, 6, 0.96] }, act: "collapse", amp: 0.3, mouthAmp: 0.6 },
    refuse:     { label: "拒絕", eyes: "open", lids: 0.15, brows: [1, 6, -6], mouth: "flat", fx: ["no"], pose: { armL: -20, handL: -34 }, act: "shakeHead", amp: 0.9, mouthAmp: 0.8 },
    sick:       { label: "不舒服", eyes: "closed", brows: [3, -12, 12], mouth: "wavy", marks: ["sweats"], pose: { head: [10, 6], armL: 50, handL: 10, root: [4, 0, 0.98] }, loop: "wobble", amp: 0.4, mouthAmp: 0.6 }
  };
  const ALIAS = { // 後端或關鍵字可能回傳的名字
    "開心": "happy", "快樂": "joy", "樂": "joy", "喜": "happy", "怒": "angry", "哀": "sad", "驚": "surprised", "笑": "laugh",
    smile: "happy", glad: "happy", delighted: "joy", lol: "laugh", haha: "laugh", shocked2: "shocked", wow2: "wow", calm: "neutral",
    think: "thinking", question: "curious", puzzled: "confused", skeptical: "doubt", ok: "okay", yes: "agree", no: "refuse",
    hello: "greeting", hi: "greeting", bye: "goodbye", thank: "thanks", apology: "sorry", apologetic: "sorry", embarrassed: "shy",
    anxious: "nervous", fear: "scared", afraid: "scared", exhausted: "tired", sleep: "sleepy", mad: "angry", rage: "furious", irritated: "annoyed",
    sadness: "sad", crying: "cry", tear: "cry", disappoint: "disappointed", upset: "disappointed", bored2: "bored", confident2: "confident",
    excitement: "excited", amazing: "amazed", great: "excited", celebrate2: "celebrate", party: "celebrate", music: "dance", song: "sing",
    heart: "love", like: "love", smug: "proud", idea2: "idea", eureka: "idea", focus: "focused", explain: "explaining", listening2: "focused"
  };
  const norm = e => { e = (e || "").toString().trim(); if (EMO[e]) return e; const k = e.toLowerCase(); return EMO[k] ? k : (ALIAS[e] || ALIAS[k] || "happy"); };
  const getSpec = id => Object.assign({}, D, EMO[id] || EMO.happy, { pose: Object.assign({ head: [0, 0], armL: 0, handL: 0, armR: 0, kase: 0, root: [0, 0, 1] }, (EMO[id] || {}).pose || {}) });

  /* ---------------- 臉 ---------------- */
  function applyFace(s) {
    EYES.forEach(k => { if (el.eyes[k]) el.eyes[k].style.opacity = k === s.eyes ? 1 : 0; });
    lidBase = s.eyes === "open" ? (s.lids || 0) : 0;
    if (hasGsap) gsap.set(el.lids, { scaleY: lidBase, transformOrigin: "50% 0%" });
    MOUTHS.forEach(k => { if (el.mouths[k]) el.mouths[k].style.opacity = (!talking && k === s.mouth) ? 1 : 0; });
    MARKS.forEach(k => { const on = s.marks.includes(k); tw(el.marks[k], { opacity: on ? 1 : 0, y: (on && (k === "tear" || k === "tears")) ? 4 : 0 }); });
    FXS.forEach(k => { const on = s.fx.includes(k); const n = el.fx[k]; if (!n) return;
      if (on) { if (hasGsap && !reduce) gsap.fromTo(n, { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2)", overwrite: "auto" }); else n.style.opacity = 1; }
      else tw(n, { opacity: 0, duration: 0.25 }); });
    brows(s.brows[0], s.brows[1], s.brows[2]);
  }
  function brows(y, rotL, rotR) {
    tw(el.browL, { y, rotation: rotL, transformOrigin: "100% 50%" });
    tw(el.browR, { y, rotation: rotR, transformOrigin: "0% 50%" });
  }
  function blinkLoop() {
    setTimeout(() => {
      if (spec && spec.eyes === "open" && hasGsap && !reduce && state !== "thinking") {
        gsap.to(el.lids, { scaleY: 1, duration: 0.07, transformOrigin: "50% 0%", yoyo: true, repeat: 1, onComplete: () => gsap.set(el.lids, { scaleY: lidBase }) });
      }
      blinkLoop();
    }, 2600 + Math.random() * 2600);
  }

  /* ---------------- 姿勢（固定）---------------- */
  function applyPose(p, dur = 0.5) {
    rot("head", p.head[0], dur, { y: p.head[1] });
    rot("armL", p.armL, dur); rot("handL", p.handL, dur); rot("armR", p.armR, dur); rot("kase", p.kase, dur);
    tw(el.root, { y: p.root[0], rotation: p.root[1], scale: p.root[2], x: 0, svgOrigin: PIV.root, duration: dur });
    tw(el.torso, { scaleY: 1, duration: dur });
  }

  /* ---------------- 一次性動作 ---------------- */
  const ACT = {
    nod:       tl => tl.to(el.head, { y: "+=9", rotation: "+=4", duration: 0.18 }).to(el.head, { y: "-=9", rotation: "-=4", duration: 0.25 }),
    nod2:      tl => { for (let i = 0; i < 2; i++) tl.to(el.head, { y: "+=9", rotation: "+=4", duration: 0.16 }).to(el.head, { y: "-=9", rotation: "-=4", duration: 0.2 }); },
    nodSoft:   tl => tl.to(el.head, { y: "+=5", duration: 0.35 }).to(el.head, { y: "-=5", duration: 0.45 }),
    shakeHead: tl => tl.to(el.head, { x: 5, duration: 0.07 }).to(el.head, { x: -5, duration: 0.07, repeat: 5, yoyo: true }).to(el.head, { x: 0, duration: 0.08 }),
    tilt:      tl => tl.to(el.head, { rotation: "-=6", duration: 0.3 }).to(el.head, { rotation: "+=6", duration: 0.5, delay: 0.5 }),
    bow:       tl => tl.to(el.root, { scaleY: 0.95, y: "+=6", svgOrigin: PIV.root, duration: 0.35 }, 0).to(el.head, { y: "+=16", rotation: "+=8", duration: 0.35 }, 0).to(el.root, { scaleY: 1, y: "-=6", duration: 0.5, delay: 0.5 }).to(el.head, { y: "-=16", rotation: "-=8", duration: 0.5 }, "<"),
    bow2:      tl => { for (let i = 0; i < 2; i++) tl.to(el.root, { scaleY: 0.95, y: "+=6", svgOrigin: PIV.root, duration: 0.3 }).to(el.head, { y: "+=16", rotation: "+=8", duration: 0.3 }, "<").to(el.root, { scaleY: 1, y: "-=6", duration: 0.4, delay: 0.2 }).to(el.head, { y: "-=16", rotation: "-=8", duration: 0.4 }, "<"); },
    jump3:     tl => tl.to(el.root, { y: "-=16", duration: 0.18, yoyo: true, repeat: 5, ease: "power1.inOut" }).to(el.root, { y: 0, duration: 0.2 }),
    pop:       tl => tl.to(el.root, { scale: "+=0.05", y: "-=10", duration: 0.14 }).to(el.root, { scale: "-=0.05", y: "+=10", duration: 0.3, ease: "back.out(2)" }),
    shiver:    tl => tl.to(el.root, { x: 3, duration: 0.05, repeat: 11, yoyo: true }).to(el.root, { x: 0, duration: 0.05 }),
    leanIn:    tl => tl.to(el.root, { scale: "+=0.04", y: "-=5", duration: 0.5 }),
    leanBack:  tl => tl.to(el.root, { scale: "-=0.03", y: "+=4", duration: 0.4 }),
    glasses:   tl => tl.to(el.handL, { rotation: "-=14", duration: 0.25 }).to(el.handL, { rotation: "+=14", duration: 0.35, delay: 0.3 }).to(el.marks.shine, { opacity: 0.35, duration: 0.15, yoyo: true, repeat: 1 }, 0.1),
    scratch:   tl => tl.to(el.handL, { rotation: "+=16", duration: 0.14, repeat: 5, yoyo: true }),
    scratchSlow: tl => tl.to(el.handL, { rotation: "+=12", duration: 0.3, repeat: 3, yoyo: true }),
    salute:    tl => tl.to(el.handL, { rotation: "-=10", duration: 0.15 }).to(el.handL, { rotation: "+=10", duration: 0.3, delay: 0.6 }),
    chin:      tl => tl.to(el.handL, { rotation: "+=8", duration: 0.4, repeat: 3, yoyo: true }),
    point:     tl => tl.to(el.armL, { rotation: "-=12", duration: 0.2 }).to(el.handL, { rotation: "-=10", duration: 0.2 }, "<").to(el.armL, { rotation: "+=12", duration: 0.35, delay: 0.4 }).to(el.handL, { rotation: "+=10", duration: 0.35 }, "<"),
    present:   tl => tl.to(el.armL, { rotation: "-=14", duration: 0.3 }).to(el.armR, { rotation: "-=10", duration: 0.3 }, "<").to(el.kase, { rotation: "+=8", duration: 0.3 }, "<").to(el.armL, { rotation: "+=14", duration: 0.4, delay: 0.5 }).to(el.armR, { rotation: "+=10", duration: 0.4 }, "<").to(el.kase, { rotation: "-=8", duration: 0.4 }, "<"),
    wipe:      tl => tl.to(el.handL, { rotation: "-=26", duration: 0.25 }).to(el.handL, { rotation: "+=26", duration: 0.3 }).to(el.marks.sweat, { y: 18, opacity: 0, duration: 0.6 }, 0.2),
    fist:      tl => { for (let i = 0; i < 2; i++) tl.to(el.armL, { rotation: "-=18", duration: 0.14 }).to(el.handL, { rotation: "-=12", duration: 0.14 }, "<").to(el.root, { y: "-=8", duration: 0.14 }, "<").to(el.armL, { rotation: "+=18", duration: 0.22 }).to(el.handL, { rotation: "+=12", duration: 0.22 }, "<").to(el.root, { y: "+=8", duration: 0.22 }, "<"); },
    peek:      tl => tl.to(el.root, { x: 18, rotation: "+=5", duration: 0.35 }).to(el.root, { x: 0, rotation: "-=5", duration: 0.45, delay: 0.6 }),
    slump:     tl => tl.to(el.root, { y: "+=6", scaleY: 0.97, svgOrigin: PIV.root, duration: 0.6 }).to(el.head, { y: "+=4", duration: 0.6 }, "<"),
    stomp:     tl => tl.to(el.root, { y: "-=7", duration: 0.12 }).to(el.root, { y: "+=9", duration: 0.1, ease: "power2.in" }).to(el.root, { y: "-=2", duration: 0.12 }).to(el.head, { x: 4, duration: 0.06, repeat: 5, yoyo: true }, 0.2).to(el.head, { x: 0, duration: 0.05 }),
    stretch:   tl => tl.to(el.armL, { rotation: "-=30", duration: 0.5 }).to(el.handL, { rotation: "-=30", duration: 0.5 }, "<").to(el.head, { y: "-=6", duration: 0.5 }, "<").to(el.armL, { rotation: "+=30", duration: 0.5, delay: 0.8 }).to(el.handL, { rotation: "+=30", duration: 0.5 }, "<").to(el.head, { y: "+=6", duration: 0.5 }, "<"),
    collapse:  tl => tl.to(el.root, { rotation: "+=6", y: "+=8", duration: 0.5, ease: "power2.in" }).to(el.head, { rotation: "+=10", duration: 0.5 }, "<"),
    waveBow:   tl => { waveInto(tl); tl.to(el.root, { scaleY: 0.95, y: "+=6", svgOrigin: PIV.root, duration: 0.35 }).to(el.head, { y: "+=14", rotation: "+=8", duration: 0.35 }, "<").to(el.root, { scaleY: 1, y: "-=6", duration: 0.5, delay: 0.3 }).to(el.head, { y: "-=14", rotation: "-=8", duration: 0.5 }, "<"); },
    wave:      tl => waveInto(tl),
    lookAround: tl => tl.to(gaze, { x: -6, y: -1, duration: 0.3 }).to(el.head, { rotation: "-=4", svgOrigin: PIV.head, duration: 0.4 }, "<").to(gaze, { x: 6, duration: 0.45, delay: 0.5 }).to(el.head, { rotation: "+=8", duration: 0.5 }, "<").to(gaze, { x: 0, y: 0, duration: 0.3, delay: 0.5 }).to(el.head, { rotation: "-=4", duration: 0.4 }, "<"),
    caseSwing: tl => tl.to(el.kase, { rotation: "+=16", svgOrigin: PIV.kase, duration: 0.28, yoyo: true, repeat: 3 }).to(el.armR, { rotation: "-=6", svgOrigin: PIV.armR, duration: 0.28, yoyo: true, repeat: 3 }, 0),
    bounce:    tl => tl.to(el.root, { y: "-=7", duration: 0.16, yoyo: true, repeat: 3, ease: "power1.inOut" }).to(el.head, { rotation: "+=3", svgOrigin: PIV.head, duration: 0.32, yoyo: true, repeat: 1 }, 0),
    shrug:     tl => tl.to(el.armL, { rotation: "-=10", svgOrigin: PIV.armL, duration: 0.25 }).to(el.armR, { rotation: "-=8", svgOrigin: PIV.armR, duration: 0.25 }, "<").to(el.head, { y: "+=4", rotation: "+=5", duration: 0.25 }, "<").to(el.armL, { rotation: "+=10", duration: 0.35, delay: 0.45 }).to(el.armR, { rotation: "+=8", duration: 0.35 }, "<").to(el.head, { y: "-=4", rotation: "-=5", duration: 0.35 }, "<")
  };
  function waveInto(tl) {
    tl.set(el.arcs, { opacity: 1 })
      .to(el.armL, { rotation: "-=8", duration: 0.25 }, 0)
      .to(el.handL, { rotation: "-=22", duration: 0.2 }, 0)
      .to(el.handL, { rotation: "+=40", duration: 0.2 }).to(el.handL, { rotation: "-=40", duration: 0.2 }).to(el.handL, { rotation: "+=40", duration: 0.2 }).to(el.handL, { rotation: "-=34", duration: 0.2 }).to(el.handL, { rotation: "+=16", duration: 0.3 })
      .to(el.armL, { rotation: "+=8", duration: 0.4 }, "-=0.3")
      .to(el.head, { rotation: "-=3", duration: 0.3 }, 0).to(el.head, { rotation: "+=3", duration: 0.5 }, 0.8)
      .to(el.arcs, { opacity: 0, duration: 0.3 });
  }
  function runAct(name) {
    if (!hasGsap || reduce || !ACT[name]) return;
    if (actTl) actTl.kill();
    if (state === "idle") loopStop(false);
    actTl = gsap.timeline({ defaults: { ease: "sine.inOut" }, onComplete: () => {
      actTl = null; gsap.set(gaze, { x: 0, y: 0 });
      if (state !== "idle" || !spec) return;
      applyPose(spec.pose, 0.35);
      if (spec.loop) gsap.delayedCall(0.36, () => { if (state === "idle" && !actTl) loopStart(spec.loop); });
    } });
    ACT[name](actTl);
  }

  /* ---------------- 循環動作 ---------------- */
  function loopStart(mode) {
    if (!hasGsap || reduce) return;
    loopStop(false);
    const a = spec ? spec.amp : 1;
    const p = spec ? spec.pose : getSpec("happy").pose;
    loopTl = gsap.timeline({ repeat: -1, defaults: { ease: "sine.inOut" } });
    const L = loopTl;
    switch (mode) {
      case "speaking": {
        const v = pickSpeak();
        if (v === 0) {   // 手勢：左手比劃、公事包跟著晃
          L.to(el.handL, { rotation: p.handL - 16 * a, svgOrigin: PIV.handL, duration: 0.22 }, 0).to(el.handL, { rotation: p.handL + 12 * a, duration: 0.22 }, 0.22).to(el.handL, { rotation: p.handL - 14 * a, duration: 0.22 }, 0.44).to(el.handL, { rotation: p.handL + 8 * a, duration: 0.22 }, 0.66).to(el.handL, { rotation: p.handL, duration: 0.3 }, 0.88)
           .to(el.armL, { rotation: p.armL - 9 * a, svgOrigin: PIV.armL, duration: 0.5 }, 0).to(el.armL, { rotation: p.armL + 5 * a, duration: 0.55 }, 0.5).to(el.armL, { rotation: p.armL - 4 * a, duration: 0.5 }, 1.05).to(el.armL, { rotation: p.armL, duration: 0.45 }, 1.55)
           .to(el.armR, { rotation: p.armR + 4 * a, svgOrigin: PIV.armR, duration: 0.6 }, 0.1).to(el.armR, { rotation: p.armR - 5 * a, duration: 0.7 }, 0.7).to(el.armR, { rotation: p.armR, duration: 0.6 }, 1.4)
           .to(el.kase, { rotation: p.kase + 6 * a, svgOrigin: PIV.kase, duration: 0.6 }, 0.25).to(el.kase, { rotation: p.kase - 6 * a, duration: 0.7 }, 0.85).to(el.kase, { rotation: p.kase, duration: 0.6 }, 1.55)
           .to(el.head, { rotation: p.head[0] + 2.5 * a, svgOrigin: PIV.head, duration: 0.5 }, 0).to(el.head, { rotation: p.head[0] - 2 * a, duration: 0.55 }, 0.5).to(el.head, { rotation: p.head[0], duration: 0.55 }, 1.05)
           .to(el.root, { rotation: p.root[1] + 1.3 * a, x: 2.5 * a, svgOrigin: PIV.root, duration: 0.95 }, 0).to(el.root, { rotation: p.root[1] - 1.1 * a, x: -2.5 * a, duration: 1.05 }, 0.95);
        } else if (v === 1) {   // 解說：手抬高、掌心翻動、頭跟著點
          L.to(el.armL, { rotation: p.armL - 18 * a, svgOrigin: PIV.armL, duration: 0.45 }, 0).to(el.armL, { rotation: p.armL - 6 * a, duration: 0.45 }, 0.45).to(el.armL, { rotation: p.armL - 15 * a, duration: 0.45 }, 0.9).to(el.armL, { rotation: p.armL, duration: 0.45 }, 1.35)
           .to(el.handL, { rotation: p.handL - 24 * a, svgOrigin: PIV.handL, duration: 0.3 }, 0).to(el.handL, { rotation: p.handL + 6 * a, duration: 0.3 }, 0.3).to(el.handL, { rotation: p.handL - 20 * a, duration: 0.3 }, 0.6).to(el.handL, { rotation: p.handL + 4 * a, duration: 0.3 }, 0.9).to(el.handL, { rotation: p.handL, duration: 0.6 }, 1.2)
           .to(el.head, { y: p.head[1] + 4, svgOrigin: PIV.head, duration: 0.3 }, 0).to(el.head, { y: p.head[1], duration: 0.3 }, 0.3).to(el.head, { y: p.head[1] + 4, duration: 0.3 }, 0.9).to(el.head, { y: p.head[1], duration: 0.3 }, 1.2)
           .to(el.kase, { rotation: p.kase + 4 * a, svgOrigin: PIV.kase, duration: 0.9 }, 0).to(el.kase, { rotation: p.kase, duration: 0.9 }, 0.9);
        } else if (v === 2) {   // 邊點頭邊說
          L.to(el.head, { y: p.head[1] + 5, rotation: p.head[0] + 2, svgOrigin: PIV.head, duration: 0.22 }, 0).to(el.head, { y: p.head[1], rotation: p.head[0], duration: 0.26 }, 0.22).to(el.head, { y: p.head[1] + 4, duration: 0.22 }, 0.6).to(el.head, { y: p.head[1], duration: 0.3 }, 0.82)
           .to(el.root, { y: p.root[0] - 2, svgOrigin: PIV.root, duration: 0.24 }, 0).to(el.root, { y: p.root[0], duration: 0.3 }, 0.24).to(el.root, { y: p.root[0] - 2, duration: 0.24 }, 0.6).to(el.root, { y: p.root[0], duration: 0.3 }, 0.84)
           .to(el.handL, { rotation: p.handL - 8 * a, svgOrigin: PIV.handL, duration: 0.4 }, 0).to(el.handL, { rotation: p.handL + 6 * a, duration: 0.4 }, 0.4).to(el.handL, { rotation: p.handL, duration: 0.36 }, 0.8);
        } else if (v === 3) {   // 指向重點：手往前指、頭微側
          L.to(el.armL, { rotation: p.armL - 20 * a, svgOrigin: PIV.armL, duration: 0.3 }, 0).to(el.handL, { rotation: p.handL - 18 * a, svgOrigin: PIV.handL, duration: 0.3 }, 0)
           .to(el.handL, { rotation: p.handL - 10 * a, duration: 0.16 }, 0.45).to(el.handL, { rotation: p.handL - 18 * a, duration: 0.16 }, 0.61).to(el.handL, { rotation: p.handL - 10 * a, duration: 0.16 }, 0.9).to(el.handL, { rotation: p.handL - 18 * a, duration: 0.16 }, 1.06)
           .to(el.head, { rotation: p.head[0] - 5, svgOrigin: PIV.head, duration: 0.35 }, 0).to(el.head, { rotation: p.head[0] - 2, duration: 0.5 }, 0.8)
           .to(el.armL, { rotation: p.armL, duration: 0.45 }, 1.35).to(el.handL, { rotation: p.handL, duration: 0.45 }, 1.35).to(el.head, { rotation: p.head[0], duration: 0.45 }, 1.35);
        } else {   // 攤手：兩手同時張開、公事包大晃
          L.to(el.armL, { rotation: p.armL - 13 * a, svgOrigin: PIV.armL, duration: 0.4 }, 0).to(el.armR, { rotation: p.armR - 9 * a, svgOrigin: PIV.armR, duration: 0.4 }, 0).to(el.kase, { rotation: p.kase + 12 * a, svgOrigin: PIV.kase, duration: 0.4 }, 0)
           .to(el.handL, { rotation: p.handL - 12 * a, svgOrigin: PIV.handL, duration: 0.4 }, 0).to(el.head, { rotation: p.head[0] + 3, y: p.head[1] - 2, svgOrigin: PIV.head, duration: 0.4 }, 0)
           .to(el.armL, { rotation: p.armL, duration: 0.5 }, 0.8).to(el.armR, { rotation: p.armR, duration: 0.5 }, 0.8).to(el.kase, { rotation: p.kase - 8 * a, duration: 0.5 }, 0.8).to(el.kase, { rotation: p.kase, duration: 0.4 }, 1.3)
           .to(el.handL, { rotation: p.handL, duration: 0.5 }, 0.8).to(el.head, { rotation: p.head[0], y: p.head[1], duration: 0.5 }, 0.8);
        }
        break;
      }
      case "idle":   // 原圖就是在揮手：輕輕揮動＋呼吸
        L.to(el.handL, { rotation: -7, svgOrigin: PIV.handL, duration: 0.45 }, 0).to(el.handL, { rotation: 6, duration: 0.45 }, 0.45).to(el.handL, { rotation: 0, duration: 0.45 }, 0.9)
         .to(el.armL, { rotation: -2, svgOrigin: PIV.armL, duration: 0.68 }, 0).to(el.armL, { rotation: 0, duration: 0.67 }, 0.68)
         .to(el.kase, { rotation: 1.5, svgOrigin: PIV.kase, duration: 0.7 }, 0).to(el.kase, { rotation: -1.5, duration: 0.7 }, 0.7).to(el.kase, { rotation: 0, duration: 0.35 }, 1.4)
         .to(el.torso, { scaleY: 1.008, transformOrigin: "50% 100%", duration: 0.9 }, 0).to(el.torso, { scaleY: 1, duration: 0.9 }, 0.9);
        break;
      case "laugh":
        L.to(el.root, { y: p.root[0] - 5, duration: 0.11 }, 0).to(el.root, { y: p.root[0] + 2, duration: 0.11 }, 0.11).to(el.head, { rotation: p.head[0] - 3, duration: 0.11 }, 0).to(el.head, { rotation: p.head[0] + 3, duration: 0.11 }, 0.11)
         .to(el.kase, { rotation: p.kase + 5, svgOrigin: PIV.kase, duration: 0.22 }, 0).to(el.kase, { rotation: p.kase - 5, duration: 0.22 }, 0.22);
        break;
      case "giggle":
        L.to(el.root, { y: p.root[0] - 2, duration: 0.1 }, 0).to(el.root, { y: p.root[0] + 1, duration: 0.1 }, 0.1).to(el.handL, { rotation: p.handL + 6, svgOrigin: PIV.handL, duration: 0.1 }, 0).to(el.handL, { rotation: p.handL - 4, duration: 0.1 }, 0.1);
        break;
      case "sway":
        L.to(el.root, { rotation: p.root[1] + 2.5, x: 3, svgOrigin: PIV.root, duration: 1.1 }, 0).to(el.root, { rotation: p.root[1] - 2.5, x: -3, duration: 1.1 }, 1.1).to(el.root, { rotation: p.root[1], x: 0, duration: 1.1 }, 2.2)
         .to(el.head, { rotation: p.head[0] - 3, duration: 1.1 }, 0).to(el.head, { rotation: p.head[0] + 3, duration: 1.1 }, 1.1).to(el.head, { rotation: p.head[0], duration: 1.1 }, 2.2);
        break;
      case "swaySlow":
        L.to(el.root, { rotation: p.root[1] + 1.5, svgOrigin: PIV.root, duration: 1.8 }, 0).to(el.root, { rotation: p.root[1] - 1.5, duration: 1.8 }, 1.8).to(el.root, { rotation: p.root[1], duration: 1.8 }, 3.6)
         .to(el.head, { y: p.head[1] + 3, duration: 1.8 }, 0).to(el.head, { y: p.head[1] - 1, duration: 1.8 }, 1.8).to(el.head, { y: p.head[1], duration: 1.8 }, 3.6);
        break;
      case "dance":
        L.to(el.root, { rotation: p.root[1] - 4, x: -8, y: p.root[0] - 12, svgOrigin: PIV.root, duration: 0.26 }, 0).to(el.root, { rotation: p.root[1] + 4, x: 8, y: p.root[0], duration: 0.26 }, 0.26).to(el.root, { rotation: p.root[1] - 4, x: -8, y: p.root[0] - 12, duration: 0.26 }, 0.52).to(el.root, { rotation: p.root[1], x: 0, y: p.root[0], duration: 0.26 }, 0.78)
         .to(el.armL, { rotation: p.armL - 20, svgOrigin: PIV.armL, duration: 0.26 }, 0).to(el.armL, { rotation: p.armL + 10, duration: 0.26 }, 0.26).to(el.armL, { rotation: p.armL - 20, duration: 0.26 }, 0.52).to(el.armL, { rotation: p.armL, duration: 0.26 }, 0.78)
         .to(el.handL, { rotation: p.handL - 24, svgOrigin: PIV.handL, duration: 0.26 }, 0).to(el.handL, { rotation: p.handL + 18, duration: 0.26 }, 0.26).to(el.handL, { rotation: p.handL - 24, duration: 0.26 }, 0.52).to(el.handL, { rotation: p.handL, duration: 0.26 }, 0.78)
         .to(el.armR, { rotation: p.armR - 16, svgOrigin: PIV.armR, duration: 0.52 }, 0).to(el.armR, { rotation: p.armR, duration: 0.52 }, 0.52)
         .to(el.kase, { rotation: p.kase + 14, svgOrigin: PIV.kase, duration: 0.26 }, 0).to(el.kase, { rotation: p.kase - 14, duration: 0.26 }, 0.26).to(el.kase, { rotation: p.kase + 14, duration: 0.26 }, 0.52).to(el.kase, { rotation: p.kase, duration: 0.26 }, 0.78)
         .to(el.head, { rotation: p.head[0] + 6, duration: 0.26 }, 0).to(el.head, { rotation: p.head[0] - 6, duration: 0.26 }, 0.26).to(el.head, { rotation: p.head[0] + 6, duration: 0.26 }, 0.52).to(el.head, { rotation: p.head[0], duration: 0.26 }, 0.78);
        break;
      case "ponder":
        L.to(el.handL, { rotation: p.handL + 6, svgOrigin: PIV.handL, duration: 0.6 }, 0).to(el.handL, { rotation: p.handL, duration: 0.6 }, 0.6).to(el.head, { rotation: p.head[0] + 2, duration: 1.2 }, 0).to(el.head, { rotation: p.head[0], duration: 1.2 }, 1.2);
        break;
      case "explain":
        L.to(el.armL, { rotation: p.armL - 10, svgOrigin: PIV.armL, duration: 0.5 }, 0).to(el.armL, { rotation: p.armL + 6, duration: 0.6 }, 0.5).to(el.armL, { rotation: p.armL, duration: 0.5 }, 1.1)
         .to(el.handL, { rotation: p.handL - 14, svgOrigin: PIV.handL, duration: 0.4 }, 0).to(el.handL, { rotation: p.handL + 10, duration: 0.4 }, 0.4).to(el.handL, { rotation: p.handL, duration: 0.4 }, 0.8);
        break;
      case "sob":
        L.to(el.root, { y: p.root[0] + 3, duration: 0.16 }, 0).to(el.root, { y: p.root[0], duration: 0.16 }, 0.16).to(el.head, { y: p.head[1] + 3, duration: 0.16 }, 0).to(el.head, { y: p.head[1], duration: 0.16 }, 0.16).to(el.handL, { rotation: p.handL + 8, svgOrigin: PIV.handL, duration: 0.16 }, 0).to(el.handL, { rotation: p.handL, duration: 0.16 }, 0.16);
        break;
      case "fidget":
        L.to(el.handL, { rotation: p.handL + 10, svgOrigin: PIV.handL, duration: 0.25 }, 0).to(el.handL, { rotation: p.handL - 6, duration: 0.25 }, 0.25).to(el.handL, { rotation: p.handL, duration: 0.3 }, 0.5).to(el.head, { x: 2, duration: 0.4 }, 0).to(el.head, { x: -2, duration: 0.4 }, 0.4).to(el.head, { x: 0, duration: 0.3 }, 0.8);
        break;
      case "shiverLoop":
        L.to(el.root, { x: 2.5, duration: 0.05 }, 0).to(el.root, { x: -2.5, duration: 0.05 }, 0.05).to(el.root, { x: 0, duration: 0.05 }, 0.1).to(el.kase, { rotation: p.kase + 3, svgOrigin: PIV.kase, duration: 0.08 }, 0).to(el.kase, { rotation: p.kase - 3, duration: 0.08 }, 0.08);
        break;
      case "wobble":
        L.to(el.root, { rotation: p.root[1] + 4, x: 5, svgOrigin: PIV.root, duration: 0.7 }, 0).to(el.root, { rotation: p.root[1] - 4, x: -5, duration: 0.7 }, 0.7).to(el.root, { rotation: p.root[1], x: 0, duration: 0.7 }, 1.4)
         .to(el.head, { rotation: p.head[0] - 8, duration: 0.7 }, 0).to(el.head, { rotation: p.head[0] + 8, duration: 0.7 }, 0.7).to(el.head, { rotation: p.head[0], duration: 0.7 }, 1.4);
        break;
      case "rage":
        L.to(el.head, { x: 3, duration: 0.05 }, 0).to(el.head, { x: -3, duration: 0.05 }, 0.05).to(el.head, { x: 0, duration: 0.05 }, 0.1)
         .to(el.root, { y: p.root[0] - 6, duration: 0.14 }, 0).to(el.root, { y: p.root[0], duration: 0.12 }, 0.14).to(el.handL, { rotation: p.handL - 14, svgOrigin: PIV.handL, duration: 0.14 }, 0).to(el.handL, { rotation: p.handL, duration: 0.14 }, 0.14)
         .to(el.marks.anger, { scale: 1.25, transformOrigin: "50% 50%", duration: 0.2 }, 0).to(el.marks.anger, { scale: 1, duration: 0.2 }, 0.2);
        break;
      default: loopTl.kill(); loopTl = null;
    }
  }
  let lastSpeak = -1;
  const pickSpeak = () => { let v; do { v = Math.floor(Math.random() * 5); } while (v === lastSpeak); lastSpeak = v; return v; };
  function loopStop(reset = true) {
    if (loopTl) { loopTl.kill(); loopTl = null; }
    if (reset && spec) applyPose(spec.pose, 0.4);
  }

  /* ---------------- 情緒 ---------------- */
  function setEmotion(e) {
    emotion = norm(e);
    spec = getSpec(emotion);
    stage && stage.setAttribute("data-emotion", emotion);
    if (actTl) { actTl.kill(); actTl = null; gsap && gsap.set(el.arcs, { opacity: 0 }); }
    if (loopTl) { loopTl.kill(); loopTl = null; }
    applyFace(spec);
    applyPose(spec.pose, 0.45);
    if (spec.confetti && window.AI3FX && window.AI3FX.confetti) window.AI3FX.confetti(1);
    if (state === "speaking") loopStart("speaking");
    else if (spec.act) runAct(spec.act);
    else if (spec.loop) loopStart(spec.loop);
  }

  /* ---------------- 狀態 ---------------- */
  let speakTimer = null, idleSince = 0;
  function speakShuffle() {
    clearTimeout(speakTimer);
    speakTimer = setTimeout(() => { if (state === "speaking") { loopStart("speaking"); speakShuffle(); } }, 1600 + Math.random() * 1600);
  }
  function setState(s) {
    state = s;
    clearTimeout(speakTimer);
    if (s === "speaking") speakShuffle();
    if (s === "idle") idleSince = performance.now();
    stage && stage.setAttribute("data-state", s);
    clearTimeout(calmTimer);
    if (actTl) { actTl.kill(); actTl = null; gsap && gsap.set(el.arcs, { opacity: 0 }); }
    switch (s) {
      case "listening":
        loopStop(false); applyFace(getSpec("focused")); brows(-3, 0, 0);
        applyPose(Object.assign(getSpec("focused").pose, { head: [-5, 2], armL: 6, handL: -6, root: [0, -1.5, 1.01] }), 0.4);
        break;
      case "thinking":
        loopStop(false); spec = getSpec("thinking"); applyFace(spec); applyPose(spec.pose, 0.4); loopStart("ponder");
        break;
      case "speaking":
        setEmotion(emotion);
        break;
      default:
        setEmotion(emotion);
        levelT = 0;
        calmTimer = setTimeout(() => { if (state === "idle" && emotion !== "happy") setEmotion("happy"); }, 12000);
    }
  }

  /* ---------------- 每一幀：嘴型、瞳孔、音量條 ---------------- */
  function frame() {
    requestAnimationFrame(frame);
    t += 0.016;
    level += (levelT - level) * 0.35;
    const sc = spec ? spec.scale : [1, 0.8];
    let wide = sc[0], open;
    if (state === "speaking" && talk) {
      setTalking(true);
      if (t > visUntil) { let nv = pickVis(); if (nv === vis) nv = pickVis(); vis = nv; visUntil = t + 0.09 + Math.random() * 0.13; }
      const env = Math.min(1, level + kick); kick *= 0.88;
      const amp = Math.max(0.95, spec ? spec.mouthAmp : 1);   // 再小聲的情緒，說話時嘴巴也要看得出在動
      const tw2 = vis.w * (0.95 + 0.12 * env), th2 = vis.h < 2 ? vis.h : vis.h * (0.5 + 0.7 * env) * amp;
      mw += (tw2 - mw) * 0.4; mh += (th2 - mh) * 0.5;
      const curve = CURVE[spec ? spec.mouth : "smile"] ?? 2;
      drawTalk(mw, mh, curve, spec && spec.mouth === "grit" ? 10 : 6);
      el.mouth.setAttribute("transform", "");
    } else { setTalking(false); }
    if (state === "speaking") open = 1;
    else if (state === "listening") open = 0.35;
    else if (state === "thinking") { open = 0.5; wide = 0.7; }
    else open = sc[1] + (emotion === "happy" ? 0.06 * Math.sin(t * 1.4) : 0);
    if (state !== "speaking") el.mouth.setAttribute("transform", `translate(196 204) scale(${wide} ${open}) translate(-196 -204)`);
    const pb = spec ? spec.pupil : [0, 0];
    const px = pb[0] + gaze.x + mouse.x * 6, py = pb[1] + gaze.y + (state === "thinking" ? -4 : mouse.y * 4);
    el.pupilL.setAttribute("transform", `translate(${px} ${py})`);
    el.pupilR.setAttribute("transform", `translate(${px} ${py})`);
    const base = state === "speaking" || state === "listening" ? level : 0;
    bars.forEach((b, i) => { b.style.height = (6 + base * (12 + 14 * Math.abs(Math.sin(t * 9 + i)))) + "px"; });
  }

  /* ---------------- 表情秀：依序展示全部情緒 ---------------- */
  let showing = false;
  function showcase(interval = 1700) {
    clearTimeout(showTimer); showing = true;
    const ids = Object.keys(EMO); let i = 0;
    const step = () => {
      if (state !== "idle") { showTimer = setTimeout(step, 800); return; }
      const id = ids[i % ids.length]; setEmotion(id);
      if (bubble) { bubble.textContent = (i + 1) + "/" + ids.length + "　" + EMO[id].label + "（" + id + "）"; bubble.classList.add("is-show"); }
      i++;
      if (i <= ids.length) showTimer = setTimeout(step, interval);
      else { showing = false; if (bubble) { bubble.classList.remove("is-show"); bubble.textContent = "讓我想一下…"; } setEmotion("happy"); }
    };
    step();
  }
  function stopShowcase() { clearTimeout(showTimer); showing = false; if (bubble) { bubble.classList.remove("is-show"); bubble.textContent = "讓我想一下…"; } }

  setEmotion("happy");
  frame();
  blinkLoop();
  setTimeout(() => runAct("wave"), 1500);
  const IDLE_ACTS = ["wave", "wave", "nod", "tilt", "glasses", "scratch", "chin", "peek", "present", "stretch", "point", "salute", "fist", "lookAround", "lookAround", "caseSwing", "bounce", "shrug"];
  const IDLE_EMOS = ["wink", "proud", "curious", "amused", "cool", "giggle", "idea", "confident", "welcome", "playful", "satisfied", "sing"];
  let inView = true, idleTimer = null, emoBack = null, lastIdle = "";
  if ("IntersectionObserver" in window && stage) new IntersectionObserver(en => { inView = en[0].isIntersecting; }).observe(stage);
  const pickFrom = arr => { let x; do { x = arr[Math.floor(Math.random() * arr.length)]; } while (x === lastIdle && arr.length > 1); lastIdle = x; return x; };
  function idleTick() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      const quiet = performance.now() - idleSince > 5000;   // 剛回完話的表情先留一下
      if (state === "idle" && quiet && !showing && !actTl && (inView || (window.AI3Dock && window.AI3Dock.docked)) && document.visibilityState === "visible" && hasGsap && !reduce) {
        if (Math.random() < 0.32) {
          const e = pickFrom(IDLE_EMOS); setEmotion(e);
          clearTimeout(emoBack); emoBack = setTimeout(() => { if (state === "idle" && emotion === e && !showing) setEmotion("happy"); }, 2600 + Math.random() * 1800);
        } else runAct(pickFrom(IDLE_ACTS));
      }
      idleTick();
    }, 3800 + Math.random() * 5200);
  }
  idleTick();

  window.AiAvatar = { kick: (v = 0.45) => { kick = Math.min(0.8, kick + v); visUntil = 0; }, setLevel: v => { levelT = Math.max(0, Math.min(1, v)); }, setState, setEmotion, wave: () => runAct("wave"), act: runAct, showcase, stopShowcase, list: () => Object.keys(EMO).map(k => ({ id: k, label: EMO[k].label })), count: Object.keys(EMO).length };
})();
