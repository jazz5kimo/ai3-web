/* ==========================================================================
   Ai3 新官網 · 語音機器人設定
   把 brain 改成 'http' 並填入 endpoint，就能把首頁語音機器人接上
   Ai3 自家的 Qbi / RAG 知識庫後端（或任何回 JSON 的 API）。
   ========================================================================== */
window.AI3_CONFIG = {
  // 'demo'  = 內建離線知識庫（不需後端，拿來看版面與互動）
  // 'http'  = POST { message, sessionId, history } 到 endpoint，期待回 { reply: "..." }
  brain: "demo",
  endpoint: "https://your-backend.example.com/api/chat",

  // 語音辨識（瀏覽器內建 Web Speech API）
  sttLang: "zh-TW",

  // 語音合成（瀏覽器內建 speechSynthesis）：貴哥是男生
  // 依序找這些男聲：台灣國語 YunJhe 雲哲（Edge 線上自然語音）、Zhiwei 志偉（Windows），
  // 再來是普通話男聲 Yunxi 雲希／Yunjian 雲健／Yunyang 雲揚（Edge）、Kangkang 康康（Windows）、Li-Mu（Mac／iPhone）。
  // 瀏覽器只有女聲時（例如 Chrome、部分手機），改用中文女聲並把音高壓低到 ttsFallbackPitch，聽起來比較低沉。
  ttsMale: ["YunJhe", "Zhiwei", "Yunxi", "Yunjian", "Yunyang", "Yunze", "Yunye", "Kangkang", "Li-Mu", "Limu"],
  ttsRate: 1.02,
  ttsPitch: 0.95,          // 找到男聲時的音高
  ttsFallbackPitch: 0.6,   // 只有女聲時的音高（0～2，越小越低沉）

  // 機器人人設（Demo 用）
  botName: "貴哥",
  greeting: "你好，我是貴哥。想知道 Ai3 做什麼、服務過誰、或怎麼導入，直接問我。",

  // 首頁特效開關（效能不夠的機器可以關掉）
  effects: { particles: true, tilt: true, headings: true, magnet: true, glow: true, confetti: true }
};
